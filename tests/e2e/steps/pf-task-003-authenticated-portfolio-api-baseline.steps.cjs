const assert = require('node:assert/strict');

const { Given, Then, When } = require('@qavajs/core');

const {
  BACKEND_URL,
  PORTFOLIO_SEED_ALIASES,
} = require('../support/test-data.cjs');

const actors = PORTFOLIO_SEED_ALIASES.actors;
const items = PORTFOLIO_SEED_ALIASES.items;
const publicSlugs = PORTFOLIO_SEED_ALIASES.publicSlugs;

function rememberAuthToken(world, authToken, actor) {
  world.pfTask003 = { ...(world.pfTask003 ?? {}), authToken, actor };
}

function getAuthToken(world, actionDescription) {
  const authToken = world.pfTask003?.authToken;
  assert.ok(authToken, `Expected authentication token before ${actionDescription}`);
  return authToken;
}

function rememberLatestApiResponse(world, response, payload) {
  world.pfTask003 = {
    ...(world.pfTask003 ?? {}),
    lastApiStatus: response.status,
    lastApiPayload: payload,
  };
}

function getLatestApiResponse(world) {
  assert.notEqual(
    world.pfTask003?.lastApiStatus,
    undefined,
    'Expected a PF-task-003 API response to have been recorded',
  );
  return world.pfTask003;
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
    headers: {
      Accept: 'application/json',
    },
  });

  const payload = await readJsonSafely(response);
  assert.equal(response.status, 200, `Expected ${actor.alias} login to return 200, received ${response.status}`);
  assert.ok(payload?.access_token, `Expected ${actor.alias} login to return an access_token`);
  rememberAuthToken(world, payload.access_token, actor);
}

async function requestAuthenticatedPortfolio(world, studentId = actors.student.id, headers = {}) {
  const response = await fetch(`${BACKEND_URL}/portfolios/students/${studentId}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...headers,
    },
  });

  rememberLatestApiResponse(world, response, await readJsonSafely(response));
}

function requirePortfolioPayload(world) {
  const { lastApiPayload } = getLatestApiResponse(world);
  assert.equal(typeof lastApiPayload, 'object', 'Expected portfolio response payload to be an object');
  assert.notEqual(lastApiPayload, null, 'Expected portfolio response payload not to be null');
  return lastApiPayload;
}

function itemIds(payload) {
  assert.ok(Array.isArray(payload.items), 'Expected portfolio response items to be an array');
  return payload.items.map((item) => item.id);
}

function assertNoPortfolioCollections(payload) {
  assert.equal(typeof payload, 'object', 'Expected denial response payload to be an object');
  assert.notEqual(payload, null, 'Expected denial response payload not to be null');
  assert.deepEqual(Object.keys(payload).sort(), ['detail'], 'Expected denial response to expose only the documented error detail');
}

function assertReviewShape(review) {
  assert.equal(typeof review.id, 'string', 'Expected review id');
  assert.equal(typeof review.item_id, 'string', 'Expected review item_id');
  assert.equal(typeof review.review_text, 'string', 'Expected review text');
  assert.equal(typeof review.created_at, 'string', 'Expected review created_at');
  assert.equal(typeof review.updated_at, 'string', 'Expected review updated_at');
  assert.equal(typeof review.is_world_visible, 'boolean', 'Expected review world-visible flag');
  assert.equal(typeof review.public_notice_accepted_at, 'string', 'Expected review public notice timestamp');
  assert.equal(typeof review.author?.id, 'string', 'Expected review author identity');
  assert.equal(typeof review.author?.role, 'string', 'Expected review author role');
}

function assertItemShape(item) {
  assert.equal(typeof item.id, 'string', 'Expected item id');
  assert.equal(typeof item.created_at, 'string', 'Expected item created_at');
  assert.equal(typeof item.completed_at, 'string', 'Expected item completed_at');
  assert.equal(typeof item.source_student_id, 'string', 'Expected source student id');
  assert.equal(typeof item.student?.full_name, 'string', 'Expected copied student display fields');
  assert.equal(typeof item.task?.name, 'string', 'Expected copied task display fields');
  assert.equal(typeof item.project?.name, 'string', 'Expected copied project display fields');
  assert.equal(typeof item.business?.name, 'string', 'Expected copied business display fields');
  assert.ok(Array.isArray(item.skills), 'Expected copied skills collection');
  assert.equal(item.curation?.is_retired, false, 'Expected retired items to be excluded');
  assert.equal(item.curation?.is_hidden, false, 'Expected hidden items to be excluded');
  assert.equal(typeof item.curation?.is_authenticated_public_retraction, 'boolean', 'Expected curation retraction state');
  assert.equal(typeof item.curation?.is_world_visible, 'boolean', 'Expected curation world-visible state');
  assert.equal(typeof item.archived_source?.task, 'boolean', 'Expected archived-source task state');
  assert.equal(typeof item.archived_source?.project, 'boolean', 'Expected archived-source project state');
  assert.equal(typeof item.archived_source?.business, 'boolean', 'Expected archived-source business state');
  assert.equal(typeof item.visibility?.reason, 'string', 'Expected visibility reason');
  assert.ok(Array.isArray(item.reviews), 'Expected item review collection shape');
  item.reviews.forEach(assertReviewShape);
}

Given('I am authenticated as the PF-task-003 portfolio owner student', async function () {
  await loginAs(this, actors.student);
});

Given('I am authenticated as the PF-task-003 other portfolio student', async function () {
  await loginAs(this, actors.privateStudent);
});

Given('I am authenticated as the PF-task-003 portfolio teacher', async function () {
  await loginAs(this, actors.teacher);
});

Given('I am authenticated as the PF-task-003 related portfolio supervisor', async function () {
  await loginAs(this, actors.relatedSupervisor);
});

Given('I am authenticated as the PF-task-003 unrelated portfolio supervisor', async function () {
  await loginAs(this, actors.unrelatedSupervisor);
});

When('I request the PF-task-003 authenticated portfolio for the seeded portfolio student', async function () {
  const authToken = getAuthToken(this, 'requesting the authenticated portfolio baseline');
  await requestAuthenticatedPortfolio(this, actors.student.id, { Authorization: `Bearer ${authToken}` });
});

When('I request the PF-task-003 authenticated portfolio for the private slug student fixture', async function () {
  const authToken = getAuthToken(this, 'requesting the authenticated portfolio baseline for the private slug student');
  await requestAuthenticatedPortfolio(this, actors.privateStudent.id, { Authorization: `Bearer ${authToken}` });
});

When('I request the PF-task-003 authenticated portfolio for the seeded portfolio student without authentication', async function () {
  await requestAuthenticatedPortfolio(this, actors.student.id);
});

When('I request the PF-task-003 private public portfolio slug fixture', async function () {
  const response = await fetch(`${BACKEND_URL}/portfolio/${publicSlugs.private.slug}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  rememberLatestApiResponse(this, response, await readJsonSafely(response));
});

When('I request the PF-task-003 OpenAPI contract', async function () {
  const response = await fetch(`${BACKEND_URL}/openapi.json`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  rememberLatestApiResponse(this, response, await readJsonSafely(response));
});

Then('the latest PF-task-003 API response status should be {int}', function (expectedStatus) {
  const { lastApiStatus } = getLatestApiResponse(this);
  assert.equal(lastApiStatus, expectedStatus, `Expected latest API status to be ${expectedStatus}, received ${lastApiStatus}`);
});

Then('the PF-task-003 portfolio response should describe viewer role {string}', function (expectedRole) {
  const payload = requirePortfolioPayload(this);
  assert.equal(payload.viewer_role, expectedRole, `Expected viewer_role to be '${expectedRole}'`);
});

Then('the PF-task-003 portfolio response should include the seeded student identity', function () {
  const payload = requirePortfolioPayload(this);
  assert.equal(payload.student?.id, actors.student.id, 'Expected seeded student id in response');
  assert.equal(payload.student?.full_name, actors.student.fullName, 'Expected seeded student full_name in response');
  assert.equal(payload.student?.portfolio_slug, publicSlugs.existing.slug, 'Expected seeded portfolio slug in response');
  assert.equal(typeof payload.student?.is_portfolio_world_public, 'boolean', 'Expected student world-public setting in response');
});

Then('the PF-task-003 portfolio response should include canonical portfolio fields', function () {
  const payload = requirePortfolioPayload(this);
  assert.ok(Array.isArray(payload.items), 'Expected canonical items collection');
  assert.ok(Array.isArray(payload.reviews), 'Expected canonical reviews collection');
  payload.items.forEach(assertItemShape);
  payload.reviews.forEach(assertReviewShape);
});

Then('the PF-task-003 portfolio response should include non-hidden canonical items', function () {
  const payload = requirePortfolioPayload(this);
  const ids = itemIds(payload);
  assert.ok(ids.includes(items.noRatings.id), 'Expected no-rating canonical item to be included');
  assert.ok(ids.includes(items.allRatingsGood.id), 'Expected all-ratings-good canonical item to be included');
  assert.ok(ids.includes(items.lowRating.id), 'Expected low-rating canonical item to be included');
  assert.ok(ids.includes(items.retractedAuthenticatedPublic.id), 'Expected retracted item to remain visible to owner/teacher baseline reads');
  assert.ok(ids.includes(items.worldPublicSelected.id), 'Expected world-visible canonical item to be included');
  assert.ok(ids.includes(items.archivedSource.id), 'Expected archived-source canonical item to be included');
  assert.ok(!ids.includes(items.hidden.id), 'Expected hidden canonical item to be excluded');
  assert.ok(payload.items.every((item) => item.curation?.is_retired === false), 'Expected all returned canonical items to be non-retired');
  assert.ok(payload.items.every((item) => item.curation?.is_hidden === false), 'Expected all returned canonical items to be non-hidden');
});

Then('the PF-task-003 portfolio response should not use the stale student portfolio shape', function () {
  const payload = requirePortfolioPayload(this);
  assert.equal(payload.active_count, undefined, 'Expected no stale active_count field');
  assert.equal(payload.snapshot_count, undefined, 'Expected no stale snapshot_count field');
  assert.equal(payload.source_type, undefined, 'Expected no stale top-level source_type field');
  assert.ok(!payload.items.some((item) => item.source_type !== undefined), 'Expected no stale item source_type fields');
});

Then('the PF-task-003 related supervisor response should be a safe Phase 1 baseline', function () {
  const payload = requirePortfolioPayload(this);
  assert.ok(Array.isArray(payload.items), 'Expected related supervisor response to keep the canonical item collection shape');
  assert.ok(Array.isArray(payload.reviews), 'Expected related supervisor response to keep the canonical review collection shape');
  assert.ok(payload.items.every((item) => item.visibility?.viewer_can_see !== false), 'Expected returned supervisor items to be marked visible when present');
});

Then('the PF-task-003 denial response should not expose portfolio item or review data', function () {
  const { lastApiPayload } = getLatestApiResponse(this);
  assertNoPortfolioCollections(lastApiPayload);
});

Then('the PF-task-003 OpenAPI contract should document authenticated portfolio examples', function () {
  const payload = requirePortfolioPayload(this);
  const responses = payload.paths?.['/portfolios/students/{student_id}']?.get?.responses;
  assert.ok(responses, 'Expected authenticated portfolio OpenAPI responses');

  const successExamples = responses['200']?.content?.['application/json']?.examples;
  assert.ok(successExamples, 'Expected authenticated portfolio success examples map');
  const successExample = successExamples.teacher?.value;
  assert.equal(successExample?.viewer_role, 'teacher', 'Expected authenticated portfolio success example viewer_role');
  assert.equal(typeof successExample?.student?.id, 'string', 'Expected student identity in success example');
  assert.ok(Array.isArray(successExample?.items), 'Expected success example items collection');
  assert.ok(Array.isArray(successExample?.reviews), 'Expected success example reviews collection');
  assert.ok(successExample.items.length >= 1, 'Expected success example to include an item object');
  assert.ok(successExample.reviews.length >= 1, 'Expected success example to include a review object');
  assertItemShape(successExample.items[0]);
  assertReviewShape(successExample.reviews[0]);

  for (const status of ['401', '403', '404']) {
    assertNoPortfolioCollections(responses[status]?.content?.['application/json']?.example);
  }
});

Then('the PF-task-003 OpenAPI contract should document public not-public examples', function () {
  const payload = requirePortfolioPayload(this);
  const publicResponses = payload.paths?.['/portfolio/{slug}']?.get?.responses;
  assert.ok(publicResponses, 'Expected public portfolio OpenAPI responses');
  assertNoPortfolioCollections(publicResponses['404']?.content?.['application/json']?.example);
});
