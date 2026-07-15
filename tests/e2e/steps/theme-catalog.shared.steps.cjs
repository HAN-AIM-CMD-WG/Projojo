// Theme catalog steps shared across the theme management suites (TS-task-010
// list, TS-task-011 create modal, and the sibling theme tasks).

const { Given } = require('@qavajs/core');

const { resetThemeCatalog } = require('../support/theme-catalog.cjs');

Given('the theme catalog is empty', async function () {
  // A genuinely empty catalog: the reset wipes every theme and creates none.
  // Used by the TS-010 empty state (proving the real GET /themes/ response
  // rather than a stubbed one) and by the TS-011 first-theme scenario (which
  // exercises the empty-catalog edge of the server's display_order assignment,
  // max of nothing + 1 = 1).
  await resetThemeCatalog([]);
});
