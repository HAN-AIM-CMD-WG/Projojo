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
  FRONTEND_URL,
  PROOF_PROJECT_ID,
} = require('../support/test-data.cjs');
const { page } = require('../support/e2e-session.cjs');
const { themeApi, teacherApi } = require('../support/theme-catalog.cjs');
const { setProjectThemes } = require('../support/project-themes.cjs');
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
  if (!world.overviewThemeSource) {
    world.overviewThemeSource = { requests: [], hidProofProject: false, linkedArchivedProject: false };
  }
  return world.overviewThemeSource;
}

// The two changes this suite makes that outlive their scenario, both undone here.
//
// Hiding the proof project is the more dangerous one: the seed's default is public,
// and the stack-health and api-memory suites read GET /projects/public without
// staging it - they are asserting on the seeded fixture - so a scenario that left
// the project hidden would fail them several features later, with nothing pointing
// back here. Restored to the seeded default rather than to whatever it happened to
// be, because that is what those suites are entitled to.
//
// The archived organisation's theme link is the milder one: every theme suite
// resets the catalog, and a reset deletes each theme's links along with it, so the
// link cannot survive into an assertion. Cleared anyway - a fixture left linked to
// a theme nothing in the seed explains is a trap for whoever debugs here next.
After(async function () {
  const current = this.overviewThemeSource;
  if (current?.hidProofProject) {
    await setProjectVisibility(PROOF_PROJECT_ID, true);
  }
  if (current?.linkedArchivedProject) {
    await setProjectThemes(ARCHIVED_SOURCE_PROJECT_ID, []);
  }
});

// --- backend staging ---------------------------------------------------------------

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
 * theme gets once selected can never be picked up instead. The Material Symbols
 * icon drops out of that name by the browser's own rule - it is aria-hidden - so a
 * themed pill and an icon-less one match identically.
 *
 * The count is matched here rather than read back from the DOM afterwards, because
 * the accessible name is computed from what is actually rendered: a count hidden by
 * some future responsive class would leave the name and fail this locator, where
 * reading the element's text would still find it and pass.
 */
function themePill(world, name, count = '\\d+') {
  return page(world).getByRole('button', { name: new RegExp(`^${escapeForRegExp(name)}\\s+${count}$`) });
}

/** Assert the rendered cards are exactly `projectIds`, in any order. */
async function assertExactCards(world, projectIds, description) {
  const shown = await projectCards(world).evaluateAll((cards) => cards.map((card) => card.id).sort());
  assert.deepEqual(shown, projectIds.map((id) => `project-${id}`).sort(), description);
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
  state(this).linkedArchivedProject = true;
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
  //
  // The cross-business card specifically, rather than whichever card renders first:
  // the scenarios below prove a filtered list by that card's ABSENCE, which proves
  // nothing unless it was on the unfiltered page to begin with. It is also the only
  // card that can be waited for safely here - its organisation holds exactly one
  // project, whereas the proof project's organisation collects the projects
  // TS-task-015 creates and cannot delete, and a business renders only its first
  // three (ProjectDashboard), in an order TypeDB is free to choose.
  await visibleCard(this, CROSS_BUSINESS_PROJECT_ID, 'cross-business project');
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

When('I clear the theme filter {string}', async function (name) {
  // The active filter chip, which is what a user reaches for and the only affordance
  // here that is globally unique: the theme row's own "Alles" reset is labelled
  // identically to the sector row's, so clicking that one means scoping to the row
  // by its shape - which any extra wrapper element inside the row would break.
  await page(this).getByRole('button', { name: `Verwijder filter: ${name}` }).click();
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
  await assertExactCards(
    this,
    [PROOF_PROJECT_ID, CROSS_BUSINESS_PROJECT_ID],
    'Expected the theme-filtered list to hold exactly the two matching projects',
  );
});

Then('the overview page shows exactly the proof project', async function () {
  await visibleCard(this, PROOF_PROJECT_ID, 'proof project');
  await assertExactCards(
    this,
    [PROOF_PROJECT_ID],
    'Expected the filtered list to hold exactly the proof project',
  );
});

// --- Then: where the themes came from (AC-3) -------------------------------------------

/**
 * Guards every "no such request was made" assertion against passing for the wrong
 * reason: if the recording missed the page's load entirely, absence would be
 * trivially true. Called by the negative steps themselves rather than left to the
 * feature file to remember, so the vacuous version cannot be written by accident -
 * the scenarios state it explicitly as well, because it is worth reading there.
 */
function assertBusinessQuerySeen(world) {
  const { requests } = state(world);
  assert.ok(
    requests.some((request) => new URL(request.url).pathname === BUSINESS_QUERY_PATH),
    `Expected the overview page to read ${BUSINESS_QUERY_PATH}, saw ${requests.length} requests: ${JSON.stringify(requests.map((r) => new URL(r.url).pathname))}`,
  );
}

/** The recorded requests whose pathname satisfies `matches`, as "METHOD /path". */
function recordedRequests(world, matches) {
  return state(world)
    .requests.filter((request) => matches(new URL(request.url).pathname))
    .map((request) => `${request.method} ${new URL(request.url).pathname}`);
}

Then('the overview page requested the enriched business query', function () {
  assertBusinessQuerySeen(this);
});

Then('the overview page requested no per-project theme endpoint', function () {
  assertBusinessQuerySeen(this);
  assert.deepEqual(
    recordedRequests(this, (pathname) => pathname.startsWith(PROJECT_THEME_PATH)),
    [],
    'Expected the overview page to take its themes from the business query rather than reading them per project',
  );
});

Then('the overview page requested no public project feed', function () {
  assertBusinessQuerySeen(this);
  assert.deepEqual(
    recordedRequests(this, (pathname) => pathname === PUBLIC_FEED_PATH),
    [],
    'Expected the overview page not to read the public project feed, which only ever carried the public projects',
  );
});

// --- Then: the theme filter pills (AC-4, AC-5) -----------------------------------------

Then('the theme filter pill {string} shows the count {string}', async function (name, expected) {
  try {
    await themePill(this, name, escapeForRegExp(expected)).waitFor({ state: 'visible', timeout: 10_000 });
  } catch (error) {
    // On its own the failure reads "locator did not become visible", which cannot
    // tell a wrong count from a missing pill - and the count is the assertion.
    const seen = await themePill(this, name).allInnerTexts();
    throw new Error(
      `Expected a theme filter pill '${name}' showing the count '${expected}'. Pills labelled '${name}' on screen: ${JSON.stringify(seen)}. ${error.message}`,
    );
  }
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