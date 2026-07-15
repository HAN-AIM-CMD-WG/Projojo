// Real-backend theme catalog control for the theme management UI suites.
//
// The E2E TypeDB seed holds no themes, and the theme-integrity API scenarios
// create themes without per-scenario cleanup, so the live catalog is
// order-dependent. To drive the theme management UI against the real backend
// deterministically, this helper resets the catalog to a known baseline: it
// deletes every existing theme and recreates a fixed fixture set through the
// real, teacher-authenticated theme API.
//
// This is the theme analogue of the portfolio reset contract (PF-task-004):
// real backend + known fixtures + reset-to-baseline. Network stubs are reserved
// only for the states the real backend cannot produce on demand (loading,
// fetch error, empty catalog) and live in theme-stub.cjs.
//
// DELETE /themes/{id} first removes the theme's hasTheme links and then the
// theme, so wiping a catalog whose themes are linked to projects is safe. Both
// theme suites re-establish their own preconditions per scenario, so resetting
// the shared catalog between scenarios does not leak state across suites.

const assert = require('node:assert/strict');

const { BACKEND_URL, E2E_TEACHER_ID } = require('./test-data.cjs');
const { loginToken } = require('./e2e-session.cjs');

// One description is deliberately long so the list-truncation assertion has
// something to truncate; kept here as the single source of truth for TS-010.
const LONG_DESCRIPTION =
  'Dit is een opzettelijk zeer lange themabeschrijving die ruim voorbij de afkapgrens loopt zodat de weergave de tekst zichtbaar moet inkorten in de lijst.';

// Deterministic baseline catalog for the TS-task-010 list scenarios. Display
// orders are non-contiguous and include a tie (3) whose names are NOT
// alphabetical (Alpha before Bravo), so "sorted by display_order then name" is
// an unambiguous, non-trivial assertion. No `id` is included: the backend
// assigns ids on create, and the UI assertions key off names, not ids.
const THEME_SEED_BASELINE = Object.freeze([
  Object.freeze({ name: 'Onderwijs', sdg_code: 'SDG4', icon: 'school', color: '#E91E63', display_order: 6, description: 'Educatie en kennisoverdracht.' }),
  Object.freeze({ name: 'Bravo Thema', sdg_code: 'SDG9', icon: 'lightbulb', color: '#9C27B0', display_order: 3, description: 'Beschrijving bravo.' }),
  Object.freeze({ name: 'Duurzaamheid', sdg_code: 'SDG12', icon: 'eco', color: '#4CAF50', display_order: 1, description: 'Duurzame praktijken.' }),
  Object.freeze({ name: 'Water', sdg_code: 'SDG14', icon: 'water_drop', color: '#00BCD4', display_order: 5, description: 'Waterbeheer en biodiversiteit.' }),
  Object.freeze({ name: 'Alpha Thema', sdg_code: 'SDG2', icon: 'restaurant', color: '#FF9800', display_order: 3, description: 'Beschrijving alpha.' }),
  Object.freeze({ name: 'Klimaat & Milieu', sdg_code: 'SDG13', icon: 'public', color: '#2196F3', display_order: 2, description: LONG_DESCRIPTION }),
]);

// Expected teacher-visible order: display_order ascending, then name. Alpha
// Thema precedes Bravo Thema at the shared display_order 3. Written out on
// purpose so the assertion does not merely mirror the component comparator.
const EXPECTED_SORTED_NAMES = Object.freeze([
  'Duurzaamheid', // 1
  'Klimaat & Milieu', // 2
  'Alpha Thema', // 3 (tie, name-first)
  'Bravo Thema', // 3 (tie)
  'Water', // 5
  'Onderwijs', // 6
]);

async function themeApi(pathname, token, options = {}) {
  const headers = {
    Accept: 'application/json',
    ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const response = await fetch(`${BACKEND_URL}${pathname}`, { ...options, headers });
  const text = await response.text();
  // Keep the raw text on non-JSON bodies (e.g. a 500 "Internal Server Error")
  // so callers fail on the unexpected status with a readable message instead of
  // an opaque JSON.parse crash.
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { status: response.status, body };
}

/**
 * Reset the live theme catalog to exactly `baseline`: delete every existing
 * theme, then recreate the baseline set via the real teacher-authenticated API.
 *
 * Uses the trailing-slash `/themes/` collection URL that the backend router
 * exposes, so no 307 redirect is involved.
 *
 * @param {ReadonlyArray<object>} [baseline]
 * @returns {Promise<Array<object>>} the created theme records (with backend ids)
 */
async function resetThemeCatalog(baseline = THEME_SEED_BASELINE) {
  const token = await loginToken(E2E_TEACHER_ID);

  const existing = await themeApi('/themes/', token);
  assert.equal(existing.status, 200, `Expected GET /themes/ during reset to return 200, received ${existing.status}`);
  assert.ok(Array.isArray(existing.body), `Expected GET /themes/ during reset to return an array, received ${JSON.stringify(existing.body)}`);

  for (const theme of existing.body) {
    if (!theme?.id) continue;
    const deleted = await themeApi(`/themes/${theme.id}`, token, { method: 'DELETE' });
    assert.ok(
      deleted.status === 200 || deleted.status === 404,
      `Expected DELETE /themes/${theme.id} during reset to return 200 or 404, received ${deleted.status}`,
    );
  }

  const created = [];
  for (const theme of baseline) {
    const result = await themeApi('/themes/', token, { method: 'POST', body: JSON.stringify(theme) });
    assert.equal(
      result.status,
      201,
      `Expected POST /themes/ during reset to return 201, received ${result.status}: ${JSON.stringify(result.body)}`,
    );
    created.push(result.body);
  }
  return created;
}

/** Read the live theme catalog via the public GET /themes/ endpoint. */
async function fetchThemes() {
  const result = await themeApi('/themes/', null);
  assert.equal(result.status, 200, `Expected GET /themes/ to return 200, received ${result.status}: ${JSON.stringify(result.body)}`);
  assert.ok(Array.isArray(result.body), `Expected GET /themes/ to return an array, received ${JSON.stringify(result.body)}`);
  return result.body;
}

/** Find a persisted theme by exact name, or null when it does not exist. */
async function getThemeByName(name) {
  const themes = await fetchThemes();
  return themes.find((theme) => theme?.name === name) ?? null;
}

/**
 * Poll until a theme with `name` is persisted, so assertions on what the UI
 * actually saved do not race the browser's in-flight create request.
 */
async function waitForThemeByName(name, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const theme = await getThemeByName(name);
    if (theme) return theme;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  assert.fail(`Expected a theme named '${name}' to be persisted within ${timeoutMs}ms`);
}

module.exports = {
  THEME_SEED_BASELINE,
  EXPECTED_SORTED_NAMES,
  LONG_DESCRIPTION,
  resetThemeCatalog,
  fetchThemes,
  getThemeByName,
  waitForThemeByName,
};
