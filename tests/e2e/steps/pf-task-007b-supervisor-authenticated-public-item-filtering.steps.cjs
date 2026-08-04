const assert = require('node:assert/strict');

const { Given, Then, When } = require('@qavajs/core');

const { BACKEND_URL, PORTFOLIO_SEED_ALIASES } = require('../support/test-data.cjs');

const actors = PORTFOLIO_SEED_ALIASES.actors;
const items = PORTFOLIO_SEED_ALIASES.items;

// Human-readable scenario tokens mapped to their deterministic seed identifiers.
const ITEM_TOKENS = Object.freeze({
  'no-ratings': items.noRatings.id,
  'all-good-ratings': items.allRatingsGood.id,
  'low-rating': items.lowRating.id,
  'mixed-ratings': items.mixedRatings.id,
  'retracted': items.retractedAuthenticatedPublic.id,
  'hidden': items.hidden.id,
  'retired': items.retired.id,
  'world-public': items.worldPublicSelected.id,
  'archived-source': items.archivedSource.id,
});

const ROLE_ACTORS = Object.freeze({
  'owner student': actors.student,
  'teacher': actors.teacher,
  'related supervisor': actors.relatedSupervisor,
});

function state(world) {
  world.pfTask007b = world.pfTask007b ?? { views: {}, authToken: null };
  return world.pfTask007b;
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

async function requestPortfolio(authToken, studentId) {
  const response = await fetch(`${BACKEND_URL}/portfolios/students/${studentId}`, {
    method: 'GET',
    headers: { Accept: 'application/json', Authorization: `Bearer ${authToken}` },
  });
  return { status: response.status, payload: await readJsonSafely(response) };
}

function resolveItemId(token) {
  const id = ITEM_TOKENS[token.trim()];
  assert.ok(id, `Unknown PF-task-007b item token '${token}'. Known tokens: ${Object.keys(ITEM_TOKENS).join(', ')}`);
  return id;
}

function resolveItemIds(tokenList) {
  return tokenList.split(',').map((token) => resolveItemId(token));
}

function getView(world, roleLabel) {
  const view = state(world).views[roleLabel];
  assert.ok(view, `Expected a captured PF-task-007b "${roleLabel}" view before asserting on it`);
  return view;
}

function viewItemIds(view) {
  assert.equal(typeof view.payload, 'object', 'Expected the captured portfolio view payload to be an object');
  assert.notEqual(view.payload, null, 'Expected the captured portfolio view payload not to be null');
  assert.ok(Array.isArray(view.payload.items), 'Expected the captured portfolio view to carry an items array');
  return view.payload.items.map((item) => item.id);
}

function viewReviews(view) {
  assert.ok(Array.isArray(view.payload?.reviews), 'Expected the captured portfolio view to carry a reviews array');
  return view.payload.reviews;
}

When('I capture the PF-task-007b {string} view of the portfolio owner student', async function (roleLabel) {
  const actor = ROLE_ACTORS[roleLabel];
  assert.ok(actor, `Unknown PF-task-007b role '${roleLabel}'. Known roles: ${Object.keys(ROLE_ACTORS).join(', ')}`);
  const authToken = await loginAs(this, actor);
  state(this).views[roleLabel] = await requestPortfolio(authToken, actors.student.id);
});

Given('the PF-task-007b retired item exists in the seed as retired portfolio evidence', async function () {
  // Genuine existence + retired-state probe with no mutation: the review endpoint rejects a
  // retired item specifically (create_review checks isRetired before writing). A teacher passes
  // the supervisor gate and skips the business-ownership check, so the only reason for a 400 with
  // this message is that the item exists AND is retired. A missing item would report "niet gevonden".
  const authToken = await loginAs(this, actors.teacher);
  const response = await fetch(`${BACKEND_URL}/portfolio-items/${items.retired.id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ review_text: 'PF-task-007b retired existence probe', public_review_notice_accepted: true }),
  });
  const payload = await readJsonSafely(response);
  assert.equal(response.status, 400, `Expected the retired item to reject a new review with 400, received ${response.status}`);
  assert.match(
    payload?.detail ?? '',
    /ingetrokken/iu,
    `Expected rejection because the item is retired evidence (proving it exists and is retired), received: ${JSON.stringify(payload)}`,
  );
});

Then('the PF-task-007b {string} view should respond with status {int}', function (roleLabel, expectedStatus) {
  const view = getView(this, roleLabel);
  assert.equal(view.status, expectedStatus, `Expected the "${roleLabel}" view status ${expectedStatus}, received ${view.status}`);
});

Then('the PF-task-007b {string} view should describe viewer role {string}', function (roleLabel, expectedRole) {
  const view = getView(this, roleLabel);
  assert.equal(view.payload?.viewer_role, expectedRole, `Expected viewer_role '${expectedRole}', received '${view.payload?.viewer_role}'`);
});

Then('the PF-task-007b {string} view should include the {string} item', function (roleLabel, token) {
  const ids = viewItemIds(getView(this, roleLabel));
  const expectedId = resolveItemId(token);
  assert.ok(ids.includes(expectedId), `Expected the "${roleLabel}" view to include item '${token}' (${expectedId}), got: ${ids.join(', ')}`);
});

Then('the PF-task-007b {string} view should exclude the {string} item', function (roleLabel, token) {
  const ids = viewItemIds(getView(this, roleLabel));
  const excludedId = resolveItemId(token);
  assert.ok(!ids.includes(excludedId), `Expected the "${roleLabel}" view to exclude item '${token}' (${excludedId}), got: ${ids.join(', ')}`);
});

Then('the PF-task-007b {string} view should include the {string} items', function (roleLabel, tokenList) {
  const ids = viewItemIds(getView(this, roleLabel));
  for (const expectedId of resolveItemIds(tokenList)) {
    assert.ok(ids.includes(expectedId), `Expected the "${roleLabel}" view to include item ${expectedId}, got: ${ids.join(', ')}`);
  }
});

Then('the PF-task-007b {string} view should exclude the {string} items', function (roleLabel, tokenList) {
  const ids = viewItemIds(getView(this, roleLabel));
  for (const excludedId of resolveItemIds(tokenList)) {
    assert.ok(!ids.includes(excludedId), `Expected the "${roleLabel}" view to exclude item ${excludedId}, got: ${ids.join(', ')}`);
  }
});

Then('the PF-task-007b {string} view should include the reviews of the {string} items', function (roleLabel, tokenList) {
  const view = getView(this, roleLabel);
  const reviewItemIds = new Set(viewReviews(view).map((review) => review.item_id));
  for (const expectedId of resolveItemIds(tokenList)) {
    assert.ok(reviewItemIds.has(expectedId), `Expected the "${roleLabel}" view to return at least one review for item ${expectedId}`);
  }
});

Then('every review in the PF-task-007b {string} view should belong to a returned item', function (roleLabel) {
  const view = getView(this, roleLabel);
  const itemIds = new Set(viewItemIds(view));
  const reviews = viewReviews(view);
  assert.ok(reviews.length >= 1, `Expected the "${roleLabel}" view to return at least one review to make this assertion meaningful`);
  for (const review of reviews) {
    assert.ok(itemIds.has(review.item_id), `Expected review ${review.id} to reference a returned item, but item ${review.item_id} is not visible`);
  }
});

Then('the PF-task-007b {string} view should return at least one review', function (roleLabel) {
  const reviews = viewReviews(getView(this, roleLabel));
  assert.ok(reviews.length >= 1, `Expected the "${roleLabel}" view to return at least one review so the review-exclusion assertions are not vacuous`);
});

Then('the PF-task-007b {string} view should carry no numeric rating for the {string} item', function (roleLabel, token) {
  const itemId = resolveItemId(token);
  const rated = viewReviews(getView(this, roleLabel)).filter(
    (review) => review.item_id === itemId && typeof review.rating === 'number',
  );
  assert.equal(
    rated.length,
    0,
    `Expected the "${token}" item to carry no numeric rating in the "${roleLabel}" view (premise of the no-ratings case), found ${JSON.stringify(rated.map((review) => review.rating))}`,
  );
});

Then('no review in the PF-task-007b {string} view should reference the {string} item', function (roleLabel, token) {
  const excludedId = resolveItemId(token);
  const referencing = viewReviews(getView(this, roleLabel)).filter((review) => review.item_id === excludedId);
  assert.equal(referencing.length, 0, `Expected no review referencing item '${token}' (${excludedId}), found ${referencing.length}`);
});

Then('no review in the PF-task-007b {string} view should have a rating below three', function (roleLabel) {
  const lowRated = viewReviews(getView(this, roleLabel)).filter((review) => typeof review.rating === 'number' && review.rating < 3);
  assert.equal(lowRated.length, 0, `Expected no returned review with a rating below three, found ${JSON.stringify(lowRated.map((review) => ({ id: review.id, rating: review.rating })))}`);
});
