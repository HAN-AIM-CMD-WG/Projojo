const assert = require('node:assert/strict');

const { Given, Then, When } = require('@qavajs/core');

const { BACKEND_URL, FRONTEND_URL } = require('../support/test-data.cjs');
const { page } = require('../support/e2e-session.cjs');

// PF-task-013 owns the world-public portfolio API contract and the minimal unauthenticated route
// shell. It reuses the canonical read-only world-public student ("Tom Teststudent",
// portfolio-seed-world-public) for the bulk selected/excluded assertions, plus two dedicated
// PF-task-013 fixtures (summary-only + content) seeded in db/test_seed.tql that prove the two
// clauses Tom's page cannot: summary-only output (AC-2), rating/retraction independence (AC-3), and
// a world-visible-flagged review on a non-public item (AC-4). Ids live here on purpose, mirroring
// how PF-task-011a/012a keep their ids local to their step files.
const SLUGS = Object.freeze({
  private: 'portfolio-seed-private',
  unknown: 'portfolio-seed-unknown-slug-pf-013',
  'summary-only': 'portfolio-seed-013-summary-only',
  'world-public': 'portfolio-seed-world-public',
  content: 'portfolio-seed-013-content',
});

// Expected student-safe identity per slug (only the fields the public page must expose).
const IDENTITY = Object.freeze({
  'portfolio-seed-013-summary-only': Object.freeze({
    full_name: 'Sami Samenvatting',
    portfolio_summary: 'PF-task-013 summary-only world-public portfolio.',
  }),
  'portfolio-seed-world-public': Object.freeze({
    full_name: 'Tom Teststudent',
    portfolio_summary: 'Portfolio seed student with deterministic completed evidence fixtures.',
  }),
});

const ITEM_IDS = Object.freeze({
  'world-public-selected': 'pf-seed-item-world-public-selected',
  hidden: 'pf-seed-item-hidden',
  retired: 'pf-seed-item-retired',
  retracted: 'pf-seed-item-retracted-authenticated-public',
  'low-rating': 'pf-seed-item-low-rating',
  'no-ratings': 'pf-seed-item-no-ratings',
  'archived-source': 'pf-seed-item-archived-source',
  'content-included': 'pf-seed-item-013-included',
  'content-nonpublic': 'pf-seed-item-013-nonpublic',
});

const REVIEW_IDS = Object.freeze({
  'world-public-selected': 'pf-seed-review-world-public-selected',
  'good-teacher': 'pf-seed-review-good-teacher',
  'good-supervisor': 'pf-seed-review-good-supervisor',
  'low-rating': 'pf-seed-review-low-rating',
  hidden: 'pf-seed-review-hidden',
  retracted: 'pf-seed-review-retracted',
  'no-rating': 'pf-seed-review-no-rating',
  'content-included': 'pf-seed-review-013-included',
  'content-leak': 'pf-seed-review-013-leak',
});

const PUBLIC_PATH = '/portfolio/{slug}';

// Authenticated-only field markers that must never appear anywhere in a public response or a
// documented public example. Each is matched as a dotted-path segment/substring produced by
// collectPaths (arrays flattened as "[]"), except student id which is matched as an exact top-level
// path so it does not clash with the allowed items[].id / reviews[].id keys.
const FORBIDDEN_PATH_SUBSTRINGS = Object.freeze([
  'curation',
  'source_navigation',
  'archived_source',
  'source_registration_id',
  'source_task_id',
  'source_project_id',
  'source_business_id',
  'source_student_id',
  'author.id',
  'is_world_visible',
  'is_portfolio_world_public',
  'hidden_by_user_id',
  'hidden_by_role',
]);
const FORBIDDEN_EXACT_PATHS = Object.freeze(['student.id']);

// Exhaustive allow-list of every leaf field path a world-public 200 response may expose (arrays
// flattened as "[]" to match collectPaths). This is a deny-by-default backstop for the reduced
// public contract: because the handler returns the full authenticated dicts and relies on
// FastAPI's response_model to strip authenticated-only fields, a future field added to a shared
// display model (PortfolioTaskDisplay/Project/Business/Visibility) or to the returned dict would
// silently ride along. FORBIDDEN_* only catches known bad names; this set catches ANY new field by
// asserting the live response introduces no path outside the student-safe contract.
const ALLOWED_PUBLIC_PATHS = Object.freeze([
  'student.full_name',
  'student.image_path',
  'student.portfolio_summary',
  'student.portfolio_slug',
  'items[].id',
  'items[].completed_at',
  'items[].task.name',
  'items[].task.description',
  'items[].project.name',
  'items[].project.description',
  'items[].business.name',
  'items[].business.location',
  'items[].skills[]',
  'items[].timeline_start_date',
  'items[].timeline_end_date',
  'items[].visibility.viewer_can_see',
  'items[].visibility.reason',
  'items[].reviews[].id',
  'items[].reviews[].item_id',
  'items[].reviews[].review_text',
  'items[].reviews[].rating',
  'items[].reviews[].created_at',
  'items[].reviews[].public_notice_accepted_at',
  'items[].reviews[].author.role',
  'items[].reviews[].author.full_name',
  'reviews[].id',
  'reviews[].item_id',
  'reviews[].review_text',
  'reviews[].rating',
  'reviews[].created_at',
  'reviews[].public_notice_accepted_at',
  'reviews[].author.role',
  'reviews[].author.full_name',
]);

function state(world) {
  world.pfTask013 = world.pfTask013 ?? { response: null, contract: null };
  return world.pfTask013;
}

function resolveSlug(token) {
  const slug = SLUGS[token.trim()];
  assert.ok(slug, `Unknown PF-task-013 slug token '${token}'. Known: ${Object.keys(SLUGS).join(', ')}`);
  return slug;
}

function resolveItemIds(csv) {
  return csv.split(',').map((token) => {
    const id = ITEM_IDS[token.trim()];
    assert.ok(id, `Unknown PF-task-013 item token '${token}'. Known: ${Object.keys(ITEM_IDS).join(', ')}`);
    return id;
  });
}

function resolveReviewIds(csv) {
  return csv.split(',').map((token) => {
    const id = REVIEW_IDS[token.trim()];
    assert.ok(id, `Unknown PF-task-013 review token '${token}'. Known: ${Object.keys(REVIEW_IDS).join(', ')}`);
    return id;
  });
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

async function fetchPublicPortfolio(slug) {
  const response = await fetch(`${BACKEND_URL}/portfolio/${slug}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  return { status: response.status, payload: await readJsonSafely(response) };
}

function requireResponse(world) {
  const { response } = state(world);
  assert.ok(response, 'Expected a PF-task-013 public portfolio response to have been requested first');
  return response;
}

function requireOkPayload(world) {
  const response = requireResponse(world);
  assert.equal(
    response.status,
    200,
    `Expected the public portfolio read to return 200, received ${response.status}: ${JSON.stringify(response.payload)}`,
  );
  assert.equal(typeof response.payload, 'object', 'Expected the public portfolio payload to be an object');
  assert.notEqual(response.payload, null, 'Expected the public portfolio payload not to be null');
  return response.payload;
}

// Collect every leaf field path in a JSON value. Arrays are flattened by element ("[]"), objects
// descend by key, and every scalar/null leaf records its dotted path. This lets us assert both the
// absence of authenticated-only fields and that a documented example's field shape matches the live
// response, regardless of concrete values.
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

function fieldPathSets(value) {
  const all = new Set();
  const nonNull = new Set();
  collectPaths(value, '', all, nonNull);
  return { all, nonNull };
}

function forbiddenPathsIn(value) {
  const { all } = fieldPathSets(value);
  return [...all].filter(
    (path) =>
      FORBIDDEN_EXACT_PATHS.includes(path) ||
      FORBIDDEN_PATH_SUBSTRINGS.some((marker) => path.includes(marker)),
  );
}

function assertNoAuthenticatedOnlyFields(value, label) {
  const leaks = forbiddenPathsIn(value);
  assert.deepEqual(leaks, [], `Expected ${label} to expose no authenticated-only fields, found: ${leaks.join(', ')}`);
}

function assertOnlyAllowedFields(value, label) {
  const allowed = new Set(ALLOWED_PUBLIC_PATHS);
  const { all } = fieldPathSets(value);
  const unexpected = [...all].filter((path) => !allowed.has(path));
  assert.deepEqual(
    unexpected,
    [],
    `Expected ${label} to expose only student-safe fields, found unlisted path(s): ${unexpected.join(', ')}. ` +
      `A new field here means the reduced public contract leaked something: either it is authenticated-only ` +
      `(strip it) or it is a new public field (add it to ALLOWED_PUBLIC_PATHS).`,
  );
}

function topLevelReviews(payload) {
  assert.ok(Array.isArray(payload.reviews), 'Expected the public response to carry a top-level reviews array');
  return payload.reviews;
}

function itemIds(payload) {
  assert.ok(Array.isArray(payload.items), 'Expected the public response to carry an items array');
  return payload.items.map((item) => item.id);
}

// --- Request actions. -----------------------------------------------------------------------

When('PF-task-013 the public portfolio is requested for the {string} slug', async function (token) {
  const slug = resolveSlug(token);
  const response = await fetchPublicPortfolio(slug);
  state(this).response = { ...response, slug };
});

// --- Status and safe-error assertions (AC-1, AC-5). ------------------------------------------

Then('PF-task-013 the public response status should be {int}', function (expectedStatus) {
  const response = requireResponse(this);
  assert.equal(
    response.status,
    expectedStatus,
    `Expected the public response status ${expectedStatus}, received ${response.status}: ${JSON.stringify(response.payload)}`,
  );
});

Then('PF-task-013 the public response should expose only an error detail', function () {
  const { payload } = requireResponse(this);
  assert.equal(typeof payload, 'object', 'Expected the error payload to be an object');
  assert.notEqual(payload, null, 'Expected the error payload not to be null');
  assert.deepEqual(
    Object.keys(payload).sort(),
    ['detail'],
    `Expected a not-found response to expose only an error detail (no student existence, items, reviews, or slug suggestions), found keys: ${Object.keys(payload).join(', ')}`,
  );
});

// --- Summary-only assertions (AC-2). ---------------------------------------------------------

Then('PF-task-013 the public response should expose the student display name and summary', function () {
  const payload = requireOkPayload(this);
  const expected = IDENTITY[requireResponse(this).slug];
  assert.ok(expected, 'Expected known identity expectations for the requested slug');
  assert.equal(payload.student?.full_name, expected.full_name, 'Expected the public response to expose the student display name');
  assert.equal(
    payload.student?.portfolio_summary,
    expected.portfolio_summary,
    `Expected the public response to expose the portfolio summary, received ${JSON.stringify(payload.student)}`,
  );
});

Then('PF-task-013 the public response should carry no items and no reviews', function () {
  const payload = requireOkPayload(this);
  assert.deepEqual(payload.items, [], `Expected a summary-only page to carry no items, received ${JSON.stringify(payload.items)}`);
  assert.deepEqual(payload.reviews, [], `Expected a summary-only page to carry no reviews, received ${JSON.stringify(payload.reviews)}`);
});

Then('PF-task-013 the public response should not expose any authenticated-only fields', function () {
  assertNoAuthenticatedOnlyFields(requireOkPayload(this), 'the live public response');
});

Then('PF-task-013 the public response should expose only student-safe fields', function () {
  assertOnlyAllowedFields(requireOkPayload(this), 'the live public response');
});

// --- Item selection assertions (AC-3). -------------------------------------------------------

Then('PF-task-013 the public response should include the {string} item', function (token) {
  const [expectedId] = resolveItemIds(token);
  const ids = itemIds(requireOkPayload(this));
  assert.ok(ids.includes(expectedId), `Expected the public page to include item '${token}' (${expectedId}), got: ${ids.join(', ')}`);
});

Then('PF-task-013 the public response should exclude the {string} items', function (csv) {
  const ids = itemIds(requireOkPayload(this));
  for (const excludedId of resolveItemIds(csv)) {
    assert.ok(!ids.includes(excludedId), `Expected the public page to exclude item ${excludedId}, got: ${ids.join(', ')}`);
  }
});

// --- Review selection assertions (AC-4). -----------------------------------------------------

Then('PF-task-013 the public response should include the {string} review', function (token) {
  const [expectedId] = resolveReviewIds(token);
  const ids = topLevelReviews(requireOkPayload(this)).map((review) => review.id);
  assert.ok(ids.includes(expectedId), `Expected the public page to include review '${token}' (${expectedId}), got: ${ids.join(', ')}`);
});

Then('PF-task-013 the public response should exclude the {string} reviews', function (csv) {
  const ids = topLevelReviews(requireOkPayload(this)).map((review) => review.id);
  for (const excludedId of resolveReviewIds(csv)) {
    assert.ok(!ids.includes(excludedId), `Expected the public page to exclude review ${excludedId}, got: ${ids.join(', ')}`);
  }
});

Then('PF-task-013 every returned public review should carry a persisted public notice acceptance timestamp', function () {
  const reviews = topLevelReviews(requireOkPayload(this));
  assert.ok(reviews.length >= 1, `Expected at least one returned public review, received ${JSON.stringify(reviews)}`);
  for (const review of reviews) {
    assert.ok(
      typeof review.public_notice_accepted_at === 'string' && review.public_notice_accepted_at.length > 0,
      `Expected public review ${review.id} to carry a persisted public_notice_accepted_at, received ${JSON.stringify(review)}`,
    );
  }
});

Then('PF-task-013 no returned public review should expose a reviewer author id', function () {
  const reviews = topLevelReviews(requireOkPayload(this));
  for (const review of reviews) {
    assert.equal(
      review.author?.id,
      undefined,
      `Expected public review ${review.id} to hide the reviewer author id, received ${JSON.stringify(review.author)}`,
    );
    assert.ok(typeof review.author?.full_name === 'string', `Expected public review ${review.id} to keep the reviewer display name`);
    assert.ok(typeof review.author?.role === 'string', `Expected public review ${review.id} to keep the reviewer role`);
  }
});

// --- Documented contract assertions (AC-7). --------------------------------------------------

async function loadContract(world) {
  const response = await fetch(`${BACKEND_URL}/openapi.json`, { headers: { Accept: 'application/json' } });
  assert.equal(response.status, 200, `Expected /openapi.json to return 200, received ${response.status}`);
  const doc = await readJsonSafely(response);
  const op = doc?.paths?.[PUBLIC_PATH]?.get;
  assert.ok(op, `Expected the schema to document GET ${PUBLIC_PATH}`);
  state(world).contract = op;
  return op;
}

function contract(world) {
  const op = state(world).contract;
  assert.ok(op, 'Expected the public portfolio contract to have been loaded first');
  return op;
}

function documentedExample(world, name) {
  const examples = contract(world).responses?.['200']?.content?.['application/json']?.examples;
  assert.ok(examples, 'Expected the public 200 response to document named examples (an "examples" map)');
  const entry = examples[name];
  assert.ok(entry, `Expected a documented public 200 example named "${name}", found: ${Object.keys(examples).join(', ')}`);
  assert.ok('value' in entry, `Expected documented example "${name}" to carry a "value"`);
  return entry.value;
}

Given('PF-task-013 the public portfolio contract is loaded from the API schema', async function () {
  await loadContract(this);
});

Then('PF-task-013 the public contract documents the {string} 200 example', function (name) {
  documentedExample(this, name);
});

Then('PF-task-013 the public contract documents a private-or-unknown slug 404 example exposing only an error detail', function () {
  const content = contract(this).responses?.['404']?.content?.['application/json'];
  assert.ok(content, 'Expected the public 404 response to document an application/json body');
  const example = content.example ?? content.examples;
  assert.ok(example, 'Expected the public 404 response to document an example');
  const value = example && 'value' in example ? example.value : example;
  assert.deepEqual(
    Object.keys(value).sort(),
    ['detail'],
    `Expected the documented 404 example to expose only an error detail, found keys: ${Object.keys(value).join(', ')}`,
  );
});

Then('PF-task-013 no documented public example exposes any authenticated-only fields', function () {
  const examples = contract(this).responses?.['200']?.content?.['application/json']?.examples;
  assert.ok(examples, 'Expected documented public 200 examples');
  for (const [name, entry] of Object.entries(examples)) {
    assertNoAuthenticatedOnlyFields(entry.value, `documented public example "${name}"`);
  }
});

Then('PF-task-013 the public contract description identifies the authenticated-only fields excluded from public responses', function () {
  const description = contract(this).description ?? '';
  assert.match(description, /authenticated-only/iu, 'Expected the description to call out authenticated-only fields');
  // The description must name concrete excluded fields, not just a vague statement, so the contract
  // remains a usable inventory for the PF-task-017 public page UI.
  for (const field of ['curation', 'source_', 'author id']) {
    assert.ok(
      description.toLowerCase().includes(field.toLowerCase()),
      `Expected the public contract description to identify the excluded '${field}' field(s)`,
    );
  }
});

Then('PF-task-013 the {string} example field shape matches the live public response', function (exampleName) {
  const example = documentedExample(this, exampleName);
  const live = requireOkPayload(this);
  const examplePaths = fieldPathSets(example).all;
  const { all: liveAll, nonNull: liveNonNull } = fieldPathSets(live);

  // Every value-bearing field the live response returns must be documented (FastAPI strips
  // always-null keys from examples, so only non-null live paths are required).
  const undocumented = [...liveNonNull].filter((path) => !examplePaths.has(path));
  // The example must not invent fields the API never returns.
  const invented = [...examplePaths].filter((path) => !liveAll.has(path));

  assert.deepEqual(undocumented, [], `Documented example "${exampleName}" is missing live field(s): ${undocumented.join(', ')}`);
  assert.deepEqual(invented, [], `Documented example "${exampleName}" documents field(s) the live response never returns: ${invented.join(', ')}`);
});

// --- Minimal frontend route shell (AC-6). ----------------------------------------------------

When('PF-task-013 I open the public portfolio route for the {string} slug without authentication', async function (token) {
  const slug = resolveSlug(token);
  const current = page(this);
  // Guarantee an unauthenticated session: clear any token a prior scenario may have stored on this
  // origin before navigating to the public route.
  await current.goto(FRONTEND_URL);
  await current.evaluate(() => localStorage.removeItem('token'));
  await current.goto(`${FRONTEND_URL}/portfolio/${slug}`);
  state(this).uiSlug = slug;
});

Then('PF-task-013 the public portfolio shell should render as a chrome-less unauthenticated page', async function () {
  const current = page(this);
  const shell = current.getByTestId('public-portfolio-page');
  await shell.waitFor({ state: 'visible' });
  assert.equal(await shell.isVisible(), true, 'Expected the public portfolio shell to be visible');

  // Public chrome: the authenticated navbar (header > nav) and footer must not be rendered.
  assert.equal(await current.locator('header nav').count(), 0, 'Expected no authenticated navbar on the public portfolio route');

  // No authentication required and no redirect to the login shell.
  assert.ok(current.url().includes(`/portfolio/${state(this).uiSlug}`), `Expected to stay on the public portfolio route, at ${current.url()}`);
  const token = await current.evaluate(() => localStorage.getItem('token'));
  assert.equal(token, null, 'Expected the public portfolio route to render without an authentication token');
});

Then('PF-task-013 the public portfolio shell should display the seeded student summary', async function () {
  const summary = page(this).getByTestId('public-portfolio-summary');
  await summary.waitFor({ state: 'visible' });
  const expected = IDENTITY[state(this).uiSlug].portfolio_summary;
  const text = (await summary.textContent()) ?? '';
  assert.ok(text.includes(expected), `Expected the public shell to display the seeded summary '${expected}', received '${text}'`);
});

Then('PF-task-013 the public portfolio shell should show a not-found state', async function () {
  const notFound = page(this).getByTestId('public-portfolio-not-found');
  await notFound.waitFor({ state: 'visible' });
  assert.equal(await notFound.isVisible(), true, 'Expected the public portfolio shell to show a not-found state for a private/unknown slug');
});
