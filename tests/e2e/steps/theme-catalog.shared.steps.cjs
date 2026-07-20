// Theme catalog steps shared across the theme management suites (TS-task-010
// list, TS-task-011 create modal, TS-task-012 edit modal, and the sibling theme
// tasks). The generic list/success/absence assertions live here rather than in any
// one suite's step file so no suite silently depends on another's steps loading.

const assert = require('node:assert/strict');

const { Given, Then } = require('@qavajs/core');

const { page } = require('../support/e2e-session.cjs');
const { resetThemeCatalog, getThemeByName } = require('../support/theme-catalog.cjs');

Given('the theme catalog is empty', async function () {
  // A genuinely empty catalog: the reset wipes every theme and creates none.
  // Used by the TS-010 empty state (proving the real GET /themes/ response
  // rather than a stubbed one) and by the TS-011 first-theme scenario (which
  // exercises the empty-catalog edge of the server's display_order assignment,
  // max of nothing + 1 = 1).
  await resetThemeCatalog([]);
});

Then('a {string} success message should be shown', async function (message) {
  const toast = page(this).getByRole('alert').filter({ hasText: message });
  await toast.waitFor({ state: 'visible', timeout: 10_000 });
  assert.equal(await toast.isVisible(), true, `Expected a success message '${message}'`);
});

Then('a theme row named {string} should be listed', async function (name) {
  const row = page(this).getByTestId('theme-row').filter({ hasText: name });
  await row.waitFor({ state: 'visible', timeout: 10_000 });
  assert.equal(await row.count(), 1, `Expected exactly one theme row named '${name}'`);
});

Then('no theme row named {string} should be listed', async function (name) {
  const row = page(this).getByTestId('theme-row').filter({ hasText: name });
  await row.waitFor({ state: 'detached', timeout: 10_000 });
  assert.equal(await row.count(), 0, `Expected no theme row named '${name}' to be listed`);
});

Then('no theme named {string} should exist', async function (name) {
  // Give any (unwanted) in-flight write a chance to land before asserting absence.
  await page(this).waitForTimeout(500);
  assert.equal(await getThemeByName(name), null, `Expected no theme named '${name}' to exist`);
});
