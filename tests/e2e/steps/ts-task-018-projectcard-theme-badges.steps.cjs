// TS-task-018 — theme badges on the authenticated ProjectCard.
//
// UI suite against the real stack. The seeded proof project's theme links are
// staged per scenario through the real PUT /themes/project/{id} (reusing the
// TS-task-019 Given steps), and the badges are then read off the two authenticated
// surfaces AC-1 names: the overview page (/ontdek) and the organisation page
// (/business/{id}). No network stubbing is involved anywhere in this suite - every
// state under test is one the real backend can produce.
//
// Step text is deliberately prefixed with "the project card" because Cucumber
// matches step text globally: the TS-task-019 details-page suite owns the
// similarly-shaped "theme pill" steps, and this file must not collide with them.
// The catalog reset, the per-scenario link staging, the student login and the
// icon-less theme fixture are reused from TS-task-009/019 rather than copied.

const assert = require('node:assert/strict');

const { Given, Then, When } = require('@qavajs/core');

const {
  E2E_TEACHER_ID,
  E2E_STUDENT_ID,
  FRONTEND_URL,
  PROOF_BUSINESS_ID,
  PROOF_PROJECT_ID,
  PROOF_PROJECT_NAME,
  PUBLIC_DISCOVERY_URL,
} = require('../support/test-data.cjs');
const { page, loginToken } = require('../support/e2e-session.cjs');
const { themeApi } = require('../support/theme-catalog.cjs');

const OVERVIEW_URL = `${FRONTEND_URL}/ontdek`;
const BUSINESS_URL = `${FRONTEND_URL}/business/${PROOF_BUSINESS_ID}`;

// The public card renders its badge at 80% alpha over the project image
// (`${color}CC`). AC-4 requires the authenticated badge to use that same pattern,
// so the expected background is the theme color at exactly that alpha - not the
// flat hex. A theme with no color falls back to this neutral wash.
const BADGE_ALPHA = 0.8;
const NEUTRAL_FALLBACK_BACKGROUND = 'rgba(0, 0, 0, 0.45)';

// The badge's own declared styling. Inherited typography (line-height, letter
// spacing) is deliberately not compared: neither card's badge declares it, so a
// difference there would come from the surrounding page, not from the badge.
//
// `display` is not compared either, for a concrete reason: the authenticated card
// stacks its badges in a flex column, and CSS blockifies a flex item's
// `inline-flex` to `flex`. The declaration is the same on both cards - which the
// class-attribute assertion proves - and the rendered box is the same, which the
// measured-size assertion proves. Comparing the computed keyword would flag a
// difference the user cannot see.
const COMPARED_STYLE_PROPERTIES = [
  'backgroundColor',
  'color',
  'fontSize',
  'fontWeight',
  'borderTopLeftRadius',
  'borderBottomRightRadius',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'alignItems',
  'columnGap',
  'backdropFilter',
];

// --- world state -----------------------------------------------------------------

function state(world) {
  if (!world.cardThemeBadge) world.cardThemeBadge = { requests: [], recordedStyle: null };
  return world.cardThemeBadge;
}

/** Record every request the browser makes from this point on. */
function recordRequests(world) {
  page(world).on('request', (request) => {
    state(world).requests.push({ method: request.method(), url: request.url() });
  });
}

// --- element helpers -------------------------------------------------------------

/** The authenticated project card for the proof project, on whichever page is open. */
function card(world) {
  return page(world).locator(`#project-${PROOF_PROJECT_ID}`);
}

/** The public discovery card for the same project. */
function publicCard(world) {
  return page(world).locator(`a[href="/publiek/${PROOF_PROJECT_ID}"]`);
}

function badgeIn(scope) {
  return scope.getByTestId('project-theme-badge');
}

async function visibleCard(world) {
  const element = card(world);
  await element.waitFor({ state: 'visible', timeout: 20_000 });
  return element;
}

/** The card's single theme badge, once the card itself is on screen. */
async function visibleBadge(world) {
  const badge = badgeIn(await visibleCard(world));
  await badge.waitFor({ state: 'visible', timeout: 10_000 });
  return badge;
}

/**
 * Capture the badge's class list, its own computed styling and its rendered size.
 * Both cards show the same theme for the same project, so an identically styled
 * badge must also measure identically.
 */
async function captureStyle(badge) {
  return badge.evaluate((el, properties) => {
    const computed = getComputedStyle(el);
    const styles = {};
    for (const property of properties) styles[property] = computed[property];
    const { width, height } = el.getBoundingClientRect();
    return { className: el.className, styles, size: { width: Math.round(width), height: Math.round(height) } };
  }, COMPARED_STYLE_PROPERTIES);
}

/** '#4CAF50' + alpha -> 'rgba(76, 175, 80, 0.8)', the shape getComputedStyle returns. */
function hexToRgba(hex, alpha) {
  const value = hex.replace('#', '');
  const [r, g, b] = [value.slice(0, 2), value.slice(2, 4), value.slice(4, 6)].map((c) => parseInt(c, 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** The theme names the project is really linked to, read through the real endpoint. */
async function linkedThemeNames() {
  const result = await themeApi(`/themes/project/${PROOF_PROJECT_ID}`, null);
  assert.equal(result.status, 200, `Expected GET /themes/project/{id} to return 200, received ${result.status}`);
  assert.ok(Array.isArray(result.body), `Expected GET /themes/project/{id} to return an array, received ${JSON.stringify(result.body)}`);
  return result.body.map((theme) => theme?.name);
}

// --- Given ------------------------------------------------------------------------

Given('the project is publicly visible', async function () {
  // Sibling suites edit the proof project and can leave it private, so publish it
  // through the real endpoint and verify it really surfaces on the public feed the
  // discovery page reads - otherwise the AC-4 comparison would have nothing to
  // compare against.
  const token = await loginToken(E2E_TEACHER_ID);
  const result = await themeApi(`/projects/${PROOF_PROJECT_ID}/visibility?is_public=true`, token, { method: 'PATCH' });
  assert.equal(result.status, 200, `Expected publishing the proof project to return 200, received ${result.status}: ${JSON.stringify(result.body)}`);

  const publicFeed = await themeApi('/projects/public', null);
  assert.equal(publicFeed.status, 200, `Expected GET /projects/public to return 200, received ${publicFeed.status}`);
  assert.ok(
    publicFeed.body.some((project) => project?.id === PROOF_PROJECT_ID),
    'Expected the proof project to appear on the public feed after publishing it',
  );
});

Given('the student actively works on the project', async function () {
  // A precondition of the seed (the PF-task-004 fixtures hold accepted, uncompleted
  // registrations on this project), asserted rather than assumed: if it ever drifts,
  // the "Actief" badge would silently disappear and the overlap scenario would pass
  // without proving anything.
  const token = await loginToken(E2E_STUDENT_ID);
  const result = await themeApi('/students/registrations', token);
  assert.equal(result.status, 200, `Expected GET /students/registrations to return 200, received ${result.status}`);
  const active = (result.body ?? []).filter(
    (registration) => registration?.project_id === PROOF_PROJECT_ID && registration?.is_accepted === true && !registration?.completed_at,
  );
  assert.ok(
    active.length > 0,
    'Expected the seeded student to hold at least one accepted, uncompleted registration on the proof project',
  );
});

// --- When -------------------------------------------------------------------------

When('I open the overview page filtered to the proof project', async function () {
  recordRequests(this);
  await page(this).goto(OVERVIEW_URL);
  // The overview collapses a business to its first three cards, and sibling suites
  // add projects to this business, so search for the proof project by name instead
  // of hoping it lands in the visible three. The search input is debounced by 300ms;
  // waiting for the card covers that.
  const search = page(this).getByPlaceholder('Zoek organisatie of project...');
  await search.waitFor({ state: 'visible', timeout: 20_000 });
  await search.fill(PROOF_PROJECT_NAME);
  await visibleCard(this);
});

When("I open the organisation page of the project's business", async function () {
  recordRequests(this);
  await page(this).goto(BUSINESS_URL);
  await visibleCard(this);
});

When('I record the styling of the project card theme badge', async function () {
  state(this).recordedStyle = await captureStyle(await visibleBadge(this));
});

When('I open the public discovery page', async function () {
  await page(this).goto(PUBLIC_DISCOVERY_URL);
  await publicCard(this).waitFor({ state: 'visible', timeout: 20_000 });
});

// --- Then: the badge itself (AC-1) ------------------------------------------------

Then('the project card shows exactly one theme badge', async function () {
  await visibleBadge(this);
  assert.equal(
    await badgeIn(card(this)).count(),
    1,
    'Expected the project card to render exactly one theme badge',
  );
});

Then('the project card theme badge is labelled {string}', async function (label) {
  const name = (await visibleBadge(this)).getByTestId('project-theme-badge-name');
  assert.ok(await name.isVisible(), `Expected the theme badge to visibly show the name '${label}'`);
  assert.equal((await name.innerText()).trim(), label, `Expected the theme badge to be labelled '${label}'`);
});

Then("the project card theme badge names one of the project's linked themes", async function () {
  const shown = (await (await visibleBadge(this)).getByTestId('project-theme-badge-name').innerText()).trim();
  const linked = await linkedThemeNames();
  assert.ok(
    linked.includes(shown),
    `Expected the badge to name one of the project's linked themes ${JSON.stringify(linked)}, got '${shown}'`,
  );
});

Then('the project card theme badge shows the Material Symbols icon {string}', async function (icon) {
  const iconEl = (await visibleBadge(this)).getByTestId('project-theme-badge-icon');
  // "shows" means visibly rendered: innerText on a display:none element falls back
  // to textContent, so a hidden glyph would still read "eco".
  assert.ok(await iconEl.isVisible(), `Expected the theme badge to visibly show the '${icon}' icon`);
  const classes = (await iconEl.getAttribute('class')) ?? '';
  assert.ok(classes.includes('material-symbols'), `Expected the badge icon to be a Material Symbols glyph, got class '${classes}'`);
  assert.equal((await iconEl.innerText()).trim(), icon, `Expected the theme badge to show the '${icon}' icon`);
});

Then('the project card theme badge uses the color {string} as its background', async function (hex) {
  const background = await (await visibleBadge(this)).evaluate((el) => getComputedStyle(el).backgroundColor);
  const expected = hexToRgba(hex, BADGE_ALPHA);
  assert.equal(background, expected, `Expected the theme badge background to be ${hex} at ${BADGE_ALPHA} alpha (${expected}), got '${background}'`);
});

// --- Then: the overflow count (AC-2, AC-3) ----------------------------------------

Then('the project card theme badge shows the overflow count {string}', async function (expected) {
  const overflow = (await visibleBadge(this)).getByTestId('project-theme-badge-overflow');
  await overflow.waitFor({ state: 'visible', timeout: 10_000 });
  assert.equal((await overflow.innerText()).trim(), expected, `Expected the badge to summarise the remaining themes as '${expected}'`);
});

Then('the project card theme badge shows no overflow count', async function () {
  const badge = await visibleBadge(this);
  assert.equal(
    await badge.getByTestId('project-theme-badge-overflow').count(),
    0,
    'Expected a single-theme badge to render no overflow count at all',
  );
});

Then('the project card shows no overflow count', async function () {
  assert.equal(
    await (await visibleCard(this)).getByTestId('project-theme-badge-overflow').count(),
    0,
    'Expected a project without themes to render no overflow count',
  );
});

// --- Then: the empty state (AC-3) -------------------------------------------------

Then('the project card shows no theme badge', async function () {
  assert.equal(
    await badgeIn(await visibleCard(this)).count(),
    0,
    'Expected a project without linked themes to render no theme badge',
  );
});

Then('the project card still shows its title, its open positions and its call to action', async function () {
  const element = await visibleCard(this);
  const title = element.getByRole('heading', { name: PROOF_PROJECT_NAME });
  assert.ok(await title.isVisible(), 'Expected the card to still show the project title');

  // Either "N plek(ken) beschikbaar" or "Geen plekken beschikbaar" - both prove the
  // positions row survived the missing badge. Matched case-insensitively because
  // innerText applies the card's `uppercase` text-transform.
  const text = await element.innerText();
  assert.match(text, /plek/i, `Expected the card to still show its open-positions row, got '${text}'`);
  assert.match(text, /bekijk project/i, `Expected the card to still show its call to action, got '${text}'`);
});

// --- Then: the public-card comparison (AC-4) --------------------------------------

Then('the public project card theme badge is styled identically to the recorded one', async function () {
  const recorded = state(this).recordedStyle;
  assert.ok(recorded, 'Expected the authenticated badge styling to have been recorded first');

  const badge = badgeIn(publicCard(this));
  await badge.waitFor({ state: 'visible', timeout: 10_000 });
  const observed = await captureStyle(badge);

  assert.equal(observed.className, recorded.className, 'Expected the public and authenticated theme badges to carry the same classes');
  assert.deepEqual(observed.styles, recorded.styles, 'Expected the public and authenticated theme badges to compute to the same styling');
  assert.deepEqual(observed.size, recorded.size, 'Expected the public and authenticated theme badges to render at the same size');
});

// --- Then: no extra theme traffic (AC-5) ------------------------------------------

Then('no theme endpoint was requested while the page loaded', async function () {
  const themeRequests = state(this).requests.filter((request) => new URL(request.url).pathname.startsWith('/themes'));
  assert.deepEqual(
    themeRequests,
    [],
    `Expected the page to render theme badges without requesting any theme endpoint, saw ${JSON.stringify(themeRequests)}`,
  );
});

// --- Then: a theme without icon or color ------------------------------------------

Then('the project card theme badge shows no icon', async function () {
  assert.equal(
    await (await visibleBadge(this)).getByTestId('project-theme-badge-icon').count(),
    0,
    'Expected a theme without an icon to render no icon element rather than an empty glyph',
  );
});

Then('the project card theme badge falls back to a visible neutral background', async function () {
  const badge = await visibleBadge(this);
  const background = await badge.evaluate((el) => getComputedStyle(el).backgroundColor);
  assert.equal(
    background,
    NEUTRAL_FALLBACK_BACKGROUND,
    `Expected a colorless theme to fall back to the public card's neutral wash, got '${background}'`,
  );
  // The point of the fallback is legibility over the project image: a transparent
  // badge would leave white text on an arbitrary photo.
  const name = badge.getByTestId('project-theme-badge-name');
  assert.ok(await name.isVisible(), 'Expected the theme name to stay visible on the fallback background');
});

// --- Then: co-existence with the active-work badge --------------------------------

Then('the project card shows the active work badge', async function () {
  const work = (await visibleCard(this)).getByTestId('project-card-work-badge');
  await work.waitFor({ state: 'visible', timeout: 10_000 });
  // Case-insensitive: innerText applies the badge's `uppercase` text-transform.
  assert.match((await work.innerText()).trim(), /actief/i, 'Expected the active work badge to read "Actief"');
});

Then('the theme badge and the active work badge do not overlap', async function () {
  const element = await visibleCard(this);
  const themeBox = await badgeIn(element).boundingBox();
  const workBox = await element.getByTestId('project-card-work-badge').boundingBox();
  assert.ok(themeBox && workBox, 'Expected both badges to have a layout box');
  const separated =
    themeBox.y + themeBox.height <= workBox.y ||
    workBox.y + workBox.height <= themeBox.y ||
    themeBox.x + themeBox.width <= workBox.x ||
    workBox.x + workBox.width <= themeBox.x;
  assert.ok(separated, `Expected the two badges not to overlap, got theme ${JSON.stringify(themeBox)} and work ${JSON.stringify(workBox)}`);
});

Then('the theme badge sits above the active work badge', async function () {
  const element = await visibleCard(this);
  const themeBox = await badgeIn(element).boundingBox();
  const workBox = await element.getByTestId('project-card-work-badge').boundingBox();
  assert.ok(themeBox && workBox, 'Expected both badges to have a layout box');
  assert.ok(themeBox.y < workBox.y, `Expected the theme badge (y=${themeBox.y}) to sit above the work badge (y=${workBox.y})`);
});
