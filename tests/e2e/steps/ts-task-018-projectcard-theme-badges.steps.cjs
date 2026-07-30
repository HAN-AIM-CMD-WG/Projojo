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

// The badge fills opaquely with the theme colour and picks its label colour for
// contrast, the same way the theme pills elsewhere in the app do. A theme without
// a colour falls back to the coral those pills use.
const COLORLESS_THEME_FILL = '#FF7F50';

// WCAG AA for normal text. The app's own helper documents that black-or-white
// always clears at least 4.58:1 against any sRGB fill, so anything below this is
// a real defect rather than a borderline colour choice.
const MINIMUM_CONTRAST_RATIO = 4.5;

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

/**
 * Navigate to `url` with every request the browser makes recorded.
 *
 * The listener must be attached before the goto to cover the page's own load, so
 * the previously open page is dropped to about:blank first. Without that, the
 * landing page the login step leaves behind keeps executing for a few
 * milliseconds after the navigation starts, and its DiscoverySection fires
 * GET /themes/ into this recording - traffic that has nothing to do with the page
 * under test.
 */
async function gotoRecording(world, url) {
  const current = state(world);
  await page(world).goto('about:blank');
  page(world).on('request', (request) => {
    current.requests.push({ method: request.method(), url: request.url() });
  });
  await page(world).goto(url);
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
 * Capture the badge's class list, its own computed styling, its label and its
 * rendered size. Both cards show the same theme for the same project, so an
 * identically styled badge must also measure identically.
 *
 * The size is only comparable once the Material Symbols glyphs have arrived. Until
 * then the icon falls back to its literal ligature text at the same 24px, which is
 * 9px wider than the glyph while leaving the badge's height untouched - so a badge
 * measured before the font landed and one measured after differ by exactly that,
 * with nothing else to hint at why.
 */
async function captureStyle(badge) {
  await badge.page().waitForFunction(
    () => document.fonts.check('24px "Material Symbols Outlined"', 'eco'),
    null,
    { timeout: 15_000 },
  );
  return badge.evaluate((el, properties) => {
    const computed = getComputedStyle(el);
    const styles = {};
    for (const property of properties) styles[property] = computed[property];
    const { width, height } = el.getBoundingClientRect();
    return {
      className: el.className,
      styles,
      text: el.innerText.trim(),
      size: { width: Math.round(width), height: Math.round(height) },
    };
  }, COMPARED_STYLE_PROPERTIES);
}

/** '#4CAF50' -> 'rgb(76, 175, 80)', the shape getComputedStyle returns for an opaque fill. */
function hexToRgb(hex) {
  const value = hex.replace('#', '');
  const channels = [value.slice(0, 2), value.slice(2, 4), value.slice(4, 6)].map((c) => parseInt(c, 16));
  return `rgb(${channels.join(', ')})`;
}

/** 'rgb(76, 175, 80)' / 'rgba(76, 175, 80, 0.8)' -> { channels: [76,175,80], alpha: 1 | 0.8 }. */
function parseCssColor(value) {
  const numbers = value.match(/[\d.]+/g);
  assert.ok(numbers && numbers.length >= 3, `Expected a parsable rgb(a) colour, got '${value}'`);
  return { channels: numbers.slice(0, 3).map(Number), alpha: numbers.length > 3 ? Number(numbers[3]) : 1 };
}

/**
 * WCAG 2.1 relative luminance and contrast ratio, computed here from the colours
 * the browser actually rendered. Deliberately an independent implementation: a
 * step that imported the app's own helper would only prove the helper agrees
 * with itself.
 */
function relativeLuminance([r, g, b]) {
  const toLinear = (channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(foreground, background) {
  const [light, dark] = [relativeLuminance(foreground), relativeLuminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

/** The badge's rendered label and fill colours. */
async function badgeColors(world) {
  return (await visibleBadge(world)).evaluate((el) => {
    const computed = getComputedStyle(el);
    return { color: computed.color, backgroundColor: computed.backgroundColor };
  });
}

/** The theme names the project is really linked to, read through the real endpoint. */
async function linkedThemeNames() {
  const result = await themeApi(`/themes/project/${PROOF_PROJECT_ID}`, null);
  assert.equal(result.status, 200, `Expected GET /themes/project/{id} to return 200, received ${result.status}`);
  assert.ok(Array.isArray(result.body), `Expected GET /themes/project/{id} to return an array, received ${JSON.stringify(result.body)}`);
  return result.body.map((theme) => theme?.name);
}

// --- Given ------------------------------------------------------------------------

Given('a theme {string} exists with the color {string}', async function (name, hex) {
  // Created through the real API rather than added to the shared baseline: the
  // extreme colours these scenarios need (near-white, near-black) exist only to
  // exercise the contrast choice and would be noise in the catalog fixtures the
  // other suites assert on.
  const token = await loginToken(E2E_TEACHER_ID);
  const existing = await themeApi('/themes/', token);
  assert.equal(existing.status, 200, `Expected GET /themes/ to return 200, received ${existing.status}`);
  const already = existing.body.find((theme) => theme?.name === name);
  if (already) {
    assert.equal(already.color, hex, `Expected the existing theme '${name}' to carry the color ${hex}`);
    return;
  }

  const created = await themeApi('/themes/', token, {
    method: 'POST',
    body: JSON.stringify({ name, color: hex, description: 'TS-task-018 contrast fixture' }),
  });
  assert.equal(created.status, 201, `Expected creating '${name}' to return 201, received ${created.status}: ${JSON.stringify(created.body)}`);
  assert.equal(created.body?.color, hex, `Expected the created theme '${name}' to persist the color ${hex}, got ${JSON.stringify(created.body?.color)}`);
});

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
  await gotoRecording(this, OVERVIEW_URL);
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
  await gotoRecording(this, BUSINESS_URL);
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
  const { backgroundColor } = await badgeColors(this);
  assert.equal(backgroundColor, hexToRgb(hex), `Expected the theme badge background to be ${hex} (${hexToRgb(hex)}), got '${backgroundColor}'`);
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
  // Before the size: two badges of different width are only comparable if they
  // carry the same label, so a content difference is named rather than surfacing
  // as an unexplained pixel count.
  assert.equal(observed.text, recorded.text, 'Expected both cards to show the same theme badge label');
  assert.deepEqual(observed.size, recorded.size, 'Expected the public and authenticated theme badges to render at the same size');
});

// --- Then: no extra theme traffic (AC-5) ------------------------------------------

Then('no theme endpoint was requested while the page loaded', async function () {
  const { requests } = state(this);
  // Guard against a vacuous pass: if the recording window somehow missed the page's
  // own data loading, "no theme requests" would be true for the wrong reason. The
  // organisation page's project read must be in the window for the absence of theme
  // traffic to mean anything.
  assert.ok(
    requests.some((request) => new URL(request.url).pathname === `/businesses/${PROOF_BUSINESS_ID}/projects`),
    `Expected the recording to cover the page's own project read, saw ${requests.length} requests`,
  );

  const themeRequests = requests.filter((request) => new URL(request.url).pathname.startsWith('/themes'));
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

Then('the project card theme badge falls back to the colorless theme fill', async function () {
  const { backgroundColor } = await badgeColors(this);
  assert.equal(
    backgroundColor,
    hexToRgb(COLORLESS_THEME_FILL),
    `Expected a colorless theme to fall back to ${COLORLESS_THEME_FILL}, the fill the theme pills elsewhere use, got '${backgroundColor}'`,
  );
  const name = (await visibleBadge(this)).getByTestId('project-theme-badge-name');
  assert.ok(await name.isVisible(), 'Expected the theme name to stay visible on the fallback background');
});

// --- Then: text contrast ----------------------------------------------------------

Then('the project card theme badge uses dark text', async function () {
  const { color } = await badgeColors(this);
  assert.deepEqual(parseCssColor(color).channels, [0, 0, 0], `Expected a light theme colour to get black text, got '${color}'`);
});

Then('the project card theme badge uses white text', async function () {
  const { color } = await badgeColors(this);
  assert.deepEqual(parseCssColor(color).channels, [255, 255, 255], `Expected a dark theme colour to get white text, got '${color}'`);
});

Then('the project card theme badge text is legible against its background', async function () {
  const { color, backgroundColor } = await badgeColors(this);
  const foreground = parseCssColor(color);
  const background = parseCssColor(backgroundColor);
  // A translucent fill would make this ratio depend on the project photo behind
  // it, so the measurement is only meaningful on an opaque badge.
  assert.equal(background.alpha, 1, `Expected an opaque badge fill to measure contrast against, got '${backgroundColor}'`);
  const ratio = contrastRatio(foreground.channels, background.channels);
  assert.ok(
    ratio >= MINIMUM_CONTRAST_RATIO,
    `Expected the badge label '${color}' on '${backgroundColor}' to reach WCAG AA ${MINIMUM_CONTRAST_RATIO}:1, got ${ratio.toFixed(2)}:1`,
  );
});

Then('the project card theme badge is fully opaque', async function () {
  const { backgroundColor } = await badgeColors(this);
  assert.equal(
    parseCssColor(backgroundColor).alpha,
    1,
    `Expected the badge fill to be opaque so its contrast does not depend on the project image, got '${backgroundColor}'`,
  );
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

Then('the active work badge sits above the theme badge', async function () {
  const element = await visibleCard(this);
  const themeBox = await badgeIn(element).boundingBox();
  const workBox = await element.getByTestId('project-card-work-badge').boundingBox();
  assert.ok(themeBox && workBox, 'Expected both badges to have a layout box');
  assert.ok(workBox.y < themeBox.y, `Expected the work badge (y=${workBox.y}) to sit above the theme badge (y=${themeBox.y})`);
});
