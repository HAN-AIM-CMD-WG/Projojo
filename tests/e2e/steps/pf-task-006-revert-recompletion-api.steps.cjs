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
const lifecycle = PORTFOLIO_SEED_ALIASES.lifecycle;
const studentId = actors.student.id;
const publicSlug = PORTFOLIO_SEED_ALIASES.publicSlugs.existing.slug;

const actorAliases = Object.freeze({
  'portfolio owner student': actors.student,
  'portfolio teacher': actors.teacher,
  'related portfolio supervisor': actors.relatedSupervisor,
});

const actionPaths = Object.freeze({
  'revert-start': 'revert-start',
  'revert-completion': 'revert-completion',
});

const RESET_FIXTURES = String.raw`
from db.initDatabase import Db

fixture_ids = [
    "pf-task-004-pending-start-rejected",
    "pf-task-004-accepted-for-start",
    "pf-task-004-started-for-revert",
    "pf-task-004-completed-start-rejected",
    "pf-task-004-started-for-completion",
    "pf-task-004-supervisor-completion-allowed",
]

for registration_id in fixture_ids:
    Db.write_transact(f'''
match
  $item isa portfolioItem, has sourceRegistrationId "{registration_id}";
  $review_link isa hasPortfolioReview (item: $item, review: $review);
  $author_link isa portfolioReviewAuthor (review: $review, author: $author);
delete
  $author_link;
  $review_link;
  $review;
''')
    Db.write_transact(f'''
match
  $item isa portfolioItem, has sourceRegistrationId "{registration_id}";
  $ownership isa hasPortfolio (student: $student, item: $item);
delete
  $ownership;
  $item;
''')

for attribute_type in ['isAccepted', 'response', 'acceptedAt', 'startedAt', 'completedAt']:
    Db.write_transact(f'''
match
  $registration isa registersForTask, has id $registration_id, has {attribute_type} $value;
  {{ $registration_id == "pf-task-004-pending-start-rejected"; }} or
  {{ $registration_id == "pf-task-004-accepted-for-start"; }} or
  {{ $registration_id == "pf-task-004-started-for-revert"; }} or
  {{ $registration_id == "pf-task-004-completed-start-rejected"; }} or
  {{ $registration_id == "pf-task-004-started-for-completion"; }} or
  {{ $registration_id == "pf-task-004-supervisor-completion-allowed"; }};
delete
  has $value of $registration;
''')

Db.write_transact('''
match
  $accepted_start isa registersForTask, has id "pf-task-004-accepted-for-start";
  $started_revert isa registersForTask, has id "pf-task-004-started-for-revert";
  $completed_start isa registersForTask, has id "pf-task-004-completed-start-rejected";
  $started_completion isa registersForTask, has id "pf-task-004-started-for-completion";
  $supervisor_completion isa registersForTask, has id "pf-task-004-supervisor-completion-allowed";
insert
  $accepted_start has isAccepted true;
  $accepted_start has response "Accepted for PF-task-006 revert coverage.";
  $accepted_start has acceptedAt 2026-01-21T11:00:00.000+0000;

  $started_revert has isAccepted true;
  $started_revert has response "Accepted for PF-task-006 revert coverage.";
  $started_revert has acceptedAt 2026-01-21T11:10:00.000+0000;
  $started_revert has startedAt 2026-01-22T09:10:00.000+0000;

  $completed_start has isAccepted true;
  $completed_start has response "Accepted for PF-task-006 revert coverage.";
  $completed_start has acceptedAt 2026-01-21T11:04:00.000+0000;
  $completed_start has startedAt 2026-01-22T09:04:00.000+0000;
  $completed_start has completedAt 2026-01-23T17:04:00.000+0000;

  $started_completion has isAccepted true;
  $started_completion has response "Accepted for PF-task-006 re-completion coverage.";
  $started_completion has acceptedAt 2026-01-21T11:06:00.000+0000;
  $started_completion has startedAt 2026-01-22T09:06:00.000+0000;

  $supervisor_completion has isAccepted true;
  $supervisor_completion has response "Accepted for PF-task-006 supervisor re-completion coverage.";
  $supervisor_completion has acceptedAt 2026-01-21T11:13:00.000+0000;
  $supervisor_completion has startedAt 2026-01-22T09:13:00.000+0000;
''')
`;

const SNAPSHOT_PROBE = String.raw`
import json
import os

from db.initDatabase import Db

fixture = json.loads(os.environ['PF_TASK_006_FIXTURE'])

timeline = Db.read_transact("""
match
  $task isa task, has id ~task_id;
  $student isa student, has id ~student_id;
  $registration isa registersForTask (student: $student, task: $task), has id ~registration_id;
fetch {
  'requested_at': [$registration.requestedAt],
  'accepted_at': [$registration.acceptedAt],
  'started_at': [$registration.startedAt],
  'completed_at': [$registration.completedAt],
  'is_accepted': [$registration.isAccepted]
};
""", {
  'task_id': fixture['taskId'],
  'student_id': fixture['studentId'],
  'registration_id': fixture['registrationId'],
}, sort_fields=False)

items = Db.read_transact("""
match
  $student isa student, has id ~student_id;
  $item isa portfolioItem,
    has sourceRegistrationId ~registration_id,
    has id $id,
    has isRetired $is_retired;
  $ownership isa hasPortfolio (student: $student, item: $item);
fetch {
  'id': $id,
  'is_retired': $is_retired,
  'retired_at': [$item.retiredAt],
  'reviews': [
    match
      $review_link isa hasPortfolioReview (item: $item, review: $review);
      $author_link isa portfolioReviewAuthor (review: $review, author: $author);
    fetch {
      'id': $review.id,
      'review_text': $review.reviewText,
      'rating': [$review.rating],
      'author_id': $author.id
    };
  ]
};
""", {
  'registration_id': fixture['registrationId'],
  'student_id': fixture['studentId'],
}, sort_fields=False)

print(json.dumps({'timeline': timeline, 'items': items}, default=str))
`;

const MAKE_ITEM_WORLD_VISIBLE = String.raw`
import json
import os

from db.initDatabase import Db

payload = json.loads(os.environ['PF_TASK_006_ITEM'])

Db.write_transact_many([
    ("""
    match
      $item isa portfolioItem, has id ~item_id, has isWorldVisible $is_world_visible;
    delete
      has $is_world_visible of $item;
    """, {'item_id': payload['itemId']}),
    ("""
    match
      $item isa portfolioItem, has id ~item_id;
    insert
      $item has isWorldVisible true;
    """, {'item_id': payload['itemId']}),
])

print(json.dumps({'updated': True}))
`;

function getState(world) {
  world.pfTask006 = world.pfTask006 ?? {};
  return world.pfTask006;
}

function fixtureFor(name) {
  const fixture = lifecycle[name];
  assert.ok(fixture, `Unknown PF-task-006 lifecycle fixture '${name}'`);
  return fixture;
}

function actorFor(name) {
  const actor = actorAliases[name];
  assert.ok(actor, `Unknown PF-task-006 actor '${name}'`);
  return actor;
}

function itemIdFor(world, itemAlias) {
  const itemRef = getState(world).itemIds?.[itemAlias];
  assert.ok(itemRef, `Expected remembered PF-task-006 portfolio item '${itemAlias}'`);
  return typeof itemRef === 'string' ? itemRef : itemRef.id;
}

function itemFixtureFor(world, itemAlias) {
  const itemRef = getState(world).itemIds?.[itemAlias];
  assert.ok(itemRef, `Expected remembered PF-task-006 portfolio item '${itemAlias}'`);
  assert.equal(typeof itemRef, 'object', `Expected portfolio item '${itemAlias}' to remember its source fixture`);
  assert.ok(itemRef.fixtureName, `Expected portfolio item '${itemAlias}' to include its source fixture`);
  return itemRef.fixtureName;
}

function reviewTextFor(world, textAlias) {
  const reviewText = getState(world).reviewTexts?.[textAlias];
  assert.ok(reviewText, `Expected remembered PF-task-006 review text '${textAlias}'`);
  return reviewText;
}

function scalar(values) {
  assert.ok(Array.isArray(values), `Expected TypeDB optional field array, received ${JSON.stringify(values)}`);
  assert.ok(values.length <= 1, `Expected TypeDB optional field to contain at most one value, received ${values.length}`);
  return values.length === 0 ? null : values[0];
}

function valueOf(value) {
  return Array.isArray(value) ? scalar(value) : value;
}

function normalizeReview(review) {
  return {
    id: valueOf(review.id),
    review_text: valueOf(review.review_text),
    rating: scalar(review.rating),
    author_id: valueOf(review.author_id),
  };
}

function normalizeItem(item) {
  return {
    id: valueOf(item.id),
    is_retired: valueOf(item.is_retired),
    retired_at: scalar(item.retired_at),
    reviews: (item.reviews ?? []).map(normalizeReview).sort((left, right) => left.id.localeCompare(right.id)),
  };
}

function normalizeSnapshot(payload) {
  assert.equal(payload.timeline.length, 1, 'Expected one lifecycle timeline row');
  return {
    timeline: {
      requested_at: scalar(payload.timeline[0].requested_at),
      accepted_at: scalar(payload.timeline[0].accepted_at),
      started_at: scalar(payload.timeline[0].started_at),
      completed_at: scalar(payload.timeline[0].completed_at),
      is_accepted: scalar(payload.timeline[0].is_accepted),
    },
    items: payload.items.map(normalizeItem).sort((left, right) => left.id.localeCompare(right.id)),
  };
}

async function runBackend(script, env = {}) {
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
  assert.ok(jsonLine, `Expected PF-task-006 backend command to write JSON. stderr: ${stderr}`);
  return JSON.parse(jsonLine);
}

async function resetFixtures() {
  await execFileAsync(
    'docker',
    [...DOCKER_COMPOSE_ARGS, 'exec', '-T', 'backend', 'uv', 'run', 'python', '-c', RESET_FIXTURES],
    { cwd: REPO_ROOT, env: process.env, maxBuffer: 1024 * 1024 * 10 },
  );
}

async function readSnapshot(fixtureName) {
  const fixture = fixtureFor(fixtureName);
  const payload = await runBackend(SNAPSHOT_PROBE, {
    PF_TASK_006_FIXTURE: JSON.stringify({ ...fixture, studentId }),
  });
  return normalizeSnapshot(payload);
}

async function readSnapshotForItem(world, itemAlias) {
  return readSnapshot(itemFixtureFor(world, itemAlias));
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

async function tokenFor(actor) {
  const response = await fetch(`${BACKEND_URL}/auth/test/login/${actor.id}`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  const payload = await readJsonSafely(response);
  assert.equal(response.status, 200, `Expected ${actor.alias} login to return 200, received ${response.status}`);
  assert.ok(payload?.access_token, `Expected ${actor.alias} login to return an access_token`);
  return payload.access_token;
}

async function loginAs(world, actor) {
  Object.assign(getState(world), { authToken: await tokenFor(actor), actor });
}

function getAuthToken(world, actionDescription) {
  const authToken = getState(world).authToken;
  assert.ok(authToken, `Expected authentication token before ${actionDescription}`);
  return authToken;
}

function rememberLatestApiResponse(world, response, payload) {
  Object.assign(getState(world), { lastApiStatus: response.status, lastApiPayload: payload });
}

function latestApiResponse(world) {
  assert.notEqual(getState(world).lastApiStatus, undefined, 'Expected a PF-task-006 API response to have been recorded');
  return getState(world);
}

async function completeRegistration(world, fixtureName, body) {
  const fixture = fixtureFor(fixtureName);
  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${getAuthToken(world, 'completing a PF-task-006 registration')}`,
  };
  const request = { method: 'PATCH', headers };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    request.body = JSON.stringify(body);
  }

  const response = await fetch(`${BACKEND_URL}/tasks/${fixture.taskId}/registrations/${studentId}/complete`, request);
  rememberLatestApiResponse(world, response, await readJsonSafely(response));
  getState(world).lastCompletionFixtureName = fixtureName;
}

async function requestLifecycleAction(world, action, fixtureName) {
  const pathSegment = actionPaths[action];
  assert.ok(pathSegment, `Unknown PF-task-006 lifecycle action '${action}'`);
  const fixture = fixtureFor(fixtureName);
  const response = await fetch(`${BACKEND_URL}/tasks/${fixture.taskId}/registrations/${studentId}/${pathSegment}`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${getAuthToken(world, `requesting PF-task-006 ${action}`)}`,
    },
  });
  rememberLatestApiResponse(world, response, await readJsonSafely(response));
}

async function readPortfolioAs(actorName) {
  const authToken = await tokenFor(actorFor(actorName));
  const response = await fetch(`${BACKEND_URL}/portfolios/students/${studentId}`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${authToken}` },
  });
  const payload = await readJsonSafely(response);
  assert.equal(response.status, 200, `Expected ${actorName} portfolio read to return 200, received ${response.status}: ${JSON.stringify(payload)}`);
  return payload;
}

function findItem(snapshot, itemId) {
  const item = snapshot.items.find((candidate) => candidate.id === itemId);
  assert.ok(item, `Expected portfolio item ${itemId} to exist in TypeDB snapshot`);
  return item;
}

async function assertItemVisibility(world, itemAlias, actorName, expectedVisible) {
  const itemId = itemIdFor(world, itemAlias);
  const payload = await readPortfolioAs(actorName);
  const item = (payload.items ?? []).find((candidate) => candidate.id === itemId);
  if (expectedVisible) {
    assert.ok(item, `Expected item ${itemId} to be visible to ${actorName}`);
    assert.equal(item.visibility?.viewer_can_see, true, `Expected item ${itemId} visibility metadata to allow ${actorName}`);
  } else {
    assert.equal(item, undefined, `Expected item ${itemId} to be absent from normal portfolio view for ${actorName}`);
  }
}

async function allNormalPortfolioItems() {
  const payloads = await Promise.all(Object.keys(actorAliases).map(readPortfolioAs));
  return payloads.flatMap((payload) => payload.items ?? []);
}

async function readPublicPortfolio() {
  const response = await fetch(`${BACKEND_URL}/portfolio/${publicSlug}`, { headers: { Accept: 'application/json' } });
  const payload = await readJsonSafely(response);
  assert.equal(response.status, 200, `Expected public portfolio response to be 200, received ${response.status}: ${JSON.stringify(payload)}`);
  return payload;
}

Given('the PF-task-006 lifecycle fixtures are reset', async function () {
  await resetFixtures();
  this.pfTask006 = {};
});

Given('I am authenticated as the PF-task-006 {word} {word}', async function (first, second) {
  await loginAs(this, actorFor(`${first} ${second}`));
});

Given('I am authenticated as the PF-task-006 {word} {word} {word}', async function (first, second, third) {
  await loginAs(this, actorFor(`${first} ${second} ${third}`));
});

Given('I remember unique PF-task-006 review text as {string}', function (textAlias) {
  const state = getState(this);
  state.reviewTexts = state.reviewTexts ?? {};
  state.reviewTexts[textAlias] = `PF-task-006 ${textAlias} ${Date.now()} ${Math.random().toString(16).slice(2)}`;
});

Given('I remember the PF-task-006 side effects for {string}', async function (fixtureName) {
  const state = getState(this);
  state.remembered = state.remembered ?? {};
  state.remembered[fixtureName] = await readSnapshot(fixtureName);
});

Given('I remember the PF-task-006 retirement timestamp for portfolio item {string}', async function (itemAlias) {
  const itemId = itemIdFor(this, itemAlias);
  const items = (await allNormalPortfolioItems()).filter((item) => item.id === itemId);
  assert.equal(items.length, 0, `Expected retired item ${itemId} to be absent from normal views before remembering retirement timestamp`);

  const item = findItem(await readSnapshotForItem(this, itemAlias), itemId);
  assert.equal(typeof item.retired_at, 'string', `Expected item ${itemId} to have a retired_at timestamp`);
  getState(this).retirementTimestamps = { ...(getState(this).retirementTimestamps ?? {}), [itemAlias]: item.retired_at };
});

When('I complete the PF-task-006 registration {string} with remembered review text {string}, accepted notice, and rating {int}', async function (fixtureName, textAlias, rating) {
  await completeRegistration(this, fixtureName, {
    review_text: reviewTextFor(this, textAlias),
    public_review_notice_accepted: true,
    rating,
  });
});

When('I complete the PF-task-006 registration {string} without review text', async function (fixtureName) {
  await completeRegistration(this, fixtureName, undefined);
});

When('I request PF-task-006 lifecycle action {string} for {string}', async function (action, fixtureName) {
  await requestLifecycleAction(this, action, fixtureName);
});

Then('the latest PF-task-006 API response status should be {int}', function (expectedStatus) {
  const { lastApiStatus, lastApiPayload } = latestApiResponse(this);
  assert.equal(
    lastApiStatus,
    expectedStatus,
    `Expected latest PF-task-006 API status to be ${expectedStatus}, received ${lastApiStatus}: ${JSON.stringify(lastApiPayload)}`,
  );
});

Then('the PF-task-006 response should include a new portfolio item id as {string}', async function (itemAlias) {
  const { lastApiPayload } = latestApiResponse(this);
  const itemId = lastApiPayload?.portfolio_item_id;
  assert.equal(typeof itemId, 'string', `Expected response to include portfolio_item_id, received ${JSON.stringify(lastApiPayload)}`);
  const fixtureName = getState(this).lastCompletionFixtureName;
  assert.ok(fixtureName, `Expected a PF-task-006 completion fixture before remembering ${itemAlias}`);
  const state = getState(this);
  state.itemIds = state.itemIds ?? {};
  const rememberedItemIds = Object.values(state.itemIds).map((itemRef) => (typeof itemRef === 'string' ? itemRef : itemRef.id));
  assert.equal(rememberedItemIds.includes(itemId), false, `Expected ${itemId} to be new in this PF-task-006 scenario`);
  state.itemIds[itemAlias] = { id: itemId, fixtureName };
});

Then('I make the PF-task-006 portfolio item {string} visible in the public portfolio read model', async function (itemAlias) {
  await runBackend(MAKE_ITEM_WORLD_VISIBLE, {
    PF_TASK_006_ITEM: JSON.stringify({ itemId: itemIdFor(this, itemAlias) }),
  });
});

Then('the PF-task-006 lifecycle state for {string} should be started but not completed', async function (fixtureName) {
  const { timeline } = await readSnapshot(fixtureName);
  assert.equal(timeline.is_accepted, true, `Expected ${fixtureName} to remain accepted`);
  assert.equal(typeof timeline.started_at, 'string', `Expected ${fixtureName} to keep a started timestamp`);
  assert.equal(timeline.completed_at, null, `Expected ${fixtureName} to have no completed timestamp`);
});

Then('the PF-task-006 lifecycle state for {string} should be accepted but not started or completed', async function (fixtureName) {
  const { timeline } = await readSnapshot(fixtureName);
  assert.equal(timeline.is_accepted, true, `Expected ${fixtureName} to remain accepted`);
  assert.equal(timeline.started_at, null, `Expected ${fixtureName} to have no started timestamp`);
  assert.equal(timeline.completed_at, null, `Expected ${fixtureName} to have no completed timestamp`);
});

Then('the PF-task-006 side effects for {string} should be unchanged', async function (fixtureName) {
  const before = getState(this).remembered?.[fixtureName];
  assert.ok(before, `Expected remembered PF-task-006 side effects for ${fixtureName}`);
  const after = await readSnapshot(fixtureName);
  assert.deepEqual(after, before, `Expected ${fixtureName} lifecycle and portfolio side effects to be unchanged`);
});

Then('no PF-task-006 portfolio evidence should exist for {string}', async function (fixtureName) {
  assert.deepEqual((await readSnapshot(fixtureName)).items, [], `Expected no portfolio evidence for ${fixtureName}`);
});

Then('no active PF-task-006 portfolio item should exist for {string}', async function (fixtureName) {
  const activeItems = (await readSnapshot(fixtureName)).items.filter((item) => item.is_retired === false);
  assert.deepEqual(activeItems, [], `Expected no active portfolio item for ${fixtureName}`);
});

Then('the PF-task-006 portfolio item {string} should be retired', async function (itemAlias) {
  const itemId = itemIdFor(this, itemAlias);
  const item = findItem(await readSnapshotForItem(this, itemAlias), itemId);
  assert.ok(item, `Expected portfolio item ${itemId} to exist`);
  assert.equal(item.is_retired, true, `Expected portfolio item ${itemId} to be retired`);
  assert.equal(typeof item.retired_at, 'string', `Expected portfolio item ${itemId} to store retired_at`);
});

Then('remembered PF-task-006 review text {string} with rating {int} should remain persisted on retired portfolio item {string}', async function (textAlias, rating, itemAlias) {
  const itemId = itemIdFor(this, itemAlias);
  const reviewText = reviewTextFor(this, textAlias);
  const item = findItem(await readSnapshotForItem(this, itemAlias), itemId);
  assert.equal(item.is_retired, true, `Expected portfolio item ${itemId} to be retired before checking audit reviews`);
  assert.ok(
    item.reviews.some((review) => review.review_text === reviewText && review.rating === rating),
    `Expected retired item ${itemId} to keep persisted review text '${reviewText}' with rating ${rating}`,
  );
});

Then('the PF-task-006 portfolio item {string} should be active', async function (itemAlias) {
  const itemId = itemIdFor(this, itemAlias);
  const item = findItem(await readSnapshotForItem(this, itemAlias), itemId);
  assert.equal(item.is_retired, false, `Expected portfolio item ${itemId} to be active`);
  assert.equal(item.retired_at, null, `Expected active portfolio item ${itemId} not to have retired_at`);
});

Then('PF-task-006 portfolio item {string} should be different from {string}', function (leftAlias, rightAlias) {
  assert.notEqual(itemIdFor(this, leftAlias), itemIdFor(this, rightAlias), 'Expected re-completion to create a different portfolio item id');
});

Then('the PF-task-006 portfolio item {string} should be visible to the {word} {word}', async function (itemAlias, first, second) {
  await assertItemVisibility(this, itemAlias, `${first} ${second}`, true);
});

Then('the PF-task-006 portfolio item {string} should be visible to the {word} {word} {word}', async function (itemAlias, first, second, third) {
  await assertItemVisibility(this, itemAlias, `${first} ${second} ${third}`, true);
});

Then('the PF-task-006 portfolio item {string} should be absent from normal views for the {word} {word}', async function (itemAlias, first, second) {
  await assertItemVisibility(this, itemAlias, `${first} ${second}`, false);
});

Then('the PF-task-006 portfolio item {string} should be absent from normal views for the {word} {word} {word}', async function (itemAlias, first, second, third) {
  await assertItemVisibility(this, itemAlias, `${first} ${second} ${third}`, false);
});

Then('remembered PF-task-006 review text {string} should be visible on portfolio item {string}', async function (textAlias, itemAlias) {
  const itemId = itemIdFor(this, itemAlias);
  const reviewText = reviewTextFor(this, textAlias);
  const payload = await readPortfolioAs('portfolio teacher');
  const item = (payload.items ?? []).find((candidate) => candidate.id === itemId);
  assert.ok(item, `Expected item ${itemId} to be visible before checking its review text`);
  assert.ok(
    (item.reviews ?? []).some((review) => review.review_text === reviewText),
    `Expected visible item ${itemId} to include review text '${reviewText}'`,
  );
});

Then('remembered PF-task-006 review text {string} should be absent from normal portfolio views', async function (textAlias) {
  const reviewText = reviewTextFor(this, textAlias);
  const reviewTexts = (await allNormalPortfolioItems()).flatMap((item) => (item.reviews ?? []).map((review) => review.review_text));
  assert.equal(reviewTexts.includes(reviewText), false, `Expected review text '${reviewText}' to be absent from normal portfolio views`);
});

Then('the PF-task-006 public portfolio view should not expose portfolio item {string}', async function (itemAlias) {
  const itemId = itemIdFor(this, itemAlias);
  const payload = await readPublicPortfolio();
  assert.equal((payload.items ?? []).some((item) => item.id === itemId), false, `Expected public portfolio not to expose retired item ${itemId}`);
});

Then('the PF-task-006 public portfolio view should expose portfolio item {string}', async function (itemAlias) {
  const itemId = itemIdFor(this, itemAlias);
  const payload = await readPublicPortfolio();
  const item = (payload.items ?? []).find((candidate) => candidate.id === itemId);
  assert.ok(item, `Expected public portfolio to expose item ${itemId} before retirement`);
  assert.equal(item.visibility?.viewer_can_see, true, `Expected public portfolio visibility metadata to allow item ${itemId}`);
});

Then('the PF-task-006 portfolio item {string} should keep its remembered retirement timestamp', async function (itemAlias) {
  const expected = getState(this).retirementTimestamps?.[itemAlias];
  assert.ok(expected, `Expected remembered retirement timestamp for ${itemAlias}`);
  const itemId = itemIdFor(this, itemAlias);
  const item = findItem(await readSnapshotForItem(this, itemAlias), itemId);
  assert.equal(item.retired_at, expected, `Expected retired item ${itemId} audit timestamp to remain unchanged`);
});
