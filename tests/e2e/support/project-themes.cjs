// Project-theme link staging and read-back for the theme UI suites.
//
// Every suite that needs a project linked to known themes stages it the same way:
// resolve the names against the live catalog, PUT the ids as the teacher, then read
// the links back before the scenario starts. The read-back is the point - a scenario
// that merely assumed its own preconditions would report a staging failure as a UI
// failure, far from its cause.
//
// This module depends on theme-catalog.cjs for the authenticated call and the
// name-to-id lookup; nothing in theme-catalog.cjs depends on this module. Catalog
// lookup is a prerequisite of linking and never the reverse, so the dependency
// points one way only. Catalog reset lives there, project assignment lives here.

const assert = require('node:assert/strict');

const { themeApi, teacherApi, themeIdsFor } = require('./theme-catalog.cjs');

/**
 * The theme names a project is really linked to, read through the real public
 * endpoint rather than through anything the page under test rendered.
 *
 * Sorted, because the backend promises no order for a project's themes and every
 * caller either compares against a sorted expectation or only asks whether a name
 * is present.
 *
 * @param {string} projectId
 * @returns {Promise<string[]>} the linked theme names, sorted
 */
async function linkedThemeNames(projectId) {
  const result = await themeApi(`/themes/project/${projectId}`, null);
  assert.equal(
    result.status,
    200,
    `Expected GET /themes/project/${projectId} to return 200, received ${result.status}: ${JSON.stringify(result.body)}`,
  );
  assert.ok(
    Array.isArray(result.body),
    `Expected GET /themes/project/${projectId} to return an array, received ${JSON.stringify(result.body)}`,
  );
  return result.body.map((theme) => theme?.name).sort();
}

/**
 * Replace a project's theme links with exactly `names`, then prove it took.
 *
 * Linking replaces every link, so `names` is the whole of the project's theme state
 * afterwards - passing an empty array clears it. The read-back turns the scenario's
 * precondition from an assumption into a fact: a staging call that silently wrote
 * nothing fails here, with the project id in the message, instead of surfacing later
 * as a puzzling missing pill.
 *
 * @param {string} projectId
 * @param {string[]} names - theme names, each of which must exist in the catalog
 */
async function setProjectThemes(projectId, names) {
  const themeIds = await themeIdsFor(names);
  const result = await teacherApi(`/themes/project/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify({ theme_ids: themeIds }),
  });
  assert.equal(
    result.status,
    200,
    `Expected staging PUT /themes/project/${projectId} to return 200, received ${result.status}: ${JSON.stringify(result.body)}`,
  );
  assert.deepEqual(
    await linkedThemeNames(projectId),
    [...names].sort(),
    `Expected the staged theme links of ${projectId} to be readable back before the scenario starts`,
  );
}

module.exports = {
  linkedThemeNames,
  setProjectThemes,
};
