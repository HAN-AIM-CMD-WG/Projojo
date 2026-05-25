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

const actorAliases = Object.freeze({
  'portfolio teacher': actors.teacher,
  'related portfolio supervisor': actors.relatedSupervisor,
});

const RESET_COMPLETION_FIXTURES = String.raw`
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

const COMPLETION_SNAPSHOT_PROBE = String.raw`
import json
import os

from db.initDatabase import Db

fixture = json.loads(os.environ['PF_TASK_005_FIXTURE'])

timeline = Db.read_transact("""
match
  $task isa task, has id ~task_id;
  $student isa student, has id ~student_id, has fullName $student_name, has imagePath $student_image_path;
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

source = Db.read_transact("""
match
  $student isa student, has id ~student_id, has fullName $student_name, has imagePath $student_image_path;
  $task isa task, has id ~task_id, has name $task_name, has description $task_description;
  $registration isa registersForTask (student: $student, task: $task), has id $registration_id;
  $project isa project, has id $project_id, has name $project_name, has description $project_description;
  $contains_task isa containsTask (project: $project, task: $task);
  $business isa business, has id $business_id, has name $business_name, has location $business_location;
  $has_projects isa hasProjects (business: $business, project: $project);
fetch {
  'student_id': $student.id,
  'student_name': $student_name,
  'student_image_path': $student_image_path,
  'registration_id': $registration_id,
  'task_id': $task.id,
  'task_name': $task_name,
  'task_description': $task_description,
  'project_id': $project_id,
  'project_name': $project_name,
  'project_description': $project_description,
  'business_id': $business_id,
  'business_name': $business_name,
  'business_location': $business_location,
  'skills': [
    match
      $requires_skill isa requiresSkill (task: $task, skill: $skill);
    fetch { 'name': $skill.name };
  ]
};
""", {
  'task_id': fixture['taskId'],
  'student_id': fixture['studentId'],
}, sort_fields=False)

items = Db.read_transact("""
match
  $student isa student, has id ~student_id;
  $item isa portfolioItem, has sourceRegistrationId ~registration_id;
  $ownership isa hasPortfolio (student: $student, item: $item);
fetch {
  'id': $item.id,
  'created_at': $item.createdAt,
  'completed_at': $item.completedAt,
  'source_student_id': $item.sourceStudentId,
  'source_registration_id': $item.sourceRegistrationId,
  'source_task_id': $item.sourceTaskId,
  'source_project_id': $item.sourceProjectId,
  'source_business_id': $item.sourceBusinessId,
  'student_name': $item.studentName,
  'student_image_path': [$item.studentImagePath],
  'task_name': $item.taskName,
  'task_description': [$item.taskDescription],
  'project_name': $item.projectName,
  'project_description': [$item.projectDescription],
  'business_name': $item.businessName,
  'business_location': [$item.businessLocation],
  'skills': [
    match
      $item has skillName $skill_name;
    fetch { 'name': $skill_name };
  ],
  'timeline_start_date': [$item.timelineStartDate],
  'timeline_end_date': [$item.timelineEndDate],
  'is_retired': $item.isRetired,
  'is_hidden': $item.isHidden,
  'is_authenticated_public_retraction': $item.isAuthenticatedPublicRetraction,
  'is_world_visible': $item.isWorldVisible,
  'reviews': [
    match
      $review_link isa hasPortfolioReview (item: $item, review: $review);
      $author_link isa portfolioReviewAuthor (review: $review, author: $author);
    fetch {
      'id': $review.id,
      'review_text': $review.reviewText,
      'rating': [$review.rating],
      'public_notice_accepted_at': [$review.publicNoticeAcceptedAt],
      'author_id': $author.id
    };
  ]
};
""", {
  'registration_id': fixture['registrationId'],
  'student_id': fixture['studentId'],
}, sort_fields=False)

print(json.dumps({'timeline': timeline, 'source': source, 'items': items}, default=str))
`;

const COMPLETION_FAILURE_PROBE = String.raw`
import json
import os
from uuid import uuid4

import domain.repositories.task_repository as task_repository_module
from domain.repositories.task_repository import TaskRepository
from db.initDatabase import Db

fixture = json.loads(os.environ['PF_TASK_005_FIXTURE'])
student_id = os.environ['PF_TASK_005_STUDENT_ID']
reviewer_id = os.environ['PF_TASK_005_REVIEWER_ID']
item_id = f"pf-task-005-rollback-item-{uuid4()}"
review_text = f"PF-task-005 forced rollback review {uuid4()}"
generated_ids = [item_id, 'pf-seed-review-good-teacher']
original_generate_uuid = task_repository_module.generate_uuid

def fake_generate_uuid():
    return generated_ids.pop(0) if generated_ids else original_generate_uuid()

try:
    task_repository_module.generate_uuid = fake_generate_uuid
    TaskRepository().mark_registration_completed(
        fixture['taskId'],
        student_id,
        reviewer_id=reviewer_id,
        reviewer_role='teacher',
        review_text=review_text,
        public_review_notice_accepted=True,
        rating=5,
    )
    result = {'failed_as_expected': False, 'error': None}
except Exception as error:
    result = {'failed_as_expected': True, 'error': str(error)}
finally:
    task_repository_module.generate_uuid = original_generate_uuid
    item_rows = Db.read_transact("""
    match
      $item isa portfolioItem, has id ~item_id;
    fetch { 'id': $item.id };
    """, {'item_id': item_id}, sort_fields=False)
    review_rows = Db.read_transact("""
    match
      $review isa portfolioReview, has reviewText ~review_text;
    fetch { 'id': $review.id };
    """, {'review_text': review_text}, sort_fields=False)
    result.update({
        'item_id': item_id,
        'item_persisted': bool(item_rows),
        'review_persisted': bool(review_rows),
    })
    Db.close()

print(json.dumps(result))
`;

function getState(world) {
  world.pfTask005 = world.pfTask005 ?? {};
  return world.pfTask005;
}

function fixtureFor(name) {
  const fixture = lifecycle[name];
  assert.ok(fixture, `Unknown PF-task-005 lifecycle fixture '${name}'`);
  return fixture;
}

function scalar(values) {
  assert.ok(Array.isArray(values), `Expected TypeDB optional field array, received ${JSON.stringify(values)}`);
  assert.ok(values.length <= 1, `Expected TypeDB optional field to contain at most one value, received ${values.length}`);
  return values.length === 0 ? null : values[0];
}

function valueOf(value) {
  return Array.isArray(value) ? scalar(value) : value;
}

function skillNames(rows) {
  return [...new Set((rows ?? []).map((skill) => valueOf(skill.name)).filter(Boolean))].sort();
}

function normalizeReview(review) {
  return {
    id: valueOf(review.id),
    review_text: valueOf(review.review_text),
    rating: scalar(review.rating),
    public_notice_accepted_at: scalar(review.public_notice_accepted_at),
    author_id: valueOf(review.author_id),
  };
}

function normalizeItem(item) {
  return {
    id: valueOf(item.id),
    created_at: valueOf(item.created_at),
    completed_at: valueOf(item.completed_at),
    source_student_id: valueOf(item.source_student_id),
    source_registration_id: valueOf(item.source_registration_id),
    source_task_id: valueOf(item.source_task_id),
    source_project_id: valueOf(item.source_project_id),
    source_business_id: valueOf(item.source_business_id),
    student_name: valueOf(item.student_name),
    student_image_path: scalar(item.student_image_path),
    task_name: valueOf(item.task_name),
    task_description: scalar(item.task_description),
    project_name: valueOf(item.project_name),
    project_description: scalar(item.project_description),
    business_name: valueOf(item.business_name),
    business_location: scalar(item.business_location),
    skills: skillNames(item.skills),
    timeline_start_date: scalar(item.timeline_start_date),
    timeline_end_date: scalar(item.timeline_end_date),
    is_retired: valueOf(item.is_retired),
    is_hidden: valueOf(item.is_hidden),
    is_authenticated_public_retraction: valueOf(item.is_authenticated_public_retraction),
    is_world_visible: valueOf(item.is_world_visible),
    reviews: (item.reviews ?? []).map(normalizeReview).sort((left, right) => left.id.localeCompare(right.id)),
  };
}

function normalizeSnapshot(payload) {
  assert.equal(payload.timeline.length, 1, 'Expected one lifecycle timeline row');
  assert.equal(payload.source.length, 1, 'Expected one source context row');
  return {
    timeline: {
      requested_at: scalar(payload.timeline[0].requested_at),
      accepted_at: scalar(payload.timeline[0].accepted_at),
      started_at: scalar(payload.timeline[0].started_at),
      completed_at: scalar(payload.timeline[0].completed_at),
      is_accepted: scalar(payload.timeline[0].is_accepted),
    },
    source: {
      student_id: valueOf(payload.source[0].student_id),
      student_name: valueOf(payload.source[0].student_name),
      student_image_path: valueOf(payload.source[0].student_image_path),
      registration_id: valueOf(payload.source[0].registration_id),
      task_id: valueOf(payload.source[0].task_id),
      task_name: valueOf(payload.source[0].task_name),
      task_description: valueOf(payload.source[0].task_description),
      project_id: valueOf(payload.source[0].project_id),
      project_name: valueOf(payload.source[0].project_name),
      project_description: valueOf(payload.source[0].project_description),
      business_id: valueOf(payload.source[0].business_id),
      business_name: valueOf(payload.source[0].business_name),
      business_location: valueOf(payload.source[0].business_location),
      skills: skillNames(payload.source[0].skills),
    },
    items: payload.items.map(normalizeItem).sort((left, right) => left.id.localeCompare(right.id)),
  };
}

async function runBackendProbe(script, env = {}) {
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
  assert.ok(jsonLine, `Expected PF-task-005 backend probe to write JSON. stderr: ${stderr}`);
  return JSON.parse(jsonLine);
}

async function resetCompletionFixtures() {
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
      RESET_COMPLETION_FIXTURES,
    ],
    {
      cwd: REPO_ROOT,
      env: process.env,
      maxBuffer: 1024 * 1024 * 10,
    },
  );
}

async function readSnapshot(fixtureName) {
  const fixture = fixtureFor(fixtureName);
  const payload = await runBackendProbe(COMPLETION_SNAPSHOT_PROBE, {
    PF_TASK_005_FIXTURE: JSON.stringify({ ...fixture, studentId }),
  });
  return normalizeSnapshot(payload);
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
  assert.notEqual(getState(world).lastApiStatus, undefined, 'Expected a PF-task-005 API response to have been recorded');
  return getState(world);
}

function rememberNewItem(world, fixtureName, itemId) {
  const state = getState(world);
  state.newItemIds = state.newItemIds ?? {};
  state.newItemIds[fixtureName] = itemId;
}

function rememberedNewItem(world, fixtureName) {
  const itemId = getState(world).newItemIds?.[fixtureName];
  assert.ok(itemId, `Expected a new PF-task-005 item id for ${fixtureName}`);
  return itemId;
}

function buildCompletionBody(world, options) {
  const body = {};
  if (options.reviewText !== undefined) body.review_text = options.reviewText;
  if (options.useRememberedReviewText) body.review_text = getState(world).reviewText;
  if (options.rating !== undefined) body.rating = options.rating;
  if (options.notice !== undefined) body.public_review_notice_accepted = options.notice;
  return body;
}

async function completeRegistration(world, fixtureName, body) {
  const fixture = fixtureFor(fixtureName);
  const authToken = getAuthToken(world, 'completing a PF-task-005 registration');
  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${authToken}`,
  };
  const request = {
    method: 'PATCH',
    headers,
  };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    request.body = JSON.stringify(body);
  }

  const response = await fetch(`${BACKEND_URL}/tasks/${fixture.taskId}/registrations/${studentId}/complete`, request);
  rememberLatestApiResponse(world, response, await readJsonSafely(response));
}

function noticeValue(notice) {
  if (notice === 'missing') return undefined;
  if (notice === 'false') return false;
  if (notice === 'accepted') return true;
  throw new Error(`Unknown PF-task-005 notice state '${notice}'`);
}

function itemByRememberedId(snapshot, world, fixtureName) {
  const itemId = rememberedNewItem(world, fixtureName);
  const item = snapshot.items.find((candidate) => candidate.id === itemId);
  assert.ok(item, `Expected portfolio item ${itemId} to exist for ${fixtureName}`);
  return item;
}

function assertCanonicalItemFields(snapshot, item) {
  const { source, timeline } = snapshot;
  assert.equal(item.source_student_id, source.student_id, 'Expected source student id to be copied');
  assert.equal(item.source_registration_id, source.registration_id, 'Expected source registration id to be copied');
  assert.equal(item.source_task_id, source.task_id, 'Expected source task id to be copied');
  assert.equal(item.source_project_id, source.project_id, 'Expected source project id to be copied');
  assert.equal(item.source_business_id, source.business_id, 'Expected source business id to be copied');
  assert.equal(item.student_name, source.student_name, 'Expected student display name to be copied');
  assert.equal(item.student_image_path, source.student_image_path, 'Expected student image path to be copied');
  assert.equal(item.task_name, source.task_name, 'Expected task display name to be copied');
  assert.equal(item.task_description, source.task_description, 'Expected task description to be copied');
  assert.equal(item.project_name, source.project_name, 'Expected project display name to be copied');
  assert.equal(item.project_description, source.project_description, 'Expected project description to be copied');
  assert.equal(item.business_name, source.business_name, 'Expected business display name to be copied');
  assert.equal(item.business_location, source.business_location, 'Expected business location to be copied');
  assert.deepEqual(item.skills, source.skills, 'Expected task skills to be copied');
  assert.equal(item.timeline_start_date, timeline.started_at, 'Expected item timeline start to match registration start');
  assert.equal(item.timeline_end_date, timeline.completed_at, 'Expected item timeline end to match registration completion');
  assert.equal(item.completed_at, timeline.completed_at, 'Expected item completed timestamp to match registration completion');
  assert.equal(item.is_retired, false, 'Expected the new item to be active');
  assert.equal(item.is_hidden, false, 'Expected the new item not to be hidden');
  assert.equal(item.is_authenticated_public_retraction, false, 'Expected the new item not to be retracted from authenticated-public visibility');
  assert.equal(item.is_world_visible, false, 'Expected the new item not to be world-public by default');
}

Given('the PF-task-005 completion fixtures are reset', async function () {
  await resetCompletionFixtures();
  this.pfTask005 = {};
});

Given('I am authenticated as the PF-task-005 {word} {word}', async function (first, second) {
  const actorName = `${first} ${second}`;
  await loginAs(this, actorAliases[actorName]);
});

Given('I am authenticated as the PF-task-005 {word} {word} {word}', async function (first, second, third) {
  const actorName = `${first} ${second} ${third}`;
  await loginAs(this, actorAliases[actorName]);
});

Given('I remember unique PF-task-005 review text for {string}', function (purpose) {
  getState(this).reviewText = `PF-task-005 ${purpose} ${Date.now()} ${Math.random().toString(16).slice(2)}`;
});

Given('I remember the PF-task-005 completion side effects for {string}', async function (fixtureName) {
  const remembered = getState(this).remembered ?? {};
  remembered[fixtureName] = await readSnapshot(fixtureName);
  getState(this).remembered = remembered;
});

When('I complete the PF-task-005 registration {string} without review text', async function (fixtureName) {
  await completeRegistration(this, fixtureName, undefined);
});

When('I complete the PF-task-005 registration {string} with review text state {string}', async function (fixtureName, reviewTextState) {
  const reviewText = reviewTextState === 'missing' ? undefined : '   ';
  const body = buildCompletionBody(this, { reviewText, notice: true });
  await completeRegistration(this, fixtureName, Object.keys(body).length === 0 ? undefined : body);
});

When('I complete the PF-task-005 registration {string} with review text, accepted notice, and no rating', async function (fixtureName) {
  await completeRegistration(this, fixtureName, buildCompletionBody(this, { useRememberedReviewText: true, notice: true }));
});

When(/^I complete the PF-task-005 registration "([^"]+)" with raw rating (.+)$/u, async function (fixtureName, rawRating) {
  await completeRegistration(this, fixtureName, buildCompletionBody(this, {
    useRememberedReviewText: true,
    notice: true,
    rating: JSON.parse(rawRating),
  }));
});

When('a PF-task-005 completion persistence failure is simulated for {string}', async function (fixtureName) {
  const fixture = fixtureFor(fixtureName);
  getState(this).simulatedFailure = await runBackendProbe(COMPLETION_FAILURE_PROBE, {
    PF_TASK_005_FIXTURE: JSON.stringify(fixture),
    PF_TASK_005_STUDENT_ID: studentId,
    PF_TASK_005_REVIEWER_ID: actors.teacher.id,
  });
});

When('I complete the PF-task-005 registration {string} with review text and notice {string}', async function (fixtureName, notice) {
  await completeRegistration(this, fixtureName, buildCompletionBody(this, {
    useRememberedReviewText: true,
    notice: noticeValue(notice),
  }));
});

When('I complete the PF-task-005 registration {string} with review text, accepted notice, and rating {int}', async function (fixtureName, rating) {
  await completeRegistration(this, fixtureName, buildCompletionBody(this, {
    useRememberedReviewText: true,
    notice: true,
    rating,
  }));
});

Then('the latest PF-task-005 API response status should be {int}', function (expectedStatus) {
  const { lastApiStatus, lastApiPayload } = latestApiResponse(this);
  assert.equal(
    lastApiStatus,
    expectedStatus,
    `Expected latest API status to be ${expectedStatus}, received ${lastApiStatus}: ${JSON.stringify(lastApiPayload)}`,
  );
});

Then('the PF-task-005 response should include a new portfolio item id for {string}', async function (fixtureName) {
  const { lastApiPayload } = latestApiResponse(this);
  const itemId = lastApiPayload?.portfolio_item_id;
  assert.equal(typeof itemId, 'string', `Expected response to include portfolio_item_id, received ${JSON.stringify(lastApiPayload)}`);

  const beforeIds = new Set((getState(this).remembered?.[fixtureName]?.items ?? []).map((item) => item.id));
  assert.equal(beforeIds.has(itemId), false, `Expected ${itemId} to be a newly created portfolio item id`);

  const snapshot = await readSnapshot(fixtureName);
  assert.equal(typeof snapshot.timeline.completed_at, 'string', `Expected ${fixtureName} to have a completed timestamp`);
  assert.ok(snapshot.items.some((item) => item.id === itemId), `Expected item ${itemId} to be persisted`);
  rememberNewItem(this, fixtureName, itemId);
});

Then('the PF-task-005 canonical item for {string} should copy source display fields', async function (fixtureName) {
  const snapshot = await readSnapshot(fixtureName);
  const item = itemByRememberedId(snapshot, this, fixtureName);
  assertCanonicalItemFields(snapshot, item);
});

Then('the PF-task-005 canonical item for {string} should have no initial review', async function (fixtureName) {
  const item = itemByRememberedId(await readSnapshot(fixtureName), this, fixtureName);
  assert.deepEqual(item.reviews, [], 'Expected teacher completion without review text to create no initial review');
});

Then('the PF-task-005 completion side effects for {string} should be unchanged', async function (fixtureName) {
  const before = getState(this).remembered?.[fixtureName];
  assert.ok(before, `Expected remembered PF-task-005 completion side effects for ${fixtureName}`);
  const after = await readSnapshot(fixtureName);
  assert.deepEqual(after.timeline, before.timeline, `Expected ${fixtureName} lifecycle timestamps to be unchanged`);
  assert.deepEqual(after.items, before.items, `Expected ${fixtureName} portfolio evidence to be unchanged`);
});

Then('the PF-task-005 simulated persistence failure should be reported', function () {
  const failure = getState(this).simulatedFailure;
  assert.equal(failure?.failed_as_expected, true, `Expected simulated persistence failure, received ${JSON.stringify(failure)}`);
  assert.equal(failure.item_persisted, false, `Expected rollback item not to persist, received ${JSON.stringify(failure)}`);
  assert.equal(failure.review_persisted, false, `Expected rollback review not to persist, received ${JSON.stringify(failure)}`);
  assert.ok(String(failure.error ?? '').length > 0, `Expected rollback failure to report an error, received ${JSON.stringify(failure)}`);
});

Then('the PF-task-005 canonical item for {string} should have one initial review with no rating', async function (fixtureName) {
  const item = itemByRememberedId(await readSnapshot(fixtureName), this, fixtureName);
  assert.equal(item.reviews.length, 1, 'Expected exactly one initial review');
  assert.equal(item.reviews[0].review_text, getState(this).reviewText, 'Expected review text to be persisted');
  assert.equal(item.reviews[0].rating, null, 'Expected omitted rating to stay absent');
  assert.equal(typeof item.reviews[0].public_notice_accepted_at, 'string', 'Expected public notice accepted timestamp');
  assert.equal(item.reviews[0].author_id, getState(this).actor.id, 'Expected review author to be the authenticated reviewer');
});

Then('the PF-task-005 canonical item for {string} should have one initial review with rating {int}', async function (fixtureName, rating) {
  const item = itemByRememberedId(await readSnapshot(fixtureName), this, fixtureName);
  assert.equal(item.reviews.length, 1, 'Expected exactly one initial review');
  assert.equal(item.reviews[0].review_text, getState(this).reviewText, 'Expected review text to be persisted');
  assert.equal(item.reviews[0].rating, rating, `Expected rating ${rating} to be persisted`);
  assert.equal(typeof item.reviews[0].public_notice_accepted_at, 'string', 'Expected public notice accepted timestamp');
  assert.equal(item.reviews[0].author_id, getState(this).actor.id, 'Expected review author to be the authenticated reviewer');
});

Then('the PF-task-005 new portfolio item should be visible in the authenticated portfolio', async function () {
  const itemIds = Object.values(getState(this).newItemIds ?? {});
  assert.equal(itemIds.length, 1, 'Expected one remembered new PF-task-005 item id');
  const expectedReviewText = getState(this).reviewText;
  const authToken = getAuthToken(this, 'reading the authenticated portfolio');
  const response = await fetch(`${BACKEND_URL}/portfolios/students/${studentId}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
  });
  const payload = await readJsonSafely(response);

  assert.equal(response.status, 200, `Expected portfolio read to return 200, received ${response.status}: ${JSON.stringify(payload)}`);
  const item = (payload.items ?? []).find((candidate) => candidate.id === itemIds[0]);
  assert.ok(item, `Expected new portfolio item ${itemIds[0]} to be visible to the authenticated viewer`);
  assert.equal(item.visibility?.viewer_can_see, true, 'Expected visibility metadata to mark the item visible');
  assert.ok(
    (item.reviews ?? []).some((review) => review.review_text === expectedReviewText && review.rating === null),
    `Expected the unrated review '${expectedReviewText}' to be visible on the authenticated portfolio item`,
  );
});
