const assert = require('node:assert/strict');

const { Given, Then, When } = require('@qavajs/core');

const {
  BACKEND_URL,
  E2E_STUDENT_ID,
  E2E_TEACHER_ID,
} = require('../support/test-data.cjs');

let authToken = null;
let lastApiStatus = null;
let lastApiPayload = null;

Given('I am authenticated as the seeded teacher', async function () {
  const response = await fetch(`${BACKEND_URL}/auth/test/login/${E2E_TEACHER_ID}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
  });

  assert.equal(response.status, 200, `Expected seeded teacher login to return 200, received ${response.status}`);
  const payload = await response.json();
  authToken = payload?.access_token ?? null;
  assert.ok(authToken, 'Expected seeded teacher login to return an access_token');
});

When('I call the legacy student portfolio endpoint', async function () {
  assert.ok(authToken, 'Expected authentication token before calling legacy student portfolio endpoint');

  const response = await fetch(`${BACKEND_URL}/students/${E2E_STUDENT_ID}/portfolio`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
  });

  lastApiStatus = response.status;
  lastApiPayload = await response.json();
});

When('I call the legacy student portfolio delete endpoint for portfolio id {string}', async function (portfolioId) {
  assert.ok(authToken, 'Expected authentication token before calling legacy student portfolio delete endpoint');

  const response = await fetch(`${BACKEND_URL}/students/${E2E_STUDENT_ID}/portfolio/${portfolioId}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
  });

  lastApiStatus = response.status;
  lastApiPayload = await response.json();
});

Then('the latest legacy portfolio API response status should be {int}', function (expectedStatus) {
  assert.equal(lastApiStatus, expectedStatus, `Expected latest API status to be ${expectedStatus}, received ${lastApiStatus}`);
});

Then('the latest API response detail should contain {string}', function (expectedText) {
  const detail = String(lastApiPayload?.detail ?? '');
  assert.notEqual(detail.trim(), '', 'Expected latest API response to include a detail message');
  assert.ok(
    detail.includes(expectedText),
    `Expected latest API detail to contain '${expectedText}', received '${detail}'`,
  );
});