const assert = require('node:assert/strict');

const { Given, Then, When } = require('@qavajs/core');

const { BACKEND_URL, PORTFOLIO_SEED_ALIASES } = require('../support/test-data.cjs');

const actors = PORTFOLIO_SEED_ALIASES.actors;

// PF-task-011a owns dedicated, mutation-safe portfolio items so ordering, hide/show, and
// world-visible toggles never disturb the read-only expectations of other suites. These ids
// live only here (kept out of the shared `items` alias map on purpose) and are seeded in
// db/test_seed.tql. Most belong to the world-public owner student; "private-worldable" belongs
// to the private-by-default student so the world-public page gate can be proven.
const ITEM_IDS = Object.freeze({
  'order-first': 'pf-seed-item-011a-order-first',
  'order-second': 'pf-seed-item-011a-order-second',
  hideable: 'pf-seed-item-011a-hideable',
  'teacher-hidden': 'pf-seed-item-011a-teacher-hidden',
  worldable: 'pf-seed-item-011a-worldable',
  guard: 'pf-seed-item-011a-guard',
  'private-worldable': 'pf-seed-item-011a-private-worldable',
});

const ROLE_ACTORS = Object.freeze({
  owner: actors.student,
  teacher: actors.teacher,
  'related supervisor': actors.relatedSupervisor,
  'other student': actors.privateStudent,
});

const OWNER_ID = actors.student.id;
const OWNER_PUBLIC_SLUG = PORTFOLIO_SEED_ALIASES.publicSlugs.existing.slug;
const PRIVATE_PAGE_SLUG = PORTFOLIO_SEED_ALIASES.publicSlugs.private.slug;

function state(world) {
  world.pfTask011a = world.pfTask011a ?? { mutation: null };
  return world.pfTask011a;
}

function resolveItemId(token) {
  const id = ITEM_IDS[token.trim()];
  assert.ok(id, `Unknown PF-task-011a item token '${token}'. Known: ${Object.keys(ITEM_IDS).join(', ')}`);
  return id;
}

function resolveActor(roleLabel) {
  const actor = ROLE_ACTORS[roleLabel.trim()];
  assert.ok(actor, `Unknown PF-task-011a role '${roleLabel}'. Known: ${Object.keys(ROLE_ACTORS).join(', ')}`);
  return actor;
}

function resolveFlag(onOff) {
  const value = onOff.trim();
  assert.ok(value === 'on' || value === 'off', `Expected flag 'on' or 'off', received '${onOff}'`);
  return value === 'on';
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

async function patchCuration(itemId, body, { authToken } = {}) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const response = await fetch(`${BACKEND_URL}/portfolios/me/items/${itemId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  return { status: response.status, payload: await readJsonSafely(response) };
}

async function ownerPatch(itemId, body) {
  const authToken = await login(actors.student);
  const result = await patchCuration(itemId, body, { authToken });
  assert.equal(
    result.status,
    200,
    `Expected the owner curation of '${itemId}' to return 200, received ${result.status}: ${JSON.stringify(result.payload)}`,
  );
  return result;
}

async function fetchAuthenticatedPortfolio(actor, studentId) {
  const authToken = await login(actor);
  const response = await fetch(`${BACKEND_URL}/portfolios/students/${studentId}`, {
    method: 'GET',
    headers: { Accept: 'application/json', Authorization: `Bearer ${authToken}` },
  });
  return { status: response.status, payload: await readJsonSafely(response) };
}

async function fetchPublicPortfolio(slug) {
  const response = await fetch(`${BACKEND_URL}/portfolio/${slug}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  return { status: response.status, payload: await readJsonSafely(response) };
}

function viewItemIds(view) {
  assert.equal(view.status, 200, `Expected the portfolio read to return 200, received ${view.status}`);
  assert.ok(Array.isArray(view.payload?.items), 'Expected the portfolio read to carry an items array');
  return view.payload.items.map((item) => item.id);
}

function findViewItem(view, itemId) {
  const item = (view.payload?.items ?? []).find((candidate) => candidate.id === itemId);
  assert.ok(item, `Expected the portfolio read to include item ${itemId}, got: ${viewItemIds(view).join(', ')}`);
  return item;
}

function requireMutation(world) {
  const { mutation } = state(world);
  assert.ok(mutation, 'Expected a PF-task-011a mutation response to have been recorded first');
  return mutation;
}

function mutatedCuration(world, itemToken) {
  const mutation = requireMutation(world);
  const itemId = resolveItemId(itemToken);
  assert.equal(mutation.status, 200, `Expected a successful mutation, received ${mutation.status}: ${JSON.stringify(mutation.payload)}`);
  assert.equal(mutation.payload?.id, itemId, `Expected the mutation to return item ${itemId}, received ${mutation.payload?.id}`);
  assert.ok(mutation.payload?.curation, `Expected the mutation to return a curation block, received ${JSON.stringify(mutation.payload)}`);
  return mutation.payload.curation;
}

// --- Owner-driven curation actions (the behavior under test). -------------------------------

When('PF-task-011a the owner sets the {string} item display order to {int}', async function (itemToken, order) {
  const itemId = resolveItemId(itemToken);
  state(this).mutation = { itemId, itemToken, ...(await ownerPatch(itemId, { display_order: order })) };
});

// A single registration per phrase: cucumber step matching is keyword-agnostic, so these serve
// both the Given (precondition) and When (action) usages in the feature.
Given('PF-task-011a the owner sets the {string} item hidden state to {string}', async function (itemToken, onOff) {
  const itemId = resolveItemId(itemToken);
  state(this).mutation = { itemId, itemToken, ...(await ownerPatch(itemId, { is_student_hidden: resolveFlag(onOff) })) };
});

Given('PF-task-011a the owner sets the {string} item world-visible state to {string}', async function (itemToken, onOff) {
  const itemId = resolveItemId(itemToken);
  state(this).mutation = { itemId, itemToken, ...(await ownerPatch(itemId, { is_world_visible: resolveFlag(onOff) })) };
});

When('PF-task-011a the private-page owner marks their {string} item world-visible', async function (itemToken) {
  const itemId = resolveItemId(itemToken);
  const authToken = await login(actors.privateStudent);
  const result = await patchCuration(itemId, { is_world_visible: true }, { authToken });
  assert.equal(
    result.status,
    200,
    `Expected the private-page owner curation of '${itemToken}' to return 200, received ${result.status}: ${JSON.stringify(result.payload)}`,
  );
  state(this).mutation = { itemId, itemToken, ...result };
});

// --- Unauthorized curation attempts (recorded without asserting success). -------------------

When('PF-task-011a a {string} attempts to set the {string} item hidden state to {string}', async function (roleLabel, itemToken, onOff) {
  const itemId = resolveItemId(itemToken);
  const authToken = await login(resolveActor(roleLabel));
  state(this).mutation = { itemId, itemToken, ...(await patchCuration(itemId, { is_student_hidden: resolveFlag(onOff) }, { authToken })) };
});

When('PF-task-011a an unauthenticated caller attempts to set the {string} item hidden state to {string}', async function (itemToken, onOff) {
  const itemId = resolveItemId(itemToken);
  state(this).mutation = { itemId, itemToken, ...(await patchCuration(itemId, { is_student_hidden: resolveFlag(onOff) })) };
});

// --- Mutation-response assertions. ----------------------------------------------------------

Then('PF-task-011a the mutation response should report the {string} item display order as {int}', function (itemToken, order) {
  const curation = mutatedCuration(this, itemToken);
  assert.equal(curation.display_order, order, `Expected display_order ${order}, received ${JSON.stringify(curation)}`);
});

Then('PF-task-011a the mutation response should report the {string} item as student-hidden', function (itemToken) {
  const curation = mutatedCuration(this, itemToken);
  assert.equal(curation.is_student_hidden, true, `Expected the item to be student-hidden, received ${JSON.stringify(curation)}`);
});

Then('PF-task-011a the mutation response should report the {string} item as not student-hidden', function (itemToken) {
  const curation = mutatedCuration(this, itemToken);
  assert.equal(curation.is_student_hidden, false, `Expected the item not to be student-hidden, received ${JSON.stringify(curation)}`);
});

Then('PF-task-011a the mutation response should report the {string} item as hidden by a teacher', function (itemToken) {
  const curation = mutatedCuration(this, itemToken);
  assert.equal(curation.is_hidden, true, `Expected the item to remain hidden, received ${JSON.stringify(curation)}`);
  assert.equal(curation.hidden_by_role, 'teacher', `Expected the item to remain hidden by a teacher, received ${JSON.stringify(curation)}`);
});

Then('PF-task-011a the mutation response should report the {string} item as world-visible', function (itemToken) {
  const curation = mutatedCuration(this, itemToken);
  assert.equal(curation.is_world_visible, true, `Expected the item to be world-visible, received ${JSON.stringify(curation)}`);
});

Then('PF-task-011a the curation attempt should be denied with status {int}', function (expectedStatus) {
  const mutation = requireMutation(this);
  assert.equal(
    mutation.status,
    expectedStatus,
    `Expected the curation attempt to be denied with ${expectedStatus}, received ${mutation.status}: ${JSON.stringify(mutation.payload)}`,
  );
  assert.equal(
    mutation.payload?.curation,
    undefined,
    `Expected a denial to return no mutated item, received ${JSON.stringify(mutation.payload)}`,
  );
});

// --- Ordering assertions (fresh reads reflect the persisted, post-mutation state). ----------

Then('PF-task-011a the {string} item should appear before the {string} item in the owner view', async function (firstToken, secondToken) {
  const ids = viewItemIds(await fetchAuthenticatedPortfolio(actors.student, OWNER_ID));
  const firstId = resolveItemId(firstToken);
  const secondId = resolveItemId(secondToken);
  const firstIndex = ids.indexOf(firstId);
  const secondIndex = ids.indexOf(secondId);
  assert.ok(firstIndex >= 0, `Expected the owner view to include '${firstToken}' (${firstId}), got: ${ids.join(', ')}`);
  assert.ok(secondIndex >= 0, `Expected the owner view to include '${secondToken}' (${secondId}), got: ${ids.join(', ')}`);
  assert.ok(
    firstIndex < secondIndex,
    `Expected '${firstToken}' (index ${firstIndex}) to appear before '${secondToken}' (index ${secondIndex}) in: ${ids.join(', ')}`,
  );
});

Then('PF-task-011a a fresh owner read should report the {string} item display order as {int}', async function (itemToken, order) {
  const view = await fetchAuthenticatedPortfolio(actors.student, OWNER_ID);
  const item = findViewItem(view, resolveItemId(itemToken));
  assert.equal(
    item.curation?.display_order,
    order,
    `Expected the persisted display_order of '${itemToken}' to be ${order}, received ${JSON.stringify(item.curation)}`,
  );
});

// --- Read-model assertions across roles and the world-public page. --------------------------

Then('PF-task-011a the {string} view should include the {string} item', async function (roleLabel, itemToken) {
  const ids = viewItemIds(await fetchAuthenticatedPortfolio(resolveActor(roleLabel), OWNER_ID));
  const itemId = resolveItemId(itemToken);
  assert.ok(ids.includes(itemId), `Expected the "${roleLabel}" view to include '${itemToken}' (${itemId}), got: ${ids.join(', ')}`);
});

Then('PF-task-011a the {string} view should exclude the {string} item', async function (roleLabel, itemToken) {
  const ids = viewItemIds(await fetchAuthenticatedPortfolio(resolveActor(roleLabel), OWNER_ID));
  const itemId = resolveItemId(itemToken);
  assert.ok(!ids.includes(itemId), `Expected the "${roleLabel}" view to exclude '${itemToken}' (${itemId}), got: ${ids.join(', ')}`);
});

Then('PF-task-011a the world-public page should include the {string} item', async function (itemToken) {
  const ids = viewItemIds(await fetchPublicPortfolio(OWNER_PUBLIC_SLUG));
  const itemId = resolveItemId(itemToken);
  assert.ok(ids.includes(itemId), `Expected the world-public page '${OWNER_PUBLIC_SLUG}' to include '${itemToken}' (${itemId}), got: ${ids.join(', ')}`);
});

Then('PF-task-011a the world-public page should exclude the {string} item', async function (itemToken) {
  const ids = viewItemIds(await fetchPublicPortfolio(OWNER_PUBLIC_SLUG));
  const itemId = resolveItemId(itemToken);
  assert.ok(!ids.includes(itemId), `Expected the world-public page '${OWNER_PUBLIC_SLUG}' to exclude '${itemToken}' (${itemId}), got: ${ids.join(', ')}`);
});

Then('PF-task-011a the {string} item should still be shown to the owner', async function (itemToken) {
  const view = await fetchAuthenticatedPortfolio(actors.student, OWNER_ID);
  const item = findViewItem(view, resolveItemId(itemToken));
  assert.equal(
    item.curation?.is_student_hidden,
    false,
    `Expected '${itemToken}' to remain shown (not student-hidden) after the denied attempt, received ${JSON.stringify(item.curation)}`,
  );
});

Then('PF-task-011a the private portfolio page should not be reachable as a world-public page', async function () {
  const result = await fetchPublicPortfolio(PRIVATE_PAGE_SLUG);
  assert.equal(
    result.status,
    404,
    `Expected the private page '${PRIVATE_PAGE_SLUG}' to return 404 so a world-visible item is not exposed, received ${result.status}: ${JSON.stringify(result.payload)}`,
  );
});

// --- Delete-endpoint absence (normal curation must not rely on a delete endpoint). ----------

Then('PF-task-011a a DELETE request to the {string} curation endpoint should be rejected with status {int}', async function (itemToken, expectedStatus) {
  const authToken = await login(actors.student);
  const response = await fetch(`${BACKEND_URL}/portfolios/me/items/${resolveItemId(itemToken)}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json', Authorization: `Bearer ${authToken}` },
  });
  assert.equal(
    response.status,
    expectedStatus,
    `Expected DELETE on the curation endpoint to be rejected with ${expectedStatus} (no delete endpoint exists), received ${response.status}`,
  );
});
