const assert = require('node:assert/strict');

const { Given, Then, When } = require('@qavajs/core');

const {
  ARCHIVED_SOURCE_PROJECT_ID,
  CROSS_BUSINESS_PROJECT_ID,
  E2E_TEACHER_ID,
  PROOF_PROJECT_ID,
} = require('../support/test-data.cjs');
const { page, authenticateInBrowser, loginToken } = require('../support/e2e-session.cjs');
const { resetThemeCatalog, getThemeByName, themeApi } = require('../support/theme-catalog.cjs');
const { stubThemeDeleteEndpoint } = require('../support/theme-stub.cjs');

// A TS-013-specific baseline. "Duurzaamheid" is the delete subject throughout;
// "Klimaat & Milieu" only exists so AC-7 can prove a project's OTHER theme links
// survive the cascade; "Nieuw Thema" is the never-linked theme AC-3 warns about.
const TS013_BASELINE = Object.freeze([
  Object.freeze({ name: 'Duurzaamheid', sdg_code: 'SDG12', icon: 'eco', color: '#4CAF50', display_order: 1, description: 'Duurzame praktijken.' }),
  Object.freeze({ name: 'Klimaat & Milieu', sdg_code: 'SDG13', icon: 'public', color: '#2196F3', display_order: 2, description: 'Klimaat en milieu.' }),
  Object.freeze({ name: 'Nieuw Thema', sdg_code: 'SDG9', icon: 'lightbulb', color: '#9C27B0', display_order: 3, description: 'Nog nergens aan gekoppeld.' }),
]);

// The three projects in the deterministic E2E seed, in a fixed order so
// "the first of those projects" is unambiguous across scenarios.
const SEEDED_PROJECT_IDS = Object.freeze([
  PROOF_PROJECT_ID,
  ARCHIVED_SOURCE_PROJECT_ID,
  CROSS_BUSINESS_PROJECT_ID,
]);

function deleteModal(world) {
  return page(world).getByTestId('theme-delete-modal');
}

/** Project ids this scenario deliberately linked to a theme. */
function linkedProjectIds(world) {
  assert.ok(world.ts013LinkedProjectIds?.length, 'No projects were linked in this scenario');
  return world.ts013LinkedProjectIds;
}

/** Replace a project's theme links through the real teacher-authenticated API. */
async function setProjectThemes(projectId, themeIds, token) {
  const result = await themeApi(`/themes/project/${projectId}`, token, {
    method: 'PUT',
    body: JSON.stringify({ theme_ids: themeIds }),
  });
  assert.equal(
    result.status,
    200,
    `Expected linking project ${projectId} to return 200, received ${result.status}: ${JSON.stringify(result.body)}`,
  );
}

/** The names of the themes a project is currently linked to. */
async function projectThemeNames(projectId) {
  const result = await themeApi(`/themes/project/${projectId}`, null);
  assert.equal(result.status, 200, `Expected GET /themes/project/${projectId} to return 200, received ${result.status}`);
  assert.ok(Array.isArray(result.body), `Expected GET /themes/project/${projectId} to return an array`);
  return result.body.map((theme) => theme?.name);
}

Given('I am authenticated in the browser as the TS-task-013 teacher', async function () {
  await authenticateInBrowser(this, E2E_TEACHER_ID);
});

Given('the theme catalog contains the TS-013 baseline themes', async function () {
  // Real backend: wipe and recreate the TS-013 baseline. Wiping also drops every
  // hasTheme link, so each scenario starts from a known zero-link state and the
  // impact warning is deterministic.
  await resetThemeCatalog(TS013_BASELINE);
  this.ts013LinkedProjectIds = [];
});

Given('the theme {string} is linked to {int} project(s)', async function (themeName, count) {
  assert.ok(
    count <= SEEDED_PROJECT_IDS.length,
    `The E2E seed has ${SEEDED_PROJECT_IDS.length} projects, cannot link ${count}`,
  );
  const theme = await getThemeByName(themeName);
  assert.ok(theme, `Expected a persisted theme named '${themeName}' to link projects to`);

  const token = await loginToken(E2E_TEACHER_ID);
  const projectIds = SEEDED_PROJECT_IDS.slice(0, count);
  for (const projectId of projectIds) {
    await setProjectThemes(projectId, [theme.id], token);
  }

  // Verify the precondition actually took effect, so a scenario asserting on a
  // link count never passes against silently unlinked projects.
  for (const projectId of projectIds) {
    const names = await projectThemeNames(projectId);
    assert.ok(names.includes(themeName), `Expected project ${projectId} to be linked to '${themeName}', got ${JSON.stringify(names)}`);
  }
  this.ts013LinkedProjectIds = projectIds;
});

Given('the first of those projects is also linked to the theme {string}', async function (themeName) {
  const [projectId] = linkedProjectIds(this);
  const extra = await getThemeByName(themeName);
  assert.ok(extra, `Expected a persisted theme named '${themeName}'`);

  // PUT replaces a project's links, so send the existing ones plus the new theme.
  const currentNames = await projectThemeNames(projectId);
  const themes = await Promise.all(currentNames.map((name) => getThemeByName(name)));
  const themeIds = [...themes.map((theme) => theme.id), extra.id];

  await setProjectThemes(projectId, themeIds, await loginToken(E2E_TEACHER_ID));
  const names = await projectThemeNames(projectId);
  assert.ok(names.includes(themeName), `Expected project ${projectId} to also be linked to '${themeName}', got ${JSON.stringify(names)}`);
});

Given('deleting a theme fails with {string}', async function (detail) {
  await stubThemeDeleteEndpoint(page(this), { status: 500, detail });
});

When('I request deletion of the theme {string}', async function (name) {
  await page(this).getByRole('button', { name: `Verwijderen: ${name}` }).click();
  await deleteModal(this).waitFor({ state: 'visible' });
});

When('I confirm the theme deletion', async function () {
  await deleteModal(this).getByTestId('theme-delete-confirm-button').click();
});

When('I cancel the theme deletion', async function () {
  await deleteModal(this).getByTestId('theme-delete-cancel-button').click();
});

When('the theme {string} is deleted outside the browser', async function (name) {
  // Simulates a concurrent deletion by another teacher: the row the browser is
  // holding is already gone by the time this teacher confirms.
  const theme = await getThemeByName(name);
  assert.ok(theme, `Expected a persisted theme named '${name}' to delete out of band`);
  const result = await themeApi(`/themes/${theme.id}`, await loginToken(E2E_TEACHER_ID), { method: 'DELETE' });
  assert.equal(result.status, 200, `Expected the out-of-band DELETE to return 200, received ${result.status}`);
});

Then('the theme delete confirmation should be visible', async function () {
  assert.equal(await deleteModal(this).isVisible(), true, 'Expected the delete confirmation dialog to be visible');
});

Then('the theme delete confirmation should be closed', async function () {
  await deleteModal(this).waitFor({ state: 'detached', timeout: 10_000 });
  assert.equal(await deleteModal(this).count(), 0, 'Expected the delete confirmation dialog to be closed');
});

Then('the theme delete confirmation should stay open', async function () {
  // Ordered after the error assertion, which waits for the failed response to
  // render, so this is a real assertion rather than a sleep racing the request.
  assert.equal(await deleteModal(this).isVisible(), true, 'Expected the delete confirmation to stay open after a failed delete');
});

Then('the delete confirmation message should read {string}', async function (expected) {
  const message = deleteModal(this).getByTestId('theme-delete-message');
  await message.waitFor({ state: 'visible', timeout: 10_000 });
  // Collapse the line wrapping the rendered paragraph introduces; the assertion is
  // on the wording and the interpolated count, not on where the text breaks.
  const actual = (await message.innerText()).replace(/\s+/g, ' ').trim();
  assert.equal(actual, expected, `Expected the confirmation message to read '${expected}', got '${actual}'`);
});

Then('the delete error {string} should be shown', async function (expected) {
  const error = deleteModal(this).getByTestId('theme-delete-error');
  await error.waitFor({ state: 'visible', timeout: 10_000 });
  assert.equal((await error.innerText()).trim(), expected, `Expected the delete error to read '${expected}'`);
});

Then('the theme {string} should still exist', async function (name) {
  // Give any (unwanted) in-flight delete a chance to land before asserting presence.
  await page(this).waitForTimeout(500);
  assert.ok(await getThemeByName(name), `Expected the theme '${name}' to still exist`);
});

Then('every linked project should still exist', async function () {
  const token = await loginToken(E2E_TEACHER_ID);
  for (const projectId of linkedProjectIds(this)) {
    const result = await themeApi(`/projects/${projectId}`, token);
    assert.equal(result.status, 200, `Expected project ${projectId} to still exist, GET returned ${result.status}`);
    assert.equal(result.body?.id, projectId, `Expected GET /projects/${projectId} to return that project`);
  }
});

Then('no linked project should still be linked to {string}', async function (themeName) {
  for (const projectId of linkedProjectIds(this)) {
    const names = await projectThemeNames(projectId);
    assert.ok(
      !names.includes(themeName),
      `Expected project ${projectId} to no longer list the deleted theme '${themeName}', got ${JSON.stringify(names)}`,
    );
  }
});

Then('the first linked project should still be linked to {string}', async function (themeName) {
  const [projectId] = linkedProjectIds(this);
  const names = await projectThemeNames(projectId);
  assert.ok(
    names.includes(themeName),
    `Expected project ${projectId} to keep its other theme link '${themeName}', got ${JSON.stringify(names)}`,
  );
});
