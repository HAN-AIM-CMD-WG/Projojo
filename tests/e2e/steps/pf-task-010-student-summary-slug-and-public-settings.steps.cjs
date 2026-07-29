const assert = require('node:assert/strict');

const { Given, Then, When } = require('@qavajs/core');

const { BACKEND_URL, PORTFOLIO_SEED_ALIASES } = require('../support/test-data.cjs');

const actors = PORTFOLIO_SEED_ALIASES.actors;
const publicSlugs = PORTFOLIO_SEED_ALIASES.publicSlugs;

// Baseline the mutable settings student is reset to at the start of each mutating scenario, so
// scenarios stay order-independent under the serial runner.
const BASELINE_SUMMARY = 'PF-task-010 baseline summary.';
const BASELINE_SLUG = 'pf-task-010-baseline';

// The slug contract under test (documented in the feature file).
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

const ROLE_ACTORS = Object.freeze({
  teacher: actors.teacher,
  supervisor: actors.relatedSupervisor,
});

function state(world) {
  world.pfTask010 = world.pfTask010 ?? { lastStatus: undefined, lastPayload: undefined, firstReadSlug: undefined };
  return world.pfTask010;
}

async function readJsonSafely(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw_body: text };
  }
}

async function login(actor) {
  const response = await fetch(`${BACKEND_URL}/auth/test/login/${actor.id}`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  const payload = await readJsonSafely(response);
  assert.equal(response.status, 200, `Expected ${actor.alias} login to return 200, received ${response.status}`);
  assert.ok(payload?.access_token, `Expected ${actor.alias} login to return an access_token`);
  return payload.access_token;
}

async function getSettings(actor) {
  const authToken = await login(actor);
  const response = await fetch(`${BACKEND_URL}/portfolios/me`, {
    method: 'GET',
    headers: { Accept: 'application/json', Authorization: `Bearer ${authToken}` },
  });
  return { status: response.status, payload: await readJsonSafely(response) };
}

async function patchSettings(actor, body) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (actor) headers.Authorization = `Bearer ${await login(actor)}`;
  const response = await fetch(`${BACKEND_URL}/portfolios/me`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  return { status: response.status, payload: await readJsonSafely(response) };
}

async function getPublic(slug) {
  const response = await fetch(`${BACKEND_URL}/portfolio/${slug}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  return { status: response.status, payload: await readJsonSafely(response) };
}

async function getAuthenticatedPortfolio(actor, studentId) {
  const authToken = await login(actor);
  const response = await fetch(`${BACKEND_URL}/portfolios/students/${studentId}`, {
    method: 'GET',
    headers: { Accept: 'application/json', Authorization: `Bearer ${authToken}` },
  });
  return { status: response.status, payload: await readJsonSafely(response) };
}

function remember(world, result) {
  const store = state(world);
  store.lastStatus = result.status;
  store.lastPayload = result.payload;
}

// --- Baseline / setup ------------------------------------------------------------------------

Given('the PF-task-010 settings student has baseline portfolio settings', async function () {
  const result = await patchSettings(actors.settingsStudent, {
    summary: BASELINE_SUMMARY,
    slug: BASELINE_SLUG,
    is_world_public: false,
  });
  assert.equal(
    result.status,
    200,
    `Expected baseline settings PATCH to return 200, received ${result.status}: ${JSON.stringify(result.payload)}`,
  );
  assert.equal(result.payload?.slug, BASELINE_SLUG, 'Expected baseline PATCH to persist the baseline slug');
});

// --- Read actions ----------------------------------------------------------------------------

When('the PF-task-010 no-slug student reads their portfolio settings', async function () {
  const result = await getSettings(actors.noSlugStudent);
  remember(this, result);
  if (result.status === 200) state(this).firstReadSlug = result.payload?.slug;
});

When('an unauthenticated visitor requests the PF-task-010 world-private public slug', async function () {
  remember(this, await getPublic(publicSlugs.private.slug));
});

// --- Update actions --------------------------------------------------------------------------

When('the PF-task-010 settings student updates the summary to {string}', async function (summary) {
  remember(this, await patchSettings(actors.settingsStudent, { summary }));
});

When('the PF-task-010 settings student updates the summary to a string of {int} characters', async function (length) {
  remember(this, await patchSettings(actors.settingsStudent, { summary: 'a'.repeat(length) }));
});

When('the PF-task-010 settings student updates the slug to {string}', async function (slug) {
  remember(this, await patchSettings(actors.settingsStudent, { slug }));
});

When(
  'the PF-task-010 settings student publishes with summary {string} and slug {string}',
  async function (summary, slug) {
    remember(this, await patchSettings(actors.settingsStudent, { summary, slug, is_world_public: true }));
  },
);

When('a PF-task-010 {string} attempts to update the portfolio settings summary', async function (roleLabel) {
  const actor = ROLE_ACTORS[roleLabel.trim()];
  assert.ok(actor, `Unknown PF-task-010 role '${roleLabel}'. Known: ${Object.keys(ROLE_ACTORS).join(', ')}`);
  remember(this, await patchSettings(actor, { summary: 'Ongeautoriseerde wijziging.' }));
});

When('an unauthenticated caller attempts to update the PF-task-010 portfolio settings summary', async function () {
  remember(this, await patchSettings(null, { summary: 'Ongeautoriseerde wijziging.' }));
});

When('another PF-task-010 student updates their own summary to {string}', async function (summary) {
  remember(this, await patchSettings(actors.noSlugStudent, { summary }));
});

// --- Assertions ------------------------------------------------------------------------------

Then('the latest PF-task-010 API response status should be {int}', function (expectedStatus) {
  assert.equal(
    state(this).lastStatus,
    expectedStatus,
    `Expected latest API status ${expectedStatus}, received ${state(this).lastStatus}: ${JSON.stringify(state(this).lastPayload)}`,
  );
});

Then('the PF-task-010 settings world-public flag should be false', function () {
  assert.equal(
    state(this).lastPayload?.is_world_public,
    false,
    `Expected world-public flag false on first read, received ${JSON.stringify(state(this).lastPayload)}`,
  );
});

Then('the PF-task-010 settings slug should be a valid non-empty slug', function () {
  const slug = state(this).lastPayload?.slug;
  assert.equal(typeof slug, 'string', `Expected a string slug, received ${JSON.stringify(slug)}`);
  assert.ok(slug.length >= 3 && slug.length <= 50, `Expected slug length 3-50, received '${slug}'`);
  assert.match(slug, SLUG_PATTERN, `Expected generated slug to match the slug contract, received '${slug}'`);
});

Then('reading the PF-task-010 no-slug student settings again should return the same slug', async function () {
  const first = state(this).firstReadSlug;
  assert.ok(first, 'Expected a slug to have been generated on the first read');
  const result = await getSettings(actors.noSlugStudent);
  assert.equal(result.status, 200, `Expected the second settings read to return 200, received ${result.status}`);
  assert.equal(
    result.payload?.slug,
    first,
    `Expected the generated slug to be stable across reads, first='${first}' second='${result.payload?.slug}'`,
  );
});

Then('the PF-task-010 response should expose no portfolio item or review data', function () {
  const payload = state(this).lastPayload;
  assert.equal(typeof payload, 'object', 'Expected a response payload object');
  assert.notEqual(payload, null, 'Expected a non-null response payload');
  assert.deepEqual(
    Object.keys(payload).sort(),
    ['detail'],
    `Expected the private-slug denial to expose only an error detail, received ${JSON.stringify(payload)}`,
  );
});

Then('the PF-task-010 settings summary should be {string}', function (expected) {
  assert.equal(
    state(this).lastPayload?.summary,
    expected,
    `Expected the mutation response summary to be '${expected}', received ${JSON.stringify(state(this).lastPayload)}`,
  );
});

Then('reading the PF-task-010 settings student settings should return summary {string}', async function (expected) {
  const result = await getSettings(actors.settingsStudent);
  assert.equal(result.status, 200, `Expected the settings read to return 200, received ${result.status}`);
  assert.equal(
    result.payload?.summary,
    expected,
    `Expected the persisted summary to be '${expected}', received ${JSON.stringify(result.payload)}`,
  );
});

Then('the PF-task-010 settings student slug should still be {string}', async function (expected) {
  const result = await getSettings(actors.settingsStudent);
  assert.equal(result.status, 200, `Expected the settings read to return 200, received ${result.status}`);
  assert.equal(
    result.payload?.slug,
    expected,
    `Expected the slug to remain '${expected}', received ${JSON.stringify(result.payload)}`,
  );
});

Then(
  'the PF-task-010 authenticated portfolio read for the settings student should show summary {string}',
  async function (expected) {
    // AC-3 promises the saved summary is used by later authenticated responses, not just the
    // owner settings read. The owner reads their own authenticated portfolio and the student
    // identity block must carry the freshly saved summary.
    const result = await getAuthenticatedPortfolio(actors.settingsStudent, actors.settingsStudent.id);
    assert.equal(
      result.status,
      200,
      `Expected the authenticated portfolio read to return 200, received ${result.status}: ${JSON.stringify(result.payload)}`,
    );
    assert.equal(
      result.payload?.student?.portfolio_summary,
      expected,
      `Expected the authenticated read to expose summary '${expected}', received ${JSON.stringify(result.payload?.student)}`,
    );
  },
);

Then('the PF-task-010 world-public page at slug {string} should be served', async function (slug) {
  const result = await getPublic(slug);
  assert.equal(result.status, 200, `Expected world-public page '${slug}' to return 200, received ${result.status}`);
  assert.equal(result.payload?.student?.portfolio_slug, slug, `Expected the served page to carry slug '${slug}'`);
});

Then('the PF-task-010 world-public page at slug {string} should not be served', async function (slug) {
  const result = await getPublic(slug);
  assert.equal(result.status, 404, `Expected world-public page '${slug}' to return 404, received ${result.status}`);
});

Then('the PF-task-010 world-public page at slug {string} should show summary {string}', async function (slug, expected) {
  const result = await getPublic(slug);
  assert.equal(result.status, 200, `Expected world-public page '${slug}' to return 200, received ${result.status}`);
  assert.equal(
    result.payload?.student?.portfolio_summary,
    expected,
    `Expected the world-public page to show summary '${expected}', received ${JSON.stringify(result.payload?.student)}`,
  );
});

Then('the PF-task-010 world-public page at slug {string} should have no items', async function (slug) {
  const result = await getPublic(slug);
  assert.equal(result.status, 200, `Expected world-public page '${slug}' to return 200, received ${result.status}`);
  assert.ok(Array.isArray(result.payload?.items), 'Expected the world-public page to carry an items array');
  assert.equal(
    result.payload.items.length,
    0,
    `Expected a summary-only page to have no items, received ${JSON.stringify(result.payload.items)}`,
  );
});
