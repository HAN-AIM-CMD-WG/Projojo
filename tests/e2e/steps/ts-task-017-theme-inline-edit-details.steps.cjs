// TS-task-017 — inline theme editing on ProjectDetailsPage.
//
// UI suite against the real stack, layered on the read-only theme section
// TS-task-019 put on this page: the details page of the seeded proof project is
// driven like a supervisor (or teacher) would, and the result is verified through
// the backend (GET /themes/project/{id}) rather than through the same UI that
// wrote it.
//
// The link request itself is observed at the network level, because several
// acceptance criteria are about it: that cancelling sends none (AC-6), that the
// removal confirmation blocks it until confirmed (AC-7), and that a save which
// changed nothing sends none at all. Recording starts when the editor is opened,
// which is exactly the window those assertions are about.
//
// Setup and read-only assertions deliberately reuse the steps the TS-019 display
// suite and the TS-016 edit-form suite already own (Cucumber matches step text
// globally, so re-declaring them would be a duplicate definition and a second copy
// of the same verification):
//   TS-019: the catalog reset, the per-scenario link staging, the student and
//           owning-supervisor logins, opening the page, the read-only pill
//           assertions, the empty-state message, the failing theme read.
//   TS-016: the removal confirmation's text, buttons, confirm and cancel actions,
//           and the two backend read-backs of what is actually linked.
//
// Everything below is specific to the inline editor, and its step names say so
// ("in the theme section", "the inline theme edit") so they cannot collide with
// the picker, create or edit-form suites.

const assert = require('node:assert/strict');

const { Before, Given, Then, When } = require('@qavajs/core');

const {
  E2E_OTHER_SUPERVISOR_ID,
  E2E_TEACHER_ID,
  PROOF_PROJECT_ID,
} = require('../support/test-data.cjs');
const { page, authenticateInBrowser } = require('../support/e2e-session.cjs');
const { fetchThemes } = require('../support/theme-catalog.cjs');
const { stubProjectThemeEndpoint } = require('../support/theme-stub.cjs');

// Long enough that the "still saving" assertion runs well inside the window, short
// enough not to dominate the suite's runtime.
const SAVE_DELAY_MS = 3_000;

function createState() {
  return { requests: [], responses: [], recording: false, saveStartedAt: null };
}

Before(function () {
  this.inlineThemeEdit = createState();
});

function state(world) {
  if (!world.inlineThemeEdit) world.inlineThemeEdit = createState();
  return world.inlineThemeEdit;
}

function isThemeLink(request) {
  return request.method === 'PUT' && /\/themes\/project\/[^/?]+$/.test(request.url);
}

// --- page helpers ----------------------------------------------------------------

function section(world) {
  return page(world).getByTestId('project-themes');
}

function editButton(world) {
  return section(world).getByTestId('project-theme-edit');
}

function picker(world) {
  return section(world).getByTestId('theme-picker');
}

/** A selectable theme pill inside the inline picker, matched on its exact accessible name. */
function pickerPill(world, name) {
  return picker(world).getByRole('button', { name, exact: true });
}

function saveButton(world) {
  return section(world).getByTestId('project-theme-save');
}

function cancelButton(world) {
  return section(world).getByTestId('project-theme-cancel');
}

/** The selected/unselected state of every pill in the inline picker, keyed by theme name. */
async function selectionState(world) {
  await picker(world).getByTestId('theme-pill').first().waitFor({ state: 'visible', timeout: 10_000 });
  const pills = await picker(world).getByTestId('theme-pill').all();
  assert.ok(pills.length > 0, 'Expected theme pills to inspect in the inline theme editor');
  const selected = [];
  const unselected = [];
  for (const pill of pills) {
    const name = (await pill.innerText()).trim();
    const pressed = await pill.getAttribute('aria-pressed');
    assert.ok(pressed === 'true' || pressed === 'false', `Expected '${name}' to expose aria-pressed, got '${pressed}'`);
    (pressed === 'true' ? selected : unselected).push(name);
  }
  return { selected: selected.sort(), unselected: unselected.sort() };
}

function parseNames(names) {
  return names.split(',').map((name) => name.trim()).filter(Boolean).sort();
}

/** Wait until the staged save request has been intercepted, i.e. the save window is open. */
async function waitForSaveStart(world, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (state(world).saveStartedAt) return;
    await page(world).waitForTimeout(50);
  }
  assert.fail(`Expected the inline theme save request to have started within ${timeoutMs}ms`);
}

// --- Given ------------------------------------------------------------------------

Given('I am authenticated in the browser as a teacher', async function () {
  await authenticateInBrowser(this, E2E_TEACHER_ID);
});

Given('I am authenticated in the browser as a supervisor from another business', async function () {
  // Supervisor of the cross-business organisation: authenticated, a supervisor,
  // and related to neither this project nor its business.
  await authenticateInBrowser(this, E2E_OTHER_SUPERVISOR_ID);
});

Given('the inline theme save fails', async function () {
  // Only the write is staged; the read stays real, so the section still shows the
  // project's genuine themes before and after the failed save.
  await stubProjectThemeEndpoint(page(this), { put: { status: 500 } });
});

Given('the inline theme save is slow', async function () {
  const current = state(this);
  // Delayed and then passed through to the real backend, so the themes still end
  // up genuinely linked once the window closes.
  await stubProjectThemeEndpoint(page(this), {
    put: {
      delayMs: SAVE_DELAY_MS,
      onIntercept: () => { current.saveStartedAt ??= Date.now(); },
    },
  });
});

// --- When -------------------------------------------------------------------------

When('I start editing the themes', async function () {
  const current = state(this);
  // Recorded from the moment the editor opens: every "was a link request sent"
  // assertion in this suite is about what this edit did, not about page load.
  if (!current.recording) {
    current.recording = true;
    page(this).on('request', (request) => {
      current.requests.push({ method: request.method(), url: request.url() });
    });
    page(this).on('response', (response) => {
      current.responses.push({ method: response.request().method(), url: response.url(), status: response.status() });
    });
  }

  await editButton(this).waitFor({ state: 'visible', timeout: 15_000 });
  await editButton(this).click();
  // The picker fetches the catalog; waiting for a real pill means the following
  // steps act on the settled pre-selection rather than on skeletons.
  await picker(this).getByTestId('theme-pill').first().waitFor({ state: 'visible', timeout: 15_000 });
});

When('I toggle the theme {string} in the theme section', async function (name) {
  const pill = pickerPill(this, name);
  const before = await pill.getAttribute('aria-pressed');
  assert.ok(before === 'true' || before === 'false', `Expected '${name}' to expose aria-pressed before toggling, got '${before}'`);
  await pill.click();
  const after = before === 'true' ? 'false' : 'true';
  assert.equal(await pill.getAttribute('aria-pressed'), after, `Expected toggling '${name}' to flip it to aria-pressed=${after}`);
});

When('I save the inline theme edit', async function () {
  await saveButton(this).click();
});

When('I cancel the inline theme edit', async function () {
  await cancelButton(this).click();
});

When('the slow inline theme save completes', async function () {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (state(this).responses.some(isThemeLink)) return;
    await page(this).waitForTimeout(100);
  }
  assert.fail('Expected the inline theme save request to have completed within 15000ms');
});

// --- Then: who is offered the edit control (AC-1, AC-2) ----------------------------

Then('a theme edit control is offered next to the {string} heading', async function (heading) {
  await section(this).waitFor({ state: 'visible', timeout: 15_000 });
  const control = editButton(this);
  await control.waitFor({ state: 'visible', timeout: 15_000 });

  // A real control, not a decorated span: it must be a button, reachable by
  // keyboard, and carry an accessible name (the pencil glyph alone is not one).
  const tag = await control.evaluate((el) => el.tagName);
  assert.equal(tag, 'BUTTON', `Expected the theme edit control to be a <button>, got <${tag.toLowerCase()}>`);
  assert.equal(await control.isEnabled(), true, 'Expected the theme edit control to be enabled');
  const accessibleName = (await control.getAttribute('aria-label')) ?? (await control.innerText()).trim();
  assert.ok(accessibleName, 'Expected the theme edit control to expose an accessible name');

  // "next to the heading": the label the section is headed with, and the control,
  // share a line - the control sits after the label and their boxes overlap
  // vertically. This is what distinguishes "next to the heading" from "somewhere
  // in the section".
  // The section labels itself "Thema's:"; anchored so this matches that label and
  // only that label, never a theme name that happens to contain the same words.
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const label = section(this).getByText(new RegExp(`^${escaped}:?$`));
  await label.waitFor({ state: 'visible', timeout: 10_000 });
  const labelBox = await label.boundingBox();
  const controlBox = await control.boundingBox();
  assert.ok(labelBox && controlBox, 'Expected both the theme heading and the edit control to have a layout box');
  assert.ok(
    controlBox.x >= labelBox.x,
    `Expected the edit control (x=${controlBox.x}) to sit after the '${heading}' heading (x=${labelBox.x})`,
  );
  const overlap = Math.min(labelBox.y + labelBox.height, controlBox.y + controlBox.height) - Math.max(labelBox.y, controlBox.y);
  assert.ok(
    overlap > 0,
    `Expected the edit control to share a line with the '${heading}' heading (vertical overlap ${overlap}px)`,
  );
});

// --- Then: edit mode (AC-4) ---------------------------------------------------------

Then('the theme section shows the interactive theme picker instead of the read-only pills', async function () {
  await picker(this).waitFor({ state: 'visible', timeout: 15_000 });
  assert.equal(
    await section(this).getByTestId('project-theme-pill').count(),
    0,
    'Expected the read-only theme pills to be replaced by the picker, not shown alongside it',
  );
  // "interactive": the picker's pills are real toggle buttons, which is what makes
  // this edit mode rather than the picker's own read-only rendering.
  const pills = await picker(this).getByTestId('theme-pill').all();
  assert.ok(pills.length > 0, 'Expected the inline picker to render theme pills');
  for (const pill of pills) {
    const tag = await pill.evaluate((el) => el.tagName);
    assert.equal(tag, 'BUTTON', `Expected an editable theme pill to be a <button>, got <${tag.toLowerCase()}>`);
    assert.notEqual(await pill.getAttribute('aria-pressed'), null, 'Expected an editable theme pill to expose its toggle state');
  }
});

Then('the theme picker in the theme section offers the whole theme catalog', async function () {
  // Against the live catalog rather than a fixed list: this proves the inline
  // picker is fed by the real GET /themes/, not that the fixtures were copied.
  const expected = (await fetchThemes()).map((theme) => theme?.name).sort();
  assert.ok(expected.length > 0, 'Expected the baseline reset to have left themes in the catalog');

  const shown = (await picker(this).getByTestId('theme-pill').allInnerTexts()).map((text) => text.trim()).sort();
  assert.deepEqual(shown, expected, 'Expected the inline editor to offer every theme in the catalog');
});

Then('exactly the themes {string} are selected in the theme section', async function (names) {
  const expected = parseNames(names);
  const { selected, unselected } = await selectionState(this);
  assert.deepEqual(selected, expected, 'Expected exactly these themes to be selected in the inline editor');
  for (const name of expected) {
    assert.equal(unselected.includes(name), false, `Expected '${name}' not to also appear unselected`);
  }
});

Then('no theme is selected in the theme section', async function () {
  const { selected } = await selectionState(this);
  assert.deepEqual(selected, [], 'Expected no theme to be selected in the inline editor');
});

Then('the theme section offers a {string} and a {string} button', async function (saveLabel, cancelLabel) {
  for (const [label, locator] of [[saveLabel, saveButton(this)], [cancelLabel, cancelButton(this)]]) {
    await locator.waitFor({ state: 'visible', timeout: 10_000 });
    assert.equal(
      (await locator.innerText()).trim(),
      label,
      `Expected the inline editor to offer a '${label}' button`,
    );
    assert.equal(await locator.evaluate((el) => el.tagName), 'BUTTON', `Expected '${label}' to be a <button>`);
  }
});

// --- Then: which mode the section is in (AC-5, AC-6, AC-7, AC-8) --------------------

Then('the theme section is back in read-only mode', async function () {
  // The editor is really gone - not merely hidden behind a still-mounted picker -
  // and the read-only rendering is back in its place.
  await picker(this).waitFor({ state: 'detached', timeout: 15_000 });
  await section(this).waitFor({ state: 'visible', timeout: 10_000 });
  for (const [name, locator] of [['Opslaan', saveButton(this)], ['Annuleren', cancelButton(this)]]) {
    assert.equal(await locator.count(), 0, `Expected the '${name}' button to be gone in read-only mode`);
  }
  // The edit control is offered again, so the section is genuinely back to the
  // read-only state an editor sees rather than stuck in a third, control-less one.
  assert.equal(await editButton(this).count(), 1, 'Expected the edit control to be offered again in read-only mode');
});

Then('the theme section is still in edit mode', async function () {
  assert.equal(await picker(this).count(), 1, 'Expected the inline theme picker to still be shown');
  assert.equal(await saveButton(this).count(), 1, "Expected the 'Opslaan' button to still be shown");
  assert.equal(await cancelButton(this).count(), 1, "Expected the 'Annuleren' button to still be shown");
  assert.equal(
    await section(this).getByTestId('project-theme-pill').count(),
    0,
    'Expected the read-only pills not to have come back while still editing',
  );
});

Then('the inline theme save is still in progress', async function () {
  await waitForSaveStart(this);
  assert.equal(await saveButton(this).isDisabled(), true, 'Expected the save button to be disabled while the save is in flight');
  assert.equal(await picker(this).count(), 1, 'Expected the section to stay in edit mode while the save is in flight');
  assert.equal(
    await section(this).getByTestId('project-theme-pill').count(),
    0,
    'Expected the section not to return to read-only before the save completed',
  );
});

// --- Then: the messages the section shows (AC-5, AC-8) ------------------------------

Then('a success message is shown in the theme section', async function () {
  const message = section(this).getByTestId('project-theme-success');
  await message.waitFor({ state: 'visible', timeout: 15_000 });
  const text = (await message.innerText()).trim();
  assert.ok(text.length > 0, 'Expected the success message to carry text');
  assert.match(text, /thema/i, `Expected the success message to be about the themes, got '${text}'`);
});

Then('no success message is shown in the theme section', async function () {
  // Give an unwanted message a chance to appear before asserting its absence.
  await page(this).waitForTimeout(500);
  assert.equal(
    await section(this).getByTestId('project-theme-success').count(),
    0,
    'Expected no success message to be claimed',
  );
});

Then('an error message is shown in the theme section', async function () {
  const message = section(this).getByTestId('project-theme-error');
  await message.waitFor({ state: 'visible', timeout: 15_000 });
  const text = (await message.innerText()).trim();
  assert.match(
    text,
    /niet.*(opgeslagen|bijgewerkt|gekoppeld)|mislukt/i,
    `Expected the message to explain that saving the themes failed, got '${text}'`,
  );
  // The save error must not be mistaken for the read error the section shows when
  // the themes could not be loaded at all.
  assert.equal(
    await section(this).getByTestId('project-themes-error').count(),
    0,
    'Expected a failed save to show its own error, not the load-error state',
  );
});

// --- Then: the requests the edit did and did not send (AC-6, AC-7) ------------------

Then('no theme link request was sent from the details page', async function () {
  assert.equal(state(this).recording, true, 'Expected the editor to have been opened first, so requests were recorded');
  // Give an unwanted in-flight request a chance to be recorded before asserting absence.
  await page(this).waitForTimeout(500);
  const links = state(this).requests.filter(isThemeLink);
  assert.deepEqual(links, [], `Expected no request to the project theme link endpoint, got ${JSON.stringify(links)}`);
  assert.ok(
    !links.some((link) => link.url.endsWith(`/themes/project/${PROOF_PROJECT_ID}`)),
    'Expected this project in particular not to have been re-linked',
  );
});