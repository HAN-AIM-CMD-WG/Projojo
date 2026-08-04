// TS-task-021 — theme pills on the supervisor's Organisatiedashboard.
//
// UI suite against the real stack. The seeded proof project's theme links are
// staged per scenario through the real PUT /themes/project/{id} (reusing the
// TS-task-019 Given steps), and the pills are then read off the supervisor's home
// dashboard (SupervisorDashboard.jsx, reached at /home). No network stubbing is
// involved anywhere in this suite - every state under test is one the real backend
// can produce.
//
// Step text is deliberately prefixed with "the dashboard" because Cucumber matches
// step text globally: TS-task-018 owns "the project card theme badge ..." for the
// shared ProjectCard, and TS-task-019 owns "the {string} theme pill ..." for the
// details page. Those two suites cover different components on different pages.
//
// Reused from sibling suites rather than copied: the catalog reset, the
// per-scenario link staging and the supervisor login (TS-task-019), publishing the
// project and opening the public discovery page (TS-task-018), and the icon-less
// theme fixture (TS-task-009). Nothing links those files to this one at load time,
// so retiring a step there breaks this feature silently - check before you do.
//
// The colour maths below is a deliberate re-implementation of WCAG 2.1 rather than
// an import of the app's own legibleFill helper: a step that used the helper would
// only prove the helper agrees with itself, never that the rendered pill is legible.

const assert = require('node:assert/strict');

const { Given, Then, When } = require('@qavajs/core');

const {
  FRONTEND_URL,
  PROOF_PROJECT_ID,
  PROOF_PROJECT_NAME,
} = require('../support/test-data.cjs');
const { page } = require('../support/e2e-session.cjs');
const { themeApi } = require('../support/theme-catalog.cjs');

// The supervisor's home dashboard. "/" is the public landing page; the role-aware
// HomePage that renders SupervisorDashboard is mounted at /home (App.jsx).
const DASHBOARD_URL = `${FRONTEND_URL}/home`;

// The fill a theme carrying no colour of its own falls back to, matching the theme
// pills everywhere else in the app.
const COLORLESS_THEME_FILL = '#FF7F50';

// WCAG AA for normal text. Black-or-white always clears at least 4.58:1 against any
// sRGB fill, so anything below this is a real defect and not a borderline choice.
const MINIMUM_CONTRAST_RATIO = 4.5;

// What "matching skill badge sizing" is measured on. Colour is deliberately absent:
// a theme pill is filled with its theme colour and a skill pill is grey, by design.
// Rendered width and height are absent for the same reason - the two carry different
// text. What is compared is the box the app gives a compact pill on a project card.
// fontWeight and border radius are absent too: neither is a size, and "no larger
// than" is meaningless for them.
const COMPARED_SIZE_PROPERTIES = [
  'fontSize',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
];

// The dashboard thumbnail's floor (w-24 / min-h-24 = 6rem). The image column has no
// height of its own beyond this, so a card taller than the floor proves the column
// really stretched rather than happening to match.
const THUMBNAIL_MIN_HEIGHT = 96;

// --- world state -----------------------------------------------------------------

function state(world) {
  if (!world.dashboardThemes) world.dashboardThemes = { requests: [], recordedSizing: null, recordedHeight: null };
  return world.dashboardThemes;
}

/**
 * Navigate to `url` with every request the browser makes recorded.
 *
 * The listener is attached before the goto so the page's own load is covered. The
 * previously open page is dropped to about:blank first: the login step leaves the
 * frontend root open, and without this it keeps executing for a few milliseconds
 * into the recording, contributing traffic that has nothing to do with the page
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

/**
 * The dashboard's project card for the proof project.
 *
 * Matched on the card's own exact href. The pending-registration entries on the
 * same page link to `/projects/{id}#task-{taskId}`, which this exact-match
 * attribute selector deliberately does not catch.
 */
function card(world) {
  return page(world).locator(`a[href="/projects/${PROOF_PROJECT_ID}"]`);
}

function pillsIn(scope) {
  return scope.getByTestId('dashboard-theme-pill');
}

/** The dashboard's "Mijn Projecten" card, once it is on screen. */
async function visibleCard(world) {
  const element = card(world);
  try {
    // Deliberately under cucumber's 20s step timeout: at 20s the runner kills the
    // step first and reports "function timed out" with nothing about the page,
    // which is unusable for an intermittent failure.
    await element.waitFor({ state: 'visible', timeout: 12_000 });
  } catch (error) {
    const seen = await page(world).evaluate(() => ({
      url: location.href,
      headings: [...document.querySelectorAll('h1, h2')].map((el) => el.innerText),
      projectLinks: [...document.querySelectorAll('a[href^="/projects/"]')].map((el) => el.getAttribute('href')),
    }));
    throw new Error(`${error.message}\nPage at that moment: ${JSON.stringify(seen)}`);
  }
  return element;
}

/** The card's single theme pill, asserted to be the only one before it is read. */
async function soleVisiblePill(world) {
  const element = await visibleCard(world);
  const pill = pillsIn(element).first();
  await pill.waitFor({ state: 'visible', timeout: 10_000 });
  assert.equal(
    await pillsIn(element).count(),
    1,
    'Expected the project card to show exactly one theme pill for this step to speak about',
  );
  return pill;
}

/** The names shown on the pills, read from the name element rather than the icon ligature. */
async function shownPillNames(world) {
  const element = await visibleCard(world);
  await pillsIn(element).first().waitFor({ state: 'visible', timeout: 10_000 });
  const names = await element.getByTestId('dashboard-theme-pill-name').allInnerTexts();
  return names.map((text) => text.trim());
}

/**
 * A dashboard section, located by the heading it carries.
 *
 * Filtered on the heading element rather than on `hasText`: that option matches any
 * descendant text case-insensitively, so "Actieve Studenten" would also select the
 * sidebar's Statistieken section, which carries an "Actieve studenten" stat row.
 * The heading name is matched as a substring because each of these headings also
 * contains a Material Symbols ligature that folds into its accessible name.
 */
function sectionTitled(world, heading) {
  return page(world)
    .locator('section')
    .filter({ has: page(world).getByRole('heading', { name: heading }) });
}

function parseNames(names) {
  return names.split(',').map((name) => name.trim()).filter(Boolean).sort();
}

/** The theme names the project is really linked to, read through the real endpoint. */
async function linkedThemeNames() {
  const result = await themeApi(`/themes/project/${PROOF_PROJECT_ID}`, null);
  assert.equal(result.status, 200, `Expected GET /themes/project/{id} to return 200, received ${result.status}`);
  assert.ok(Array.isArray(result.body), `Expected GET /themes/project/{id} to return an array, received ${JSON.stringify(result.body)}`);
  return result.body.map((theme) => theme?.name);
}

/** The proof project's first skill, read from the live public feed the card renders. */
async function proofProjectSkill() {
  const result = await themeApi('/projects/public', null);
  assert.equal(result.status, 200, `Expected GET /projects/public to return 200, received ${result.status}`);
  const project = (result.body ?? []).find((candidate) => candidate?.id === PROOF_PROJECT_ID);
  assert.ok(project, 'Expected the proof project on the public feed to read its skill pill from');
  const [skill] = project.skills ?? [];
  assert.ok(skill, `Expected the proof project to require at least one skill, got ${JSON.stringify(project.skills)}`);
  return skill;
}

// --- colour helpers ---------------------------------------------------------------

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

/** The sole pill's rendered label and fill colours. */
async function pillColors(world) {
  return (await soleVisiblePill(world)).evaluate((el) => {
    const computed = getComputedStyle(el);
    return { color: computed.color, backgroundColor: computed.backgroundColor };
  });
}

/** The subset of an element's computed styling that "compact sizing" is judged on. */
function sizingOf(locator) {
  return locator.evaluate((el, properties) => {
    const computed = getComputedStyle(el);
    return Object.fromEntries(properties.map((property) => [property, computed[property]]));
  }, COMPARED_SIZE_PROPERTIES);
}

// --- When -------------------------------------------------------------------------

When('I open the organisation dashboard', async function () {
  await gotoRecording(this, DASHBOARD_URL);
  await visibleCard(this);
});

When('I record the sizing of the dashboard theme pill', async function () {
  state(this).recordedSizing = await sizingOf(await soleVisiblePill(this));
});

When('I record the height of the dashboard project card', async function () {
  const box = await (await visibleCard(this)).boundingBox();
  assert.ok(box, 'Expected the project card to have a layout box to measure');
  state(this).recordedHeight = box.height;
});

// --- Then: the pills themselves (AC-1, AC-2) --------------------------------------

Then('the dashboard project card shows exactly {int} theme pill(s)', async function (expected) {
  const element = await visibleCard(this);
  await pillsIn(element).first().waitFor({ state: 'visible', timeout: 10_000 });
  assert.equal(
    await pillsIn(element).count(),
    expected,
    `Expected the dashboard project card to show exactly ${expected} theme pill(s)`,
  );
});

Then('the dashboard theme pills are exactly {string}', async function (names) {
  assert.deepEqual(
    (await shownPillNames(this)).sort(),
    parseNames(names),
    'Expected exactly these theme pills on the dashboard project card',
  );
});

Then('the dashboard theme pill is labelled {string}', async function (label) {
  const name = (await soleVisiblePill(this)).getByTestId('dashboard-theme-pill-name');
  assert.ok(await name.isVisible(), `Expected the theme pill to visibly show the name '${label}'`);
  assert.equal((await name.innerText()).trim(), label, `Expected the theme pill to be labelled '${label}'`);
});

Then('the dashboard theme pill shows the Material Symbols icon {string}', async function (icon) {
  const iconEl = (await soleVisiblePill(this)).getByTestId('dashboard-theme-pill-icon');
  // "shows" means visibly rendered: innerText on a display:none element falls back
  // to textContent, so a hidden glyph would still read "eco".
  assert.ok(await iconEl.isVisible(), `Expected the theme pill to visibly show the '${icon}' icon`);
  const classes = (await iconEl.getAttribute('class')) ?? '';
  assert.ok(classes.includes('material-symbols'), `Expected the pill icon to be a Material Symbols glyph, got class '${classes}'`);
  assert.equal((await iconEl.innerText()).trim(), icon, `Expected the theme pill to show the '${icon}' icon`);
});

Then('the dashboard theme pill uses the color {string} as its background', async function (hex) {
  const { backgroundColor } = await pillColors(this);
  assert.equal(
    backgroundColor,
    hexToRgb(hex),
    `Expected the theme pill background to be ${hex} (${hexToRgb(hex)}), got '${backgroundColor}'`,
  );
});

Then('every dashboard theme pill names one of the project\'s linked themes', async function () {
  const shown = await shownPillNames(this);
  assert.ok(shown.length > 0, 'Expected at least one theme pill to inspect');
  const linked = await linkedThemeNames();
  for (const name of shown) {
    assert.ok(
      linked.includes(name),
      `Expected every pill to name one of the project's linked themes ${JSON.stringify(linked)}, got '${name}'`,
    );
  }
  // Two pills naming the same theme would satisfy the check above while showing the
  // user one theme twice and hiding another.
  assert.equal(new Set(shown).size, shown.length, `Expected the pills to name distinct themes, got ${JSON.stringify(shown)}`);
});

// --- Then: compact sizing (AC-2) ---------------------------------------------------

Then('the recorded pill is no larger than the public project card skill pill', async function () {
  const recorded = state(this).recordedSizing;
  assert.ok(recorded, 'Expected the dashboard pill sizing to have been recorded first');

  const skill = await proofProjectSkill();
  const skillPill = page(this)
    .locator(`a[href="/publiek/${PROOF_PROJECT_ID}"]`)
    .getByText(skill, { exact: true });
  await skillPill.waitFor({ state: 'visible', timeout: 10_000 });
  const referent = await sizingOf(skillPill);

  for (const [property, value] of Object.entries(recorded)) {
    const limit = Number.parseFloat(referent[property]);
    assert.ok(
      Number.isFinite(limit),
      `Expected the '${skill}' skill pill to report a numeric ${property}, got '${referent[property]}'`,
    );
    assert.ok(
      Number.parseFloat(value) <= limit,
      `Expected the dashboard theme pill's ${property} (${value}) to be no larger than the compact '${skill}' skill pill's (${referent[property]})`,
    );
  }
});

// --- Then: card geometry (AC-3) ----------------------------------------------------

Then('the dashboard project card has the recorded height', async function () {
  const recorded = state(this).recordedHeight;
  assert.ok(recorded, 'Expected the themeless card height to have been recorded first');
  const box = await (await visibleCard(this)).boundingBox();
  assert.ok(box, 'Expected the project card to have a layout box to measure');
  // Sub-pixel tolerance only: a wrapped pill row or an extra line would move this by
  // a dozen pixels or more, so anything above 1px is the defect this guards.
  assert.ok(
    Math.abs(box.height - recorded) <= 1,
    `Expected a themed card to keep the themeless card's height of ${recorded}px, got ${box.height}px`,
  );
});

Then('the theme pills, the overflow count and the arrow sit on one line', async function () {
  const element = await visibleCard(this);
  await pillsIn(element).first().waitFor({ state: 'visible', timeout: 10_000 });
  const boxes = [];
  for (const pill of await pillsIn(element).all()) boxes.push({ what: 'pill', box: await pill.boundingBox() });
  const overflow = element.getByTestId('dashboard-theme-pill-overflow');
  if (await overflow.count()) boxes.push({ what: 'overflow', box: await overflow.boundingBox() });
  assert.ok(boxes.length >= 2, 'Expected at least two items on the theme row for "one line" to mean anything');

  // Vertically overlapping boxes are on one line; a wrapped item sits entirely below
  // the first. Overlap rather than equal tops, because the items differ in height.
  const [first] = boxes;
  for (const { what, box } of boxes.slice(1)) {
    assert.ok(box, `Expected the ${what} to have a layout box`);
    assert.ok(
      box.y < first.box.y + first.box.height && first.box.y < box.y + box.height,
      `Expected the ${what} to share the first pill's line, got ${JSON.stringify(box)} against ${JSON.stringify(first.box)}`,
    );
  }
});

Then('the dashboard project card is taller than its thumbnail minimum', async function () {
  const box = await (await visibleCard(this)).boundingBox();
  assert.ok(box, 'Expected the project card to have a layout box to measure');
  assert.ok(
    box.height > THUMBNAIL_MIN_HEIGHT,
    `Expected the card to stand taller than its ${THUMBNAIL_MIN_HEIGHT}px thumbnail floor, got ${box.height}px`,
  );
});

Then('the project image fills the height of the dashboard project card', async function () {
  const element = await visibleCard(this);
  const cardBox = await element.boundingBox();
  const imageBox = await element.locator('img').first().boundingBox();
  assert.ok(cardBox && imageBox, 'Expected both the card and its image to have a layout box');
  // The card's own border accounts for a pixel or two; a thumbnail that stopped
  // short would leave a strip of tens of pixels.
  assert.ok(
    cardBox.height - imageBox.height <= 4,
    `Expected the thumbnail (${imageBox.height}px) to run the full height of the card (${cardBox.height}px)`,
  );
});

// --- Then: the empty state (AC-3) --------------------------------------------------

Then('the dashboard project card shows no theme pills', async function () {
  assert.equal(
    await pillsIn(await visibleCard(this)).count(),
    0,
    'Expected a project without linked themes to render no theme pill',
  );
});

Then('the dashboard project card shows no theme overflow count', async function () {
  assert.equal(
    await (await visibleCard(this)).getByTestId('dashboard-theme-pill-overflow').count(),
    0,
    'Expected no overflow count when no theme is hidden',
  );
});

Then('the dashboard project card shows no empty theme placeholder', async function () {
  const element = await visibleCard(this);
  // The details page's empty-state wording, which must not be copied onto a card
  // this dense: a themeless project simply shows nothing.
  assert.equal(
    await element.getByTestId('dashboard-themes-empty').count(),
    0,
    'Expected no empty-state theme element on the card',
  );
  const text = await element.innerText();
  assert.doesNotMatch(text, /thema/i, `Expected a themeless card to say nothing about themes, got '${text}'`);
});

Then('the dashboard project card still shows its title, its task count and its link to the project', async function () {
  const element = await visibleCard(this);
  assert.ok(
    await element.getByRole('heading', { name: PROOF_PROJECT_NAME }).isVisible(),
    'Expected the card to still show the project title',
  );
  const text = await element.innerText();
  assert.match(text, /\d+\s+ta(ak|ken)/i, `Expected the card to still show its task count, got '${text}'`);
  assert.equal(
    await element.getAttribute('href'),
    `/projects/${PROOF_PROJECT_ID}`,
    'Expected the card to still link to the project',
  );
});

// --- Then: truncation (AC-4) -------------------------------------------------------

Then('the dashboard project card shows the theme overflow count {string}', async function (expected) {
  const overflow = (await visibleCard(this)).getByTestId('dashboard-theme-pill-overflow');
  await overflow.waitFor({ state: 'visible', timeout: 10_000 });
  assert.equal(
    (await overflow.innerText()).trim(),
    expected,
    `Expected the hidden themes to be summarised as '${expected}'`,
  );
});

// --- Then: the data source (AC-5) --------------------------------------------------

Then('the dashboard requested its own project data', async function () {
  const { requests } = state(this);
  assert.ok(
    requests.some((request) => request.method === 'GET' && new URL(request.url).pathname === '/supervisors/dashboard'),
    `Expected the recording to cover the dashboard's own data read, saw ${requests.length} requests`,
  );
});

Then('no theme endpoint was requested while the dashboard loaded', async function () {
  const themeRequests = state(this).requests.filter((request) => new URL(request.url).pathname.startsWith('/themes'));
  assert.deepEqual(
    themeRequests,
    [],
    `Expected the dashboard to render theme pills without requesting any theme endpoint, saw ${JSON.stringify(themeRequests)}`,
  );
});

// --- Then: a theme without an icon or colour ---------------------------------------

Then('the dashboard theme pill shows no icon', async function () {
  assert.equal(
    await (await soleVisiblePill(this)).getByTestId('dashboard-theme-pill-icon').count(),
    0,
    'Expected a theme without an icon to render no icon element rather than an empty glyph',
  );
});

Then('the dashboard theme pill falls back to the colorless theme fill', async function () {
  const { backgroundColor } = await pillColors(this);
  assert.equal(
    backgroundColor,
    hexToRgb(COLORLESS_THEME_FILL),
    `Expected a colorless theme to fall back to ${COLORLESS_THEME_FILL}, the fill the theme pills elsewhere use, got '${backgroundColor}'`,
  );
  const name = (await soleVisiblePill(this)).getByTestId('dashboard-theme-pill-name');
  assert.ok(await name.isVisible(), 'Expected the theme name to stay visible on the fallback background');
});

// --- Then: text contrast -----------------------------------------------------------

Then('the dashboard theme pill uses dark text', async function () {
  const { color } = await pillColors(this);
  assert.deepEqual(parseCssColor(color).channels, [0, 0, 0], `Expected a light theme colour to get black text, got '${color}'`);
});

Then('the dashboard theme pill uses white text', async function () {
  const { color } = await pillColors(this);
  assert.deepEqual(parseCssColor(color).channels, [255, 255, 255], `Expected a dark theme colour to get white text, got '${color}'`);
});

Then('the dashboard theme pill text is legible against its background', async function () {
  const { color, backgroundColor } = await pillColors(this);
  const foreground = parseCssColor(color);
  const background = parseCssColor(backgroundColor);
  // A translucent fill would make this ratio depend on the card behind it, so the
  // measurement is only meaningful on an opaque pill.
  assert.equal(background.alpha, 1, `Expected an opaque pill fill to measure contrast against, got '${backgroundColor}'`);
  const ratio = contrastRatio(foreground.channels, background.channels);
  assert.ok(
    ratio >= MINIMUM_CONTRAST_RATIO,
    `Expected the pill label '${color}' on '${backgroundColor}' to reach WCAG AA ${MINIMUM_CONTRAST_RATIO}:1, got ${ratio.toFixed(2)}:1`,
  );
});

// --- Then: assistive-technology labelling ------------------------------------------

Then('every dashboard theme pill carries an aria-label naming its own theme', async function () {
  const element = await visibleCard(this);
  await pillsIn(element).first().waitFor({ state: 'visible', timeout: 10_000 });
  const all = await pillsIn(element).all();
  assert.ok(all.length > 0, 'Expected theme pills to inspect');
  for (const pill of all) {
    const label = await pill.getAttribute('aria-label');
    const name = (await pill.getByTestId('dashboard-theme-pill-name').innerText()).trim();
    assert.ok(label, `Expected the '${name}' pill to carry an aria-label`);
    // Its OWN theme, not just any theme name: a single shared label would pass a
    // looser check while telling a screen-reader user the wrong thing.
    assert.ok(
      label.includes(name),
      `Expected the '${name}' pill's aria-label to name that theme, got '${label}'`,
    );
  }
});

Then('the pill icons are hidden from assistive technology', async function () {
  const icons = await (await visibleCard(this)).getByTestId('dashboard-theme-pill-icon').all();
  assert.ok(icons.length > 0, 'Expected theme pill icons to inspect');
  for (const icon of icons) {
    assert.equal(
      await icon.getAttribute('aria-hidden'),
      'true',
      'Expected the Material Symbols ligature to be hidden from assistive technology, so it is not read out as text',
    );
  }
});

// --- Then: scope ------------------------------------------------------------------

Then('the dashboard shows a pending registration and an active student for that project', async function () {
  for (const heading of ['Openstaande Aanmeldingen', 'Actieve Studenten']) {
    const section = sectionTitled(this, heading);
    await section.waitFor({ state: 'visible', timeout: 10_000 });
    const text = await section.innerText();
    assert.ok(
      text.includes(PROOF_PROJECT_NAME),
      `Expected the '${heading}' section to reference '${PROOF_PROJECT_NAME}', got '${text}'`,
    );
  }
});

Then('no theme pill is shown outside the project cards', async function () {
  const onCard = await pillsIn(await visibleCard(this)).count();
  const onPage = await pillsIn(page(this)).count();
  assert.ok(onCard > 0, 'Expected the project card to carry the pills this step is scoping');
  assert.equal(
    onPage,
    onCard,
    `Expected every theme pill on the dashboard to sit on a project card, found ${onPage} on the page but only ${onCard} on the card`,
  );
});
