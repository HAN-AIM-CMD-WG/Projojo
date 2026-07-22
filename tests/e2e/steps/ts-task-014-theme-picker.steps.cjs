const assert = require('node:assert/strict');

const { Given, When, Then } = require('@qavajs/core');

const { FRONTEND_URL } = require('../support/test-data.cjs');
const { page } = require('../support/e2e-session.cjs');
const { stubThemesEndpoint } = require('../support/theme-stub.cjs');

// Deterministic stub catalog for the ThemePicker harness. Fixed ids/names/colors
// so the rendering, selection and contrast assertions key off known values.
// Colors span the legibility range on purpose: '#E91E63' (Onderwijs) is a
// mid-luminance color that no plain white/dark text can carry at AA 4.5:1, so it
// forces the component's darken-to-legible fallback, while '#9C27B0' (Gezondheid)
// exercises the white-text branch and '#FFEB3B' (Innovatie) the dark-text branch.
const STUB_THEMES = Object.freeze([
  Object.freeze({ id: 'tp-duurzaamheid', name: 'Duurzaamheid', color: '#4CAF50' }),
  Object.freeze({ id: 'tp-klimaat', name: 'Klimaat & Milieu', color: '#2196F3' }),
  Object.freeze({ id: 'tp-onderwijs', name: 'Onderwijs', color: '#E91E63' }),
  Object.freeze({ id: 'tp-innovatie', name: 'Innovatie', color: '#FFEB3B' }),
  Object.freeze({ id: 'tp-water', name: 'Water', color: '#00BCD4' }),
  Object.freeze({ id: 'tp-gezondheid', name: 'Gezondheid', color: '#9C27B0' }),
]);

// The app's coral primary, hard-coded so AC-11's "3px primary color ring"
// assertion proves the ring is the primary color rather than mirroring a token.
const PRIMARY_RGB = 'rgb(255, 127, 80)';

const HARNESS_PATH = '/dev/theme-picker';

function idForName(name) {
  const theme = STUB_THEMES.find((candidate) => candidate.name === name);
  assert.ok(theme, `Unknown stub theme name '${name}'`);
  return theme.id;
}

function colorForName(name) {
  const theme = STUB_THEMES.find((candidate) => candidate.name === name);
  assert.ok(theme, `Unknown stub theme name '${name}'`);
  return theme.color;
}

function hexToRgb(hex) {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

// WCAG relative-luminance contrast ratio between two "rgb(r, g, b)" strings, so
// AC-3's "text stays legible" is proven by real contrast rather than by trusting
// whatever colour the component happened to pick.
function parseRgb(rgb) {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  assert.ok(match, `Expected an rgb() colour, got '${rgb}'`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function relativeLuminance([r, g, b]) {
  const channel = (value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(rgbA, rgbB) {
  const lumA = relativeLuminance(parseRgb(rgbA));
  const lumB = relativeLuminance(parseRgb(rgbB));
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

function picker(world) {
  return page(world).getByTestId('theme-picker');
}

function pillById(world, id) {
  return picker(world).locator(`[data-testid="theme-pill"][data-theme-id="${id}"]`);
}

function pillByName(world, name) {
  return pillById(world, idForName(name));
}

/**
 * Poll a pill's computed background-color until it reaches `expectedRgb`, so
 * assertions read the settled colour rather than a mid-transition oklab frame.
 */
async function settledBackgroundColor(pill, expectedRgb) {
  return pill.evaluate((el, expected) => new Promise((resolve) => {
    const start = Date.now();
    const check = () => {
      const current = getComputedStyle(el).backgroundColor;
      if (current === expected || Date.now() - start > 3000) return resolve(current);
      requestAnimationFrame(check);
    };
    check();
  }), expectedRgb);
}

async function openHarness(world, { readonly = false, selectedNames = [], delayed = false } = {}) {
  const params = new URLSearchParams();
  if (readonly) params.set('readonly', '1');
  if (delayed) params.set('delayed', '1');
  if (selectedNames.length > 0) params.set('selected', selectedNames.map(idForName).join(','));
  const query = params.toString();
  await page(world).goto(`${FRONTEND_URL}${HARNESS_PATH}${query ? `?${query}` : ''}`);
  await picker(world).waitFor({ state: 'visible' });
}

// --- Given: catalog states (all stubbed; see feature header) --------------------

Given('the theme picker demo has {int} themes available', async function (count) {
  await stubThemesEndpoint(page(this), { status: 200, body: STUB_THEMES.slice(0, count) });
});

Given('the theme picker demo has no themes available', async function () {
  await stubThemesEndpoint(page(this), { status: 200, body: [] });
});

Given('the theme picker demo is slow to return {int} themes', async function (count) {
  await stubThemesEndpoint(page(this), { status: 200, body: STUB_THEMES.slice(0, count), delayMs: 2000 });
});

// --- When: open the harness in its various configurations -----------------------

When('I open the theme picker demo', async function () {
  await openHarness(this);
});

When('I open the theme picker demo with {string} and {string} pre-selected', async function (first, second) {
  await openHarness(this, { selectedNames: [first, second] });
});

When('I open the read-only theme picker demo showing {string} and {string}', async function (first, second) {
  await openHarness(this, { readonly: true, selectedNames: [first, second] });
});

When('I open the read-only theme picker demo with delayed selection of {string} and {string}', async function (first, second) {
  await openHarness(this, { readonly: true, selectedNames: [first, second], delayed: true });
});

// --- When: interactions ---------------------------------------------------------

When('I click the {string} theme pill', async function (name) {
  await pillByName(this, name).click();
});

When('I try to click the read-only {string} pill', async function (name) {
  // force:true because a correct read-only pill is a non-interactive <span>;
  // the click must be attempted so the "nothing changed" assertions are real.
  await pillByName(this, name).click({ force: true });
});

When('I select every theme pill', async function () {
  await picker(this).getByTestId('theme-pill').first().waitFor({ state: 'visible' });
  const pills = await picker(this).getByTestId('theme-pill').all();
  for (const pill of pills) {
    await pill.click();
  }
});

When('I focus the {string} theme pill', async function (name) {
  await pillByName(this, name).focus();
});

When('I press {string} on the focused pill', async function (key) {
  await page(this).keyboard.press(key);
});

// --- Then: rendering (AC-1) -----------------------------------------------------

Then('{int} theme pills are shown', async function (count) {
  await picker(this).getByTestId('theme-pill').first().waitFor({ state: 'visible' });
  assert.equal(
    await picker(this).getByTestId('theme-pill').count(),
    count,
    `Expected ${count} theme pills`,
  );
});

Then('each theme pill shows a color dot and its theme name', async function () {
  for (const theme of STUB_THEMES) {
    const pill = pillById(this, theme.id);
    assert.equal(await pill.count(), 1, `Expected a pill for '${theme.name}'`);
    assert.ok(
      (await pill.innerText()).includes(theme.name),
      `Expected pill '${theme.id}' to show the name '${theme.name}'`,
    );
    const dot = pill.getByTestId('theme-pill-dot');
    assert.equal(await dot.isVisible(), true, `Expected a visible color dot for '${theme.name}'`);
    const dotColor = await dot.evaluate((el) => getComputedStyle(el).backgroundColor);
    assert.equal(dotColor, hexToRgb(theme.color), `Expected '${theme.name}' dot to use its theme color`);
  }
});

// --- Then: selection state (AC-2, AC-3, AC-4, AC-6) -----------------------------

Then('the {string} pill is not selected', async function (name) {
  assert.equal(await pillByName(this, name).getAttribute('aria-pressed'), 'false', `Expected '${name}' unselected`);
});

Then('the {string} pill is selected', async function (name) {
  assert.equal(await pillByName(this, name).getAttribute('aria-pressed'), 'true', `Expected '${name}' selected`);
});

Then('the {string} pill has a neutral outlined appearance', async function (name) {
  const pill = pillByName(this, name);
  const { background, borderWidth } = await pill.evaluate((el) => {
    const style = getComputedStyle(el);
    return { background: style.backgroundColor, borderWidth: parseFloat(style.borderTopWidth) };
  });
  // Not filled with its theme color, and carrying a visible border = "outlined".
  assert.notEqual(background, hexToRgb(colorForName(name)), `Expected '${name}' to NOT be filled with its theme color when unselected`);
  assert.ok(borderWidth >= 1, `Expected '${name}' to have a visible border when unselected, got ${borderWidth}px`);
});

Then('the {string} pill shows a color dot matching its theme color', async function (name) {
  const dot = pillByName(this, name).getByTestId('theme-pill-dot');
  assert.equal(await dot.isVisible(), true, `Expected a visible color dot for '${name}'`);
  const dotColor = await dot.evaluate((el) => getComputedStyle(el).backgroundColor);
  assert.equal(dotColor, hexToRgb(colorForName(name)), `Expected '${name}' dot to match its theme color`);
});

Then('the {string} pill is filled with its theme color', async function (name) {
  const expected = hexToRgb(colorForName(name));
  // Pills use `transition-all duration-200`, and Tailwind v4 interpolates colour
  // through oklab, so sample the settled state rather than a mid-transition frame.
  const background = await settledBackgroundColor(pillByName(this, name), expected);
  assert.equal(background, expected, `Expected '${name}' filled with its theme color ${expected} when selected, got ${background}`);
});

Then('the {string} pill text stays legible against its background', async function (name) {
  const { color, background } = await pillByName(this, name).evaluate((el) => {
    const style = getComputedStyle(el);
    return { color: style.color, background: style.backgroundColor };
  });
  const ratio = contrastRatio(color, background);
  assert.ok(ratio >= 4.5, `Expected legible text on '${name}' (WCAG AA >= 4.5:1), got ${ratio.toFixed(2)}:1 (text ${color} on ${background})`);
});

Then('every selected pill keeps legible text against its background', async function () {
  const pills = await picker(this).getByTestId('theme-pill').all();
  assert.ok(pills.length > 0, 'Expected at least one selected pill to check');
  // Let the fill/text transition (200ms) settle before sampling colours.
  await page(this).waitForTimeout(400);
  for (const pill of pills) {
    const { id, color, background } = await pill.evaluate((el) => {
      const style = getComputedStyle(el);
      return { id: el.getAttribute('data-theme-id'), color: style.color, background: style.backgroundColor };
    });
    const ratio = contrastRatio(color, background);
    assert.ok(ratio >= 4.5, `Expected AA-legible text on selected pill '${id}' (>= 4.5:1), got ${ratio.toFixed(2)}:1 (text ${color} on ${background})`);
  }
});

// --- Then: no limit (AC-5) ------------------------------------------------------

Then('all {int} theme pills are selected', async function (count) {
  const pills = await picker(this).getByTestId('theme-pill').all();
  assert.equal(pills.length, count, `Expected ${count} pills`);
  for (const pill of pills) {
    assert.equal(await pill.getAttribute('aria-pressed'), 'true', 'Expected every pill selected');
  }
});

Then('no selection limit warning is shown', async function () {
  const text = await picker(this).innerText();
  assert.ok(
    !/limiet|maximum|max\.|te veel|maximaal/i.test(text),
    `Expected no selection-limit warning in the picker, got: ${text}`,
  );
});

// --- Then: read-only (AC-7) -----------------------------------------------------

Then('only the {string} and {string} pills are shown', async function (first, second) {
  const pills = picker(this).getByTestId('theme-pill');
  await pills.first().waitFor({ state: 'visible' });
  assert.equal(await pills.count(), 2, 'Expected exactly the pre-selected themes to be shown in read-only mode');
  assert.equal(await pillByName(this, first).count(), 1, `Expected '${first}' to be shown`);
  assert.equal(await pillByName(this, second).count(), 1, `Expected '${second}' to be shown`);
});

Then('the {string} pill does not use a pointer cursor', async function (name) {
  const cursor = await pillByName(this, name).evaluate((el) => getComputedStyle(el).cursor);
  assert.notEqual(cursor, 'pointer', `Expected '${name}' read-only pill to not use a pointer cursor`);
});

Then('the {string} pill is still shown', async function (name) {
  assert.equal(await pillByName(this, name).count(), 1, `Expected '${name}' to still be shown after the click`);
});

Then('the {string} and {string} pills appear once the selection loads', async function (first, second) {
  const pills = picker(this).getByTestId('theme-pill');
  await pills.first().waitFor({ state: 'visible' });
  assert.equal(await pills.count(), 2, 'Expected the delayed selection to render exactly its two pills once loaded');
  assert.equal(await pillByName(this, first).count(), 1, `Expected '${first}' to appear once loaded`);
  assert.equal(await pillByName(this, second).count(), 1, `Expected '${second}' to appear once loaded`);
});

// --- Then: onChange callback (AC-8) ---------------------------------------------

Then('the selection change callback reports no selection', async function () {
  const readout = (await page(this).getByTestId('themepicker-onchange').innerText()).trim();
  assert.equal(readout, '', `Expected no onChange payload yet, got '${readout}'`);
});

async function assertCallbackReports(world, names) {
  const readout = (await page(world).getByTestId('themepicker-onchange').innerText()).trim();
  let reported;
  try {
    reported = JSON.parse(readout);
  } catch {
    assert.fail(`Expected the onChange read-out to be a JSON array, got '${readout}'`);
  }
  assert.ok(Array.isArray(reported), `Expected the onChange payload to be an array, got '${readout}'`);
  const expected = names.map(idForName);
  assert.deepEqual([...reported].sort(), [...expected].sort(), `Expected onChange to report ${JSON.stringify(expected)}, got ${readout}`);
}

Then('the selection change callback reports {string}', async function (name) {
  await assertCallbackReports(this, [name]);
});

Then('the selection change callback reports {string} and {string}', async function (first, second) {
  await assertCallbackReports(this, [first, second]);
});

// --- Then: loading (AC-9) -------------------------------------------------------

Then('a loading state with skeleton pills is shown', async function () {
  const loading = picker(this).getByTestId('theme-picker-loading');
  await loading.waitFor({ state: 'visible' });
  assert.ok(
    (await picker(this).getByTestId('theme-pill-skeleton').count()) >= 1,
    'Expected at least one skeleton pill while loading',
  );
});

Then('the loading state is replaced by {int} theme pills once loaded', async function (count) {
  await picker(this).getByTestId('theme-picker-loading').waitFor({ state: 'detached' });
  await picker(this).getByTestId('theme-pill').first().waitFor({ state: 'visible' });
  assert.equal(await picker(this).getByTestId('theme-pill').count(), count, `Expected ${count} pills once loaded`);
});

// --- Then: empty (AC-10) --------------------------------------------------------

Then('the empty state message {string} is shown', async function (message) {
  const empty = picker(this).getByTestId('theme-picker-empty');
  await empty.waitFor({ state: 'visible' });
  assert.ok((await empty.innerText()).includes(message), `Expected empty-state message '${message}'`);
});

Then('no theme pills are shown', async function () {
  assert.equal(await picker(this).getByTestId('theme-pill').count(), 0, 'Expected no theme pills');
});

// --- Then: keyboard (AC-11) -----------------------------------------------------

Then('the {string} pill is keyboard focusable', async function (name) {
  const pill = pillByName(this, name);
  const details = await pill.evaluate((el) => ({
    isActive: document.activeElement === el,
    tabIndex: el.tabIndex,
    tag: el.tagName,
  }));
  assert.equal(details.isActive, true, `Expected '${name}' pill to be the focused element`);
  assert.ok(details.tabIndex >= 0, `Expected '${name}' pill to be in the tab order (tabIndex >= 0), got ${details.tabIndex}`);
  assert.equal(details.tag, 'BUTTON', `Expected '${name}' pill to be a native button for keyboard activation, got ${details.tag}`);
});

Then('the focused pill shows a 3px primary color focus ring', async function () {
  // The focus ring is a box-shadow under `transition-all`, so poll until it has
  // settled at full width/opacity rather than reading a mid-transition frame.
  const { boxShadow, outline } = await page(this).evaluate(() => new Promise((resolve) => {
    const el = document.activeElement;
    const start = Date.now();
    const read = () => {
      const style = getComputedStyle(el);
      const settled = /rgb\(255, 127, 80\)/.test(style.boxShadow) && style.boxShadow.includes('3px');
      if (settled || Date.now() - start > 3000) {
        return resolve({ boxShadow: style.boxShadow, outline: `${style.outlineWidth} ${style.outlineStyle} ${style.outlineColor}` });
      }
      requestAnimationFrame(read);
    };
    read();
  }));
  // Assert on the box-shadow itself so colour and width must come from the same
  // declaration, not merely co-occur somewhere in a concatenated string.
  assert.ok(boxShadow.includes(PRIMARY_RGB), `Expected a primary-color focus ring, got boxShadow '${boxShadow}' (outline '${outline}')`);
  assert.ok(boxShadow.includes('3px'), `Expected a 3px focus ring, got boxShadow '${boxShadow}' (outline '${outline}')`);
});
