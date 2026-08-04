const assert = require('node:assert/strict');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const { Given, Then, When } = require('@qavajs/core');

const { BACKEND_URL, PORTFOLIO_SEED_ALIASES } = require('../support/test-data.cjs');

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
const studentId = actors.student.id;

const ITEM_ID = 'pf-task-008-item';

// The dedicated fixture item starts with two reviews, both rated three or higher so the item
// is visible to the related supervisor before any edit. Baseline text/rating are asserted by
// the "unchanged" and "rating should be" steps, so they must match the reset script exactly.
const REVIEWS = Object.freeze({
  supervisor: Object.freeze({ id: 'pf-task-008-review-supervisor', baselineText: 'Begeleiderreview startwaarde voor PF-task-008.', baselineRating: 5, authorId: actors.relatedSupervisor.id }),
  teacher: Object.freeze({ id: 'pf-task-008-review-teacher', baselineText: 'Docentreview startwaarde voor PF-task-008.', baselineRating: 3, authorId: actors.teacher.id }),
});

const actorAliases = Object.freeze({
  'portfolio teacher': actors.teacher,
  'related portfolio supervisor': actors.relatedSupervisor,
  'unrelated portfolio supervisor': actors.unrelatedSupervisor,
  'portfolio owner student': actors.student,
});

// Deletes any prior PF-task-008 fixture, then inserts the dedicated item, its ownership, and
// two starting reviews with their author relations. Idempotent so it can run before every
// scenario. The item is sourced from the related business so a same-business supervisor may
// add reviews, and both starting ratings are >= 3 so the item begins supervisor-visible.
const RESET_FIXTURES = String.raw`
from db.initDatabase import Db

# Delete every review currently attached to the fixture item (including any additional reviews
# added by earlier scenarios through the API), then the item and its ownership. Traversing the
# item's review links rather than fixed ids keeps the reset idempotent across reruns.
Db.write_transact("""
match
  $item isa portfolioItem, has id ~item_id;
  $review_link isa hasPortfolioReview (item: $item, review: $review);
  $author_link isa portfolioReviewAuthor (review: $review, author: $author);
delete
  $author_link;
  $review_link;
  $review;
""", {"item_id": "pf-task-008-item"})

Db.write_transact("""
match
  $item isa portfolioItem, has id ~item_id;
  $ownership isa hasPortfolio (student: $student, item: $item);
delete
  $ownership;
  $item;
""", {"item_id": "pf-task-008-item"})

Db.write_transact("""
match
  $student isa student, has id "20000000-0000-4000-8000-000000000002";
  $supervisor isa supervisor, has id "20000000-0000-4000-8000-000000000003";
  $teacher isa teacher, has id "20000000-0000-4000-8000-000000000001";
insert
  $item isa portfolioItem,
    has id "pf-task-008-item",
    has createdAt 2026-03-10T17:05:00.000+0000,
    has completedAt 2026-03-10T17:00:00.000+0000,
    has sourceStudentId "20000000-0000-4000-8000-000000000002",
    has sourceRegistrationId "pf-task-008-registration",
    has sourceTaskId "50000000-0000-4000-8000-000000000001",
    has sourceProjectId "40000000-0000-4000-8000-000000000001",
    has sourceBusinessId "30000000-0000-4000-8000-000000000001",
    has studentName "Tom Teststudent",
    has studentImagePath "default.svg",
    has taskName "Infrastructure Proof Task",
    has taskDescription "PF-task-008 review edit fixture item.",
    has projectName "E2E Infrastructure Proof Project",
    has projectDescription "Portfolio seed project display copy.",
    has businessName "E2E Infrastructure Business",
    has businessLocation "Arnhem",
    has skillName "Deterministisch Testen",
    has timelineStartDate 2026-01-20T09:00:00.000+0000,
    has timelineEndDate 2026-03-10T17:00:00.000+0000,
    has isRetired false,
    has isHidden false,
    has displayOrder 20,
    has isAuthenticatedPublicRetraction false,
    has isWorldVisible false,
    has sourceTaskArchived false,
    has sourceProjectArchived false,
    has sourceBusinessArchived false;
  $ownership isa hasPortfolio (student: $student, item: $item);
  $review_sup isa portfolioReview,
    has id "pf-task-008-review-supervisor",
    has reviewText "Begeleiderreview startwaarde voor PF-task-008.",
    has rating 5,
    has createdAt 2026-03-10T18:00:00.000+0000,
    has updatedAt 2026-03-10T18:00:00.000+0000,
    has isWorldVisible false,
    has publicNoticeAcceptedAt 2026-03-10T18:00:00.000+0000;
  $review_teach isa portfolioReview,
    has id "pf-task-008-review-teacher",
    has reviewText "Docentreview startwaarde voor PF-task-008.",
    has rating 3,
    has createdAt 2026-03-10T18:30:00.000+0000,
    has updatedAt 2026-03-10T18:30:00.000+0000,
    has isWorldVisible false,
    has publicNoticeAcceptedAt 2026-03-10T18:30:00.000+0000;
  $link_sup isa hasPortfolioReview (item: $item, review: $review_sup);
  $link_teach isa hasPortfolioReview (item: $item, review: $review_teach);
  $author_sup isa portfolioReviewAuthor (review: $review_sup, author: $supervisor);
  $author_teach isa portfolioReviewAuthor (review: $review_teach, author: $teacher);
""")

print("PF_TASK_008_RESET_OK")
`;

// Reads one review's persisted fields by id (text, rating, updatedAt, author id).
const REVIEW_BY_ID_PROBE = String.raw`
import json
import os

from db.initDatabase import Db

rows = Db.read_transact("""
match
  $review isa portfolioReview, has id ~review_id, has reviewText $text, has updatedAt $updated_at;
  $author_link isa portfolioReviewAuthor (review: $review, author: $author);
  $author has id $author_id;
fetch {
  'review_text': $text,
  'rating': [$review.rating],
  'updated_at': $updated_at,
  'author_id': $author_id
};
""", {'review_id': os.environ['PF_TASK_008_REVIEW_ID']}, sort_fields=False)

print(json.dumps(rows, default=str))
Db.close()
`;

// Reads reviews by their exact review text (used to confirm creation persistence and author).
const REVIEW_BY_TEXT_PROBE = String.raw`
import json
import os

from db.initDatabase import Db

rows = Db.read_transact("""
match
  $review isa portfolioReview, has id $id, has reviewText ~review_text;
  $author_link isa portfolioReviewAuthor (review: $review, author: $author);
  $author has id $author_id;
fetch {
  'id': $id,
  'author_id': $author_id,
  'public_notice_accepted_at': [$review.publicNoticeAcceptedAt]
};
""", {'review_text': os.environ['PF_TASK_008_REVIEW_TEXT']}, sort_fields=False)

print(json.dumps(rows, default=str))
Db.close()
`;

// Counts the reviews currently attached to the dedicated fixture item.
const REVIEW_COUNT_PROBE = String.raw`
import json

from db.initDatabase import Db

rows = Db.read_transact("""
match
  $item isa portfolioItem, has id ~item_id;
  $review_link isa hasPortfolioReview (item: $item, review: $review);
fetch { 'id': $review.id };
""", {'item_id': 'pf-task-008-item'}, sort_fields=False)

print(json.dumps({'count': len(rows)}))
Db.close()
`;

function getState(world) {
  world.pfTask008 = world.pfTask008 ?? {};
  return world.pfTask008;
}

function reviewFor(name) {
  const review = REVIEWS[name];
  assert.ok(review, `Unknown PF-task-008 review fixture '${name}'`);
  return review;
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

async function runBackendScript(script, env = {}) {
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
    { cwd: REPO_ROOT, env: { ...process.env, ...env }, maxBuffer: 1024 * 1024 * 10 },
  );
  const jsonLine = stdout.split(/\r?\n/u).map((line) => line.trim()).filter(Boolean).at(-1);
  assert.ok(jsonLine, `Expected PF-task-008 backend script to write output. stderr: ${stderr}`);
  return jsonLine;
}

async function runBackendProbe(script, env = {}) {
  return JSON.parse(await runBackendScript(script, env));
}

async function readReviewById(reviewId) {
  const rows = await runBackendProbe(REVIEW_BY_ID_PROBE, { PF_TASK_008_REVIEW_ID: reviewId });
  assert.equal(rows.length, 1, `Expected exactly one persisted review with id '${reviewId}', found ${rows.length}`);
  const row = rows[0];
  const rating = Array.isArray(row.rating) ? row.rating[0] : row.rating;
  return {
    reviewText: Array.isArray(row.review_text) ? row.review_text[0] : row.review_text,
    rating: rating === undefined ? null : rating,
    updatedAt: Array.isArray(row.updated_at) ? row.updated_at[0] : row.updated_at,
    authorId: Array.isArray(row.author_id) ? row.author_id[0] : row.author_id,
  };
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
}

function rememberResponse(world, response, payload) {
  Object.assign(getState(world), { lastApiStatus: response.status, lastApiPayload: payload });
}

async function submitAdditionalReview(world, body) {
  const authToken = getState(world).authToken;
  assert.ok(authToken, 'Expected authentication before submitting an additional review');
  const response = await fetch(`${BACKEND_URL}/portfolio-items/${ITEM_ID}/reviews`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
    body: JSON.stringify(body),
  });
  rememberResponse(world, response, await readJsonSafely(response));
}

async function editReview(world, reviewName, body, { authenticate = true } = {}) {
  const review = reviewFor(reviewName);
  // Capture the pre-edit state so the "updated timestamp changed" and "unchanged" assertions
  // compare against the real prior value rather than an assumed constant.
  getState(world).priorReview = await readReviewById(review.id);
  const headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (authenticate) {
    const authToken = getState(world).authToken;
    assert.ok(authToken, 'Expected authentication before editing a review');
    headers.Authorization = `Bearer ${authToken}`;
  }
  const response = await fetch(`${BACKEND_URL}/portfolio-reviews/${review.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  rememberResponse(world, response, await readJsonSafely(response));
}

async function relatedSupervisorSeesItem(world) {
  const authToken = getState(world).authToken;
  assert.ok(authToken, 'Expected the related supervisor to be authenticated');
  const response = await fetch(`${BACKEND_URL}/portfolios/students/${studentId}`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${authToken}` },
  });
  const payload = await readJsonSafely(response);
  assert.equal(response.status, 200, `Expected supervisor portfolio read to return 200, received ${response.status}: ${JSON.stringify(payload)}`);
  assert.equal(payload.viewer_role, 'supervisor', `Expected supervisor viewer role, received '${payload.viewer_role}'`);
  return (payload.items ?? []).some((item) => item.id === ITEM_ID);
}

Given('the PF-task-008 review fixtures are reset', async function () {
  const output = await runBackendScript(RESET_FIXTURES);
  assert.equal(output, 'PF_TASK_008_RESET_OK', `Expected PF-task-008 fixtures to reset, received: ${output}`);
  this.pfTask008 = {};
});

Given(/^I am authenticated as the PF-task-008 (.+)$/u, async function (actorName) {
  const actor = actorAliases[actorName];
  assert.ok(actor, `Unknown PF-task-008 actor '${actorName}'`);
  await loginAs(this, actor);
});

Given('I remember unique PF-task-008 review text for {string}', function (purpose) {
  getState(this).reviewText = `PF-task-008 ${purpose} ${Date.now()} ${Math.random().toString(16).slice(2)}`;
});

When('I submit a PF-task-008 additional review with an accepted notice and rating {int}', async function (rating) {
  await submitAdditionalReview(this, { review_text: getState(this).reviewText, rating, public_review_notice_accepted: true });
});

When('I submit a PF-task-008 additional review with review text {string} and an accepted notice', async function (reviewText) {
  await submitAdditionalReview(this, { review_text: reviewText, rating: 4, public_review_notice_accepted: true });
});

When('I submit a PF-task-008 additional review with whitespace-only text and an accepted notice', async function () {
  await submitAdditionalReview(this, { review_text: '   ', rating: 4, public_review_notice_accepted: true });
});

When('I submit a PF-task-008 additional review with notice {string} and rating {int}', async function (notice, rating) {
  const body = { review_text: getState(this).reviewText, rating };
  if (notice === 'false') body.public_review_notice_accepted = false;
  // notice === "missing": omit the field entirely
  await submitAdditionalReview(this, body);
});

When('I edit the PF-task-008 {string} review with text {string} and rating {int}', async function (reviewName, text, rating) {
  await editReview(this, reviewName, { review_text: text, rating });
});

When('I edit the PF-task-008 {string} review with rating {int}', async function (reviewName, rating) {
  await editReview(this, reviewName, { rating });
});

When('I remove the rating from the PF-task-008 {string} review', async function (reviewName) {
  await editReview(this, reviewName, { rating: null });
});

When('I edit the PF-task-008 {string} review without authentication', async function (reviewName) {
  await editReview(this, reviewName, { review_text: 'Anonieme poging.', rating: 1 }, { authenticate: false });
});

When('I edit the PF-task-008 {string} review with a null review text', async function (reviewName) {
  await editReview(this, reviewName, { review_text: null });
});

When('I edit the PF-task-008 {string} review with an empty body', async function (reviewName) {
  await editReview(this, reviewName, {});
});

When('I edit a non-existent PF-task-008 review', async function () {
  const authToken = getState(this).authToken;
  assert.ok(authToken, 'Expected authentication before editing a review');
  const response = await fetch(`${BACKEND_URL}/portfolio-reviews/pf-task-008-missing-review`, {
    method: 'PATCH',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ rating: 4 }),
  });
  rememberResponse(this, response, await readJsonSafely(response));
});

Then('the latest PF-task-008 API response status should be {int}', function (expectedStatus) {
  const { lastApiStatus, lastApiPayload } = getState(this);
  assert.equal(lastApiStatus, expectedStatus, `Expected status ${expectedStatus}, received ${lastApiStatus}: ${JSON.stringify(lastApiPayload)}`);
});

Then(/^the persisted PF-task-008 review for the remembered text should be authored by the (.+)$/u, async function (actorName) {
  const expectedActor = actorAliases[actorName];
  assert.ok(expectedActor, `Unknown PF-task-008 actor '${actorName}'`);
  const rows = await runBackendProbe(REVIEW_BY_TEXT_PROBE, { PF_TASK_008_REVIEW_TEXT: getState(this).reviewText });
  assert.equal(rows.length, 1, `Expected exactly one persisted review for the remembered text, found ${rows.length}`);
  assert.equal(rows[0].author_id, expectedActor.id, `Expected review author '${expectedActor.id}', received '${rows[0].author_id}'`);
});

Then('the persisted PF-task-008 review for the remembered text should store a public notice accepted timestamp', async function () {
  const rows = await runBackendProbe(REVIEW_BY_TEXT_PROBE, { PF_TASK_008_REVIEW_TEXT: getState(this).reviewText });
  assert.equal(rows.length, 1, `Expected exactly one persisted review for the remembered text, found ${rows.length}`);
  const acceptedAt = Array.isArray(rows[0].public_notice_accepted_at) ? rows[0].public_notice_accepted_at[0] : rows[0].public_notice_accepted_at;
  assert.equal(typeof acceptedAt, 'string', `Expected a public notice accepted timestamp, received ${JSON.stringify(acceptedAt)}`);
});

Then('no PF-task-008 review should be persisted for the remembered text', async function () {
  const rows = await runBackendProbe(REVIEW_BY_TEXT_PROBE, { PF_TASK_008_REVIEW_TEXT: getState(this).reviewText });
  assert.deepEqual(rows, [], `Expected no persisted review for the remembered text, found ${JSON.stringify(rows)}`);
});

Then('the PF-task-008 item should have {int} reviews', async function (expectedCount) {
  const { count } = await runBackendProbe(REVIEW_COUNT_PROBE);
  assert.equal(count, expectedCount, `Expected the item to have ${expectedCount} reviews, found ${count}`);
});

Then('the PF-task-008 {string} review text should be {string}', async function (reviewName, expectedText) {
  const review = await readReviewById(reviewFor(reviewName).id);
  assert.equal(review.reviewText, expectedText, `Expected review text '${expectedText}', received '${review.reviewText}'`);
});

Then('the PF-task-008 {string} review text should be unchanged', async function (reviewName) {
  const fixture = reviewFor(reviewName);
  const review = await readReviewById(fixture.id);
  assert.equal(review.reviewText, fixture.baselineText, `Expected review text to remain '${fixture.baselineText}', received '${review.reviewText}'`);
});

Then('the PF-task-008 {string} review rating should be {int}', async function (reviewName, expectedRating) {
  const review = await readReviewById(reviewFor(reviewName).id);
  assert.equal(review.rating, expectedRating, `Expected review rating ${expectedRating}, received ${review.rating}`);
});

Then('the PF-task-008 {string} review updated timestamp should have changed', async function (reviewName) {
  const prior = getState(this).priorReview;
  assert.ok(prior?.updatedAt, 'Expected a captured pre-edit updated timestamp');
  const review = await readReviewById(reviewFor(reviewName).id);
  assert.notEqual(review.updatedAt, prior.updatedAt, `Expected updated timestamp to change from '${prior.updatedAt}'`);
  assert.ok(new Date(review.updatedAt) > new Date(prior.updatedAt), `Expected updated timestamp '${review.updatedAt}' to be later than '${prior.updatedAt}'`);
});

Then('the PF-task-008 item should be visible to the related supervisor', async function () {
  assert.equal(await relatedSupervisorSeesItem(this), true, 'Expected the item to be visible to the related supervisor');
});

Then('the PF-task-008 item should not be visible to the related supervisor', async function () {
  assert.equal(await relatedSupervisorSeesItem(this), false, 'Expected the item to be hidden from the related supervisor');
});
