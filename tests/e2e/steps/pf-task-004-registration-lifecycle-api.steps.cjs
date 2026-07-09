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

const actionPaths = Object.freeze({
  start: 'start',
  complete: 'complete',
  'revert-start': 'revert-start',
  'revert-completion': 'revert-completion',
});

const actorAliases = Object.freeze({
  'portfolio owner student': actors.student,
  'portfolio teacher': actors.teacher,
  'related portfolio supervisor': actors.relatedSupervisor,
  'unrelated portfolio supervisor': actors.unrelatedSupervisor,
});

const LIFECYCLE_STATE_PROBE = String.raw`
import json
import os

from db.initDatabase import Db

fixture = json.loads(os.environ['PF_TASK_004_FIXTURE'])

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
  $item isa portfolioItem, has sourceRegistrationId ~registration_id;
fetch {
  'id': $item.id,
  'reviews': [
    match
      $has_review isa hasPortfolioReview (item: $item, review: $review);
    fetch { 'id': $review.id };
  ]
};
""", {'registration_id': fixture['registrationId']}, sort_fields=False)

print(json.dumps({'timeline': timeline, 'items': items}, default=str))
`;

const RESET_LIFECYCLE_FIXTURES = String.raw`
from db.initDatabase import Db

Db.write_transact("""
match
  $item isa portfolioItem, has sourceRegistrationId $registration_id;
  $registration_id like "pf-task-004-.*";
  $review_link isa hasPortfolioReview (item: $item, review: $review);
  $author_link isa portfolioReviewAuthor (review: $review, author: $author);
delete
  $author_link;
  $review_link;
  $review;
""")

Db.write_transact("""
match
  $item isa portfolioItem, has sourceRegistrationId $registration_id;
  $registration_id like "pf-task-004-.*";
  $ownership isa hasPortfolio (student: $student, item: $item);
delete
  $ownership;
  $item;
""")

for attribute_type in ['isAccepted', 'response', 'acceptedAt', 'startedAt', 'completedAt']:
    Db.write_transact(f"""
match
  $registration isa registersForTask, has id $registration_id, has {attribute_type} $value;
  $registration_id like "pf-task-004-.*";
delete
  has $value of $registration;
""")

Db.write_transact("""
match
  $accepted_start isa registersForTask, has id "pf-task-004-accepted-for-start";
  $pending_start isa registersForTask, has id "pf-task-004-pending-start-rejected";
  $rejected_start isa registersForTask, has id "pf-task-004-rejected-start-rejected";
  $started_start isa registersForTask, has id "pf-task-004-started-start-rejected";
  $completed_start isa registersForTask, has id "pf-task-004-completed-start-rejected";
  $accepted_completion isa registersForTask, has id "pf-task-004-accepted-completion-rejected";
  $started_completion isa registersForTask, has id "pf-task-004-started-for-completion";
  $student_denied isa registersForTask, has id "pf-task-004-student-denied";
  $supervisor_denied isa registersForTask, has id "pf-task-004-supervisor-denied";
  $timeline_access isa registersForTask, has id "pf-task-004-timeline-access";
  $started_revert isa registersForTask, has id "pf-task-004-started-for-revert";
  $completed_revert isa registersForTask, has id "pf-task-004-completed-for-revert";
  $supervisor_start isa registersForTask, has id "pf-task-004-supervisor-start-allowed";
  $supervisor_completion isa registersForTask, has id "pf-task-004-supervisor-completion-allowed";
insert
  $accepted_start has isAccepted true;
  $accepted_start has response "Accepted for PF-task-004 lifecycle coverage.";
  $accepted_start has acceptedAt 2026-01-21T11:00:00.000+0000;

  $rejected_start has isAccepted false;
  $rejected_start has response "Rejected for PF-task-004 lifecycle coverage.";

  $started_start has isAccepted true;
  $started_start has response "Accepted for PF-task-004 lifecycle coverage.";
  $started_start has acceptedAt 2026-01-21T11:03:00.000+0000;
  $started_start has startedAt 2026-01-22T09:03:00.000+0000;

  $completed_start has isAccepted true;
  $completed_start has response "Accepted for PF-task-004 lifecycle coverage.";
  $completed_start has acceptedAt 2026-01-21T11:04:00.000+0000;
  $completed_start has startedAt 2026-01-22T09:04:00.000+0000;
  $completed_start has completedAt 2026-01-23T17:04:00.000+0000;

  $accepted_completion has isAccepted true;
  $accepted_completion has response "Accepted for PF-task-004 lifecycle coverage.";
  $accepted_completion has acceptedAt 2026-01-21T11:05:00.000+0000;

  $started_completion has isAccepted true;
  $started_completion has response "Accepted for PF-task-004 lifecycle coverage.";
  $started_completion has acceptedAt 2026-01-21T11:06:00.000+0000;
  $started_completion has startedAt 2026-01-22T09:06:00.000+0000;

  $student_denied has isAccepted true;
  $student_denied has response "Accepted for PF-task-004 lifecycle coverage.";
  $student_denied has acceptedAt 2026-01-21T11:07:00.000+0000;
  $student_denied has startedAt 2026-01-22T09:07:00.000+0000;

  $supervisor_denied has isAccepted true;
  $supervisor_denied has response "Accepted for PF-task-004 lifecycle coverage.";
  $supervisor_denied has acceptedAt 2026-01-21T11:08:00.000+0000;
  $supervisor_denied has startedAt 2026-01-22T09:08:00.000+0000;

  $timeline_access has isAccepted true;
  $timeline_access has response "Accepted for PF-task-004 lifecycle coverage.";
  $timeline_access has acceptedAt 2026-01-21T11:09:00.000+0000;

  $started_revert has isAccepted true;
  $started_revert has response "Accepted for PF-task-004 lifecycle coverage.";
  $started_revert has acceptedAt 2026-01-21T11:10:00.000+0000;
  $started_revert has startedAt 2026-01-22T09:10:00.000+0000;

  $completed_revert has isAccepted true;
  $completed_revert has response "Accepted for PF-task-004 lifecycle coverage.";
  $completed_revert has acceptedAt 2026-01-21T11:11:00.000+0000;
  $completed_revert has startedAt 2026-01-22T09:11:00.000+0000;
  $completed_revert has completedAt 2026-01-23T17:11:00.000+0000;

  $supervisor_start has isAccepted true;
  $supervisor_start has response "Accepted for PF-task-004 supervisor lifecycle coverage.";
  $supervisor_start has acceptedAt 2026-01-21T11:12:00.000+0000;

  $supervisor_completion has isAccepted true;
  $supervisor_completion has response "Accepted for PF-task-004 supervisor lifecycle coverage.";
  $supervisor_completion has acceptedAt 2026-01-21T11:13:00.000+0000;
  $supervisor_completion has startedAt 2026-01-22T09:13:00.000+0000;
""")

# A genuinely completed registration always owns an active portfolio item (created at completion).
# Recreate that evidence for the completed-for-revert fixture so revert-completion can retire it.
Db.write_transact("""
match
  $student isa student, has id "20000000-0000-4000-8000-000000000002";
insert
  $completed_revert_item isa portfolioItem,
    has id "pf-task-004-completed-revert-item",
    has createdAt 2026-01-23T17:11:00.000+0000,
    has completedAt 2026-01-23T17:11:00.000+0000,
    has sourceStudentId "20000000-0000-4000-8000-000000000002",
    has sourceRegistrationId "pf-task-004-completed-for-revert",
    has sourceTaskId "50000000-0000-4000-8000-000000000021",
    has sourceProjectId "40000000-0000-4000-8000-000000000001",
    has sourceBusinessId "30000000-0000-4000-8000-000000000001",
    has studentName "Tom Teststudent",
    has studentImagePath "default.svg",
    has taskName "PF-task-004 Completed Revert Task",
    has taskDescription "Completed registration fixture for valid revert-completion lifecycle coverage.",
    has projectName "E2E Infrastructure Proof Project",
    has projectDescription "Neutraal publiek project dat alleen de lokale testinfrastructuur bewijst.",
    has businessName "E2E Infrastructure Business",
    has businessLocation "Arnhem",
    has skillName "Deterministisch Testen",
    has timelineStartDate 2026-01-22T09:11:00.000+0000,
    has timelineEndDate 2026-01-23T17:11:00.000+0000,
    has isRetired false,
    has isHidden false,
    has isAuthenticatedPublicRetraction false,
    has isWorldVisible false,
    has sourceTaskArchived false,
    has sourceProjectArchived false,
    has sourceBusinessArchived false;
  $completed_revert_ownership isa hasPortfolio (student: $student, item: $completed_revert_item);
""")
`;

function fixtureFor(name) {
  const fixture = lifecycle[name];
  assert.ok(fixture, `Unknown PF-task-004 lifecycle fixture '${name}'`);
  return fixture;
}

function getState(world) {
  world.pfTask004 = world.pfTask004 ?? {};
  return world.pfTask004;
}

function rememberAuthToken(world, authToken, actor) {
  Object.assign(getState(world), { authToken, actor });
}

function getAuthToken(world, actionDescription) {
  const authToken = getState(world).authToken;
  assert.ok(authToken, `Expected authentication token before ${actionDescription}`);
  return authToken;
}

function rememberLatestApiResponse(world, response, payload) {
  Object.assign(getState(world), {
    lastApiStatus: response.status,
    lastApiPayload: payload,
  });
}

function latestApiResponse(world) {
  assert.notEqual(getState(world).lastApiStatus, undefined, 'Expected a PF-task-004 API response to have been recorded');
  return getState(world);
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
  rememberAuthToken(world, payload.access_token, actor);
}

async function requestLifecycleAction(world, action, fixtureName, headers = {}) {
  const pathSegment = actionPaths[action];
  assert.ok(pathSegment, `Unknown PF-task-004 lifecycle action '${action}'`);

  const fixture = fixtureFor(fixtureName);
  const actor = getState(world).actor;
  const body = action === 'complete' && actor?.alias?.includes('supervisor')
    ? {
        review_text: `PF-task-004 supervisor lifecycle completion ${Date.now()}`,
        public_review_notice_accepted: true,
      }
    : undefined;
  const requestHeaders = {
    Accept: 'application/json',
    ...headers,
  };
  if (body) requestHeaders['Content-Type'] = 'application/json';

  const response = await fetch(`${BACKEND_URL}/tasks/${fixture.taskId}/registrations/${studentId}/${pathSegment}`, {
    method: 'PATCH',
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  rememberLatestApiResponse(world, response, await readJsonSafely(response));
}

async function requestRegistrationDecision(world, decision, fixtureName, headers = {}) {
  const decisions = Object.freeze({ accepted: true, rejected: false });
  assert.ok(Object.hasOwn(decisions, decision), `Unknown PF-task-004 registration decision '${decision}'`);

  const fixture = fixtureFor(fixtureName);
  const response = await fetch(`${BACKEND_URL}/tasks/${fixture.taskId}/registrations/${studentId}`, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({
      accepted: decisions[decision],
      response: `PF-task-004 ${decision} state-machine regression check`,
    }),
  });

  rememberLatestApiResponse(world, response, await readJsonSafely(response));
}

async function requestTimeline(world, fixtureName, headers = {}) {
  const fixture = fixtureFor(fixtureName);
  const response = await fetch(`${BACKEND_URL}/tasks/${fixture.taskId}/registrations/${studentId}/timeline`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...headers,
    },
  });

  rememberLatestApiResponse(world, response, await readJsonSafely(response));
}

function scalar(values) {
  assert.ok(Array.isArray(values), `Expected TypeDB optional field array, received ${JSON.stringify(values)}`);
  assert.ok(values.length <= 1, `Expected TypeDB optional field to contain at most one value, received ${values.length}`);
  return values.length === 0 ? null : values[0];
}

function normalizeTimeline(row) {
  assert.equal(typeof row, 'object', 'Expected lifecycle timeline row');
  assert.notEqual(row, null, 'Expected lifecycle timeline row not to be null');
  return {
    requested_at: scalar(row.requested_at),
    accepted_at: scalar(row.accepted_at),
    started_at: scalar(row.started_at),
    completed_at: scalar(row.completed_at),
    is_accepted: scalar(row.is_accepted),
  };
}

async function readLifecycleState(fixtureName) {
  const fixture = fixtureFor(fixtureName);
  const { stdout, stderr } = await execFileAsync(
    'docker',
    [
      ...DOCKER_COMPOSE_ARGS,
      'exec',
      '-T',
      '-e',
      `PF_TASK_004_FIXTURE=${JSON.stringify({ ...fixture, studentId })}`,
      'backend',
      'uv',
      'run',
      'python',
      '-c',
      LIFECYCLE_STATE_PROBE,
    ],
    {
      cwd: REPO_ROOT,
      env: {
        ...process.env,
        PF_TASK_004_FIXTURE: JSON.stringify({ ...fixture, studentId }),
      },
      maxBuffer: 1024 * 1024 * 10,
    },
  );

  const jsonLine = stdout.split(/\r?\n/u).map((line) => line.trim()).filter(Boolean).at(-1);
  assert.ok(jsonLine, `Expected PF-task-004 lifecycle probe to write JSON. stderr: ${stderr}`);
  const payload = JSON.parse(jsonLine);
  assert.equal(payload.timeline.length, 1, `Expected one lifecycle registration for ${fixtureName}`);
  return {
    timeline: normalizeTimeline(payload.timeline[0]),
    items: payload.items,
  };
}

async function resetLifecycleFixtures() {
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
      RESET_LIFECYCLE_FIXTURES,
    ],
    {
      cwd: REPO_ROOT,
      env: process.env,
      maxBuffer: 1024 * 1024 * 10,
    },
  );
}

function rememberedTimeline(world, fixtureName) {
  const remembered = getState(world).remembered?.[fixtureName];
  assert.ok(remembered, `Expected remembered lifecycle state for ${fixtureName}`);
  return remembered.timeline;
}

async function assertTimestampState(fixtureName, field, expectedPresent) {
  const state = await readLifecycleState(fixtureName);
  const value = state.timeline[field];
  if (expectedPresent) {
    assert.equal(typeof value, 'string', `Expected ${fixtureName}.${field} to contain a timestamp`);
  } else {
    assert.equal(value, null, `Expected ${fixtureName}.${field} to be absent`);
  }
}

Given('I am authenticated as the PF-task-004 {word} {word} {word}', async function (first, second, third) {
  const actorName = `${first} ${second} ${third}`;
  await loginAs(this, actorAliases[actorName]);
});

Given('I am authenticated as the PF-task-004 {word} {word}', async function (first, second) {
  const actorName = `${first} ${second}`;
  await loginAs(this, actorAliases[actorName]);
});

Given('the PF-task-004 lifecycle fixtures are reset', async function () {
  await resetLifecycleFixtures();
  getState(this).remembered = {};
});

Given('I remember the PF-task-004 lifecycle state for {string}', async function (fixtureName) {
  const remembered = getState(this).remembered ?? {};
  remembered[fixtureName] = await readLifecycleState(fixtureName);
  getState(this).remembered = remembered;
});

When('I request PF-task-004 lifecycle action {string} for {string}', async function (action, fixtureName) {
  const authToken = getAuthToken(this, `requesting PF-task-004 ${action}`);
  await requestLifecycleAction(this, action, fixtureName, { Authorization: `Bearer ${authToken}` });
});

When('I request PF-task-004 lifecycle action {string} for {string} without authentication', async function (action, fixtureName) {
  await requestLifecycleAction(this, action, fixtureName);
});

When('I request PF-task-004 registration decision {string} for {string}', async function (decision, fixtureName) {
  const authToken = getAuthToken(this, `requesting PF-task-004 registration decision ${decision}`);
  await requestRegistrationDecision(this, decision, fixtureName, { Authorization: `Bearer ${authToken}` });
});

When('I request the PF-task-004 timeline for {string}', async function (fixtureName) {
  const authToken = getAuthToken(this, 'requesting a PF-task-004 timeline');
  await requestTimeline(this, fixtureName, { Authorization: `Bearer ${authToken}` });
});

When('I request the PF-task-004 timeline for {string} without authentication', async function (fixtureName) {
  await requestTimeline(this, fixtureName);
});

Then('the latest PF-task-004 API response status should be {int}', function (expectedStatus) {
  const { lastApiStatus } = latestApiResponse(this);
  assert.equal(lastApiStatus, expectedStatus, `Expected latest API status to be ${expectedStatus}, received ${lastApiStatus}`);
});

Then('the PF-task-004 lifecycle state for {string} should have a started timestamp', async function (fixtureName) {
  await assertTimestampState(fixtureName, 'started_at', true);
});

Then('the PF-task-004 lifecycle state for {string} should not have a started timestamp', async function (fixtureName) {
  await assertTimestampState(fixtureName, 'started_at', false);
});

Then('the PF-task-004 lifecycle state for {string} should have a completed timestamp', async function (fixtureName) {
  await assertTimestampState(fixtureName, 'completed_at', true);
});

Then('the PF-task-004 lifecycle state for {string} should not have a completed timestamp', async function (fixtureName) {
  await assertTimestampState(fixtureName, 'completed_at', false);
});

Then('the PF-task-004 lifecycle state for {string} should keep its remembered timestamps', async function (fixtureName) {
  const before = rememberedTimeline(this, fixtureName);
  const after = (await readLifecycleState(fixtureName)).timeline;
  assert.deepEqual(after, before, `Expected ${fixtureName} lifecycle timestamps to remain unchanged`);
});

Then('the PF-task-004 lifecycle state for {string} should keep its remembered timestamps except {string}', async function (fixtureName, excludedField) {
  const before = { ...rememberedTimeline(this, fixtureName) };
  const after = { ...(await readLifecycleState(fixtureName)).timeline };
  delete before[excludedField];
  delete after[excludedField];
  assert.deepEqual(after, before, `Expected ${fixtureName} lifecycle timestamps except ${excludedField} to remain unchanged`);
});

Then('no PF-task-004 portfolio evidence should exist for {string}', async function (fixtureName) {
  const state = await readLifecycleState(fixtureName);
  assert.deepEqual(state.items, [], `Expected no portfolio items or reviews for ${fixtureName}`);
});

Then('the PF-task-004 timeline response should include the registration lifecycle fields', function () {
  const { lastApiPayload } = latestApiResponse(this);
  assert.equal(typeof lastApiPayload, 'object', 'Expected lifecycle timeline payload object');
  assert.notEqual(lastApiPayload, null, 'Expected lifecycle timeline payload not to be null');
  for (const field of ['requested_at', 'accepted_at', 'started_at', 'completed_at', 'is_accepted']) {
    assert.ok(Object.hasOwn(lastApiPayload, field), `Expected lifecycle timeline field ${field}`);
  }
});
