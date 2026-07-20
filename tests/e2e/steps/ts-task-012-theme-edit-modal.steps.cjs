// Heads up before refactoring: the TS-task-013 delete suite reuses the edit-flow
// steps below ("open the edit modal", "change the theme description", "save the
// theme changes") for its count-after-edit regression scenario. Renaming or
// removing them breaks a scenario in another feature file.

const assert = require('node:assert/strict');

const { Given, Then, When } = require('@qavajs/core');

const { E2E_TEACHER_ID } = require('../support/test-data.cjs');
const { page, authenticateInBrowser } = require('../support/e2e-session.cjs');
const { setNativeColor } = require('../support/color-input.cjs');
const { resetThemeCatalog, getThemeByName } = require('../support/theme-catalog.cjs');

// A small TS-012-specific baseline. Kept separate from the TS-010/011 baseline so
// this suite can rely on a theme that carries two SDG codes (AC-2 pre-select) and a
// second theme to rename onto (AC-6 duplicate), without disturbing the sibling
// suites' fixed catalog. "Duurzaamheid" is the primary edit subject; "Klimaat &
// Milieu" only exists so AC-6 has an existing name to collide with.
const TS012_BASELINE = Object.freeze([
  Object.freeze({ name: 'Duurzaamheid', sdg_code: 'SDG2,SDG12', icon: 'eco', color: '#4CAF50', display_order: 1, description: 'Duurzame praktijken.' }),
  Object.freeze({ name: 'Klimaat & Milieu', sdg_code: 'SDG13', icon: 'public', color: '#2196F3', display_order: 2, description: 'Klimaat en milieu.' }),
]);

function editModal(world) {
  return page(world).getByTestId('theme-edit-modal');
}

Given('I am authenticated in the browser as the TS-task-012 teacher', async function () {
  await authenticateInBrowser(this, E2E_TEACHER_ID);
});

Given('the theme catalog contains the TS-012 baseline themes', async function () {
  // Real backend: wipe and recreate the TS-012 baseline so the edit form pre-fills
  // from a known theme and the duplicate-name collision (AC-6) is deterministic.
  await resetThemeCatalog(TS012_BASELINE);
});

When('I open the edit modal for the theme {string}', async function (name) {
  await page(this).getByRole('button', { name: `Bewerken: ${name}` }).click();
  await editModal(this).waitFor({ state: 'visible' });
});

When('I change the theme name to {string}', async function (name) {
  await editModal(this).getByTestId('theme-name-input').fill(name);
});

When('I change the theme description to {string}', async function (description) {
  await editModal(this).getByTestId('theme-description-input').fill(description);
});

When('I recolour the theme to {string}', async function (hex) {
  await setNativeColor(editModal(this).getByTestId('theme-color-input'), hex);
});

When('I clear all selected SDG codes', async function () {
  const modal = editModal(this);
  await modal.getByTestId('theme-sdg-trigger').click();
  // Uncheck every currently-checked SDG box, so a theme that had codes ends up with none.
  const checked = modal.locator('[data-testid^="theme-sdg-checkbox-"]:checked');
  for (let count = await checked.count(); count > 0; count = await checked.count()) {
    await checked.first().uncheck();
  }
});

When('I save the theme changes', async function () {
  await editModal(this).getByTestId('theme-save-button').click();
});

When('I cancel the theme edit modal', async function () {
  await editModal(this).getByTestId('theme-cancel-button').click();
});

Then('the theme edit modal should be visible', async function () {
  assert.equal(await editModal(this).isVisible(), true, 'Expected the theme edit modal to be visible');
});

Then('the edit form should be pre-filled with name {string}, description {string}, icon {string} and colour {string}', async function (name, description, icon, colour) {
  const modal = editModal(this);
  assert.equal(await modal.getByTestId('theme-name-input').inputValue(), name, `Expected the name field to be pre-filled with '${name}'`);
  assert.equal(await modal.getByTestId('theme-description-input').inputValue(), description, `Expected the description field to be pre-filled with '${description}'`);

  const iconTrigger = (await modal.getByTestId('theme-icon-trigger').innerText()).trim();
  assert.ok(iconTrigger.includes(icon), `Expected the icon selector to show '${icon}', got '${iconTrigger}'`);

  // Native <input type="color"> normalises to lower-case hex, so compare case-insensitively.
  const hex = (await modal.getByTestId('theme-color-hex').innerText()).trim();
  assert.equal(hex.toLowerCase(), colour.toLowerCase(), `Expected the colour hex to be pre-filled with '${colour}', got '${hex}'`);
});

Then('the SDG options {string} and {string} should be pre-selected', async function (firstCode, secondCode) {
  const modal = editModal(this);
  await modal.getByTestId('theme-sdg-trigger').click();
  for (const code of [firstCode, secondCode]) {
    const checkbox = modal.getByTestId(`theme-sdg-checkbox-${code}`);
    assert.equal(await checkbox.isChecked(), true, `Expected ${code} to be pre-selected in the SDG multi-select`);
  }
});

Then('no other SDG option should be selected', async function () {
  // The SDG panel is already open from the previous step. Assert exactly the two
  // expected codes are checked, so a component that pre-selects everything (or the
  // wrong codes) is caught rather than passing on the two we happened to look at.
  const modal = editModal(this);
  const checkedCount = await modal.locator('[data-testid^="theme-sdg-checkbox-"]:checked').count();
  assert.equal(checkedCount, 2, `Expected exactly 2 SDG options pre-selected, found ${checkedCount}`);
});

Then('the theme edit modal should be closed', async function () {
  await editModal(this).waitFor({ state: 'detached', timeout: 10_000 });
  assert.equal(await editModal(this).count(), 0, 'Expected the theme edit modal to be closed');
});

Then('the theme edit modal should stay open', async function () {
  // Ordered after the inline-error assertion, which waits for the failed response to
  // render, so a still-visible modal is a real assertion rather than a sleep racing
  // the request.
  assert.equal(await editModal(this).isVisible(), true, 'Expected the edit modal to stay open after a failed save');
});

Then('the inline edit error {string} should be shown', async function (message) {
  const error = editModal(this).getByTestId('theme-form-error');
  await error.waitFor({ state: 'visible', timeout: 10_000 });
  assert.equal((await error.innerText()).trim(), message, `Expected the inline error to read '${message}'`);
});

Then('the edit form name field should show {string}', async function (name) {
  assert.equal(await editModal(this).getByTestId('theme-name-input').inputValue(), name, `Expected the name field to show '${name}'`);
});

Then('the persisted theme {string} should have colour {string}', async function (name, colour) {
  const theme = await getThemeByName(name);
  assert.ok(theme, `Expected a persisted theme named '${name}'`);
  assert.equal((theme.color || '').toLowerCase(), colour.toLowerCase(), `Expected persisted colour '${colour}', got '${theme.color}'`);
});

Then('the persisted theme {string} should still have sdg_code {string}, icon {string} and description {string}', async function (name, sdgCode, icon, description) {
  const theme = await getThemeByName(name);
  assert.ok(theme, `Expected a persisted theme named '${name}'`);
  assert.equal(theme.sdg_code, sdgCode, `Expected persisted sdg_code '${sdgCode}', got '${theme.sdg_code}'`);
  assert.equal(theme.icon, icon, `Expected persisted icon '${icon}', got '${theme.icon}'`);
  assert.equal(theme.description, description, `Expected persisted description '${description}', got '${theme.description}'`);
});

Then('the persisted theme {string} should have description {string}', async function (name, description) {
  const theme = await getThemeByName(name);
  assert.ok(theme, `Expected a persisted theme named '${name}'`);
  assert.equal(theme.description, description, `Expected persisted description '${description}', got '${theme.description}'`);
});

Then('the persisted theme {string} should still be named {string}', async function (name, expected) {
  // The subject was looked up by `name`; asserting it still resolves confirms the
  // name was not changed (a rejected/cancelled edit left the record untouched).
  const theme = await getThemeByName(name);
  assert.ok(theme, `Expected the theme named '${name}' to still exist unchanged`);
  assert.equal(theme.name, expected, `Expected the persisted name to still be '${expected}', got '${theme.name}'`);
});

Then('the persisted theme {string} should have no SDG codes', async function (name) {
  const theme = await getThemeByName(name);
  assert.ok(theme, `Expected a persisted theme named '${name}'`);
  assert.ok(!theme.sdg_code, `Expected the persisted sdg_code to be empty, got '${theme.sdg_code}'`);
});

Then('the theme row {string} should show no SDG code', async function (name) {
  const sdgCell = page(this).getByTestId('theme-row').filter({ hasText: name }).getByTestId('theme-sdg');
  await sdgCell.waitFor({ state: 'visible', timeout: 10_000 });
  assert.equal((await sdgCell.innerText()).trim(), '—', `Expected the '${name}' row to show '—' for a theme with no SDG codes`);
});

