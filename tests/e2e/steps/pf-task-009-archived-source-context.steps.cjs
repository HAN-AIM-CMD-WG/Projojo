const assert = require('node:assert/strict');

const { Given, Then, When } = require('@qavajs/core');

const { BACKEND_URL, PORTFOLIO_SEED_ALIASES } = require('../support/test-data.cjs');

const actors = PORTFOLIO_SEED_ALIASES.actors;
const items = PORTFOLIO_SEED_ALIASES.items;
const archivedSourceState = PORTFOLIO_SEED_ALIASES.archivedSourceState;

// Human-readable scenario tokens mapped to their deterministic seed item identifiers.
// "archived-source" references the seed item whose source project and business are archived;
// "active-source" references the no-ratings item whose source project and business are live.
const ITEM_TOKENS = Object.freeze({
  'archived-source': items.archivedSource.id,
  'active-source': items.noRatings.id,
});

const ARCHIVED_LEVELS = Object.freeze(['task', 'project', 'business']);

function state(world) {
  world.pfTask009 = world.pfTask009 ?? { authToken: null, lastStatus: null, lastPayload: null };
  return world.pfTask009;
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

function authHeaders(token) {
  return { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

async function loginAs(world, actor) {
  const response = await fetch(`${BACKEND_URL}/auth/test/login/${actor.id}`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  const payload = await readJsonSafely(response);
  assert.equal(response.status, 200, `Expected ${actor.alias} login to return 200, received ${response.status}`);
  assert.ok(payload?.access_token, `Expected ${actor.alias} login to return an access_token`);
  state(world).authToken = payload.access_token;
  return payload.access_token;
}

async function requestPortfolio(world) {
  const token = state(world).authToken;
  assert.ok(token, 'Expected an authenticated session before requesting the PF-task-009 portfolio');
  const response = await fetch(`${BACKEND_URL}/portfolios/students/${actors.student.id}`, {
    method: 'GET',
    headers: authHeaders(token),
  });
  state(world).lastStatus = response.status;
  state(world).lastPayload = await readJsonSafely(response);
}

function resolveItemId(token) {
  const id = ITEM_TOKENS[token.trim()];
  assert.ok(id, `Unknown PF-task-009 item token '${token}'. Known tokens: ${Object.keys(ITEM_TOKENS).join(', ')}`);
  return id;
}

function portfolioItems(world) {
  const payload = state(world).lastPayload;
  assert.equal(typeof payload, 'object', 'Expected the PF-task-009 portfolio payload to be an object');
  assert.notEqual(payload, null, 'Expected the PF-task-009 portfolio payload not to be null');
  assert.ok(Array.isArray(payload.items), 'Expected the PF-task-009 portfolio payload to carry an items array');
  return payload.items;
}

function getItem(world, token) {
  const id = resolveItemId(token);
  const item = portfolioItems(world).find((candidate) => candidate.id === id);
  assert.ok(item, `Expected the PF-task-009 portfolio to include item '${token}' (${id})`);
  return item;
}

Given('I am authenticated as the PF-task-009 portfolio owner student', async function () {
  await loginAs(this, actors.student);
});

Given('I am authenticated as the PF-task-009 portfolio teacher', async function () {
  await loginAs(this, actors.teacher);
});

Given('I am authenticated as the PF-task-009 portfolio related supervisor', async function () {
  await loginAs(this, actors.relatedSupervisor);
});

Given('the PF-task-009 archived-source project starts archived', async function () {
  // Normalise the shared deterministic fixture to its archived baseline without relying on the
  // archived_source field under test: archiving an already-archived project is rejected with 400
  // "Dit project is al gearchiveerd", so both 200 (freshly archived) and that specific
  // already-archived 400 prove the baseline holds. Any other status fails the baseline. A teacher
  // passes the archive authorisation and skips ownership checks.
  const token = await loginAs(this, actors.teacher);
  const response = await fetch(`${BACKEND_URL}/projects/${archivedSourceState.projectId}/archive?confirm=true`, {
    method: 'PATCH',
    headers: authHeaders(token),
  });
  const payload = await readJsonSafely(response);
  if (response.status === 400) {
    assert.match(
      payload?.detail ?? '',
      /gearchiveerd/iu,
      `Expected the archived baseline 400 to report the project is already archived, received: ${JSON.stringify(payload)}`,
    );
  } else {
    assert.equal(
      response.status,
      200,
      `Expected archiving the PF-task-009 source project to establish the archived baseline (200 or already-archived 400), received ${response.status}: ${JSON.stringify(payload)}`,
    );
  }
});

When('I request the PF-task-009 authenticated portfolio for the seeded portfolio student', async function () {
  await requestPortfolio(this);
});

When('I restore the PF-task-009 archived-source project', async function () {
  const token = await loginAs(this, actors.teacher);
  const response = await fetch(`${BACKEND_URL}/projects/${archivedSourceState.projectId}/restore`, {
    method: 'PATCH',
    headers: authHeaders(token),
  });
  const payload = await readJsonSafely(response);
  assert.equal(
    response.status,
    200,
    `Expected restoring the archived source project to return 200, received ${response.status}: ${JSON.stringify(payload)}`,
  );
});

When('I archive the PF-task-009 archived-source project again', async function () {
  const token = await loginAs(this, actors.teacher);
  const response = await fetch(`${BACKEND_URL}/projects/${archivedSourceState.projectId}/archive?confirm=true`, {
    method: 'PATCH',
    headers: authHeaders(token),
  });
  const payload = await readJsonSafely(response);
  assert.equal(
    response.status,
    200,
    `Expected re-archiving the source project to return 200, received ${response.status}: ${JSON.stringify(payload)}`,
  );
});

Then('the latest PF-task-009 API response status should be {int}', function (expectedStatus) {
  assert.equal(
    state(this).lastStatus,
    expectedStatus,
    `Expected latest PF-task-009 API status ${expectedStatus}, received ${state(this).lastStatus}`,
  );
});

Then('the PF-task-009 portfolio should include the {string} item', function (token) {
  getItem(this, token);
});

Then('the PF-task-009 {string} item should not be retired', function (token) {
  const item = getItem(this, token);
  assert.equal(typeof item.curation, 'object', `Expected item '${token}' to carry a curation object`);
  assert.equal(item.curation.is_retired, false, `Expected archived-source item '${token}' to remain non-retired evidence`);
});

Then('the PF-task-009 {string} item should report archived source {string} as {word}', function (token, level, expected) {
  const item = getItem(this, token);
  assert.ok(ARCHIVED_LEVELS.includes(level), `Unknown archived source level '${level}'. Known: ${ARCHIVED_LEVELS.join(', ')}`);
  assert.equal(typeof item.archived_source, 'object', `Expected item '${token}' to carry an archived_source object`);
  const expectedBool = expected === 'true';
  assert.equal(
    item.archived_source[level],
    expectedBool,
    `Expected archived_source.${level} of '${token}' to be ${expectedBool}, received ${item.archived_source[level]}`,
  );
});

Then('the PF-task-009 {string} item source navigation state should be {string}', function (token, expectedStateValue) {
  const item = getItem(this, token);
  assert.equal(typeof item.source_navigation, 'object', `Expected item '${token}' to carry a source_navigation object`);
  assert.equal(
    item.source_navigation.state,
    expectedStateValue,
    `Expected source_navigation.state of '${token}' to be '${expectedStateValue}', received '${item.source_navigation?.state}'`,
  );
});

Then('the PF-task-009 {string} item should carry a non-empty source navigation reason', function (token) {
  const item = getItem(this, token);
  assert.equal(typeof item.source_navigation, 'object', `Expected item '${token}' to carry a source_navigation object`);
  assert.equal(typeof item.source_navigation.reason, 'string', `Expected source_navigation.reason of '${token}' to be a string`);
  assert.ok(item.source_navigation.reason.trim().length > 0, `Expected a non-empty source_navigation.reason for '${token}'`);
});

Then('the PF-task-009 {string} item source navigation reason should mention that the source is archived', function (token) {
  const reason = getItem(this, token).source_navigation?.reason ?? '';
  assert.match(reason, /gearchiveerd/iu, `Expected the navigation reason to state the source is archived, received: '${reason}'`);
});

Then('the PF-task-009 {string} item source navigation reason should state that completed work stays visible', function (token) {
  const reason = getItem(this, token).source_navigation?.reason ?? '';
  assert.match(reason, /zichtbaar/iu, `Expected the navigation reason to state completed work stays visible, received: '${reason}'`);
});

Then('the PF-task-009 {string} item source navigation reason should not use deletion or snapshot wording', function (token) {
  const reason = getItem(this, token).source_navigation?.reason ?? '';
  assert.doesNotMatch(
    reason,
    /verwijder|momentopname|snapshot/iu,
    `Expected the navigation reason to avoid deletion/snapshot wording, received: '${reason}'`,
  );
});
