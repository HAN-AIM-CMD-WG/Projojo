// TS-task-015 — theme selection on project creation.
//
// UI suite against the real stack: the create page is driven like a supervisor
// would, and the result is verified through the backend (GET /projects/,
// GET /themes/project/{id}) rather than through the same UI that wrote it.
//
// Two things are observed at the network level instead of the DOM, because the
// acceptance criteria are about them: that the link call is sent once, after the
// create call, to the id the create call returned (AC-3), and that it is not
// sent at all when there is nothing to link (AC-2).

const assert = require('node:assert/strict');

const { Before, Given, Then, When } = require('@qavajs/core');

const {
  E2E_TEACHER_ID,
  FRONTEND_URL,
  PROOF_SUPERVISOR_USER_ID,
} = require('../support/test-data.cjs');
const { page, authenticateInBrowser, loginToken } = require('../support/e2e-session.cjs');
const { resetThemeCatalog, fetchThemes, themeApi } = require('../support/theme-catalog.cjs');
const { stubProjectThemeLink } = require('../support/theme-stub.cjs');

const CREATE_PATH = '/projects/add';

// Projects created here cannot be removed again (DELETE /projects/{id} is broken;
// see the feature header), so every run works on its own project names. The
// feature refers to a project by its readable label and the steps resolve that
// label to the run's actual name.
const RUN_ID = Date.now().toString(36);

// Long enough that the assertions about the in-between moment (still submitting,
// still on the create page, no success yet) run well inside the window, short
// enough not to dominate the suite's runtime.
const LINK_DELAY_MS = 3_000;

// A real 1x1 PNG: the backend validates the magic bytes against the content type
// (image_service.validate_header_bytes), so a placeholder buffer is rejected.
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

// The global toast titles (components/notifications/Notification.jsx). Used to
// tell the app's alert surfaces apart: anything visible with role="alert" that is
// not one of these is either an error toast or an inline <Alert>.
const SUCCESS_TITLE = 'Gelukt!';
const INFO_TITLE = 'Info';

function createState() {
  return { requests: [], responses: [], linkStartedAt: null, projectNames: new Map(), projectIds: new Map() };
}

Before(function () {
  this.projectCreate = createState();
});

function state(world) {
  if (!world.projectCreate) world.projectCreate = createState();
  return world.projectCreate;
}

// --- backend helpers -----------------------------------------------------------

// The teacher token is reused across polls: project lookup polls every 250ms and
// a fresh test login per poll would put pointless load on the auth endpoint.
let cachedTeacherToken = null;

async function teacherApi(pathname, options) {
  cachedTeacherToken ??= await loginToken(E2E_TEACHER_ID);
  return themeApi(pathname, cachedTeacherToken, options);
}

async function projectsNamed(name) {
  const result = await teacherApi('/projects/');
  assert.equal(result.status, 200, `Expected GET /projects/ to return 200, received ${result.status}: ${JSON.stringify(result.body)}`);
  assert.ok(Array.isArray(result.body), `Expected GET /projects/ to return an array, received ${JSON.stringify(result.body)}`);
  return result.body.filter((project) => project?.name === name);
}

/** Poll until a project with `name` is persisted, so assertions do not race the create request. */
async function waitForProjectNamed(name, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const [project] = await projectsNamed(name);
    if (project?.id) return project;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.fail(`Expected a project named '${name}' to be persisted within ${timeoutMs}ms`);
}

/** The run's actual project name for a feature label, e.g. "TS015 Project Met Thema mabc123". */
function projectNameFor(world, label) {
  const names = state(world).projectNames;
  if (!names.has(label)) names.set(label, `${label} ${RUN_ID}`);
  return names.get(label);
}

async function projectIdFor(world, label) {
  const known = state(world).projectIds.get(label);
  if (known) return known;
  const project = await waitForProjectNamed(projectNameFor(world, label));
  state(world).projectIds.set(label, project.id);
  return project.id;
}

async function linkedThemeNames(projectId) {
  const result = await themeApi(`/themes/project/${projectId}`, null);
  assert.equal(result.status, 200, `Expected GET /themes/project/${projectId} to return 200, received ${result.status}: ${JSON.stringify(result.body)}`);
  assert.ok(Array.isArray(result.body), `Expected GET /themes/project/${projectId} to return an array, received ${JSON.stringify(result.body)}`);
  return result.body.map((theme) => theme?.name).sort();
}

function parseNames(names) {
  return names.split(',').map((name) => name.trim()).filter(Boolean).sort();
}

// --- page helpers --------------------------------------------------------------

function picker(world) {
  return page(world).getByTestId('theme-picker');
}

/** A theme pill in the create form, matched on its exact accessible name. */
function pill(world, name) {
  return picker(world).getByRole('button', { name, exact: true });
}

function submitButton(world) {
  return page(world).locator('form button[type="submit"]');
}

function currentPath(world) {
  return new URL(page(world).url()).pathname;
}

function isThemeLink(request) {
  return request.method === 'PUT' && /\/themes\/project\/[^/?]+$/.test(request.url);
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

// --- Given ---------------------------------------------------------------------

Given('the theme catalog contains the TS-015 baseline themes', async function () {
  // Real backend: wipe the live catalog and recreate the shared deterministic
  // baseline, so the picker on the create page renders the real GET /themes/.
  await resetThemeCatalog();
});

Given('I am authenticated in the browser as the TS-task-015 supervisor', async function () {
  await authenticateInBrowser(this, PROOF_SUPERVISOR_USER_ID);
});

Given('the project theme link request fails', async function () {
  await stubProjectThemeLink(page(this), { status: 500 });
});

Given('the project theme link request is slow', async function () {
  const current = state(this);
  await stubProjectThemeLink(page(this), {
    delayMs: LINK_DELAY_MS,
    onIntercept: () => { current.linkStartedAt ??= Date.now(); },
  });
});

// --- When ----------------------------------------------------------------------

When('I open the project create page', async function () {
  const current = state(this);
  // Recorded from here on so the "sent once, after the create call" and "never
  // sent" assertions can be made against the real traffic of this scenario.
  page(this).on('request', (request) => {
    current.requests.push({ method: request.method(), url: request.url() });
  });
  page(this).on('response', (response) => {
    current.responses.push({ method: response.request().method(), url: response.url(), status: response.status() });
  });

  await page(this).goto(`${FRONTEND_URL}${CREATE_PATH}`);
  await submitButton(this).waitFor({ state: 'visible' });
});

async function fillCreateForm(world, name) {
  await page(world).locator('input[name="name"]').fill(name);

  // Tiptap is a contenteditable: type real keys so ProseMirror's update event
  // fires and the form's description state is actually filled.
  await page(world).getByTestId('RichTextInput').click();
  await page(world).keyboard.type(`E2E beschrijving voor ${name}.`);

  await page(world).getByTestId('fileinput').setInputFiles({
    name: 'ts015-project.png',
    mimeType: 'image/png',
    buffer: PNG_1X1,
  });
  // The preview only renders once DragDrop accepted the file, so waiting for it
  // proves the image is attached before the form is submitted.
  await page(world).getByAltText('Toegevoegde foto').waitFor({ state: 'visible' });
}

When('I fill in the create form for a new project {string}', async function (label) {
  await fillCreateForm(this, projectNameFor(this, label));
});

When('I fill in the create form with the existing project name {string}', async function (name) {
  // Verbatim, not run-unique: the point is to collide with a project that exists.
  assert.equal((await projectsNamed(name)).length > 0, true, `Expected a project named '${name}' to already exist`);
  await fillCreateForm(this, name);
});

When('I select the themes {string} on the create form', async function (names) {
  for (const name of parseNames(names)) {
    const target = pill(this, name);
    await target.click();
    assert.equal(await target.getAttribute('aria-pressed'), 'true', `Expected '${name}' to be selected after clicking it`);
  }
});

When('I unselect the themes {string} on the create form', async function (names) {
  for (const name of parseNames(names)) {
    const target = pill(this, name);
    assert.equal(await target.getAttribute('aria-pressed'), 'true', `Expected '${name}' to be selected before unselecting it`);
    await target.click();
    assert.equal(await target.getAttribute('aria-pressed'), 'false', `Expected '${name}' to be unselected after clicking it again`);
  }
});

When('I submit the create form', async function () {
  await submitButton(this).click();
});

When('the theme link request completes', async function () {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (state(this).responses.some((response) => isThemeLink(response))) return;
    await page(this).waitForTimeout(100);
  }
  assert.fail('Expected the theme link request to have completed within 15000ms');
});

// --- Then: the theme section on the form (AC-1, AC-5) ---------------------------

Then('a {string} section containing the theme picker is shown on the create form', async function (heading) {
  const section = page(this).getByTestId('project-theme-section');
  await section.waitFor({ state: 'visible' });
  // Substring match: the heading also carries the "(optioneel)" qualifier.
  assert.equal(
    await section.getByRole('heading', { name: heading }).count(),
    1,
    `Expected the theme section to be headed '${heading}'`,
  );
  await section.getByTestId('theme-picker').waitFor({ state: 'visible' });
  assert.equal(
    await section.getByTestId('theme-picker').count(),
    1,
    'Expected exactly one theme picker inside the theme section',
  );
});

Then('the create form theme picker offers the whole theme catalog', async function () {
  // Against the live catalog rather than a fixed list: this proves the page's
  // picker is fed by the real GET /themes/, not that the fixtures were copied.
  const expected = (await fetchThemes()).map((theme) => theme?.name).sort();
  assert.ok(expected.length > 0, 'Expected the baseline reset to have left themes in the catalog');

  await picker(this).getByTestId('theme-pill').first().waitFor({ state: 'visible' });
  const shown = (await picker(this).getByTestId('theme-pill').allInnerTexts()).map((text) => text.trim()).sort();
  assert.deepEqual(shown, expected, 'Expected the create form to offer every theme in the catalog');
});

Then('no theme is selected on the create form', async function () {
  const pills = await picker(this).getByTestId('theme-pill').all();
  assert.ok(pills.length > 0, 'Expected theme pills to inspect');
  for (const themePill of pills) {
    assert.equal(
      await themePill.getAttribute('aria-pressed'),
      'false',
      `Expected '${(await themePill.innerText()).trim()}' to start unselected on the create form`,
    );
  }
});

/** Document order: true when `first` precedes `second` in the DOM. */
async function precedes(world, first, second) {
  const firstHandle = await first.elementHandle();
  const secondHandle = await second.elementHandle();
  assert.ok(firstHandle && secondHandle, 'Expected both elements to be present for the order check');
  return page(world).evaluate(
    ([a, b]) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
    [firstHandle, secondHandle],
  );
}

Then('the theme section appears after the project detail fields', async function () {
  const section = page(this).getByTestId('project-theme-section');
  for (const [label, field] of [
    ['the project title field', page(this).locator('input[name="name"]')],
    ['the description editor', page(this).getByTestId('RichTextInput')],
    ['the planning fields', page(this).locator('input[name="end_date"]')],
  ]) {
    assert.equal(
      await precedes(this, field, section),
      true,
      `Expected the theme section to appear after ${label}`,
    );
  }
});

Then('the theme section appears before the {string} button', async function (label) {
  const section = page(this).getByTestId('project-theme-section');
  const button = page(this).getByRole('button', { name: label });
  assert.equal(await button.count(), 1, `Expected exactly one '${label}' button on the create form`);
  assert.equal(
    await precedes(this, section, button),
    true,
    `Expected the theme section to appear before the '${label}' button`,
  );
});

// --- Then: what was actually persisted (AC-2, AC-3, AC-4) -----------------------

Then('the project {string} exists', async function (label) {
  // Resolves through the backend, so this fails unless the project was really persisted.
  await projectIdFor(this, label);
});

Then('the project {string} has no linked themes', async function (name) {
  // Deliberately a single read, not a poll: the scenarios that use this have
  // already asserted the flow finished (they landed on the new project's page),
  // so a poll could only turn a real failure into a passing first sample.
  const linked = await linkedThemeNames(await projectIdFor(this, name));
  assert.deepEqual(linked, [], `Expected project '${name}' to have no linked themes, got ${JSON.stringify(linked)}`);
});

Then('the project {string} is linked to exactly the themes {string}', async function (name, names) {
  const projectId = await projectIdFor(this, name);
  const expected = parseNames(names);

  // The link call can still be in flight when the project itself is already
  // persisted, so poll - but only for this exact set, never for "anything".
  const deadline = Date.now() + 15_000;
  let linked = [];
  while (Date.now() < deadline) {
    linked = await linkedThemeNames(projectId);
    if (linked.length === expected.length && linked.every((themeName, index) => themeName === expected[index])) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.deepEqual(linked, expected, `Expected project '${name}' to be linked to exactly ${JSON.stringify(expected)}`);
});

Then('the themes of project {string} were linked in one request after the project was created', async function (name) {
  const projectId = await projectIdFor(this, name);
  const recorded = state(this).requests;

  const links = recorded.filter(isThemeLink);
  assert.equal(links.length, 1, `Expected exactly one theme link request, got ${JSON.stringify(links)}`);
  assert.ok(
    links[0].url.endsWith(`/themes/project/${projectId}`),
    `Expected the link request to target the created project id ${projectId}, got ${links[0].url}`,
  );

  const createIndex = recorded.findIndex((request) => request.method === 'POST' && /\/projects\/?$/.test(request.url));
  assert.ok(createIndex >= 0, 'Expected a POST to /projects to have been sent');
  assert.ok(
    recorded.indexOf(links[0]) > createIndex,
    'Expected the theme link request to be sent after the project create request, not before or instead of it',
  );
});

Then('no theme link request was sent', async function () {
  // Give an unwanted in-flight request a chance to be recorded before asserting absence.
  await page(this).waitForTimeout(500);
  const links = state(this).requests.filter(isThemeLink);
  assert.deepEqual(links, [], `Expected no request to the project theme link endpoint, got ${JSON.stringify(links)}`);
});

// --- Then: navigation and messages ----------------------------------------------

Then('I am taken to the page of project {string}', async function (name) {
  const projectId = await projectIdFor(this, name);
  await page(this).waitForURL(`${FRONTEND_URL}/projects/${projectId}`, { timeout: 10_000 });
  assert.equal(currentPath(this), `/projects/${projectId}`, `Expected to land on the new project's page`);
});

Then('I am still on the project create page', function () {
  assert.equal(currentPath(this), CREATE_PATH, 'Expected to stay on the project create page');
});

Then('no error message is shown', async function () {
  const texts = await visibleAlertTexts(this);
  const offending = texts.filter((text) => !text.startsWith(SUCCESS_TITLE) && !text.startsWith(INFO_TITLE));
  assert.deepEqual(offending, [], `Expected no error message, got ${JSON.stringify(offending)}`);
});

Then('an error message explains that the themes could not be linked', async function () {
  const alert = page(this).getByRole('alert').filter({ hasText: /thema/i });
  await alert.first().waitFor({ state: 'visible', timeout: 10_000 });
  const text = await alert.first().innerText();
  assert.match(text, /niet.*gekoppeld|koppelen.*mislukt|mislukt/i, `Expected the message to say the theme linking failed, got '${text}'`);
  assert.match(text, /aangemaakt/i, `Expected the message to say the project itself was created, got '${text}'`);
  assert.match(text, /bewerk/i, `Expected the message to point at editing the project to retry, got '${text}'`);
});

Then('an error message explains that the project name already exists', async function () {
  const alert = page(this).getByRole('alert').filter({ hasText: /bestaat al/i });
  await alert.first().waitFor({ state: 'visible', timeout: 10_000 });
  assert.match(await alert.first().innerText(), /bestaat al/i, 'Expected a duplicate-name error message');
});

// --- Then: the single success flow (AC-3) ---------------------------------------

Then('the create form is still submitting while the themes are being linked', async function () {
  await waitForLinkStart(this);
  assert.equal(await submitButton(this).isDisabled(), true, 'Expected the submit button to still be disabled while the themes are linked');
  assert.match(
    await submitButton(this).innerText(),
    /Aanmaken\.\.\./,
    'Expected the submit button to still show its in-progress label while the themes are linked',
  );
});

Then('I am still on the project create page while the themes are being linked', async function () {
  await waitForLinkStart(this);
  assert.equal(currentPath(this), CREATE_PATH, 'Expected not to be navigated away before the themes are linked');
});

Then('no success message is shown while the themes are being linked', async function () {
  await waitForLinkStart(this);
  const successes = (await visibleAlertTexts(this)).filter((text) => text.startsWith(SUCCESS_TITLE));
  assert.deepEqual(successes, [], `Expected no success message before the themes are linked, got ${JSON.stringify(successes)}`);
});
