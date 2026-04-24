const assert = require('node:assert/strict');

const { Given, Then, When } = require('@qavajs/core');
const memory = require('@qavajs/memory');
const { query } = require('@qavajs/steps-playwright/lib/pageObject.js');

const {
  BACKEND_URL,
  LOGIN_URL,
  PROOF_BUSINESS_NAME,
  PROOF_PROJECT_NAME,
  PROOF_SEED_MARKER,
} = require('../support/test-data.cjs');

let lastApiStatus = null;
let lastApiPayload = null;

const normalizeText = (value) => value.replace(/\s+/g, ' ').trim();

function getNamedTarget(world, alias) {
  const pageObject = world?.config?.pageObject;
  assert.ok(pageObject, 'Expected qavajs world to expose config.pageObject');

  const chain = query(pageObject, alias);
  let current = world?.playwright?.page;
  assert.ok(current, 'Expected qavajs world to expose playwright.page');

  for (const item of chain) {
    switch (item.type) {
      case 'simple':
        current = item.selector ? current.locator(item.selector) : current;
        break;
      case 'template':
        current = current.locator(item.selector(item.argument));
        break;
      case 'native':
        current = item.selector({
          driver: world.playwright.driver,
          browser: world.playwright.browser,
          context: world.playwright.context,
          page: world.playwright.page,
          parent: current,
          argument: item.argument,
        });
        break;
      default:
        throw new Error(`Unsupported page object selector type '${item.type}' for alias '${alias}'`);
    }
  }

  return current;
}

async function waitForAssertion(assertion, timeoutMs = 15_000, intervalMs = 250) {
  const startedAt = Date.now();
  let lastError = null;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      await assertion();
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  throw lastError ?? new Error('Timed out while waiting for assertion to pass');
}

function getProofProjectFromLastPayload() {
  assert.ok(Array.isArray(lastApiPayload), 'Expected the latest API payload to be an array of public projects');

  const proofProject = lastApiPayload.find((project) => project?.name === PROOF_PROJECT_NAME);
  assert.ok(proofProject, `Could not find proof project '${PROOF_PROJECT_NAME}' in latest API payload`);

  return proofProject;
}

Given('the backend root endpoint is reachable', async function () {
  const response = await fetch(`${BACKEND_URL}/`);
  assert.equal(response.status, 200, `Expected backend root to respond with 200, received ${response.status}`);

  const payload = await response.json();
  assert.equal(payload.message, 'Welcome to Projojo Backend API');
});

Given('the TypeDB status endpoint reports a connected database', async function () {
  const response = await fetch(`${BACKEND_URL}/typedb/status`);
  assert.equal(response.status, 200, `Expected TypeDB status endpoint to respond with 200, received ${response.status}`);

  const payload = await response.json();
  assert.equal(payload.status, 'connected', `Expected TypeDB status to be 'connected', received '${payload.status}'`);
});

Given('the frontend login shell is reachable', async function () {
  const response = await fetch(LOGIN_URL);
  assert.equal(response.status, 200, `Expected frontend login shell to respond with 200, received ${response.status}`);

  const html = await response.text();
  assert.match(html, /<div id="root"><\/div>|<div id="root">\s*<\/div>/, 'Expected the frontend login shell to return the Vite application root');
});

When('I request the public projects API', async function () {
  const response = await fetch(`${BACKEND_URL}/projects/public`, {
    headers: {
      Accept: 'application/json',
    },
  });

  lastApiStatus = response.status;
  lastApiPayload = await response.json();
});

Then('the latest API response status should be {int}', function (expectedStatus) {
  assert.equal(lastApiStatus, expectedStatus, `Expected latest API status to be ${expectedStatus}, received ${lastApiStatus}`);
});

Then('the latest public projects response should include project {string}', function (expectedProjectName) {
  assert.ok(Array.isArray(lastApiPayload), 'Expected the latest API payload to be an array of public projects');
  assert.ok(
    lastApiPayload.some((project) => project?.name === expectedProjectName),
    `Expected latest public projects response to include project '${expectedProjectName}'`,
  );
});

Then('the latest public projects response should include business {string}', function (expectedBusinessName) {
  assert.ok(Array.isArray(lastApiPayload), 'Expected the latest API payload to be an array of public projects');
  assert.ok(
    lastApiPayload.some((project) => project?.business?.name === expectedBusinessName),
    `Expected latest public projects response to include business '${expectedBusinessName}'`,
  );
});

Then('the latest public projects response should include seed marker {string}', function (expectedMarker) {
  const proofProject = getProofProjectFromLastPayload();
  assert.equal(
    proofProject.impact_summary,
    expectedMarker,
    `Expected proof project to expose seed marker '${expectedMarker}', received '${proofProject.impact_summary}'`,
  );
});

When('I remember the proof project id as {string}', function (memoryKey) {
  memory.setValue(memoryKey, getProofProjectFromLastPayload().id);
});

When('I remember the proof project name as {string}', function (memoryKey) {
  memory.setValue(memoryKey, getProofProjectFromLastPayload().name);
});

When('I remember the proof business name as {string}', function (memoryKey) {
  memory.setValue(memoryKey, getProofProjectFromLastPayload().business?.name ?? '');
});

Then('memory key {string} should not be empty', function (memoryKey) {
  const value = memory.getValue(memoryKey);
  assert.ok(value, `Expected memory key '${memoryKey}' to contain a value`);
  assert.notEqual(String(value).trim(), '', `Expected memory key '${memoryKey}' not to be blank`);
});

When('I open browser url {string}', async function (url) {
  await this.playwright.page.goto(url);
});

When('I click named element {string}', async function (alias) {
  const target = getNamedTarget(this, alias);
  await target.click();
});

Then('{string} should be visible', async function (alias) {
  const target = getNamedTarget(this, alias);
  await waitForAssertion(async () => {
    assert.equal(await target.isVisible(), true, 'Expected locator to be visible');
  });
});

Then('{string} text should equal {string}', async function (alias, expectedText) {
  const target = getNamedTarget(this, alias);
  await waitForAssertion(async () => {
    const actualText = normalizeText(await target.innerText());
    assert.equal(actualText, expectedText, `Expected text '${expectedText}', received '${actualText}'`);
  });
});

Then('{string} should contain text {string}', async function (alias, expectedText) {
  const target = getNamedTarget(this, alias);
  await waitForAssertion(async () => {
    const actualText = normalizeText(await target.innerText());
    assert.ok(
      actualText.includes(expectedText),
      `Expected text to contain '${expectedText}', received '${actualText}'`,
    );
  });
});

Then('{string} should contain remembered value {string}', async function (alias, memoryKey) {
  const target = getNamedTarget(this, alias);
  const expectedValue = String(memory.getValue(`$${memoryKey}`) ?? '');
  assert.notEqual(expectedValue.trim(), '', `Expected memory key '${memoryKey}' to contain a non-empty value`);

  await waitForAssertion(async () => {
    const actualText = normalizeText(await target.innerText());
    assert.ok(
      actualText.includes(expectedValue),
      `Expected text to contain remembered value '${expectedValue}', received '${actualText}'`,
    );
  });
});
