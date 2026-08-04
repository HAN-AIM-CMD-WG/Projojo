const assert = require('node:assert/strict');

const { Then, When } = require('@qavajs/core');

const { BACKEND_URL, PORTFOLIO_SEED_ALIASES } = require('../support/test-data.cjs');

const actors = PORTFOLIO_SEED_ALIASES.actors;

// PF-task-011b owns dedicated, mutation-safe teacher soft-hide items (seeded in db/test_seed.tql).
// The teacher hide endpoint has no un-hide counterpart in this task, so a hide is irreversible
// within a run: every hiding scenario uses its own item and the shared "guard" item is never
// successfully hidden. These ids live only here (kept out of the shared `items` alias map on
// purpose) and every item is owned by the world-public owner student.
const ITEM_IDS = Object.freeze({
  hide: 'pf-seed-item-011b-hide',
  excluded: 'pf-seed-item-011b-excluded',
  precedence: 'pf-seed-item-011b-precedence',
  persist: 'pf-seed-item-011b-persist',
  guard: 'pf-seed-item-011b-guard',
  retired: 'pf-seed-item-011b-retired',
  rehide: 'pf-seed-item-011b-rehide',
});

const ROLE_ACTORS = Object.freeze({
  owner: actors.student,
  teacher: actors.teacher,
  student: actors.student,
  'related supervisor': actors.relatedSupervisor,
});

const OWNER_ID = actors.student.id;
const TEACHER_ID = actors.teacher.id;
const SECOND_TEACHER_ID = actors.secondTeacher.id;
const OTHER_STUDENT_ID = actors.privateStudent.id;
const OWNER_PUBLIC_SLUG = PORTFOLIO_SEED_ALIASES.publicSlugs.existing.slug;

function state(world) {
  world.pfTask011b = world.pfTask011b ?? { hide: null, show: null };
  return world.pfTask011b;
}

function resolveItemId(token) {
  const id = ITEM_IDS[token.trim()];
  assert.ok(id, `Unknown PF-task-011b item token '${token}'. Known: ${Object.keys(ITEM_IDS).join(', ')}`);
  return id;
}

function resolveActor(roleLabel) {
  const actor = ROLE_ACTORS[roleLabel.trim()];
  assert.ok(actor, `Unknown PF-task-011b role '${roleLabel}'. Known: ${Object.keys(ROLE_ACTORS).join(', ')}`);
  return actor;
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

async function login(actor) {
  const response = await fetch(`${BACKEND_URL}/auth/test/login/${actor.id}`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  const payload = await readJsonSafely(response);
  assert.equal(response.status, 200, `Expected ${actor.alias} login to return 200, received ${response.status}`);
  assert.ok(payload?.access_token, `Expected ${actor.alias} login to return an access_token`);
  return payload.access_token;
}

async function hideRequest(studentId, itemId, { authToken } = {}) {
  const headers = { Accept: 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const response = await fetch(`${BACKEND_URL}/portfolios/students/${studentId}/items/${itemId}/hide`, {
    method: 'PATCH',
    headers,
  });
  return { status: response.status, payload: await readJsonSafely(response) };
}

async function teacherHide(studentId, itemId) {
  const authToken = await login(actors.teacher);
  return hideRequest(studentId, itemId, { authToken });
}

async function teacherHideAs(actor, studentId, itemId) {
  const authToken = await login(actor);
  return hideRequest(studentId, itemId, { authToken });
}

async function fetchAuthenticatedPortfolio(actor, studentId) {
  const authToken = await login(actor);
  const response = await fetch(`${BACKEND_URL}/portfolios/students/${studentId}`, {
    method: 'GET',
    headers: { Accept: 'application/json', Authorization: `Bearer ${authToken}` },
  });
  return { status: response.status, payload: await readJsonSafely(response) };
}

async function fetchPublicPortfolio(slug) {
  const response = await fetch(`${BACKEND_URL}/portfolio/${slug}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  return { status: response.status, payload: await readJsonSafely(response) };
}

// The owner's curation endpoint returns the item straight from ownership-scoped storage without
// applying the hidden/retired read filters, so it is the honest way to prove a teacher-hidden item
// is still stored (and to read its persisted curation) from the API surface.
async function ownerReadItem(itemId, body = {}) {
  const authToken = await login(actors.student);
  const response = await fetch(`${BACKEND_URL}/portfolios/me/items/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${authToken}` },
    body: JSON.stringify(body),
  });
  return { status: response.status, payload: await readJsonSafely(response) };
}

function viewItemIds(view) {
  assert.equal(view.status, 200, `Expected the portfolio read to return 200, received ${view.status}`);
  assert.ok(Array.isArray(view.payload?.items), 'Expected the portfolio read to carry an items array');
  return view.payload.items.map((item) => item.id);
}

function requireHide(world) {
  const { hide } = state(world);
  assert.ok(hide, 'Expected a PF-task-011b teacher soft-hide response to have been recorded first');
  return hide;
}

function hiddenCuration(world, itemToken) {
  const hide = requireHide(world);
  const itemId = resolveItemId(itemToken);
  assert.equal(hide.status, 200, `Expected a successful soft-hide, received ${hide.status}: ${JSON.stringify(hide.payload)}`);
  assert.equal(hide.payload?.id, itemId, `Expected the soft-hide to return item ${itemId}, received ${hide.payload?.id}`);
  assert.ok(hide.payload?.curation, `Expected the soft-hide to return a curation block, received ${JSON.stringify(hide.payload)}`);
  return hide.payload.curation;
}

// --- Teacher soft-hide actions (the behavior under test). -----------------------------------

// One registration per phrase: qavajs step matching is keyword-agnostic, so this serves both the
// Given (precondition) and When (action) usages in the feature.
When('PF-task-011b the teacher soft-hides the {string} item', async function (itemToken) {
  const itemId = resolveItemId(itemToken);
  state(this).hide = { itemId, itemToken, ...(await teacherHide(OWNER_ID, itemId)) };
});

// Re-hide by a different teacher: proves the recorded hiddenByUserId is overwritten with the
// latest acting teacher's id (the metadata delete-then-insert in set_teacher_hidden).
When('PF-task-011b the second teacher soft-hides the {string} item', async function (itemToken) {
  const itemId = resolveItemId(itemToken);
  state(this).hide = { itemId, itemToken, ...(await teacherHideAs(actors.secondTeacher, OWNER_ID, itemId)) };
});

// --- Denied soft-hide attempts (recorded without asserting success). ------------------------

When('PF-task-011b a {string} attempts to soft-hide the {string} item', async function (roleLabel, itemToken) {
  const itemId = resolveItemId(itemToken);
  const authToken = await login(resolveActor(roleLabel));
  state(this).hide = { itemId, itemToken, ...(await hideRequest(OWNER_ID, itemId, { authToken })) };
});

When('PF-task-011b an unauthenticated caller attempts to soft-hide the {string} item', async function (itemToken) {
  const itemId = resolveItemId(itemToken);
  state(this).hide = { itemId, itemToken, ...(await hideRequest(OWNER_ID, itemId)) };
});

When('PF-task-011b the teacher attempts to soft-hide the {string} item under a different student', async function (itemToken) {
  const itemId = resolveItemId(itemToken);
  // The item really belongs to OWNER_ID; naming a different student must not hide it (404).
  state(this).hide = { itemId, itemToken, ...(await teacherHide(OTHER_STUDENT_ID, itemId)) };
});

// --- Student show attempt (must not override the teacher hide). ------------------------------

When('PF-task-011b the owner attempts to show the {string} item', async function (itemToken) {
  const itemId = resolveItemId(itemToken);
  state(this).show = { itemId, itemToken, ...(await ownerReadItem(itemId, { is_student_hidden: false })) };
});

// --- Soft-hide response assertions. ---------------------------------------------------------

Then('PF-task-011b the hide response should report the {string} item as hidden by a teacher', function (itemToken) {
  const curation = hiddenCuration(this, itemToken);
  assert.equal(curation.is_hidden, true, `Expected the item to be hidden, received ${JSON.stringify(curation)}`);
  assert.equal(curation.hidden_by_role, 'teacher', `Expected the item to be hidden by a teacher, received ${JSON.stringify(curation)}`);
});

Then('PF-task-011b the hide response should record which teacher hid it and when', function () {
  const hide = requireHide(this);
  const curation = hide.payload?.curation ?? {};
  assert.equal(
    curation.hidden_by_user_id,
    TEACHER_ID,
    `Expected the hide to record the acting teacher id ${TEACHER_ID}, received ${JSON.stringify(curation)}`,
  );
  assert.ok(
    typeof curation.hidden_at === 'string' && !Number.isNaN(Date.parse(curation.hidden_at)),
    `Expected the hide to record a hidden_at timestamp, received ${JSON.stringify(curation)}`,
  );
});

Then('PF-task-011b the hide response should record the second teacher as the moderator who hid it', function () {
  const hide = requireHide(this);
  const curation = hide.payload?.curation ?? {};
  assert.equal(
    curation.hidden_by_user_id,
    SECOND_TEACHER_ID,
    `Expected the re-hide to overwrite hidden_by_user_id with the second teacher id ${SECOND_TEACHER_ID}, received ${JSON.stringify(curation)}`,
  );
  assert.equal(
    curation.hidden_by_role,
    'teacher',
    `Expected the item to remain hidden by a teacher, received ${JSON.stringify(curation)}`,
  );
});

Then('PF-task-011b the soft-hide attempt should be denied with status {int}', function (expectedStatus) {
  const hide = requireHide(this);
  assert.equal(
    hide.status,
    expectedStatus,
    `Expected the soft-hide to be denied with ${expectedStatus}, received ${hide.status}: ${JSON.stringify(hide.payload)}`,
  );
  assert.equal(
    hide.payload?.curation,
    undefined,
    `Expected a denied soft-hide to return no mutated item, received ${JSON.stringify(hide.payload)}`,
  );
});

// --- Precedence assertions (student show leaves the teacher hide in effect). -----------------

Then('PF-task-011b the show attempt should return status {int}', function (expectedStatus) {
  const { show } = state(this);
  assert.ok(show, 'Expected a PF-task-011b student show response to have been recorded first');
  assert.equal(
    show.status,
    expectedStatus,
    `Expected the student show to return ${expectedStatus}, received ${show.status}: ${JSON.stringify(show.payload)}`,
  );
});

Then('PF-task-011b the show response should report the {string} item as still hidden by a teacher', function (itemToken) {
  const { show } = state(this);
  const itemId = resolveItemId(itemToken);
  assert.ok(show, 'Expected a PF-task-011b student show response to have been recorded first');
  const curation = show.payload?.curation ?? {};
  assert.equal(show.payload?.id, itemId, `Expected the show to return item ${itemId}, received ${show.payload?.id}`);
  assert.equal(curation.is_student_hidden, false, `Expected the student show to have cleared the student flag, received ${JSON.stringify(curation)}`);
  assert.equal(curation.is_hidden, true, `Expected the teacher hide to remain in effect, received ${JSON.stringify(curation)}`);
  assert.equal(curation.hidden_by_role, 'teacher', `Expected the item to remain hidden by a teacher, received ${JSON.stringify(curation)}`);
});

// --- Read-model assertions across roles and the world-public page. --------------------------

// One registration per phrase (keyword-agnostic): used as a Given precondition in the feature.
Then('PF-task-011b the {string} view should include the {string} item', async function (roleLabel, itemToken) {
  const ids = viewItemIds(await fetchAuthenticatedPortfolio(resolveActor(roleLabel), OWNER_ID));
  const itemId = resolveItemId(itemToken);
  assert.ok(ids.includes(itemId), `Expected the "${roleLabel}" view to include '${itemToken}' (${itemId}), got: ${ids.join(', ')}`);
});

Then('PF-task-011b the {string} view should exclude the {string} item', async function (roleLabel, itemToken) {
  const ids = viewItemIds(await fetchAuthenticatedPortfolio(resolveActor(roleLabel), OWNER_ID));
  const itemId = resolveItemId(itemToken);
  assert.ok(!ids.includes(itemId), `Expected the "${roleLabel}" view to exclude '${itemToken}' (${itemId}), got: ${ids.join(', ')}`);
});

Then('PF-task-011b the world-public page should include the {string} item', async function (itemToken) {
  const ids = viewItemIds(await fetchPublicPortfolio(OWNER_PUBLIC_SLUG));
  const itemId = resolveItemId(itemToken);
  assert.ok(ids.includes(itemId), `Expected the world-public page '${OWNER_PUBLIC_SLUG}' to include '${itemToken}' (${itemId}), got: ${ids.join(', ')}`);
});

Then('PF-task-011b the world-public page should exclude the {string} item', async function (itemToken) {
  const ids = viewItemIds(await fetchPublicPortfolio(OWNER_PUBLIC_SLUG));
  const itemId = resolveItemId(itemToken);
  assert.ok(!ids.includes(itemId), `Expected the world-public page '${OWNER_PUBLIC_SLUG}' to exclude '${itemToken}' (${itemId}), got: ${ids.join(', ')}`);
});

// --- Unchanged-guard and no-hard-delete assertions. -----------------------------------------

Then('PF-task-011b the {string} item should still be shown to the owner', async function (itemToken) {
  const ids = viewItemIds(await fetchAuthenticatedPortfolio(actors.student, OWNER_ID));
  const itemId = resolveItemId(itemToken);
  assert.ok(
    ids.includes(itemId),
    `Expected '${itemToken}' (${itemId}) to remain visible to the owner after the denied attempt, got: ${ids.join(', ')}`,
  );
});

Then('PF-task-011b the {string} item should still be stored after the hide', async function (itemToken) {
  const itemId = resolveItemId(itemToken);
  // 1. A repeat teacher hide still resolves the item by ownership; a hard delete would 404 here.
  const rehide = await teacherHide(OWNER_ID, itemId);
  assert.equal(rehide.status, 200, `Expected a repeat soft-hide of a stored item to return 200, received ${rehide.status}: ${JSON.stringify(rehide.payload)}`);
  assert.equal(rehide.payload?.id, itemId, `Expected the repeat soft-hide to return the stored item ${itemId}, received ${rehide.payload?.id}`);
  // 2. The owner can still read the persisted record straight from storage, and it is hidden, not gone.
  const owned = await ownerReadItem(itemId);
  assert.equal(owned.status, 200, `Expected the owner to still read the stored item, received ${owned.status}: ${JSON.stringify(owned.payload)}`);
  assert.equal(owned.payload?.id, itemId, `Expected the stored item ${itemId} to still be readable, received ${owned.payload?.id}`);
  assert.equal(owned.payload?.curation?.is_hidden, true, `Expected the stored item to be hidden rather than deleted, received ${JSON.stringify(owned.payload?.curation)}`);
});

Then('PF-task-011b a DELETE request to the {string} hide endpoint should be rejected with status {int}', async function (itemToken, expectedStatus) {
  const authToken = await login(actors.teacher);
  const response = await fetch(`${BACKEND_URL}/portfolios/students/${OWNER_ID}/items/${resolveItemId(itemToken)}/hide`, {
    method: 'DELETE',
    headers: { Accept: 'application/json', Authorization: `Bearer ${authToken}` },
  });
  assert.equal(
    response.status,
    expectedStatus,
    `Expected DELETE on the hide endpoint to be rejected with ${expectedStatus} (soft-hide is not delete-based), received ${response.status}`,
  );
});
