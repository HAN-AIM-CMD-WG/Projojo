// TS-task-019 — read-only theme display on ProjectDetailsPage.
//
// UI suite against the real stack: the details page of the seeded proof project
// is opened as a normal user, and the themes it shows are verified against the
// project's real theme links (staged per scenario through the real
// PUT /themes/project/{id}) and the baseline catalog's real icon/color values.
//
// The display's own data source is GET /themes/project/{id} - the endpoint AC-5
// mandates - so the network-level assertion watches for exactly that request.
// Only the loading state (slow read) and the graceful-degradation path (failed
// read) are staged with a Playwright route; everything else is real.
//
// The step names are deliberately display-specific ("theme pill", "on the project
// details") because Cucumber matches step text globally: the TS-014 picker suite
// and the TS-015/016 create/edit suites define similarly-shaped steps, and this
// file must not collide with them.
//
// That same global registry means this file has a second consumer: the TS-task-017
// inline-edit feature reuses the catalog reset, the per-scenario link staging, the
// logins, opening the page, the read-only pill assertions, the empty-state message
// and the failing read from here. Nothing links the two at load time, so renaming or
// retiring a step below changes that feature silently - check it before you do.

const assert = require('node:assert/strict');

const { Given, Then, When } = require('@qavajs/core');

const {
  E2E_STUDENT_ID,
  E2E_TEACHER_ID,
  FRONTEND_URL,
  PROOF_PROJECT_ID,
  PROOF_PROJECT_NAME,
  PROOF_SUPERVISOR_USER_ID,
} = require('../support/test-data.cjs');
const { page, authenticateInBrowser, loginToken } = require('../support/e2e-session.cjs');
const { resetThemeCatalog, fetchThemes, themeApi } = require('../support/theme-catalog.cjs');
const { stubProjectThemeEndpoint } = require('../support/theme-stub.cjs');

const PROJECT_PATH = `/projects/${PROOF_PROJECT_ID}`;

// Long enough that the loading assertion runs well inside the window, short
// enough not to dominate the suite's runtime.
const LOADING_DELAY_MS = 2_500;

// Every shape that would make an element interactive or focusable. A read-only
// theme pill must be none of these and contain none of these - not just the
// <button>/<a> it happens to avoid today, but also the
// <select>/<input>/[contenteditable]/focusable pill an interactive rewrite would
// introduce. Used section-wide only where no user may edit at all: since
// TS-task-017 the section legitimately carries an edit control for the project's
// supervisor and for teachers, so "the section holds nothing interactive" is a
// statement about those users, not about the pills.
const INTERACTIVE_SELECTOR = 'button, a, input, select, textarea, [contenteditable="true"], [role="button"], [tabindex]';

// --- backend staging (mirrors the self-contained pattern of the 015/016 suites) --

let cachedTeacherToken = null;

async function teacherApi(pathname, options) {
  cachedTeacherToken ??= await loginToken(E2E_TEACHER_ID);
  return themeApi(pathname, cachedTeacherToken, options);
}

function parseNames(names) {
  return names.split(',').map((name) => name.trim()).filter(Boolean).sort();
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

/** Read back the names the project is linked to, through the real endpoint. */
async function linkedThemeNames() {
  const result = await themeApi(`/themes/project/${PROOF_PROJECT_ID}`, null);
  assert.equal(result.status, 200, `Expected GET /themes/project/{id} to return 200, received ${result.status}: ${JSON.stringify(result.body)}`);
  assert.ok(Array.isArray(result.body), `Expected GET /themes/project/{id} to return an array, received ${JSON.stringify(result.body)}`);
  return result.body.map((theme) => theme?.name).sort();
}

/** Stage the project's theme links through the real endpoint, then verify them. */
async function setProjectThemes(names) {
  const themeIds = await themeIdsFor(names);
  const result = await teacherApi(`/themes/project/${PROOF_PROJECT_ID}`, {
    method: 'PUT',
    body: JSON.stringify({ theme_ids: themeIds }),
  });
  assert.equal(result.status, 200, `Expected staging PUT /themes/project/{id} to return 200, received ${result.status}: ${JSON.stringify(result.body)}`);
  assert.deepEqual(await linkedThemeNames(), [...names].sort(), 'Expected the staged theme links to be readable back before the scenario starts');
}

// --- page helpers ---------------------------------------------------------------

function section(world) {
  return page(world).getByTestId('project-themes');
}

function pills(world) {
  return section(world).getByTestId('project-theme-pill');
}

/** A single theme pill matched exactly on the id the catalog gave the name. */
async function pillByName(world, name) {
  const catalog = await fetchThemes();
  const theme = catalog.find((candidate) => candidate?.name === name);
  assert.ok(theme?.id, `Expected a theme named '${name}' in the catalog to locate its pill`);
  return section(world).locator(`[data-testid="project-theme-pill"][data-theme-id="${theme.id}"]`);
}

/** The names shown on the pills, read from the dedicated name element (not the icon ligature). */
async function shownPillNames(world) {
  await pills(world).first().waitFor({ state: 'visible', timeout: 10_000 });
  const names = await section(world).getByTestId('project-theme-name').allInnerTexts();
  return names.map((text) => text.trim()).sort();
}

function projectHeading(world) {
  return page(world).getByRole('heading', { level: 1, name: PROOF_PROJECT_NAME });
}

function tasksHeading(world) {
  return page(world).getByRole('heading', { name: 'Beschikbare taken', exact: true });
}

function currentPath(world) {
  return new URL(page(world).url()).pathname;
}

function state(world) {
  if (!world.themeDisplay) world.themeDisplay = { requests: [] };
  return world.themeDisplay;
}

/** '#4CAF50' -> 'rgb(76, 175, 80)', the shape getComputedStyle returns. */
function hexToRgb(hex) {
  const value = hex.replace('#', '');
  const [r, g, b] = [value.slice(0, 2), value.slice(2, 4), value.slice(4, 6)].map((c) => parseInt(c, 16));
  return `rgb(${r}, ${g}, ${b})`;
}

// --- Given ----------------------------------------------------------------------

Given('the theme catalog is reset to the shared baseline themes', async function () {
  // Real backend: wipe the live catalog and recreate the shared deterministic
  // baseline, whose Duurzaamheid carries icon "eco" and color #4CAF50 exactly as
  // the AC-2 example asserts. Deleting a theme also drops its project links, so
  // this runs before the per-scenario link staging.
  await resetThemeCatalog();
});

Given("the project's linked themes are {string}", async function (names) {
  await setProjectThemes(parseNames(names));
});

Given("the project's linked themes are cleared", async function () {
  await setProjectThemes([]);
});

Given('I am authenticated in the browser as a student', async function () {
  await authenticateInBrowser(this, E2E_STUDENT_ID);
});

Given("I am authenticated in the browser as the project's supervisor", async function () {
  await authenticateInBrowser(this, PROOF_SUPERVISOR_USER_ID);
});

Given('the project theme fetch is slow', async function () {
  await stubProjectThemeEndpoint(page(this), { get: { delayMs: LOADING_DELAY_MS } });
});

Given('the project theme fetch fails', async function () {
  await stubProjectThemeEndpoint(page(this), { get: { status: 500 } });
});

// --- When -----------------------------------------------------------------------

When('I open the project details page', async function () {
  // Recorded from here on so the AC-5 endpoint assertion is made against this
  // scenario's real traffic.
  page(this).on('request', (request) => {
    state(this).requests.push({ method: request.method(), url: request.url() });
  });

  await page(this).goto(`${FRONTEND_URL}${PROJECT_PATH}`);
  // Always present once the project itself has loaded, regardless of theme state,
  // so this wait does not mask the theme loading / error branches under test.
  await projectHeading(this).waitFor({ state: 'visible', timeout: 15_000 });
});

When('I click the project theme pill {string}', async function (name) {
  await (await pillByName(this, name)).click();
});

// --- Then: the section and its pills (AC-1, AC-3) --------------------------------

Then('a {string} section is shown on the project details', async function (heading) {
  await section(this).waitFor({ state: 'visible', timeout: 10_000 });
  const text = await section(this).innerText();
  assert.ok(text.includes(heading), `Expected the theme section to be headed '${heading}', got '${text}'`);
});

Then('exactly the theme pills {string} are shown', async function (names) {
  assert.deepEqual(await shownPillNames(this), parseNames(names), 'Expected exactly these theme pills to be shown');
});

// --- Then: a single pill's icon, name and color (AC-2) --------------------------

Then('the {string} theme pill shows the Material Symbols icon {string}', async function (name, icon) {
  const pill = await pillByName(this, name);
  await pill.waitFor({ state: 'visible', timeout: 10_000 });
  const iconEl = pill.getByTestId('project-theme-icon');
  // "shows" means visibly rendered, not merely present in the DOM: innerText on a
  // display:none element falls back to textContent, so a hidden icon would still
  // read "eco". Assert visibility explicitly so this step verifies its promise.
  assert.ok(await iconEl.isVisible(), `Expected the '${name}' pill to visibly show its Material Symbols icon`);
  const classes = await iconEl.getAttribute('class');
  assert.ok(
    (classes ?? '').includes('material-symbols'),
    `Expected the '${name}' pill icon to be a Material Symbols glyph, got class '${classes}'`,
  );
  assert.equal((await iconEl.innerText()).trim(), icon, `Expected the '${name}' pill to show the '${icon}' icon`);
});

Then('the {string} theme pill is labelled {string}', async function (name, label) {
  const nameEl = (await pillByName(this, name)).getByTestId('project-theme-name');
  assert.equal((await nameEl.innerText()).trim(), label, `Expected the '${name}' pill to be labelled '${label}'`);
});

Then('the {string} theme pill uses the color {string} as its background', async function (name, hex) {
  const pill = await pillByName(this, name);
  const background = await pill.evaluate((el) => getComputedStyle(el).backgroundColor);
  assert.equal(background, hexToRgb(hex), `Expected the '${name}' pill background to be ${hex} (${hexToRgb(hex)}), got '${background}'`);
});

// --- Then: the empty state (AC-4) ------------------------------------------------

Then('the theme section shows the message {string}', async function (message) {
  const empty = section(this).getByTestId('project-themes-empty');
  await empty.waitFor({ state: 'visible', timeout: 10_000 });
  assert.equal((await empty.innerText()).trim(), message, `Expected the empty theme section to read '${message}'`);
});

Then('no theme pills are shown on the project details', async function () {
  assert.equal(await pills(this).count(), 0, 'Expected no theme pills when the project has no linked themes');
});

// --- Then: the per-project fetch and its loading state (AC-5) --------------------

Then('the project details page requested the themes via {string}', async function (label) {
  assert.equal(label, 'GET /themes/project/{id}', `Unexpected endpoint label '${label}'`);
  const matches = (request) => request.method === 'GET' && new RegExp(`/themes/project/${PROOF_PROJECT_ID}$`).test(new URL(request.url).pathname);

  // The read fires when the theme section mounts, just after the project loads, so
  // give the recorded traffic a moment to include it rather than sampling once.
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (state(this).requests.some(matches)) return;
    await page(this).waitForTimeout(100);
  }
  const themeRequests = state(this).requests.filter((r) => r.url.includes('/themes/'));
  assert.fail(`Expected a GET to /themes/project/${PROOF_PROJECT_ID}, saw theme requests: ${JSON.stringify(themeRequests)}`);
});

Then('a loading state is shown in the theme section', async function () {
  await section(this).getByTestId('project-themes-loading').waitFor({ state: 'visible', timeout: 10_000 });
});

Then('the loading state is replaced by the theme pills once the fetch completes', async function () {
  await section(this).getByTestId('project-themes-loading').waitFor({ state: 'detached', timeout: 15_000 });
  assert.ok((await shownPillNames(this)).length > 0, 'Expected the loading state to be replaced by real theme pills');
});

// --- Then: placement and layout (AC-6) ------------------------------------------

Then("the theme section appears above the project's task list", async function () {
  await section(this).waitFor({ state: 'visible', timeout: 10_000 });
  await tasksHeading(this).waitFor({ state: 'visible', timeout: 10_000 });
  const sectionBox = await section(this).boundingBox();
  const tasksBox = await tasksHeading(this).boundingBox();
  assert.ok(sectionBox && tasksBox, 'Expected both the theme section and the task list to have a layout box');
  assert.ok(
    sectionBox.y < tasksBox.y,
    `Expected the theme section (y=${sectionBox.y}) to sit above the task list (y=${tasksBox.y})`,
  );
});

Then("the project's name and task list are still shown", async function () {
  assert.ok(await projectHeading(this).isVisible(), 'Expected the project name to still be shown');
  assert.ok(await tasksHeading(this).isVisible(), 'Expected the task list to still be shown');
});

// --- Then: read-only behaviour (AC-7) -------------------------------------------

Then('the theme pills are not interactive controls', async function () {
  await pills(this).first().waitFor({ state: 'visible', timeout: 10_000 });
  const all = await pills(this).all();
  assert.ok(all.length > 0, 'Expected theme pills to inspect');
  for (const pill of all) {
    const { tag, tabIndex } = await pill.evaluate((el) => ({ tag: el.tagName, tabIndex: el.tabIndex }));
    assert.equal(tag, 'SPAN', `Expected a read-only pill to be a <span>, got <${tag.toLowerCase()}>`);
    // A read-only pill must not be reachable by keyboard: a plain <span> reports
    // tabIndex -1, whereas an added tabIndex={0} (the first thing an interactive
    // rewrite introduces) would report 0.
    assert.equal(tabIndex, -1, 'Expected a read-only pill not to be keyboard-focusable');
    assert.equal(await pill.getAttribute('aria-pressed'), null, 'Expected a read-only pill to expose no toggle state');
    assert.equal(
      await pill.locator(INTERACTIVE_SELECTOR).count(),
      0,
      'Expected a read-only pill to contain no interactive or focusable control',
    );
  }
});

Then('the theme pills do not use a pointer cursor', async function () {
  for (const pill of await pills(this).all()) {
    const cursor = await pill.evaluate((el) => getComputedStyle(el).cursor);
    assert.notEqual(cursor, 'pointer', 'Expected a read-only pill not to invite a click with a pointer cursor');
  }
});

Then('I stay on the project details page', async function () {
  await page(this).waitForTimeout(300); // give any (unwanted) navigation a chance to happen
  assert.equal(currentPath(this), PROJECT_PATH, 'Expected clicking a read-only pill not to navigate away');
});

Then('the theme section offers no theme editing control', async function () {
  await section(this).waitFor({ state: 'visible', timeout: 10_000 });
  // Settle first. The section renders its skeleton before it knows anything, and an
  // edit control (TS-task-017) only appears once the current themes are loaded, so
  // counting controls on the loading state would pass without proving anything.
  await section(this).getByTestId('project-themes-loading').waitFor({ state: 'detached', timeout: 15_000 });
  // No editing affordance of any shape - a button, link, select, input, editable
  // region or role="button" would all count as an edit control a user who may not
  // edit this project's themes must never be offered.
  assert.equal(
    await section(this).locator(INTERACTIVE_SELECTOR).count(),
    0,
    'Expected the theme section to offer no editing control of any kind',
  );
});

// --- Then: graceful degradation --------------------------------------------------

Then('the theme section shows a load-error distinct from the empty state', async function () {
  const error = section(this).getByTestId('project-themes-error');
  await error.waitFor({ state: 'visible', timeout: 10_000 });
  const text = (await error.innerText()).trim();
  assert.match(text, /niet.*(geladen|laden)/i, `Expected a theme load-error message, got '${text}'`);
  // The whole point of the branch: a fetch failure is never rendered as the real
  // empty state, so a project that has themes cannot silently look empty.
  assert.notEqual(text, "Geen thema's gekoppeld", 'Expected the load-error not to reuse the empty-state text');
  assert.equal(
    await section(this).getByTestId('project-themes-empty').count(),
    0,
    'Expected the empty-state message not to be shown on a fetch error',
  );
});
