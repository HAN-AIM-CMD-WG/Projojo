const assert = require('node:assert/strict');

const { Given, Then, When } = require('@qavajs/core');

const {
  BACKEND_URL,
  E2E_STUDENT_ID,
  E2E_TEACHER_ID,
} = require('../support/test-data.cjs');

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