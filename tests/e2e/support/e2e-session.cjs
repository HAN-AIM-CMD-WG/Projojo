// Shared browser-session helpers for the E2E suites.
//
// Promoted out of the per-task step files once TS-task-011 became the real
// second consumer of the TS-task-010 teacher-login/session logic, so the two
// suites share one implementation instead of copies.

const assert = require('node:assert/strict');

const { BACKEND_URL, FRONTEND_URL } = require('./test-data.cjs');

/** Resolve the Playwright page the qavajs world exposes. */
function page(world) {
  const current = world?.playwright?.page;
  assert.ok(current, 'Expected the qavajs world to expose playwright.page');
  return current;
}

/** Exchange a seeded user id for a JWT via the localhost test-login endpoint. */
async function loginToken(userId) {
  const response = await fetch(`${BACKEND_URL}/auth/test/login/${userId}`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  assert.equal(response.status, 200, `Expected test login for ${userId} to return 200, received ${response.status}`);
  const payload = await response.json();
  assert.ok(payload?.access_token, `Expected test login for ${userId} to return an access_token`);
  return payload.access_token;
}

/** Authenticate the browser as a seeded user by storing its token. */
async function authenticateInBrowser(world, userId) {
  const token = await loginToken(userId);
  await page(world).goto(FRONTEND_URL);
  await page(world).evaluate((authToken) => localStorage.setItem('token', authToken), token);
}

module.exports = { page, loginToken, authenticateInBrowser };
