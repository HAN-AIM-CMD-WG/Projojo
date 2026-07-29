const assert = require('node:assert/strict');

const { Given, Then, When } = require('@qavajs/core');

const { BACKEND_URL, PORTFOLIO_SEED_ALIASES } = require('../support/test-data.cjs');

const actors = PORTFOLIO_SEED_ALIASES.actors;
const items = PORTFOLIO_SEED_ALIASES.items;
const reviews = PORTFOLIO_SEED_ALIASES.reviews;
const source = PORTFOLIO_SEED_ALIASES.source;

function state(world) {
  world.pfTask007a = world.pfTask007a ?? {};
  return world.pfTask007a;
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
}

async function requestPortfolio(world, studentId, { authenticated = true } = {}) {
  const headers = { Accept: 'application/json' };
  if (authenticated) {
    const authToken = state(world).authToken;
    assert.ok(authToken, 'Expected an authentication token before requesting the authenticated portfolio');
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${BACKEND_URL}/portfolios/students/${studentId}`, {
    method: 'GET',
    headers,
  });

  const store = state(world);
  store.lastStatus = response.status;
  store.lastPayload = await readJsonSafely(response);
}

function requireRecordedResponse(world) {
  const store = state(world);
  assert.notEqual(store.lastStatus, undefined, 'Expected a PF-task-007a API response to have been recorded');
  return store;
}

Given('I am authenticated for PF-task-007a as the portfolio owner student', async function () {
  await loginAs(this, actors.student);
});

Given('I am authenticated for PF-task-007a as an unrelated other student', async function () {
  await loginAs(this, actors.privateStudent);
});

Given('I am authenticated for PF-task-007a as the portfolio teacher', async function () {
  await loginAs(this, actors.teacher);
});

Given('I am authenticated for PF-task-007a as the supervisor whose business ever accepted the student', async function () {
  await loginAs(this, actors.everAcceptedSupervisor);
});

Given('I am authenticated for PF-task-007a as the supervisor whose business has only an open application from the student', async function () {
  await loginAs(this, actors.openApplicationSupervisor);
});

Given('I am authenticated for PF-task-007a as a supervisor with no relationship to the student', async function () {
  await loginAs(this, actors.unrelatedSupervisor);
});

Given('I am authenticated for PF-task-007a as the supervisor whose business only rejected the student', async function () {
  await loginAs(this, actors.rejectedApplicationSupervisor);
});

When('I request the PF-task-007a authenticated portfolio for the portfolio owner student', async function () {
  await requestPortfolio(this, actors.student.id);
});

When('I request the PF-task-007a authenticated portfolio for the private student who shares no project or business with the teacher', async function () {
  await requestPortfolio(this, actors.privateStudent.id);
});

When('I request the PF-task-007a authenticated portfolio for the portfolio owner student without authentication', async function () {
  await requestPortfolio(this, actors.student.id, { authenticated: false });
});

Then('the latest PF-task-007a API response status should be {int}', function (expectedStatus) {
  const { lastStatus } = requireRecordedResponse(this);
  assert.equal(lastStatus, expectedStatus, `Expected latest API status ${expectedStatus}, received ${lastStatus}`);
});

Then('the PF-task-007a portfolio response should describe viewer role {string}', function (expectedRole) {
  const { lastPayload } = requireRecordedResponse(this);
  assert.equal(typeof lastPayload, 'object', 'Expected portfolio response payload to be an object');
  assert.notEqual(lastPayload, null, 'Expected portfolio response payload not to be null');
  assert.equal(lastPayload.viewer_role, expectedRole, `Expected viewer_role '${expectedRole}', received '${lastPayload?.viewer_role}'`);
});

Then('the PF-task-007a portfolio response should expose canonical portfolio items rather than stale portfolio data', function () {
  const { lastPayload } = requireRecordedResponse(this);
  assert.ok(Array.isArray(lastPayload.items), 'Expected a canonical items collection');
  assert.ok(Array.isArray(lastPayload.reviews), 'Expected a canonical reviews collection');

  const itemById = new Map(lastPayload.items.map((item) => [item.id, item]));
  const noRatingsItem = itemById.get(items.noRatings.id);
  const allRatingsGoodItem = itemById.get(items.allRatingsGood.id);

  assert.ok(noRatingsItem, 'Expected canonical seeded no-ratings portfolio item to be present');
  assert.ok(allRatingsGoodItem, 'Expected canonical seeded reviewed portfolio item to be present');

  assert.equal(noRatingsItem.source_registration_id, source.registration.id, 'Expected canonical source registration id');
  assert.equal(noRatingsItem.source_task_id, source.task.id, 'Expected canonical source task id');
  assert.equal(noRatingsItem.source_project_id, source.project.id, 'Expected canonical source project id');
  assert.equal(noRatingsItem.source_business_id, source.business.id, 'Expected canonical source business id');
  assert.equal(noRatingsItem.curation.is_retired, false, 'Expected canonical curation retirement state');
  assert.equal(noRatingsItem.curation.is_hidden, false, 'Expected canonical curation hidden state');
  assert.equal(noRatingsItem.archived_source.task, false, 'Expected canonical task archive state');
  assert.equal(noRatingsItem.archived_source.project, false, 'Expected canonical project archive state');
  assert.equal(noRatingsItem.archived_source.business, false, 'Expected canonical business archive state');
  assert.equal(noRatingsItem.visibility.viewer_can_see, true, 'Expected canonical visibility state');

  const responseReviewIds = lastPayload.reviews.map((review) => review.id);
  const attachedReviewIds = allRatingsGoodItem.reviews.map((review) => review.id);
  assert.ok(responseReviewIds.includes(reviews.goodTeacher.id), 'Expected canonical top-level teacher review to be present');
  assert.ok(attachedReviewIds.includes(reviews.goodTeacher.id), 'Expected canonical teacher review to be attached to its item');
  assert.ok(attachedReviewIds.includes(reviews.goodSupervisor.id), 'Expected canonical supervisor review to be attached to its item');

  for (const item of lastPayload.items) {
    assert.equal(typeof item.id, 'string', 'Expected each item to carry a canonical id');
    assert.equal(typeof item.source_registration_id, 'string', 'Expected canonical items to reference their source registration');
    assert.equal(typeof item.curation?.is_retired, 'boolean', 'Expected canonical curation metadata');
  }
});

Then('the PF-task-007a denial response should not disclose whether the student has portfolio items', function () {
  const { lastPayload } = requireRecordedResponse(this);
  assert.equal(typeof lastPayload, 'object', 'Expected denial response payload to be an object');
  assert.notEqual(lastPayload, null, 'Expected denial response payload not to be null');
  assert.deepEqual(
    Object.keys(lastPayload).sort(),
    ['detail'],
    'Expected the denial response to expose only an error detail and never portfolio items or reviews',
  );
});
