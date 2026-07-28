// TS-task-016 — theme selection on project edit.
//
// UI suite against the real stack: the edit page of the seeded proof project is
// driven like a supervisor would, and the result is verified through the backend
// (GET /projects/{id}/complete, GET /themes/project/{id}) rather than through the
// same UI that wrote it.
//
// Three things are observed at the network level instead of the DOM, because the
// acceptance criteria are about them: that the update call and the link call are
// each sent once, in that order (AC-7), that neither is sent while the removal
// confirmation is still open (AC-4) or after it is cancelled (AC-6), and that no
// link call is sent when the selection did not actually change.
//
// The step names are deliberately edit-specific ("on the edit form", "during the
// save"): the TS-task-015 create suite defines its own similarly-shaped steps and
// Cucumber matches step text globally across every loaded step file.

const assert = require('node:assert/strict');

const { Before, Given, Then, When } = require('@qavajs/core');

const {
  E2E_TEACHER_ID,
  FRONTEND_URL,
  PROOF_PROJECT_ID,
  PROOF_SUPERVISOR_USER_ID,
} = require('../support/test-data.cjs');
const { page, authenticateInBrowser, loginToken } = require('../support/e2e-session.cjs');
const { resetThemeCatalog, fetchThemes, themeApi } = require('../support/theme-catalog.cjs');
const { stubProjectThemeEndpoint } = require('../support/theme-stub.cjs');

const EDIT_PATH = `/projects/${PROOF_PROJECT_ID}/update`;
const PROJECT_PATH = `/projects/${PROOF_PROJECT_ID}`;

// Long enough that the assertions about the in-between moment (still saving,
// still on the edit page) run well inside the window, short enough not to
// dominate the suite's runtime.
const LINK_DELAY_MS = 3_000;

// Descriptions are written into the shared seeded project, so every scenario
// writes its own text: "the saved description is the new description" can then
// never pass on a value an earlier scenario left behind.
const RUN_ID = Date.now().toString(36);
let descriptionCounter = 0;

// The global toast titles (components/notifications/Notification.jsx). Used to
// tell the app's alert surfaces apart: anything visible with role="alert" that is
// not one of these is either an error toast (titled "Fout") or an inline <Alert>.
// Both entries are load-bearing: the toast is always mounted and renders the
// literal "Info" until it has fired, and Playwright counts that opacity:0 element
// as visible.
const SUCCESS_TITLE = 'Gelukt!';
const INFO_TITLE = 'Info';

function createState() {
  return { requests: [], responses: [], linkStartedAt: null, descriptionBefore: null, newDescription: null };
}

Before(function () {
  this.projectEdit = createState();
});

function state(world) {
  if (!world.projectEdit) world.projectEdit = createState();
  return world.projectEdit;
}

// --- backend helpers -----------------------------------------------------------

// The teacher token is reused across calls: it is only used to read back what the
// UI saved and to stage theme links, and a fresh test login per call would put
// pointless load on the auth endpoint.
let cachedTeacherToken = null;

async function teacherApi(pathname, options) {
  cachedTeacherToken ??= await loginToken(E2E_TEACHER_ID);
  return themeApi(pathname, cachedTeacherToken, options);
}

function parseNames(names) {
  return names.split(',').map((name) => name.trim()).filter(Boolean).sort();
}

/** Resolve theme names to the ids the live catalog assigned them. */
async function themeIdsFor(names) {
  const catalog = await fetchThemes();
  return names.map((name) => {
    const theme = catalog.find((candidate) => candidate?.name === name);
    assert.ok(theme?.id, `Expected a theme named '${name}' in the catalog, got ${JSON.stringify(catalog.map((t) => t?.name))}`);
    return theme.id;
  });
}

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

async function savedDescription() {
  const result = await teacherApi(`/projects/${PROOF_PROJECT_ID}/complete`);
  assert.equal(result.status, 200, `Expected GET /projects/{id}/complete to return 200, received ${result.status}: ${JSON.stringify(result.body)}`);
  return result.body?.description ?? '';
}

// --- page helpers --------------------------------------------------------------

function picker(world) {
  return page(world).getByTestId('theme-picker');
}

/** A theme pill on the edit form, matched on its exact accessible name. */
function pill(world, name) {
  return picker(world).getByRole('button', { name, exact: true });
}

function saveButton(world) {
  return page(world).locator('form button[type="submit"]');
}

function confirmation(world) {
  return page(world).getByTestId('theme-removal-modal');
}

function currentPath(world) {
  return new URL(page(world).url()).pathname;
}

function isThemeLink(request) {
  return request.method === 'PUT' && /\/themes\/project\/[^/?]+$/.test(request.url);
}

function isProjectUpdate(request) {
  return request.method === 'PUT' && request.url.endsWith(`/projects/${PROOF_PROJECT_ID}`);
}

/** Visible role="alert" texts on the current page, ignoring empty alert containers. */
async function visibleAlertTexts(world) {
  const alerts = await page(world).getByRole('alert').all();
  const texts = [];
  for (const alert of alerts) {
    if (!(await alert.isVisible())) continue;
    const text = (await alert.innerText()).trim();
    if (text) texts.push(text);
  }
  return texts;
}

/** Wait until the staged link request has been intercepted, i.e. the linking window is open. */
async function waitForLinkStart(world, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (state(world).linkStartedAt) return;
    await page(world).waitForTimeout(50);
  }
  assert.fail(`Expected the theme link request to have started within ${timeoutMs}ms`);
}

/** The selected/unselected state of every pill on the edit form, keyed by theme name. */
async function selectionState(world) {
  // Cancelling the removal remounts the picker, which re-fetches the catalog and
  // shows skeletons until it lands - so wait for real pills before reading them.
  await picker(world).getByTestId('theme-pill').first().waitFor({ state: 'visible', timeout: 10_000 });
  const pills = await picker(world).getByTestId('theme-pill').all();
  assert.ok(pills.length > 0, 'Expected theme pills to inspect on the edit form');
  const selected = [];
  const unselected = [];
  for (const themePill of pills) {
    const name = (await themePill.innerText()).trim();
    const pressed = await themePill.getAttribute('aria-pressed');
    assert.ok(pressed === 'true' || pressed === 'false', `Expected '${name}' to expose aria-pressed, got '${pressed}'`);
    (pressed === 'true' ? selected : unselected).push(name);
  }
  return { selected: selected.sort(), unselected: unselected.sort() };
}

// --- Given ---------------------------------------------------------------------

Given('the theme catalog contains the TS-016 baseline themes', async function () {
  // Real backend: wipe the live catalog and recreate the shared deterministic
  // baseline, so the picker on the edit page renders the real GET /themes/.
  // Deleting a theme also drops its project links, which is why this runs before
  // the per-scenario link staging below.
  await resetThemeCatalog();
});

Given('I am authenticated in the browser as the TS-task-016 supervisor', async function () {
  await authenticateInBrowser(this, PROOF_SUPERVISOR_USER_ID);
});

Given('the project is linked to the themes {string}', async function (names) {
  await setProjectThemes(parseNames(names));
});

Given('the project is linked to no themes', async function () {
  await setProjectThemes([]);
});

Given('the theme link request fails while saving', async function () {
  await stubProjectThemeEndpoint(page(this), { put: { status: 500 } });
});

Given('the theme link request is slow while saving', async function () {
  const current = state(this);
  await stubProjectThemeEndpoint(page(this), {
    put: {
      delayMs: LINK_DELAY_MS,
      onIntercept: () => { current.linkStartedAt ??= Date.now(); },
    },
  });
});

// --- When ----------------------------------------------------------------------

When('I open the edit page of the project', async function () {
  const current = state(this);
  // Recorded from here on so the "sent once, in this order" and "never sent"
  // assertions can be made against the real traffic of this scenario.
  page(this).on('request', (request) => {
    current.requests.push({ method: request.method(), url: request.url() });
  });
  page(this).on('response', (response) => {
    current.responses.push({ method: response.request().method(), url: response.url(), status: response.status() });
  });

  // Snapshot what is persisted now, so "unchanged" can be asserted against a real
  // baseline rather than against a hardcoded seed value.
  current.descriptionBefore = await savedDescription();

  await page(this).goto(`${FRONTEND_URL}${EDIT_PATH}`);
  await saveButton(this).waitFor({ state: 'visible' });
  // The picker is fed by an async fetch of the project's themes; waiting for a
  // pill means later steps act on the settled pre-selection, not on an empty one.
  await picker(this).getByTestId('theme-pill').first().waitFor({ state: 'visible' });
});

When('I change the description on the edit form', async function () {
  const text = `TS016 beschrijving ${RUN_ID}-${++descriptionCounter}`;
  state(this).newDescription = text;

  // Tiptap is a contenteditable: select the existing content and type real keys so
  // ProseMirror's update event fires and the form's description state is replaced.
  await page(this).getByTestId('RichTextInput').click();
  await page(this).keyboard.press('Control+a');
  await page(this).keyboard.type(text);
});

When('I select the themes {string} on the edit form', async function (names) {
  for (const name of parseNames(names)) {
    const target = pill(this, name);
    assert.equal(await target.getAttribute('aria-pressed'), 'false', `Expected '${name}' to be unselected before selecting it`);
    await target.click();
    assert.equal(await target.getAttribute('aria-pressed'), 'true', `Expected '${name}' to be selected after clicking it`);
  }
});

When('I unselect the themes {string} on the edit form', async function (names) {
  for (const name of parseNames(names)) {
    const target = pill(this, name);
    assert.equal(await target.getAttribute('aria-pressed'), 'true', `Expected '${name}' to be selected before unselecting it`);
    await target.click();
    assert.equal(await target.getAttribute('aria-pressed'), 'false', `Expected '${name}' to be unselected after clicking it again`);
  }
});

When('I save the edit form', async function () {
  await saveButton(this).click();
});

When('I confirm the theme removal', async function () {
  await confirmation(this).waitFor({ state: 'visible', timeout: 10_000 });
  await confirmation(this).getByRole('button', { name: 'Ja, verwijderen', exact: true }).click();
});

When('I cancel the theme removal', async function () {
  await confirmation(this).waitFor({ state: 'visible', timeout: 10_000 });
  // Scoped to the dialog on purpose: the edit form itself also has an "Annuleren"
  // button, which navigates away instead of dismissing the confirmation.
  await confirmation(this).getByRole('button', { name: 'Annuleren', exact: true }).click();
  await confirmation(this).waitFor({ state: 'detached', timeout: 10_000 });
});

When('the slow theme link request completes', async function () {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (state(this).responses.some((response) => isThemeLink(response))) return;
    await page(this).waitForTimeout(100);
  }
  assert.fail('Expected the theme link request to have completed within 15000ms');
});

// --- Then: the theme section on the edit form (AC-1) ----------------------------

Then('a {string} section containing the theme picker is shown on the edit form', async function (heading) {
  const section = page(this).getByTestId('project-theme-section');
  await section.waitFor({ state: 'visible' });
  assert.equal(
    await section.getByRole('heading', { name: heading, exact: true }).count(),
    1,
    `Expected the theme section on the edit form to be headed '${heading}'`,
  );
  assert.equal(
    await section.getByTestId('theme-picker').count(),
    1,
    'Expected exactly one theme picker inside the theme section',
  );
});

Then('the edit form theme picker offers the whole theme catalog', async function () {
  // Against the live catalog rather than a fixed list: this proves the page's
  // picker is fed by the real GET /themes/, not that the fixtures were copied.
  const expected = (await fetchThemes()).map((theme) => theme?.name).sort();
  assert.ok(expected.length > 0, 'Expected the baseline reset to have left themes in the catalog');

  const shown = (await picker(this).getByTestId('theme-pill').allInnerTexts()).map((text) => text.trim()).sort();
  assert.deepEqual(shown, expected, 'Expected the edit form to offer every theme in the catalog');
});

Then('exactly the themes {string} are selected on the edit form', async function (names) {
  const expected = parseNames(names);
  const { selected, unselected } = await selectionState(this);
  assert.deepEqual(selected, expected, 'Expected exactly the given themes to be selected on the edit form');
  for (const name of expected) {
    assert.equal(unselected.includes(name), false, `Expected '${name}' not to also appear unselected`);
  }
});

Then('no theme is selected on the edit form', async function () {
  const { selected } = await selectionState(this);
  assert.deepEqual(selected, [], 'Expected no theme to be selected on the edit form');
});

// --- Then: the removal confirmation (AC-4, AC-5, AC-6) ---------------------------

Then('a confirmation asks {string}', async function (message) {
  await confirmation(this).waitFor({ state: 'visible', timeout: 10_000 });
  const shown = (await confirmation(this).getByTestId('theme-removal-message').innerText()).replace(/\s+/g, ' ').trim();
  assert.equal(shown, message, 'Expected the removal confirmation to ask exactly this');
});

Then('the confirmation offers {string} and {string}', async function (confirmLabel, cancelLabel) {
  for (const label of [confirmLabel, cancelLabel]) {
    assert.equal(
      await confirmation(this).getByRole('button', { name: label, exact: true }).count(),
      1,
      `Expected exactly one '${label}' button inside the removal confirmation`,
    );
  }
});

Then('no theme removal confirmation is shown', async function () {
  assert.equal(await confirmation(this).count(), 0, 'Expected no removal confirmation to be shown yet');
});

Then('the save completes without asking for confirmation', async function () {
  // Watches both outcomes at once: a confirmation appearing fails immediately, and
  // landing on the project page proves the save ran through unblocked. A dialog
  // cannot disappear on its own (it only closes on a click), so polling cannot
  // miss one that was shown.
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    assert.equal(await confirmation(this).count(), 0, 'Expected the save not to ask for confirmation');
    if (currentPath(this) === PROJECT_PATH) return;
    await page(this).waitForTimeout(100);
  }
  assert.fail('Expected the save to complete and land on the project page within 15000ms');
});

// --- Then: what was actually persisted (AC-2, AC-3, AC-5, AC-7) -----------------

Then('the project is linked to exactly the themes {string}', async function (names) {
  const expected = parseNames(names);

  // The link call can still be in flight when the page has already navigated, so
  // poll - but only for this exact set, never for "anything".
  const deadline = Date.now() + 10_000;
  let linked = [];
  while (Date.now() < deadline) {
    linked = await linkedThemeNames();
    if (linked.length === expected.length && linked.every((name, index) => name === expected[index])) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.deepEqual(linked, expected, 'Expected the project to be linked to exactly these themes');
});

Then('the project has no linked themes', async function () {
  // Deliberately a single read, not a poll: the scenarios using this have already
  // asserted the flow finished, so a poll could only turn a real failure into a
  // passing first sample.
  const linked = await linkedThemeNames();
  assert.deepEqual(linked, [], `Expected the project to have no linked themes, got ${JSON.stringify(linked)}`);
});

Then('the saved description is the new description', async function () {
  const expected = state(this).newDescription;
  assert.ok(expected, 'Expected a description to have been typed on the edit form first');

  // The editor round-trips through markdown, so the persisted value may carry
  // wrapping markup; the typed text is run-unique, so containment is a real check.
  const deadline = Date.now() + 10_000;
  let description = '';
  while (Date.now() < deadline) {
    description = await savedDescription();
    if (description.includes(expected)) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.fail(`Expected the saved description to contain '${expected}', got '${description}'`);
});

Then('the saved description is unchanged', async function () {
  const before = state(this).descriptionBefore;
  assert.notEqual(before, null, 'Expected the edit page to have been opened first');
  // Give an unwanted in-flight save a chance to land before asserting absence.
  await page(this).waitForTimeout(500);
  assert.equal(await savedDescription(), before, 'Expected the project description to be untouched');
});

// --- Then: the requests the save did and did not send ----------------------------

Then('no theme link request was sent during the save', async function () {
  // Give an unwanted in-flight request a chance to be recorded before asserting absence.
  await page(this).waitForTimeout(500);
  const links = state(this).requests.filter(isThemeLink);
  assert.deepEqual(links, [], `Expected no request to the project theme link endpoint, got ${JSON.stringify(links)}`);
});

Then('no project update request was sent', async function () {
  await page(this).waitForTimeout(500);
  const updates = state(this).requests.filter(isProjectUpdate);
  assert.deepEqual(updates, [], `Expected no project update request, got ${JSON.stringify(updates)}`);
});

Then('the project was updated once and its themes were linked once, in that order', function () {
  const recorded = state(this).requests;

  const updates = recorded.filter(isProjectUpdate);
  assert.equal(updates.length, 1, `Expected exactly one project update request, got ${JSON.stringify(updates)}`);

  const links = recorded.filter(isThemeLink);
  assert.equal(links.length, 1, `Expected exactly one theme link request, got ${JSON.stringify(links)}`);
  assert.ok(
    links[0].url.endsWith(`/themes/project/${PROOF_PROJECT_ID}`),
    `Expected the link request to target the edited project, got ${links[0].url}`,
  );

  assert.ok(
    recorded.indexOf(links[0]) > recorded.indexOf(updates[0]),
    'Expected the theme link request to be sent after the project update request, not before or instead of it',
  );
});

// --- Then: navigation and messages ----------------------------------------------

Then('I am taken to the project page', async function () {
  await page(this).waitForURL(`${FRONTEND_URL}${PROJECT_PATH}`, { timeout: 15_000 });
  assert.equal(currentPath(this), PROJECT_PATH, "Expected to land on the project's page");
});

Then('I am still on the edit page', function () {
  assert.equal(currentPath(this), EDIT_PATH, 'Expected to stay on the project edit page');
});

Then('no error message is shown to the supervisor', async function () {
  const texts = await visibleAlertTexts(this);
  const offending = texts.filter((text) => !text.startsWith(SUCCESS_TITLE) && !text.startsWith(INFO_TITLE));
  assert.deepEqual(offending, [], `Expected no error message, got ${JSON.stringify(offending)}`);
});

Then('an error message explains that the themes could not be saved', async function () {
  const alert = page(this).getByRole('alert').filter({ hasText: /thema/i });
  await alert.first().waitFor({ state: 'visible', timeout: 15_000 });
  const text = await alert.first().innerText();
  assert.match(text, /niet.*opgeslagen|niet.*bijgewerkt|niet.*gekoppeld|mislukt/i, `Expected the message to say the theme change failed, got '${text}'`);
  assert.match(text, /project.*(opgeslagen|bijgewerkt)/i, `Expected the message to say the project itself was saved, got '${text}'`);
});

// --- Then: the single save action (AC-7) -----------------------------------------

Then('the edit form is still saving while the themes are being linked', async function () {
  await waitForLinkStart(this);
  assert.equal(await saveButton(this).isDisabled(), true, 'Expected the save button to still be disabled while the themes are linked');
  assert.match(
    await saveButton(this).innerText(),
    /Opslaan\.\.\./,
    'Expected the save button to still show its in-progress label while the themes are linked',
  );
});

Then('I am still on the edit page while the themes are being linked', async function () {
  await waitForLinkStart(this);
  assert.equal(currentPath(this), EDIT_PATH, 'Expected not to be navigated away before the themes are linked');
});
