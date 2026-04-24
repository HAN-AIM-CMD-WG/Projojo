const assert = require('node:assert/strict');

const {
  BACKEND_URL,
  LOGIN_URL,
  PROOF_BUSINESS_NAME,
  PROOF_PROJECT_NAME,
  PROOF_SEED_MARKER,
  PROOF_SUPERVISOR_NAME,
} = require('../support/test-data.cjs');

const maxAttempts = 30;
const retryDelayMs = 2_000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function retry(label, fn) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await fn();
      console.log(`✓ ${label}`);
      return result;
    } catch (error) {
      lastError = error;
      console.log(`… ${label} not ready yet (${attempt}/${maxAttempts})`);
      if (attempt < maxAttempts) {
        await sleep(retryDelayMs);
      }
    }
  }

  throw new Error(`${label} failed after ${maxAttempts} attempts: ${lastError?.message ?? 'unknown error'}`);
}

async function main() {
  console.log('Running Projojo E2E infrastructure preflight');

  await retry('backend root endpoint', async () => {
    const response = await fetch(`${BACKEND_URL}/`);
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.message, 'Welcome to Projojo Backend API');
  });

  await retry('TypeDB development status endpoint', async () => {
    const response = await fetch(`${BACKEND_URL}/typedb/status`);
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.status, 'connected');
  });

  await retry('development user listing endpoint', async () => {
    const response = await fetch(`${BACKEND_URL}/users/`);
    assert.equal(response.status, 200);
    const users = await response.json();
    assert.ok(Array.isArray(users));
    assert.ok(users.some((user) => user?.fullName === PROOF_SUPERVISOR_NAME || user?.full_name === PROOF_SUPERVISOR_NAME));
  });

  await retry('deterministic public-project seed', async () => {
    const response = await fetch(`${BACKEND_URL}/projects/public`, {
      headers: { Accept: 'application/json' },
    });
    assert.equal(response.status, 200);
    const projects = await response.json();
    assert.ok(Array.isArray(projects));

    const proofProject = projects.find((project) => project?.name === PROOF_PROJECT_NAME);
    assert.ok(proofProject, `Missing public project '${PROOF_PROJECT_NAME}'`);
    assert.equal(proofProject.business?.name, PROOF_BUSINESS_NAME);
    assert.equal(proofProject.impact_summary, PROOF_SEED_MARKER);
  });

  await retry('frontend login shell', async () => {
    const response = await fetch(LOGIN_URL);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /<div id="root"><\/div>|<div id="root">\s*<\/div>/);
  });

  console.log('Preflight complete');
  console.log('HTML report artifact target: tests/e2e/reports/report.html');
}

main().catch((error) => {
  console.error('Preflight failed');
  console.error(error.message);
  process.exit(1);
});
