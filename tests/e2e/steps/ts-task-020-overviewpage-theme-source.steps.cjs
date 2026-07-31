// TS-task-020 — the overview page sources project themes from the enriched
// business query.
//
// UI suite against the real stack. Theme links and project visibility are staged
// through the real endpoints (PUT /themes/project/{id}, PATCH
// /projects/{id}/visibility) and read back before the scenario starts, so a
// scenario that claims "non-public" is asserting against a project the real public
// feed really does not carry. The only stub in the file is the failing theme
// catalog, a state a healthy backend will not produce on demand.
//
// Step text is prefixed with "the overview page" / "the proof project card"
// wherever it could collide, because Cucumber matches step text across every file
// in the suite. Reused rather than copied, from the files that own them:
//
//   - the catalog reset, the per-scenario link staging of the proof project and the
//     student login come from the TS-task-019 suite;
//   - opening/searching/asserting the two seeded project cards, the theme pill
//     click and the debounce wait come from the BUG-404 suite, which drives this
//     same page.
//
// Nothing links those files to this one at load time, so renaming a step there
// breaks this feature silently - check it before you do.

const assert = require('node:assert/strict');

const { After, Given, Then, When } = require('@qavajs/core');

const {
  ARCHIVED_SOURCE_PROJECT_ID,
  CROSS_BUSINESS_PROJECT_ID,
  E2E_TEACHER_ID,
  FRONTEND_URL,
  PROOF_PROJECT_ID,
} = require('../support/test-data.cjs');
const { page, loginToken } = require('../support/e2e-session.cjs');
const { fetchThemes, themeApi } = require('../support/theme-catalog.cjs');
const { stubThemesEndpoint } = require('../support/theme-stub.cjs');

const OVERVIEW_URL = `${FRONTEND_URL}/ontdek`;

// The page's own reads, by pathname. `/businesses/complete` is the enriched query
// the themes must now come from; the other two are the shapes AC-3 forbids - the
// per-project theme endpoint the page currently loops over, and the public project
// feed that made it public-only in the first place.
const BUSINESS_QUERY_PATH = '/businesses/complete';
const PROJECT_THEME_PATH = '/themes/project/';
const PUBLIC_FEED_PATH = '/projects/public';

// --- world state -----------------------------------------------------------------

function state(world) {
  if (!world.overviewThemeSource) world.overviewThemeSource = { requests: [], hidProofProject: false };
  return world.overviewThemeSource;
}

// Hiding the proof project is the one change this suite makes that outlives its
// scenario, and the seed's default is public. The stack-health and api-memory
// suites read GET /projects/public without staging it - they are asserting on the
// seeded fixture - so a scenario that left the project hidden would fail them
// several features later, with nothing pointing back here. Restored to the seeded
// default rather than to whatever it happened to be, because that is what those
// suites are entitled to.
After(async function () {
  if (this.overviewThemeSource?.hidProofProject) {
    await setProjectVisibility(PROOF_PROJECT_ID, true);
  }
});

// --- backend staging ---------------------------------------------------------------

let cachedTeacherToken = null;

async function teacherApi(pathname, options) {
  cachedTeacherToken ??= await loginToken(E2E_TEACHER_ID);
  return themeApi(pathname, cachedTeacherToken, options);
}

/** Resolve theme names to the ids the live baseline catalog assigned them. */
async function themeIdsFor(names) {
  const catalog = await fetchThemes();
  return names.map((name) => {
    const theme = catalog.find((candidate) => candidate?.name === name);
    assert.ok(theme?.id, `Expected a theme named '${name}' in the catalog, got ${JSON.stringify(catalog.map((t) => t?.name))}`);
    return theme.id;
  });
}

/** The theme names a project is really linked to, read through the real endpoint. */
async function linkedThemeNames(projectId) {
  const result = await themeApi(`/themes/project/${projectId}`, null);
  assert.equal(result.status, 200, `Expected GET /themes/project/${projectId} to return 200, received ${result.status}`);
  assert.ok(Array.isArray(result.body), `Expected GET /themes/project/${projectId} to return an array, received ${JSON.stringify(result.body)}`);
  return result.body.map((theme) => theme?.name).sort();
}

/** Stage a project's theme links through the real endpoint, then read them back. */
async function setProjectThemes(projectId, names) {
  const themeIds = await themeIdsFor(names);
  const result = await teacherApi(`/themes/project/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify({ theme_ids: themeIds }),
  });
  assert.equal(result.status, 200, `Expected staging PUT /themes/project/${projectId} to return 200, received ${result.status}: ${JSON.stringify(result.body)}`);
  assert.deepEqual(
    await linkedThemeNames(projectId),
    [...names].sort(),
    `Expected the staged theme links of ${projectId} to be readable back before the scenario starts`,
  );
}

/**
 * Flip a project's public visibility through the real endpoint and verify it
 * against the real public feed.
 *
 * The feed check is the point of the step, not decoration: every scenario about a
 * "non-public project" is worthless if the project quietly stayed public, and
 * sibling suites do publish and unpublish this same project.
 */
async function setProjectVisibility(projectId, isPublic) {
  const result = await teacherApi(`/projects/${projectId}/visibility?is_public=${isPublic}`, { method: 'PATCH' });
  assert.equal(result.status, 200, `Expected setting visibility of ${projectId} to return 200, received ${result.status}: ${JSON.stringify(result.body)}`);

  const feed = await themeApi(PUBLIC_FEED_PATH, null);
  assert.equal(feed.status, 200, `Expected GET ${PUBLIC_FEED_PATH} to return 200, received ${feed.status}`);
  const onFeed = feed.body.some((project) => project?.id === projectId);
  assert.equal(
    onFeed,
    isPublic,
    `Expected project ${projectId} to be ${isPublic ? 'present on' : 'absent from'} the public feed after staging its visibility`,
  );
}

function parseNames(names) {
  return names.split(',').map((name) => name.trim()).filter(Boolean);
}

// --- element helpers ---------------------------------------------------------------

function projectCard(world, projectId) {
  return page(world).locator(`#project-${projectId}`);
}

/** Every project card currently rendered, on whichever organisation. */
function projectCards(world) {
  return page(world).locator('article[id^="project-"]');
}

/** The "Thema's" label that heads the theme filter row; absent when there are no pills. */
function themeRowLabel(world) {
  return page(world).getByText("Thema's", { exact: true });
}

function escapeForRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * A theme filter pill, matched on its accessible name: the theme name followed by
 * its count. Anchored on both ends so the "Verwijder filter: <name>" chip the same
 * theme gets once selected can never be picked up instead.
 */
function themePill(world, name) {
  return page(world).getByRole('button', { name: new RegExp(`^${escapeForRegExp(name)}\\s+\\d+$`) });
}

/**
 * The pill's visible label and count, as the two pieces its accessible name is
 * built from. The Material Symbols icon is skipped by the same rule the browser
 * uses for the accessible name - it is aria-hidden - so a themed pill and an
 * icon-less one read back identically.
 */
async function themePillParts(pill) {
  return pill.evaluate((el) =>
    [...el.childNodes]
      .filter((node) => !(node.nodeType === Node.ELEMENT_NODE && node.getAttribute('aria-hidden') === 'true'))
      .map((node) => node.textContent.trim())
      .filter(Boolean),
  );
}

async function visibleCard(world, projectId, description) {
  const card = projectCard(world, projectId);
  try {
    // Deliberately under cucumber's 20s step timeout: at 20s the runner kills the
    // step and reports "function timed out" with nothing about the page, which is
    // useless for diagnosing a filter that showed the wrong set.
    await card.waitFor({ state: 'visible', timeout: 12_000 });
  } catch (error) {
    const seen = await page(world).evaluate(() => ({
      url: location.href,
      cards: [...document.querySelectorAll('article[id^="project-"]')].map((el) => el.id),
      search: document.querySelector('#search')?.value ?? null,
      alert: document.querySelector('[role="alert"]')?.innerText ?? null,
    }));
    throw new Error(`Expected the ${description} card on screen. ${error.message}\nPage at that moment: ${JSON.stringify(seen)}`);
  }
  return card;
}

/** The theme badge label on a project's card, once the card itself is on screen. */
async function badgeLabel(world, projectId, description) {
  const card = await visibleCard(world, projectId, description);
  const name = card.getByTestId('project-theme-badge-name');
  await name.waitFor({ state: 'visible', timeout: 10_000 });
  return (await name.innerText()).trim();
}

// --- Given ---------------------------------------------------------------------------

Given('the proof project is not publicly visible', async function () {
  state(this).hidProofProject = true;
  await setProjectVisibility(PROOF_PROJECT_ID, false);
});

Given('the cross-business project is publicly visible', async function () {
  await setProjectVisibility(CROSS_BUSINESS_PROJECT_ID, true);
});

Given("the cross-business project's linked themes are {string}", async function (names) {
  await setProjectThemes(CROSS_BUSINESS_PROJECT_ID, parseNames(names));
});

Given("the cross-business project's linked themes are cleared", async function () {
  await setProjectThemes(CROSS_BUSINESS_PROJECT_ID, []);
});

Given('the archived organisation\'s project is linked to the theme {string}', async function (name) {
  // The seeded project of the archived organisation. Its business is filtered out
  // of GET /businesses/complete, so this is a real "theme the user cannot reach"
  // rather than a theme with no links at all.
  await setProjectThemes(ARCHIVED_SOURCE_PROJECT_ID, parseNames(name));
});

Given("the overview page's theme catalog fails to load", async function () {
  await stubThemesEndpoint(page(this), { status: 500 });
});

// --- When ----------------------------------------------------------------------------

When('I open the overview page with its network traffic recorded', async function () {
  // The listener has to be attached before the goto to cover the page's own load,
  // so the previously open page is dropped to about:blank first. Without that, the
  // landing page the login step leaves behind keeps running for a few milliseconds
  // into the navigation and fires its DiscoverySection reads - including
  // GET /projects/public - into this recording, which is exactly the traffic the
  // AC-3 assertions are about.
  await page(this).goto('about:blank');
  page(this).on('request', (request) => {
    state(this).requests.push({ method: request.method(), url: request.url() });
  });
  await page(this).goto(OVERVIEW_URL);

  await page(this).getByPlaceholder('Zoek organisatie of project...').waitFor({ state: 'visible', timeout: 20_000 });
  // The list, not just the search box: every assertion below is about what the
  // loaded page shows, and the search box renders long before the projects do.
  await projectCards(this).first().waitFor({ state: 'visible', timeout: 20_000 });
});

When('I filter on the skill {string}', async function (skillName) {
  // Matched on a prefix, not exactly: the button's accessible name gains the
  // selection count ("Skills 1") the moment a skill is picked, and this same
  // locator has to close the panel again afterwards.
  const skillsPanelToggle = page(this).getByRole('button', { name: /^Skills/ });
  await skillsPanelToggle.click();

  // Every skill badge in the editor carries this label, whichever section it is
  // listed under. Selecting one applies the filter immediately (instantApply).
  const skill = page(this).getByRole('button', { name: `${skillName} toevoegen` }).first();
  await skill.waitFor({ state: 'visible', timeout: 10_000 });
  await skill.click();

  // Closing the panel is what makes the applied filter observable: the active
  // filter chips are deliberately hidden while the skills editor is open, so the
  // chip below can only appear once the panel is closed AND the selection has been
  // applied - which happens from a timer, hence waiting for it rather than
  // asserting against a filter that had not run yet.
  await skillsPanelToggle.click();
  await page(this).getByRole('button', { name: `Verwijder filter: ${skillName}` }).waitFor({ state: 'visible', timeout: 10_000 });
});

When('I clear the theme filter', async function () {
  // The "Alles" pill of the theme row, which is the row's own reset. Scoped to the
  // theme row so the identically labelled sector reset cannot be clicked instead.
  const row = page(this).locator('div').filter({ has: themeRowLabel(this) }).last();
  await row.getByRole('button', { name: 'Alles', exact: true }).click();
});

// --- Then: the badges (AC-1, AC-2) -----------------------------------------------------

Then('the proof project card shows the theme badge {string}', async function (label) {
  assert.equal(await badgeLabel(this, PROOF_PROJECT_ID, 'proof project'), label, `Expected the proof project card to show the theme badge '${label}'`);
});

Then('the cross-business project card shows the theme badge {string}', async function (label) {
  assert.equal(await badgeLabel(this, CROSS_BUSINESS_PROJECT_ID, 'cross-business project'), label, `Expected the cross-business project card to show the theme badge '${label}'`);
});

Then('the proof project card shows no theme badge', async function () {
  const card = await visibleCard(this, PROOF_PROJECT_ID, 'proof project');
  assert.equal(
    await card.getByTestId('project-theme-badge').count(),
    0,
    'Expected a project without linked themes to render no theme badge',
  );
});

Then('the overview page shows exactly the proof project and the cross-business project', async function () {
  await visibleCard(this, PROOF_PROJECT_ID, 'proof project');
  await visibleCard(this, CROSS_BUSINESS_PROJECT_ID, 'cross-business project');
  const shown = await projectCards(this).evaluateAll((cards) => cards.map((card) => card.id).sort());
  assert.deepEqual(
    shown,
    [`project-${PROOF_PROJECT_ID}`, `project-${CROSS_BUSINESS_PROJECT_ID}`].sort(),
    'Expected the theme-filtered list to hold exactly the two matching projects',
  );
});

// --- Then: where the themes came from (AC-3) -------------------------------------------

Then('the overview page requested the enriched business query', async function () {
  const { requests } = state(this);
  // Guards every "no such request was made" assertion below against passing for the
  // wrong reason: if the recording missed the page's load entirely, absence would be
  // trivially true.
  assert.ok(
    requests.some((request) => new URL(request.url).pathname === BUSINESS_QUERY_PATH),
    `Expected the overview page to read ${BUSINESS_QUERY_PATH}, saw ${requests.length} requests: ${JSON.stringify(requests.map((r) => new URL(r.url).pathname))}`,
  );
});

Then('the overview page requested no per-project theme endpoint', async function () {
  const offenders = state(this).requests.filter((request) => new URL(request.url).pathname.startsWith(PROJECT_THEME_PATH));
  assert.deepEqual(
    offenders.map((request) => `${request.method} ${new URL(request.url).pathname}`),
    [],
    'Expected the overview page to take its themes from the business query rather than reading them per project',
  );
});

Then('the overview page requested no public project feed', async function () {
  const offenders = state(this).requests.filter((request) => new URL(request.url).pathname === PUBLIC_FEED_PATH);
  assert.deepEqual(
    offenders.map((request) => `${request.method} ${new URL(request.url).pathname}`),
    [],
    'Expected the overview page not to read the public project feed, which only ever carried the public projects',
  );
});

// --- Then: the theme filter pills (AC-4, AC-5) -----------------------------------------

Then('the theme filter pill {string} shows the count {string}', async function (name, expected) {
  const pill = themePill(this, name);
  await pill.waitFor({ state: 'visible', timeout: 10_000 });
  assert.deepEqual(
    await themePillParts(pill),
    [name, expected],
    `Expected a theme filter pill labelled '${name}' showing the count '${expected}'`,
  );
});

Then('the overview page offers no theme filter pill {string}', async function (name) {
  // Non-vacuity first: with no theme row at all, "this pill is missing" would be
  // true for a reason that has nothing to do with zero-count filtering.
  await themeRowLabel(this).waitFor({ state: 'visible', timeout: 10_000 });
  assert.equal(
    await themePill(this, name).count(),
    0,
    `Expected the theme '${name}' to be left out of the filter row, having no project the user can see`,
  );
});

Then('the overview page offers no theme filter pills at all', async function () {
  assert.equal(
    await themeRowLabel(this).count(),
    0,
    'Expected no theme filter row when the theme catalog failed to load',
  );
});