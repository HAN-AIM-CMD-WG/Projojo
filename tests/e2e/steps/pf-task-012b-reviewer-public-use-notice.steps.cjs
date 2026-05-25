const assert = require('node:assert/strict');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const { Given, Then, When } = require('@qavajs/core');

const {
  BACKEND_URL,
  FRONTEND_URL,
  PROOF_PROJECT_ID,
  PORTFOLIO_SEED_ALIASES,
} = require('../support/test-data.cjs');

const execFileAsync = promisify(execFile);
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const DOCKER_COMPOSE_ARGS = [
  'compose',
  '--env-file',
  '.env.test',
  '-p',
  'projojo-e2e',
  '-f',
  'docker-compose.base.yml',
  '-f',
  'docker-compose.test.yml',
];

const actors = PORTFOLIO_SEED_ALIASES.actors;
const businesses = PORTFOLIO_SEED_ALIASES.businesses;
const lifecycle = PORTFOLIO_SEED_ALIASES.lifecycle;
const items = PORTFOLIO_SEED_ALIASES.items;
const studentId = actors.student.id;

const actorAliases = Object.freeze({
  'portfolio teacher': actors.teacher,
  'related portfolio supervisor': actors.relatedSupervisor,
});

const RESET_REVIEW_NOTICE_FIXTURES = String.raw`
from db.initDatabase import Db

for registration_id in [
    "pf-task-004-started-for-completion",
    "pf-task-004-supervisor-completion-allowed",
]:
    Db.write_transact(f"""
match
  $item isa portfolioItem, has sourceRegistrationId "{registration_id}";
  $review_link isa hasPortfolioReview (item: $item, review: $review);
  $author_link isa portfolioReviewAuthor (review: $review, author: $author);
delete
  $author_link;
  $review_link;
  $review;
""")
    Db.write_transact(f"""
match
  $item isa portfolioItem, has sourceRegistrationId "{registration_id}";
  $ownership isa hasPortfolio (student: $student, item: $item);
delete
  $ownership;
  $item;
""")
    Db.write_transact(f"""
match
  $registration isa registersForTask, has id "{registration_id}", has completedAt $completed_at;
delete
  has $completed_at of $registration;
""")
`;

const COMPLETION_STATE_PROBE = String.raw`
import json
import os

from db.initDatabase import Db

fixture = json.loads(os.environ['PF_TASK_012B_FIXTURE'])

rows = Db.read_transact("""
match
  $task isa task, has id ~task_id;
  $student isa student, has id ~student_id;
  $registration isa registersForTask (student: $student, task: $task), has id ~registration_id;
fetch {
  'completed_at': [$registration.completedAt]
};
""", {
  'task_id': fixture['taskId'],
  'student_id': fixture['studentId'],
  'registration_id': fixture['registrationId'],
}, sort_fields=False)

print(json.dumps(rows, default=str))
`;

const REVIEW_TEXT_PROBE = String.raw`
import json
import os

from db.initDatabase import Db

review_text = os.environ['PF_TASK_012B_REVIEW_TEXT']

rows = Db.read_transact("""
match
  $review isa portfolioReview, has id $id, has reviewText ~review_text;
  $review_link isa hasPortfolioReview (item: $item, review: $review);
  $item has id $item_id;
  $author_link isa portfolioReviewAuthor (review: $review, author: $author);
  $author has id $author_id;
fetch {
  'id': $id,
  'item_id': $item_id,
  'public_notice_accepted_at': [$review.publicNoticeAcceptedAt],
  'author_id': $author_id
};
""", {'review_text': review_text}, sort_fields=False)

print(json.dumps(rows, default=str))
`;

const RETIRED_REVIEW_RACE_PROBE = String.raw`
import json
import os

from db.initDatabase import Db
from domain.repositories.portfolio_repository import PortfolioRepository

item_id = os.environ['PF_TASK_012B_ITEM_ID']
author_id = os.environ['PF_TASK_012B_AUTHOR_ID']
business_id = os.environ['PF_TASK_012B_BUSINESS_ID']
review_text = os.environ['PF_TASK_012B_REVIEW_TEXT']

repo = PortfolioRepository()
repo._get_reviewable_item_state = lambda stale_item_id: {'business_id': business_id, 'is_retired': False}

try:
    repo.create_review(
        item_id=item_id,
        author_id=author_id,
        author_role='teacher',
        business_id=None,
        review_text=review_text,
        public_review_notice_accepted=True,
        rating=4,
    )
    result = {'failed_as_expected': False, 'error': None}
except Exception as error:
    result = {'failed_as_expected': True, 'error': str(error)}
finally:
    review_rows = Db.read_transact("""
    match
      $review isa portfolioReview, has reviewText ~review_text;
    fetch { 'id': $review.id };
    """, {'review_text': review_text}, sort_fields=False)
    result['review_persisted'] = bool(review_rows)
    Db.close()

print(json.dumps(result))
`;

function getState(world) {
  world.pfTask012b = world.pfTask012b ?? {};
  return world.pfTask012b;
}

function rememberLatestApiResponse(world, response, payload) {
  Object.assign(getState(world), {
    lastApiStatus: response.status,
    lastApiPayload: payload,
  });
}

function latestApiResponse(world) {
  assert.notEqual(getState(world).lastApiStatus, undefined, 'Expected a PF-task-012b API response to have been recorded');
  return getState(world);
}

function fixtureFor(name) {
  const fixture = lifecycle[name];
  assert.ok(fixture, `Unknown PF-task-012b lifecycle fixture '${name}'`);
  return fixture;
}

function itemFor(name) {
  const item = items[name];
  assert.ok(item, `Unknown PF-task-012b portfolio item fixture '${name}'`);
  return item;
}

function noticePayloadValue(notice) {
  if (notice === 'accepted') return true;
  if (notice === 'false') return false;
  if (notice === 'missing') return undefined;
  throw new Error(`Unknown PF-task-012b notice state '${notice}'`);
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
  Object.assign(getState(world), { authToken: payload.access_token, actor });
  return payload.access_token;
}

function getAuthToken(world, actionDescription) {
  const authToken = getState(world).authToken;
  assert.ok(authToken, `Expected authentication token before ${actionDescription}`);
  return authToken;
}

async function resetReviewNoticeFixtures() {
  await execFileAsync(
    'docker',
    [
      ...DOCKER_COMPOSE_ARGS,
      'exec',
      '-T',
      'backend',
      'uv',
      'run',
      'python',
      '-c',
      RESET_REVIEW_NOTICE_FIXTURES,
    ],
    {
      cwd: REPO_ROOT,
      env: process.env,
      maxBuffer: 1024 * 1024 * 10,
    },
  );
}

async function runBackendProbe(script, env) {
  const { stdout, stderr } = await execFileAsync(
    'docker',
    [
      ...DOCKER_COMPOSE_ARGS,
      'exec',
      '-T',
      ...Object.entries(env).flatMap(([key, value]) => ['-e', `${key}=${value}`]),
      'backend',
      'uv',
      'run',
      'python',
      '-c',
      script,
    ],
    {
      cwd: REPO_ROOT,
      env: { ...process.env, ...env },
      maxBuffer: 1024 * 1024 * 10,
    },
  );

  const jsonLine = stdout.split(/\r?\n/u).map((line) => line.trim()).filter(Boolean).at(-1);
  assert.ok(jsonLine, `Expected PF-task-012b backend probe to write JSON. stderr: ${stderr}`);
  return JSON.parse(jsonLine);
}

async function readCompletionState(fixtureName) {
  const fixture = fixtureFor(fixtureName);
  const rows = await runBackendProbe(COMPLETION_STATE_PROBE, {
    PF_TASK_012B_FIXTURE: JSON.stringify({ ...fixture, studentId }),
  });
  assert.equal(rows.length, 1, `Expected one completion state row for ${fixtureName}`);
  return rows[0];
}

async function readReviewsForRememberedText(world) {
  const reviewText = getState(world).reviewText;
  assert.ok(reviewText, 'Expected PF-task-012b review text to be remembered');
  return runBackendProbe(REVIEW_TEXT_PROBE, { PF_TASK_012B_REVIEW_TEXT: reviewText });
}

function buildReviewBody(world, notice, rating = 4) {
  const accepted = noticePayloadValue(notice);
  const body = {
    review_text: getState(world).reviewText,
    rating,
  };
  if (accepted !== undefined) body.public_review_notice_accepted = accepted;
  return body;
}

async function clickTaskTeamButton(page, fixtureName, buttonName) {
  const fixture = fixtureFor(fixtureName);
  const taskCard = page.getByTestId(`task-card-${fixture.taskId}`);
  await taskCard.waitFor({ state: 'visible' });
  await taskCard.getByRole('button', { name: /Team/u }).click();
  await taskCard.getByRole('button', { name: buttonName }).click();
}

function completionDialog(page) {
  return page.getByRole('dialog', { name: 'Afronding' });
}

Given('the PF-task-012b review notice fixtures are reset', async function () {
  await resetReviewNoticeFixtures();
  this.pfTask012b = {};
});

Given('I am authenticated as the PF-task-012b {word} {word}', async function (first, second) {
  const actorName = `${first} ${second}`;
  await loginAs(this, actorAliases[actorName]);
});

Given('I am authenticated as the PF-task-012b {word} {word} {word}', async function (first, second, third) {
  const actorName = `${first} ${second} ${third}`;
  await loginAs(this, actorAliases[actorName]);
});

Given('I remember unique PF-task-012b review text for {string}', function (purpose) {
  getState(this).reviewText = `PF-task-012b ${purpose} ${Date.now()} ${Math.random().toString(16).slice(2)}`;
});

Given('I am authenticated in the browser as the PF-task-012b related portfolio supervisor', async function () {
  const token = await loginAs(this, actors.relatedSupervisor);
  await this.playwright.page.goto(FRONTEND_URL);
  await this.playwright.page.evaluate((authToken) => localStorage.setItem('token', authToken), token);
});

When('I submit a PF-task-012b completion review for {string} with notice {string}', async function (fixtureName, notice) {
  const fixture = fixtureFor(fixtureName);
  const authToken = getAuthToken(this, 'submitting a completion review');
  const response = await fetch(`${BACKEND_URL}/tasks/${fixture.taskId}/registrations/${studentId}/complete`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(buildReviewBody(this, notice)),
  });

  const payload = await readJsonSafely(response);
  if (payload?.portfolio_item_id) getState(this).completionItemId = payload.portfolio_item_id;
  rememberLatestApiResponse(this, response, payload);
});

When('I submit a PF-task-012b completion review for {string} with notice {string} and rating {int}', async function (fixtureName, notice, rating) {
  const fixture = fixtureFor(fixtureName);
  const authToken = getAuthToken(this, 'submitting a completion review with a rating');
  const response = await fetch(`${BACKEND_URL}/tasks/${fixture.taskId}/registrations/${studentId}/complete`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(buildReviewBody(this, notice, rating)),
  });

  rememberLatestApiResponse(this, response, await readJsonSafely(response));
});

When('I submit a PF-task-012b completion rating without review text for {string}', async function (fixtureName) {
  const fixture = fixtureFor(fixtureName);
  const authToken = getAuthToken(this, 'submitting a completion rating without review text');
  const response = await fetch(`${BACKEND_URL}/tasks/${fixture.taskId}/registrations/${studentId}/complete`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ rating: 4 }),
  });

  rememberLatestApiResponse(this, response, await readJsonSafely(response));
});

When('I revert the PF-task-012b completion for {string}', async function (fixtureName) {
  const fixture = fixtureFor(fixtureName);
  const authToken = getAuthToken(this, 'reverting a completion');
  const response = await fetch(`${BACKEND_URL}/tasks/${fixture.taskId}/registrations/${studentId}/revert-completion`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
  });

  rememberLatestApiResponse(this, response, await readJsonSafely(response));
});

When('I submit a PF-task-012b additional review for {string} with notice {string}', async function (itemName, notice) {
  const item = itemFor(itemName);
  const authToken = getAuthToken(this, 'submitting an additional review');
  const response = await fetch(`${BACKEND_URL}/portfolio-items/${item.id}/reviews`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(buildReviewBody(this, notice)),
  });

  rememberLatestApiResponse(this, response, await readJsonSafely(response));
});

When('I submit a PF-task-012b additional review for the remembered retired completion item with notice {string}', async function (notice) {
  const itemId = getState(this).completionItemId;
  assert.ok(itemId, 'Expected a remembered PF-task-012b completion portfolio item id');
  const authToken = getAuthToken(this, 'submitting an additional review for retired evidence');
  const response = await fetch(`${BACKEND_URL}/portfolio-items/${itemId}/reviews`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(buildReviewBody(this, notice)),
  });

  rememberLatestApiResponse(this, response, await readJsonSafely(response));
});

When('PF-task-012b review creation races with retirement for the remembered completion item', async function () {
  const itemId = getState(this).completionItemId;
  assert.ok(itemId, 'Expected a remembered PF-task-012b completion portfolio item id');
  getState(this).raceResult = await runBackendProbe(RETIRED_REVIEW_RACE_PROBE, {
    PF_TASK_012B_ITEM_ID: itemId,
    PF_TASK_012B_AUTHOR_ID: actors.teacher.id,
    PF_TASK_012B_BUSINESS_ID: businesses.related.id,
    PF_TASK_012B_REVIEW_TEXT: getState(this).reviewText,
  });
});

When('I submit a PF-task-012b additional review for {string} with notice {string} and rating {int}', async function (itemName, notice, rating) {
  const item = itemFor(itemName);
  const authToken = getAuthToken(this, 'submitting an additional review with a rating');
  const response = await fetch(`${BACKEND_URL}/portfolio-items/${item.id}/reviews`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(buildReviewBody(this, notice, rating)),
  });

  rememberLatestApiResponse(this, response, await readJsonSafely(response));
});

When('I open the PF-task-012b completion dialog for {string}', async function (fixtureName) {
  await this.playwright.page.goto(`${FRONTEND_URL}/projects/${PROOF_PROJECT_ID}`);
  await clickTaskTeamButton(this.playwright.page, fixtureName, new RegExp(`Rond ${actors.student.fullName} af`, 'u'));
  await completionDialog(this.playwright.page).waitFor({ state: 'visible' });
});

When('I enter PF-task-012b completion review text', async function () {
  const reviewText = getState(this).reviewText ?? `PF-task-012b browser completion ${Date.now()} ${Math.random().toString(16).slice(2)}`;
  getState(this).reviewText = reviewText;
  await completionDialog(this.playwright.page).getByLabel('Reviewtekst').fill(reviewText);
});

When('I accept the PF-task-012b public-use notice', async function () {
  await completionDialog(this.playwright.page).getByLabel(/Ik accepteer/u).check();
});

When('I submit the PF-task-012b completion review form', async function () {
  const dialog = completionDialog(this.playwright.page);
  const submitButton = dialog.getByRole('button', { name: 'Review opslaan' });
  await submitButton.click();
  await dialog.waitFor({ state: 'hidden' });
});

Then('the PF-task-012b completion without review action should not be available', async function () {
  const dialog = completionDialog(this.playwright.page);
  const completeButton = dialog.getByRole('button', { name: 'Afronden zonder review' });
  await dialog.waitFor({ state: 'visible' });
  assert.equal(await completeButton.count(), 0, 'Expected supervisors not to see a completion-without-review action');
});

Then('the PF-task-012b race-safe review creation should fail without persisting a review', function () {
  const raceResult = getState(this).raceResult;
  assert.equal(raceResult?.failed_as_expected, true, `Expected race-safe review creation to fail, received ${JSON.stringify(raceResult)}`);
  assert.equal(raceResult.review_persisted, false, `Expected no raced review to persist, received ${JSON.stringify(raceResult)}`);
});

Then('the latest PF-task-012b API response status should be {int}', function (expectedStatus) {
  const { lastApiStatus, lastApiPayload } = latestApiResponse(this);
  assert.equal(
    lastApiStatus,
    expectedStatus,
    `Expected latest API status to be ${expectedStatus}, received ${lastApiStatus}: ${JSON.stringify(lastApiPayload)}`,
  );
});

Then('the PF-task-012b completion state for {string} should have a completed timestamp', async function (fixtureName) {
  const state = await readCompletionState(fixtureName);
  assert.equal(typeof state.completed_at?.[0], 'string', `Expected ${fixtureName} to have a completed timestamp`);
});

Then('the PF-task-012b completion state for {string} should not have a completed timestamp', async function (fixtureName) {
  const state = await readCompletionState(fixtureName);
  assert.deepEqual(state.completed_at, [], `Expected ${fixtureName} not to have a completed timestamp`);
});

Then('no PF-task-012b review should be persisted for the remembered text', async function () {
  const reviews = await readReviewsForRememberedText(this);
  assert.deepEqual(reviews, [], `Expected no persisted review for '${getState(this).reviewText}'`);
});

Then('no PF-task-012b visible portfolio review should be returned for the remembered text', async function () {
  const authToken = getAuthToken(this, 'reading the authenticated portfolio');
  const response = await fetch(`${BACKEND_URL}/portfolios/students/${studentId}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
  });
  const payload = await readJsonSafely(response);

  assert.equal(response.status, 200, `Expected portfolio read to return 200, received ${response.status}: ${JSON.stringify(payload)}`);
  const itemReviews = (payload.items ?? []).flatMap((item) => item.reviews ?? []);
  const allReviews = [...(payload.reviews ?? []), ...itemReviews];
  const visibleMatches = allReviews.filter((review) => review.review_text === getState(this).reviewText);
  assert.deepEqual(visibleMatches, [], `Expected no visible portfolio review for '${getState(this).reviewText}'`);
});

Then('the persisted PF-task-012b review should store a public notice accepted timestamp', async function () {
  const reviews = await readReviewsForRememberedText(this);
  assert.equal(reviews.length, 1, `Expected exactly one persisted review for '${getState(this).reviewText}'`);
  const noticeAcceptedAt = Array.isArray(reviews[0].public_notice_accepted_at)
    ? reviews[0].public_notice_accepted_at[0]
    : reviews[0].public_notice_accepted_at;
  assert.equal(typeof noticeAcceptedAt, 'string', 'Expected public_notice_accepted_at to be a timestamp');
  assert.equal(reviews[0].author_id, getState(this).actor.id, 'Expected the review author to be the authenticated reviewer');
});

Then('the PF-task-012b public-use notice should be displayed', async function () {
  const bodyText = await completionDialog(this.playwright.page).innerText();
  assert.match(
    bodyText,
    /student kan deze review later tonen op de openbare portfolio-pagina/i,
    'Expected concise public-use notice copy to be displayed',
  );
  assert.match(bodyText, /expliciet accepteren/i, 'Expected notice copy to require explicit acceptance');
});

Then('the PF-task-012b completion review submit button should be disabled', async function () {
  const submitButton = completionDialog(this.playwright.page).getByRole('button', { name: 'Review opslaan' });
  assert.equal(await submitButton.isDisabled(), true, 'Expected completion review submit button to be disabled');
});

Then('the PF-task-012b completion review submit button should be enabled', async function () {
  const submitButton = completionDialog(this.playwright.page).getByRole('button', { name: 'Review opslaan' });
  assert.equal(await submitButton.isEnabled(), true, 'Expected completion review submit button to be enabled');
});
