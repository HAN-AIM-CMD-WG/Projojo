const assert = require('node:assert/strict');

const { Given, Then, When } = require('@qavajs/core');

const { BACKEND_URL, PORTFOLIO_SEED_ALIASES } = require('../support/test-data.cjs');

const actors = PORTFOLIO_SEED_ALIASES.actors;

// PF-task-007c owns dedicated, mutation-safe portfolio items so retract/restore actions never
// disturb the read-only expectations of other suites. These ids live only here (they are kept
// out of the shared `items` alias map on purpose) and are seeded in db/test_seed.tql.
const ITEM_IDS = Object.freeze({
  guard: 'pf-seed-item-007c-guard',
  retractable: 'pf-seed-item-007c-retractable',
  restorable: 'pf-seed-item-007c-restorable',
  'restorable-low-rated': 'pf-seed-item-007c-restorable-low-rated',
});

// The related supervisor already passes the PF-task-007a portfolio relationship gate for the
// owner student, so any item-level change here is purely about the retraction flag.
const ROLE_ACTORS = Object.freeze({
  'owner student': actors.student,
  teacher: actors.teacher,
  'related supervisor': actors.relatedSupervisor,
  'other student': actors.privateStudent,
});

const OWNER_PUBLIC_SLUG = PORTFOLIO_SEED_ALIASES.publicSlugs.existing.slug;

function state(world) {
  world.pfTask007c = world.pfTask007c ?? { mutation: null };
  return world.pfTask007c;
}

function resolveItemId(token) {
  const id = ITEM_IDS[token.trim()];
  assert.ok(id, `Unknown PF-task-007c item token '${token}'. Known: ${Object.keys(ITEM_IDS).join(', ')}`);
  return id;
}

function resolveActor(roleLabel) {
  const actor = ROLE_ACTORS[roleLabel.trim()];
  assert.ok(actor, `Unknown PF-task-007c role '${roleLabel}'. Known: ${Object.keys(ROLE_ACTORS).join(', ')}`);
  return actor;
}

function resolveFlag(onOff) {
  const value = onOff.trim();
  assert.ok(value === 'on' || value === 'off', `Expected retraction flag 'on' or 'off', received '${onOff}'`);
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

async function patchRetraction(itemId, retracted, { authToken } = {}) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const response = await fetch(`${BACKEND_URL}/portfolios/me/items/${itemId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ is_authenticated_public_retraction: retracted }),
  });
  return { status: response.status, payload: await readJsonSafely(response) };
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
  assert.equal(view.status, 200, `Expected the portfolio read to return 200, received ${view.status}`);
  const item = (view.payload?.items ?? []).find((candidate) => candidate.id === itemId);
  assert.ok(item, `Expected the portfolio read to include item ${itemId}, got: ${viewItemIds(view).join(', ')}`);
  return item;
}

function requireMutation(world) {
  const { mutation } = state(world);
  assert.ok(mutation, 'Expected a PF-task-007c mutation response to have been recorded first');
  return mutation;
}

// --- Owner-driven retraction changes (the action under test). ------------------------------

When(
  'PF-task-007c the owner student sets the {string} item authenticated-public retraction to {string}',
  async function (itemToken, onOff) {
    const itemId = resolveItemId(itemToken);
    const retracted = resolveFlag(onOff);
    const authToken = await login(actors.student);
    const result = await patchRetraction(itemId, retracted, { authToken });
    assert.equal(
      result.status,
      200,
      `Expected the owner to set retraction=${retracted} on '${itemToken}' with 200, received ${result.status}: ${JSON.stringify(result.payload)}`,
    );
    state(this).mutation = { itemId, itemToken, expectedRetracted: retracted, ...result };
  },
);

When(
  'PF-task-007c a {string} attempts to set the {string} item authenticated-public retraction to {string}',
  async function (roleLabel, itemToken, onOff) {
    const itemId = resolveItemId(itemToken);
    const retracted = resolveFlag(onOff);
    const authToken = await login(resolveActor(roleLabel));
    state(this).mutation = { itemId, itemToken, expectedRetracted: retracted, ...(await patchRetraction(itemId, retracted, { authToken })) };
  },
);

When(
  'PF-task-007c an unauthenticated caller attempts to set the {string} item authenticated-public retraction to {string}',
  async function (itemToken, onOff) {
    const itemId = resolveItemId(itemToken);
    const retracted = resolveFlag(onOff);
    state(this).mutation = { itemId, itemToken, expectedRetracted: retracted, ...(await patchRetraction(itemId, retracted)) };
  },
);

// --- Mutation-response assertions. ----------------------------------------------------------

Then(
  'the PF-task-007c mutation response should report the {string} item as authenticated-public retracted',
  function (itemToken) {
    const mutation = requireMutation(this);
    const itemId = resolveItemId(itemToken);
    assert.equal(mutation.status, 200, `Expected a successful mutation, received ${mutation.status}`);
    assert.equal(mutation.payload?.id, itemId, `Expected the mutation to return item ${itemId}, received ${mutation.payload?.id}`);
    assert.equal(
      mutation.payload?.curation?.is_authenticated_public_retraction,
      true,
      `Expected the returned item to be authenticated-public retracted, received ${JSON.stringify(mutation.payload?.curation)}`,
    );
  },
);

Then(
  'the PF-task-007c mutation response should report the {string} item as not authenticated-public retracted',
  function (itemToken) {
    const mutation = requireMutation(this);
    const itemId = resolveItemId(itemToken);
    assert.equal(mutation.status, 200, `Expected a successful mutation, received ${mutation.status}`);
    assert.equal(mutation.payload?.id, itemId, `Expected the mutation to return item ${itemId}, received ${mutation.payload?.id}`);
    assert.equal(
      mutation.payload?.curation?.is_authenticated_public_retraction,
      false,
      `Expected the returned item not to be authenticated-public retracted, received ${JSON.stringify(mutation.payload?.curation)}`,
    );
  },
);

Then(
  'the PF-task-007c mutation response should report the {string} item as world-visible',
  function (itemToken) {
    const mutation = requireMutation(this);
    const itemId = resolveItemId(itemToken);
    assert.equal(mutation.payload?.id, itemId, `Expected the mutation to return item ${itemId}, received ${mutation.payload?.id}`);
    assert.equal(
      mutation.payload?.curation?.is_world_visible,
      true,
      `Expected the returned item to remain world-visible after retraction, received ${JSON.stringify(mutation.payload?.curation)}`,
    );
  },
);

Then('the PF-task-007c mutation attempt should be denied with status {int}', function (expectedStatus) {
  const mutation = requireMutation(this);
  assert.equal(
    mutation.status,
    expectedStatus,
    `Expected the mutation attempt to be denied with ${expectedStatus}, received ${mutation.status}: ${JSON.stringify(mutation.payload)}`,
  );
  assert.equal(
    mutation.payload?.curation,
    undefined,
    `Expected a denial to return no mutated item, received ${JSON.stringify(mutation.payload)}`,
  );
});

// --- Read-model assertions (fresh reads so they reflect the post-mutation state). -----------

Then('the PF-task-007c {string} view should include the {string} item', async function (roleLabel, itemToken) {
  const view = await fetchAuthenticatedPortfolio(resolveActor(roleLabel), actors.student.id);
  const ids = viewItemIds(view);
  const itemId = resolveItemId(itemToken);
  assert.ok(ids.includes(itemId), `Expected the "${roleLabel}" view to include '${itemToken}' (${itemId}), got: ${ids.join(', ')}`);
});

Then('the PF-task-007c {string} view should exclude the {string} item', async function (roleLabel, itemToken) {
  const view = await fetchAuthenticatedPortfolio(resolveActor(roleLabel), actors.student.id);
  const ids = viewItemIds(view);
  const itemId = resolveItemId(itemToken);
  assert.ok(!ids.includes(itemId), `Expected the "${roleLabel}" view to exclude '${itemToken}' (${itemId}), got: ${ids.join(', ')}`);
});

Then('the PF-task-007c {string} view should show the {string} item as world-visible', async function (roleLabel, itemToken) {
  const view = await fetchAuthenticatedPortfolio(resolveActor(roleLabel), actors.student.id);
  const item = findViewItem(view, resolveItemId(itemToken));
  assert.equal(
    item.curation?.is_world_visible,
    true,
    `Expected '${itemToken}' to stay world-visible in the "${roleLabel}" view, received ${JSON.stringify(item.curation)}`,
  );
});

Then('the PF-task-007c {string} item authenticated-public retraction should still be {string}', async function (itemToken, onOff) {
  const expected = resolveFlag(onOff);
  const view = await fetchAuthenticatedPortfolio(actors.student, actors.student.id);
  const item = findViewItem(view, resolveItemId(itemToken));
  assert.equal(
    item.curation?.is_authenticated_public_retraction,
    expected,
    `Expected '${itemToken}' retraction to remain ${expected} after the denied attempt, received ${JSON.stringify(item.curation)}`,
  );
});

Then('the PF-task-007c public portfolio page should include the {string} item', async function (itemToken) {
  const view = await fetchPublicPortfolio(OWNER_PUBLIC_SLUG);
  const ids = viewItemIds(view);
  const itemId = resolveItemId(itemToken);
  assert.ok(
    ids.includes(itemId),
    `Expected the world-public page '${OWNER_PUBLIC_SLUG}' to still include '${itemToken}' (${itemId}), got: ${ids.join(', ')}`,
  );
});
