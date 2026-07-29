const assert = require('node:assert/strict');

const { Given, Then, When } = require('@qavajs/core');

const { BACKEND_URL, PORTFOLIO_SEED_ALIASES } = require('../support/test-data.cjs');

const actors = PORTFOLIO_SEED_ALIASES.actors;

// PF-task-012a owns a dedicated, mutation-safe world-public student ("Ravi Reviewpubliek") plus
// its own items and reviews, seeded in db/test_seed.tql. Isolating 012a behind its own
// world-public page means marking/clearing review visibility here never disturbs the read-only
// public-page expectations of other suites (which assert against Tom's page). The owner id and
// slug live only here on purpose, mirroring how PF-task-011a kept its ids local to its steps.
const OWNER = Object.freeze({ id: '20000000-0000-4000-8000-000000000013', alias: 'portfolio-012a-owner-student' });
const OWNER_PUBLIC_SLUG = 'portfolio-seed-012a-reviews';

// review token -> the item it belongs to and the review id. The world-visible selection endpoint
// is scoped by both ids, so every action resolves the pair together.
const REVIEWS = Object.freeze({
  markable: { itemId: 'pf-seed-item-012a-host', reviewId: 'pf-seed-review-012a-markable' },
  retractable: { itemId: 'pf-seed-item-012a-host', reviewId: 'pf-seed-review-012a-retractable' },
  guard: { itemId: 'pf-seed-item-012a-host', reviewId: 'pf-seed-review-012a-guard' },
  nonpublic: { itemId: 'pf-seed-item-012a-nonpublic', reviewId: 'pf-seed-review-012a-nonpublic' },
  retired: { itemId: 'pf-seed-item-012a-retired', reviewId: 'pf-seed-review-012a-retired' },
  hidden: { itemId: 'pf-seed-item-012a-hidden', reviewId: 'pf-seed-review-012a-hidden' },
});

const ITEM_IDS = Object.freeze({
  'nonpublic-item': 'pf-seed-item-012a-nonpublic',
  'retired-item': 'pf-seed-item-012a-retired',
  'hidden-item': 'pf-seed-item-012a-hidden',
});

const ROLE_ACTORS = Object.freeze({
  teacher: actors.teacher,
  'related supervisor': actors.relatedSupervisor,
  'other student': actors.student,
});

function state(world) {
  world.pfTask012a = world.pfTask012a ?? { mutation: null };
  return world.pfTask012a;
}

function resolveReview(token) {
  const review = REVIEWS[token.trim()];
  assert.ok(review, `Unknown PF-task-012a review token '${token}'. Known: ${Object.keys(REVIEWS).join(', ')}`);
  return review;
}

function resolveItemId(token) {
  const id = ITEM_IDS[token.trim()];
  assert.ok(id, `Unknown PF-task-012a item token '${token}'. Known: ${Object.keys(ITEM_IDS).join(', ')}`);
  return id;
}

function resolveActor(roleLabel) {
  const actor = ROLE_ACTORS[roleLabel.trim()];
  assert.ok(actor, `Unknown PF-task-012a role '${roleLabel}'. Known: ${Object.keys(ROLE_ACTORS).join(', ')}`);
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

async function patchReviewSelection(review, isWorldVisible, { authToken } = {}) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const response = await fetch(`${BACKEND_URL}/portfolios/me/items/${review.itemId}/reviews/${review.reviewId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ is_world_visible: isWorldVisible }),
  });
  return { status: response.status, payload: await readJsonSafely(response) };
}

async function ownerSetReviewVisible(token, isWorldVisible) {
  const review = resolveReview(token);
  const authToken = await login(OWNER);
  const result = await patchReviewSelection(review, isWorldVisible, { authToken });
  assert.equal(
    result.status,
    200,
    `Expected the owner selection of review '${token}' to return 200, received ${result.status}: ${JSON.stringify(result.payload)}`,
  );
  return { token, review, ...result };
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

function reviewIds(view) {
  assert.equal(view.status, 200, `Expected the portfolio read to return 200, received ${view.status}: ${JSON.stringify(view.payload)}`);
  assert.ok(Array.isArray(view.payload?.reviews), 'Expected the portfolio read to carry a reviews array');
  return view.payload.reviews.map((review) => review.id);
}

function itemIds(view) {
  assert.equal(view.status, 200, `Expected the portfolio read to return 200, received ${view.status}: ${JSON.stringify(view.payload)}`);
  assert.ok(Array.isArray(view.payload?.items), 'Expected the portfolio read to carry an items array');
  return view.payload.items.map((item) => item.id);
}

function requireMutation(world) {
  const { mutation } = state(world);
  assert.ok(mutation, 'Expected a PF-task-012a selection response to have been recorded first');
  return mutation;
}

function mutatedReview(world, token) {
  const mutation = requireMutation(world);
  const review = resolveReview(token);
  assert.equal(mutation.status, 200, `Expected a successful selection, received ${mutation.status}: ${JSON.stringify(mutation.payload)}`);
  assert.equal(mutation.payload?.id, review.reviewId, `Expected the selection to return review ${review.reviewId}, received ${mutation.payload?.id}`);
  return mutation.payload;
}

// --- Owner-driven review selection actions (the behavior under test). ------------------------

// A single registration per phrase serves both the Given (precondition) and When (action) usages.
Given('PF-task-012a the owner sets the {string} review world-visible state to {string}', async function (token, onOff) {
  state(this).mutation = await ownerSetReviewVisible(token, resolveFlag(onOff));
});

// --- Unauthorized selection attempts (recorded without asserting success). -------------------

When('PF-task-012a a {string} attempts to set the {string} review world-visible state to {string}', async function (roleLabel, token, onOff) {
  const review = resolveReview(token);
  const authToken = await login(resolveActor(roleLabel));
  state(this).mutation = { token, review, ...(await patchReviewSelection(review, resolveFlag(onOff), { authToken })) };
});

When('PF-task-012a an unauthenticated caller attempts to set the {string} review world-visible state to {string}', async function (token, onOff) {
  const review = resolveReview(token);
  state(this).mutation = { token, review, ...(await patchReviewSelection(review, resolveFlag(onOff))) };
});

When('PF-task-012a the world-public page is read', async function () {
  state(this).publicPage = await fetchPublicPortfolio(OWNER_PUBLIC_SLUG);
});

// --- Selection-response assertions. ---------------------------------------------------------

Then('PF-task-012a the mutation response should report the {string} review as world-visible', function (token) {
  const review = mutatedReview(this, token);
  assert.equal(review.is_world_visible, true, `Expected review '${token}' to be world-visible, received ${JSON.stringify(review)}`);
});

Then('PF-task-012a the mutation response should report the {string} review as not world-visible', function (token) {
  const review = mutatedReview(this, token);
  assert.equal(review.is_world_visible, false, `Expected review '${token}' not to be world-visible, received ${JSON.stringify(review)}`);
});

Then('PF-task-012a the selection attempt should be denied with status {int}', function (expectedStatus) {
  const mutation = requireMutation(this);
  assert.equal(
    mutation.status,
    expectedStatus,
    `Expected the selection attempt to be denied with ${expectedStatus}, received ${mutation.status}: ${JSON.stringify(mutation.payload)}`,
  );
  assert.equal(
    mutation.payload?.is_world_visible,
    undefined,
    `Expected a denial to return no mutated review, received ${JSON.stringify(mutation.payload)}`,
  );
});

// --- World-public page assertions. ----------------------------------------------------------

Then('PF-task-012a the world-public page should include the {string} review', async function (token) {
  const review = resolveReview(token);
  const ids = reviewIds(await fetchPublicPortfolio(OWNER_PUBLIC_SLUG));
  assert.ok(
    ids.includes(review.reviewId),
    `Expected the world-public page '${OWNER_PUBLIC_SLUG}' to include review '${token}' (${review.reviewId}), got: ${ids.join(', ')}`,
  );
});

Then('PF-task-012a the world-public page should exclude the {string} review', async function (token) {
  const review = resolveReview(token);
  const ids = reviewIds(await fetchPublicPortfolio(OWNER_PUBLIC_SLUG));
  assert.ok(
    !ids.includes(review.reviewId),
    `Expected the world-public page '${OWNER_PUBLIC_SLUG}' to exclude review '${token}' (${review.reviewId}), got: ${ids.join(', ')}`,
  );
});

Then('PF-task-012a the world-public page should exclude the {string} item', async function (itemToken) {
  const itemId = resolveItemId(itemToken);
  const ids = itemIds(await fetchPublicPortfolio(OWNER_PUBLIC_SLUG));
  assert.ok(
    !ids.includes(itemId),
    `Expected the world-public page '${OWNER_PUBLIC_SLUG}' to exclude item '${itemToken}' (${itemId}), got: ${ids.join(', ')}`,
  );
});

Then('PF-task-012a every returned world-public review should carry a persisted public notice acceptance timestamp', function () {
  const { publicPage } = state(this);
  assert.ok(publicPage, 'Expected the world-public page to have been read first');
  assert.equal(publicPage.status, 200, `Expected the world-public page to return 200, received ${publicPage.status}: ${JSON.stringify(publicPage.payload)}`);
  const reviews = publicPage.payload?.reviews ?? [];
  assert.ok(reviews.length >= 1, `Expected at least one world-public review to be returned, received ${JSON.stringify(reviews)}`);
  for (const review of reviews) {
    assert.ok(
      typeof review.public_notice_accepted_at === 'string' && review.public_notice_accepted_at.length > 0,
      `Expected world-public review ${review.id} to carry a persisted public_notice_accepted_at, received ${JSON.stringify(review)}`,
    );
  }
});

// --- Authenticated read-model assertions (owner view is unaffected by world-public retraction). ---

Then('PF-task-012a the owner authenticated view should include the {string} review', async function (token) {
  const review = resolveReview(token);
  const ids = reviewIds(await fetchAuthenticatedPortfolio(OWNER, OWNER.id));
  assert.ok(
    ids.includes(review.reviewId),
    `Expected the owner authenticated view to include review '${token}' (${review.reviewId}), got: ${ids.join(', ')}`,
  );
});

Then('PF-task-012a the {string} review should still be world-visible in the owner view', async function (token) {
  const review = resolveReview(token);
  const view = await fetchAuthenticatedPortfolio(OWNER, OWNER.id);
  assert.equal(view.status, 200, `Expected the owner authenticated view to return 200, received ${view.status}: ${JSON.stringify(view.payload)}`);
  const found = (view.payload?.reviews ?? []).find((candidate) => candidate.id === review.reviewId);
  assert.ok(found, `Expected the owner authenticated view to include review '${token}' (${review.reviewId})`);
  assert.equal(
    found.is_world_visible,
    true,
    `Expected review '${token}' to remain world-visible after the denied attempt, received ${JSON.stringify(found)}`,
  );
});
