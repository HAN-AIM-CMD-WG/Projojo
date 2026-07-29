const assert = require('node:assert/strict');

const { Given, Then, When } = require('@qavajs/core');

const { BACKEND_URL, PORTFOLIO_SEED_ALIASES } = require('../support/test-data.cjs');

const actors = PORTFOLIO_SEED_ALIASES.actors;
const items = PORTFOLIO_SEED_ALIASES.items;

const PORTFOLIO_PATH = '/portfolios/students/{student_id}';

// Documented example name -> the viewer role it must describe and the seed actor whose live
// response it must stay aligned with. These are the three authenticated read viewers of PF-story-003.
const EXAMPLE_VIEWERS = Object.freeze({
  student_owner: Object.freeze({ role: 'student', actor: actors.student }),
  teacher: Object.freeze({ role: 'teacher', actor: actors.teacher }),
  related_supervisor: Object.freeze({ role: 'supervisor', actor: actors.relatedSupervisor }),
});

// Denial callers that must never receive portfolio contents (AC-4).
const DENIAL_CALLERS = Object.freeze({
  'other student': actors.privateStudent,
  'unrelated supervisor': actors.unrelatedSupervisor,
  unauthenticated: null,
});

// Human-readable item tokens -> deterministic seed ids used by the redaction assertions.
const ITEM_TOKENS = Object.freeze({
  'low-rating': items.lowRating.id,
  retracted: items.retractedAuthenticatedPublic.id,
  hidden: items.hidden.id,
  retired: items.retired.id,
  'mixed-ratings': items.mixedRatings.id,
});

function state(world) {
  world.pfTask007d = world.pfTask007d ?? { operation: null, examples: {}, live: {} };
  return world.pfTask007d;
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

async function requestPortfolio(studentId, { authToken } = {}) {
  const headers = { Accept: 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const response = await fetch(`${BACKEND_URL}/portfolios/students/${studentId}`, { method: 'GET', headers });
  return { status: response.status, payload: await readJsonSafely(response) };
}

function operation(world) {
  const op = state(world).operation;
  assert.ok(op, 'Expected the documented authenticated portfolio operation to have been loaded first');
  return op;
}

function jsonContent(op, code) {
  const response = op.responses?.[String(code)];
  assert.ok(response, `Expected the contract to document a ${code} response`);
  const content = response.content?.['application/json'];
  assert.ok(content, `Expected the ${code} response to document an application/json body`);
  return content;
}

function documentedExample(world, name) {
  const cached = state(world).examples[name];
  if (cached) return cached;
  const content = jsonContent(operation(world), 200);
  const examples = content.examples;
  assert.ok(examples, 'Expected the 200 response to document named examples (an "examples" map)');
  const entry = examples[name];
  assert.ok(entry, `Expected a documented 200 example named "${name}", found: ${Object.keys(examples).join(', ')}`);
  assert.ok('value' in entry, `Expected documented example "${name}" to carry a "value"`);
  state(world).examples[name] = entry.value;
  return entry.value;
}

function liveResponse(world, name) {
  const live = state(world).live[name];
  assert.ok(live, `Expected the live "${name}" response to have been captured first`);
  return live;
}

function resolveItemIds(tokenList) {
  return tokenList.split(',').map((token) => {
    const id = ITEM_TOKENS[token.trim()];
    assert.ok(id, `Unknown PF-task-007d item token '${token}'. Known: ${Object.keys(ITEM_TOKENS).join(', ')}`);
    return id;
  });
}

// Collect the field paths present anywhere in a JSON value. Arrays are flattened by element
// (empty arrays contribute nothing), objects descend by key, and every scalar/null leaf records
// its dotted path into `all`; non-null leaves are also recorded into `nonNull`. Comparing these
// sets proves two payloads share the same field names regardless of concrete values, timestamps,
// or how many items/reviews each contains. Tracking `nonNull` separately matters because FastAPI
// strips null-valued keys from OpenAPI examples, so an example cannot represent a field that is
// always null on this endpoint (e.g. retired_at/hidden_at, since retired and hidden items are
// filtered out before the response is built).
function collectPaths(value, prefix, all, nonNull) {
  if (Array.isArray(value)) {
    for (const element of value) collectPaths(element, `${prefix}[]`, all, nonNull);
  } else if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      collectPaths(value[key], prefix ? `${prefix}.${key}` : key, all, nonNull);
    }
  } else {
    all.add(prefix);
    if (value !== null && value !== undefined) nonNull.add(prefix);
  }
}

function fieldPaths(value) {
  return fieldPathSets(value).all;
}

function fieldPathSets(value) {
  const all = new Set();
  const nonNull = new Set();
  collectPaths(value, '', all, nonNull);
  return { all, nonNull };
}

function itemShape(payload) {
  const item = (payload.items ?? [])[0];
  assert.ok(item, 'Expected the payload to expose at least one item to compare its field shape');
  return fieldPaths(item);
}

function itemIds(payload) {
  assert.ok(Array.isArray(payload.items), 'Expected the payload to carry an items array');
  return payload.items.map((item) => item.id);
}

function reviewsOf(payload) {
  const topLevel = payload.reviews ?? [];
  const nested = (payload.items ?? []).flatMap((item) => item.reviews ?? []);
  return [...topLevel, ...nested];
}

Given('the documented authenticated portfolio response contract is loaded from the API schema', async function () {
  const response = await fetch(`${BACKEND_URL}/openapi.json`, { headers: { Accept: 'application/json' } });
  assert.equal(response.status, 200, `Expected /openapi.json to return 200, received ${response.status}`);
  const doc = await readJsonSafely(response);
  const op = doc?.paths?.[PORTFOLIO_PATH]?.get;
  assert.ok(op, `Expected the schema to document GET ${PORTFOLIO_PATH}`);
  state(this).doc = doc;
  state(this).operation = op;
});

Then('the {string} 200 response example is documented', function (name) {
  // Throws with a helpful message when the named example is absent.
  documentedExample(this, name);
});

Then('the {string} example describes viewer role {string}', function (name, expectedRole) {
  const example = documentedExample(this, name);
  assert.equal(
    example.viewer_role,
    expectedRole,
    `Expected documented example "${name}" to describe viewer_role '${expectedRole}', received '${example.viewer_role}'`,
  );
});

Then(
  'the {string} example exposes portfolio settings, item, curation, archived-source, visibility, and review fields',
  function (name) {
    const paths = fieldPaths(documentedExample(this, name));
    const required = [
      'viewer_role',
      'student.portfolio_slug',
      'student.is_portfolio_world_public',
      'items[].source_registration_id',
      'items[].curation.is_authenticated_public_retraction',
      'items[].curation.is_retired',
      'items[].archived_source.project',
      'items[].source_navigation.state',
      'items[].visibility.reason',
      'items[].reviews[].author.role',
      'reviews[].id',
      'reviews[].rating',
    ];
    for (const path of required) {
      assert.ok(paths.has(path), `Expected documented example "${name}" to expose the '${path}' contract field`);
    }
  },
);

When('I capture the live authenticated portfolio response as the {string} viewer', async function (name) {
  const viewer = EXAMPLE_VIEWERS[name];
  assert.ok(viewer, `Unknown PF-task-007d example viewer '${name}'. Known: ${Object.keys(EXAMPLE_VIEWERS).join(', ')}`);
  const authToken = await login(viewer.actor);
  const live = await requestPortfolio(actors.student.id, { authToken });
  assert.equal(live.status, 200, `Expected the live "${name}" portfolio read to return 200, received ${live.status}`);
  assert.equal(
    live.payload?.viewer_role,
    viewer.role,
    `Expected the live "${name}" response to describe viewer_role '${viewer.role}', received '${live.payload?.viewer_role}'`,
  );
  state(this).live[name] = live.payload;
});

Then('the {string} example field names match the live {string} response', function (exampleName, liveName) {
  const examplePaths = fieldPaths(documentedExample(this, exampleName));
  const { all: liveAll, nonNull: liveNonNull } = fieldPathSets(liveResponse(this, liveName));

  // Every field the live response ever populates must be documented. The example may omit fields
  // that are null in every live item, because FastAPI strips null keys from OpenAPI examples.
  const undocumented = [...liveNonNull].filter((path) => !examplePaths.has(path));
  // The example must not invent fields the API never returns.
  const invented = [...examplePaths].filter((path) => !liveAll.has(path));

  assert.deepEqual(
    undocumented,
    [],
    `Documented example "${exampleName}" is missing value-bearing field(s) the live response returns: ${undocumented.join(', ')}`,
  );
  assert.deepEqual(
    invented,
    [],
    `Documented example "${exampleName}" documents field(s) the live response never returns: ${invented.join(', ')}`,
  );
});

Then('the documented schema lists the curation moderation fields {string}', function (csv) {
  const props = state(this).doc?.components?.schemas?.PortfolioCuration?.properties;
  assert.ok(props, 'Expected the PortfolioCuration schema to be documented in the OpenAPI components');
  for (const name of csv.split(',').map((token) => token.trim())) {
    assert.ok(name in props, `Expected the curation schema to document the '${name}' moderation field, found: ${Object.keys(props).join(', ')}`);
  }
});

Then('the {string} example omits the {string} items', function (name, tokenList) {
  const documentedIds = itemIds(documentedExample(this, name));
  for (const excludedId of resolveItemIds(tokenList)) {
    assert.ok(
      !documentedIds.includes(excludedId),
      `Expected documented example "${name}" to omit item ${excludedId}, but it is present`,
    );
  }
});

Then('the live {string} response omits the {string} items', function (name, tokenList) {
  const liveIds = itemIds(liveResponse(this, name));
  for (const excludedId of resolveItemIds(tokenList)) {
    assert.ok(!liveIds.includes(excludedId), `Expected the live "${name}" response to omit item ${excludedId}, got: ${liveIds.join(', ')}`);
  }
});

Then('no review in the {string} example has a rating below three', function (name) {
  const lowRated = reviewsOf(documentedExample(this, name)).filter(
    (review) => typeof review.rating === 'number' && review.rating < 3,
  );
  assert.equal(
    lowRated.length,
    0,
    `Expected documented example "${name}" to expose no review rating below three, found ${JSON.stringify(lowRated.map((review) => review.rating))}`,
  );
});

Then('no review in the live {string} response has a rating below three', function (name) {
  const lowRated = reviewsOf(liveResponse(this, name)).filter(
    (review) => typeof review.rating === 'number' && review.rating < 3,
  );
  assert.equal(
    lowRated.length,
    0,
    `Expected the live "${name}" response to expose no review rating below three, found ${JSON.stringify(lowRated.map((review) => review.rating))}`,
  );
});

Then('the {string} example item shape is identical to the {string} example item shape', function (nameA, nameB) {
  const shapeA = itemShape(documentedExample(this, nameA));
  const shapeB = itemShape(documentedExample(this, nameB));
  assert.deepEqual(
    [...shapeA].sort(),
    [...shapeB].sort(),
    `Expected the "${nameA}" and "${nameB}" example items to share an identical field shape (no per-field redaction)`,
  );
});

Then('the {string} denial response documents an example exposing only an error detail', function (code) {
  const content = jsonContent(operation(this), code);
  const example = content.example ?? content.examples;
  assert.ok(example, `Expected the ${code} response to document an example`);
  const value = 'value' in example ? example.value : example;
  assert.deepEqual(
    Object.keys(value).sort(),
    ['detail'],
    `Expected the documented ${code} example to expose only an error detail, found keys: ${Object.keys(value).join(', ')}`,
  );
});

When('I request the authenticated portfolio as the {string} caller', async function (denial) {
  assert.ok(denial in DENIAL_CALLERS, `Unknown PF-task-007d denial caller '${denial}'. Known: ${Object.keys(DENIAL_CALLERS).join(', ')}`);
  const actor = DENIAL_CALLERS[denial];
  const authToken = actor ? await login(actor) : undefined;
  state(this).denial = await requestPortfolio(actors.student.id, { authToken });
});

Then('the live denial response status is {int}', function (expectedStatus) {
  const denial = state(this).denial;
  assert.ok(denial, 'Expected a denial response to have been recorded first');
  assert.equal(denial.status, expectedStatus, `Expected denial status ${expectedStatus}, received ${denial.status}`);
});

Then('the live denial response exposes only an error detail', function () {
  const denial = state(this).denial;
  assert.ok(denial, 'Expected a denial response to have been recorded first');
  assert.equal(typeof denial.payload, 'object', 'Expected the denial payload to be an object');
  assert.notEqual(denial.payload, null, 'Expected the denial payload not to be null');
  assert.deepEqual(
    Object.keys(denial.payload).sort(),
    ['detail'],
    `Expected the denial response to expose only an error detail (never items or reviews), found keys: ${Object.keys(denial.payload).join(', ')}`,
  );
});

Then('the documented contract notes the endpoint-name divergence from the legacy student portfolio service', function () {
  const description = operation(this).description ?? '';
  assert.match(
    description,
    /students\/\{student_id\}\/portfolio/u,
    'Expected the operation description to name the legacy student portfolio path (students/{student_id}/portfolio)',
  );
  assert.match(
    description,
    /getStudentPortfolio/u,
    'Expected the operation description to reference the legacy frontend service (getStudentPortfolio)',
  );
});
