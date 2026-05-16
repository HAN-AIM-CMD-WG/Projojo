const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { Given, Then, When } = require('@qavajs/core');

const {
  BACKEND_URL,
  E2E_STUDENT_ID,
  E2E_TEACHER_ID,
} = require('../support/test-data.cjs');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const PROJECT_ROUTER_PATH = path.join(REPO_ROOT, 'projojo_backend', 'routes', 'project_router.py');
const PROJECT_REPOSITORY_PATH = path.join(REPO_ROOT, 'projojo_backend', 'domain', 'repositories', 'project_repository.py');

function rememberAuthToken(world, authToken) {
  world.pfTask001 = { ...(world.pfTask001 ?? {}), authToken };
}

function getAuthToken(world, actionDescription) {
  const authToken = world.pfTask001?.authToken;
  assert.ok(authToken, `Expected authentication token before ${actionDescription}`);
  return authToken;
}

function rememberLatestApiResponse(world, response, payload) {
  world.pfTask001 = {
    ...(world.pfTask001 ?? {}),
    lastApiStatus: response.status,
    lastApiPayload: payload,
  };
}

function getLatestApiResponse(world) {
  assert.notEqual(
    world.pfTask001?.lastApiStatus,
    undefined,
    'Expected a legacy portfolio API response to have been recorded',
  );
  return world.pfTask001;
}

Given('I am authenticated as the seeded teacher', async function () {
  const response = await fetch(`${BACKEND_URL}/auth/test/login/${E2E_TEACHER_ID}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
  });

  assert.equal(response.status, 200, `Expected seeded teacher login to return 200, received ${response.status}`);
  const payload = await response.json();
  const authToken = payload?.access_token ?? null;
  assert.ok(authToken, 'Expected seeded teacher login to return an access_token');
  rememberAuthToken(this, authToken);
});

When('I call the legacy student portfolio endpoint', async function () {
  const authToken = getAuthToken(this, 'calling legacy student portfolio endpoint');

  const response = await fetch(`${BACKEND_URL}/students/${E2E_STUDENT_ID}/portfolio`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
  });

  rememberLatestApiResponse(this, response, await response.json());
});

When('I call the legacy student portfolio delete endpoint for portfolio id {string}', async function (portfolioId) {
  const authToken = getAuthToken(this, 'calling legacy student portfolio delete endpoint');

  const response = await fetch(`${BACKEND_URL}/students/${E2E_STUDENT_ID}/portfolio/${portfolioId}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
  });

  rememberLatestApiResponse(this, response, await response.json());
});

When('I inspect the project deletion portfolio decommissioning contract', function () {
  this.pfTask001 = {
    ...(this.pfTask001 ?? {}),
    projectRouterSource: fs.readFileSync(PROJECT_ROUTER_PATH, 'utf8'),
    projectRepositorySource: fs.readFileSync(PROJECT_REPOSITORY_PATH, 'utf8'),
  };
});

Then('the latest legacy portfolio API response status should be {int}', function (expectedStatus) {
  const { lastApiStatus } = getLatestApiResponse(this);
  assert.equal(lastApiStatus, expectedStatus, `Expected latest API status to be ${expectedStatus}, received ${lastApiStatus}`);
});

Then('the latest API response detail should contain {string}', function (expectedText) {
  const { lastApiPayload } = getLatestApiResponse(this);
  const detail = String(lastApiPayload?.detail ?? '');
  assert.notEqual(detail.trim(), '', 'Expected latest API response to include a detail message');
  assert.ok(
    detail.includes(expectedText),
    `Expected latest API detail to contain '${expectedText}', received '${detail}'`,
  );
});

Then('the project deletion code should not create portfolio snapshots', function () {
  const source = this.pfTask001?.projectRouterSource;
  assert.equal(typeof source, 'string', 'Expected project router source to be loaded');

  assert.doesNotMatch(source, /create_snapshot/u, 'Project deletion must not call stale portfolio snapshot creation');
  assert.doesNotMatch(source, /snapshots_created/u, 'Project deletion response must not expose snapshot creation counts');
  assert.doesNotMatch(source, /PortfolioRepository/u, 'Project deletion route must not depend on the stale portfolio repository');
});

Then('stale snapshot repository helpers should be absent', function () {
  const source = this.pfTask001?.projectRepositorySource;
  assert.equal(typeof source, 'string', 'Expected project repository source to be loaded');

  assert.doesNotMatch(source, /get_completed_tasks_by_project/u, 'Snapshot-oriented completed-task helper should be removed');
  assert.doesNotMatch(source, /portfolio snapshots?/iu, 'Project repository should not document portfolio snapshot behavior');
});
