// TS-task-022 - SDG badge component with official UN colours.
//
// The badge is driven through the teacher theme catalog, the only surface that
// renders a theme's sdg_code today. Expected colours, Dutch names, accessible
// names and goal URLs all come from support/sdg-catalog.cjs, which hardcodes them
// from the issue rather than importing the component's own table, so these steps
// assert against the specification instead of against the code under test.

const assert = require('node:assert/strict');

const { Given, When, Then } = require('@qavajs/core');

const { E2E_TEACHER_ID } = require('../support/test-data.cjs');
const { page, authenticateInBrowser } = require('../support/e2e-session.cjs');
const { resetThemeCatalog } = require('../support/theme-catalog.cjs');
const { stubThemesEndpoint } = require('../support/theme-stub.cjs');
const { hexToRgb, parseCssColor, contrastRatio, MINIMUM_CONTRAST_RATIO } = require('../support/theme-color.cjs');
const {
  TS022_THEME_PAYLOADS,
  expectedColor,
  expectedName,
  expectedAccessibleName,
  expectedGoalUrl,
  expectedCodesFor,
  sdgNumber,
} = require('../support/sdg-catalog.cjs');

// Tab presses allowed when walking to the badge. The fixture theme sits in the
// first theme row, so the real walk is far shorter; this only stops the loop from
// running forever if the badge is not reachable by keyboard at all.
const MAX_TAB_PRESSES = 150;

/** The theme row whose name cell reads exactly `themeName`. */
async function themeRow(world, themeName) {
  await page(world).getByTestId('theme-row').first().waitFor({ state: 'visible' });
  for (const row of await page(world).getByTestId('theme-row').all()) {
    if ((await row.getByTestId('theme-name').innerText()).trim() === themeName) return row;
  }
  assert.fail(`Expected a theme row named '${themeName}'`);
}

/** Every SDG badge rendered in that theme's SDG cell, in DOM order. */
async function badgesOn(world, themeName) {
  const row = await themeRow(world, themeName);
  return row.getByTestId('theme-sdg').getByTestId('sdg-badge');
}

/** The single badge for `code` on `themeName`, failing when it is missing or duplicated. */
async function badgeFor(world, themeName, code) {
  const row = await themeRow(world, themeName);
  const badge = row.getByTestId('theme-sdg').locator(`[data-testid="sdg-badge"][data-sdg-code="${code}"]`);
  await badge.first().waitFor({ state: 'visible' });
  assert.equal(await badge.count(), 1, `Expected exactly one '${code}' badge on theme '${themeName}'`);
  return badge;
}

/**
 * The badge's tooltip element.
 *
 * Matched on the role attribute rather than with getByRole: the tooltip is
 * visibility:hidden until hover, which takes it out of the accessibility tree
 * and therefore out of reach of a role query, and its hidden state is exactly
 * what one of these steps has to assert.
 */
const tooltipOf = (badge) => badge.locator('[role="tooltip"]');

/**
 * The tooltip's opacity once its fade has settled.
 *
 * Playwright's visibility check looks at visibility/display and box size, not at
 * opacity, so a tooltip that flips to `visibility: visible` but never fades in
 * still counts as visible to `waitFor`. The tooltip transitions opacity over
 * 300ms, so reading it once catches it mid-fade; this settles on the final value
 * instead, which is what "becomes visible" has to mean to be worth asserting.
 */
function settledOpacity(tooltip, timeoutMs = 2000) {
  return tooltip.evaluate(
    (element, budget) => new Promise((resolve) => {
      const deadline = Date.now() + budget;
      const read = () => {
        const opacity = Number(getComputedStyle(element).opacity);
        if (opacity >= 1 || Date.now() > deadline) resolve(opacity);
        else requestAnimationFrame(read);
      };
      read();
    }),
    timeoutMs,
  );
}

/** The badge's rendered fill and its number's rendered text colour. */
async function renderedColours(badge) {
  const backgroundColor = await badge.evaluate((el) => getComputedStyle(el).backgroundColor);
  const color = await badge.getByTestId('sdg-badge-number').evaluate((el) => getComputedStyle(el).color);
  return { backgroundColor, color };
}

/** The computed properties a focus ring can be drawn with. */
function readFocusIndicator(badge) {
  return badge.evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      outlineColor: style.outlineColor,
      boxShadow: style.boxShadow,
    };
  });
}

function hasVisibleIndicator({ outlineStyle, outlineWidth, boxShadow }) {
  const hasOutline = outlineStyle !== 'none' && outlineWidth !== '0px';
  return hasOutline || (boxShadow !== 'none' && boxShadow !== '');
}

Given('I am authenticated in the browser as the TS-task-022 teacher', async function () {
  await authenticateInBrowser(this, E2E_TEACHER_ID);
});

Given('the theme catalog contains only the TS-022 SDG fixtures', async function () {
  await resetThemeCatalog(TS022_THEME_PAYLOADS);
});

// The one badge state the real backend will no longer serve: TS-task-028 rejects a
// repeated goal on POST/PUT /themes/, so this cannot be staged through the API the
// way the other fixtures are. It is still data the component can be handed - the
// seeds write sdgCode as raw TypeQL and schema.tql puts no uniqueness constraint on
// it - which is exactly what theme-stub.cjs reserves stubbing for. A stable id is
// included because the row keys on it.
const REPEATED_SDG_STUB_CATALOG = Object.freeze([
  Object.freeze({
    id: 'ts022-stub-repeated-sdg',
    name: 'SDG Dubbel',
    sdg_code: 'SDG12,SDG12',
    icon: 'content_copy',
    color: '#795548',
    display_order: 1,
    description: 'Dezelfde SDG-code twee keer.',
  }),
]);

Given('the themes endpoint returns a theme whose SDG code repeats a goal', async function () {
  await stubThemesEndpoint(page(this), { status: 200, body: REPEATED_SDG_STUB_CATALOG });
});

// Deliberately a step rather than a hook: the Background's authentication already
// renders the landing page, which logs a pre-existing React warning of its own.
// Recording from here on means these scenarios answer for the theme page they are
// about, instead of failing on noise made before it was ever opened.
Given('I am recording browser errors', async function () {
  this.browserErrors = [];
  const current = page(this);
  current.on('pageerror', (error) => this.browserErrors.push(`uncaught: ${error.message}`));
  current.on('console', (message) => {
    if (message.type() === 'error') this.browserErrors.push(`console.error: ${message.text()}`);
  });
});

Then('the theme {string} should show exactly {int} SDG badge(s)', async function (themeName, expectedCount) {
  const badges = await badgesOn(this, themeName);
  await badges.first().waitFor({ state: 'visible' });
  assert.equal(
    await badges.count(),
    expectedCount,
    `Expected ${expectedCount} SDG badge(s) on theme '${themeName}'`,
  );
});

Then('the theme {string} should show no SDG badge', async function (themeName) {
  assert.deepEqual(expectedCodesFor(themeName), [], `Fixture '${themeName}' must have no SDG code for this scenario`);
  // The row itself is already rendered (themeRow waits for it), so a zero count
  // here is a real absence rather than a not-yet-painted table.
  const badges = await badgesOn(this, themeName);
  assert.equal(await badges.count(), 0, `Expected no SDG badge on theme '${themeName}'`);
});

Then('the theme {string} should still render its name and description', async function (themeName) {
  const row = await themeRow(this, themeName);
  assert.equal((await row.getByTestId('theme-name').innerText()).trim(), themeName);
  const description = (await row.getByTestId('theme-description').innerText()).trim();
  assert.ok(description.length > 0, `Expected theme '${themeName}' to still show its description`);
});

Then('no browser error should have been recorded', function () {
  assert.ok(Array.isArray(this.browserErrors), 'Expected browser error recording to have been started');
  assert.deepEqual(this.browserErrors, [], `Expected no browser errors, got:\n  ${this.browserErrors.join('\n  ')}`);
});

Then('the SDG badge for {string} on theme {string} should show the number {string}', async function (code, themeName, expectedNumber) {
  assert.equal(expectedNumber, String(sdgNumber(code)), `Scenario number must be the goal number of ${code}`);
  const badge = await badgeFor(this, themeName, code);
  assert.equal(
    (await badge.getByTestId('sdg-badge-number').innerText()).trim(),
    expectedNumber,
    `Expected the '${code}' badge to show '${expectedNumber}'`,
  );
});

Then('the SDG badge for {string} on theme {string} should be filled with {string}', async function (code, themeName, hex) {
  // Guards the feature file against a typo: the literal must be the official colour.
  assert.equal(hex.toUpperCase(), expectedColor(code), `Scenario colour for ${code} must match the official UN colour`);
  const badge = await badgeFor(this, themeName, code);
  const { backgroundColor } = await renderedColours(badge);
  assert.equal(backgroundColor, hexToRgb(hex), `Expected the '${code}' badge to be filled with ${hex}`);
});

Then('every SDG badge on theme {string} should show its goal number in its official UN colour', async function (themeName) {
  const badges = await badgesOn(this, themeName);
  await badges.first().waitFor({ state: 'visible' });
  const expectedCodes = expectedCodesFor(themeName);
  const rendered = await badges.all();
  assert.equal(rendered.length, expectedCodes.length, `Expected ${expectedCodes.length} badges on theme '${themeName}'`);

  for (const [index, badge] of rendered.entries()) {
    const code = await badge.getAttribute('data-sdg-code');
    assert.equal(code, expectedCodes[index], `Expected badge ${index + 1} on '${themeName}' to be ${expectedCodes[index]}`);
    const { backgroundColor } = await renderedColours(badge);
    assert.equal(
      backgroundColor,
      hexToRgb(expectedColor(code)),
      `Expected ${code} to be filled with its official UN colour ${expectedColor(code)}`,
    );
    // The number is checked here too, not only for the one badge AC-1 names, so a
    // goal that renders the wrong digit cannot hide behind the right fill colour.
    assert.equal(
      (await badge.getByTestId('sdg-badge-number').innerText()).trim(),
      String(sdgNumber(code)),
      `Expected the ${code} badge to show '${sdgNumber(code)}'`,
    );
  }
});

Then('the tooltip of the SDG badge for {string} on theme {string} should be hidden', async function (code, themeName) {
  const badge = await badgeFor(this, themeName, code);
  const tooltip = tooltipOf(badge);
  assert.equal(await tooltip.count(), 1, `Expected the '${code}' badge to carry a tooltip`);
  assert.equal(await tooltip.isVisible(), false, `Expected the '${code}' tooltip to stay hidden until hover`);
});

When('I hover the SDG badge for {string} on theme {string}', async function (code, themeName) {
  const badge = await badgeFor(this, themeName, code);
  await badge.hover();
  this.hoveredBadge = badge;
  this.hoveredCode = code;
});

Then('the tooltip {string} should become visible', async function (expectedText) {
  assert.ok(this.hoveredBadge, 'Expected a badge to have been hovered first');
  assert.equal(expectedText, expectedName(this.hoveredCode), `Scenario tooltip must be the Dutch name of ${this.hoveredCode}`);
  const tooltip = tooltipOf(this.hoveredBadge);
  await tooltip.waitFor({ state: 'visible' });
  const opacity = await settledOpacity(tooltip);
  assert.ok(opacity >= 1, `Expected the tooltip to fade fully in, opacity settled at ${opacity}`);
  assert.equal((await tooltip.innerText()).trim(), expectedText, 'Expected the tooltip to show the Dutch SDG name');
});

When('I click the SDG badge for {string} on theme {string}', async function (code, themeName) {
  const context = page(this).context();
  // Serve the UN goal page locally: the assertion is about where the badge points,
  // and it should not depend on reaching sdgs.un.org from the test machine.
  await context.route('https://sdgs.un.org/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>stubbed UN goal page</body></html>' }),
  );

  const badge = await badgeFor(this, themeName, code);
  const [openedTab] = await Promise.all([context.waitForEvent('page'), badge.click()]);
  await openedTab.waitForLoadState('domcontentloaded');
  this.openedTab = openedTab;
  this.clickedCode = code;
});

Then('a new browser tab should have opened at {string}', async function (expectedUrl) {
  assert.ok(this.openedTab, 'Expected the click to have opened a new browser tab');
  assert.equal(expectedUrl, expectedGoalUrl(this.clickedCode), `Scenario URL must be the UN goal page for ${this.clickedCode}`);
  assert.notEqual(this.openedTab, page(this), 'Expected a new tab, not a navigation of the current one');
  assert.equal(this.openedTab.url(), expectedUrl, 'Expected the new tab to be on the UN goal page');
  assert.ok(page(this).url().includes('/teacher'), 'Expected the original tab to stay on the teacher page');
});

Then('the SDG badges on theme {string} should be {string} and {string} in that order', async function (themeName, firstCode, secondCode) {
  const badges = await badgesOn(this, themeName);
  await badges.first().waitFor({ state: 'visible' });
  const renderedCodes = await Promise.all((await badges.all()).map((badge) => badge.getAttribute('data-sdg-code')));
  assert.deepEqual(renderedCodes, [firstCode, secondCode], `Expected '${themeName}' to render ${firstCode} then ${secondCode}`);
});

Then('each SDG badge on theme {string} should carry its own colour, tooltip and goal link', async function (themeName) {
  const badges = await badgesOn(this, themeName);
  await badges.first().waitFor({ state: 'visible' });
  const rendered = await badges.all();
  assert.equal(rendered.length, expectedCodesFor(themeName).length, `Expected every fixture code on '${themeName}' to render`);

  for (const badge of rendered) {
    const code = await badge.getAttribute('data-sdg-code');
    const { backgroundColor } = await renderedColours(badge);
    assert.equal(backgroundColor, hexToRgb(expectedColor(code)), `Expected ${code} to carry its own UN colour`);

    // The tooltip is hidden until hover, so read its text rather than its visibility.
    const tooltipText = (await tooltipOf(badge).textContent())?.trim();
    assert.equal(tooltipText, expectedName(code), `Expected ${code} to carry its own Dutch tooltip`);

    assert.equal(await badge.getAttribute('href'), expectedGoalUrl(code), `Expected ${code} to link to its own UN goal page`);
    assert.equal(await badge.getAttribute('target'), '_blank', `Expected ${code} to open in a new tab`);
  }
});

Then('the SDG badge for {string} on theme {string} should have text colour {string}', async function (code, themeName, hex) {
  const badge = await badgeFor(this, themeName, code);
  const { color, backgroundColor } = await renderedColours(badge);
  assert.equal(color, hexToRgb(hex), `Expected the '${code}' badge number to be rendered in ${hex}`);

  // Legibility is the point of AC-7, so prove the pairing actually reads, not just
  // that it matches the colour the scenario named.
  const ratio = contrastRatio(parseCssColor(color).channels, parseCssColor(backgroundColor).channels);
  assert.ok(
    ratio >= MINIMUM_CONTRAST_RATIO,
    `Expected ${code} text ${hex} on ${expectedColor(code)} to clear WCAG AA, got ${ratio.toFixed(2)}:1`,
  );
});

Then('every SDG badge on theme {string} should meet WCAG AA contrast', async function (themeName) {
  const badges = await badgesOn(this, themeName);
  await badges.first().waitFor({ state: 'visible' });
  const rendered = await badges.all();
  assert.equal(rendered.length, expectedCodesFor(themeName).length, `Expected every fixture code on '${themeName}' to render`);

  const failures = [];
  for (const badge of rendered) {
    const code = await badge.getAttribute('data-sdg-code');
    const { color, backgroundColor } = await renderedColours(badge);
    const ratio = contrastRatio(parseCssColor(color).channels, parseCssColor(backgroundColor).channels);
    if (ratio < MINIMUM_CONTRAST_RATIO) failures.push(`${code}: ${color} on ${backgroundColor} = ${ratio.toFixed(2)}:1`);
  }
  assert.deepEqual(failures, [], `Expected every SDG badge to clear ${MINIMUM_CONTRAST_RATIO}:1:\n  ${failures.join('\n  ')}`);
});

Then('the SDG badge for {string} on theme {string} should be a link announced as {string}', async function (code, themeName, accessibleName) {
  assert.equal(accessibleName, expectedAccessibleName(code), `Scenario name must be the full accessible name of ${code}`);
  const row = await themeRow(this, themeName);
  // getByRole resolves the computed accessible name, so this fails if the badge is
  // not exposed as a link or is announced as anything other than the full SDG name.
  const link = row.getByTestId('theme-sdg').getByRole('link', { name: accessibleName, exact: true });
  await link.waitFor({ state: 'visible' });
  assert.equal(await link.count(), 1, `Expected one link announced as '${accessibleName}'`);
  assert.equal(await link.getAttribute('data-sdg-code'), code, 'Expected that link to be the SDG badge itself');
  this.lastAnnouncedBadge = link;
});

Then('the number inside that badge should be hidden from assistive technology', async function () {
  assert.ok(this.lastAnnouncedBadge, 'Expected a badge to have been resolved by the preceding step');
  assert.equal(
    await this.lastAnnouncedBadge.getByTestId('sdg-badge-number').getAttribute('aria-hidden'),
    'true',
    'Expected the visual number to be hidden from screen readers, so only the full SDG name is announced',
  );
});

When('I tab forwards until the SDG badge for {string} on theme {string} has focus', async function (code, themeName) {
  const badge = await badgeFor(this, themeName, code);
  this.unfocusedIndicator = await readFocusIndicator(badge);

  let isFocused = false;
  for (let press = 0; press < MAX_TAB_PRESSES && !isFocused; press += 1) {
    await page(this).keyboard.press('Tab');
    isFocused = await badge.evaluate((el) => el === document.activeElement);
  }
  assert.ok(isFocused, `Expected the '${code}' badge to be reachable within ${MAX_TAB_PRESSES} Tab presses`);
  this.focusedBadge = badge;
});

Then('that SDG badge should show a focus indicator it does not show when unfocused', async function () {
  assert.ok(this.focusedBadge, 'Expected a badge to have been focused by the preceding step');
  const focused = await readFocusIndicator(this.focusedBadge);
  assert.ok(
    hasVisibleIndicator(focused),
    `Expected a focus ring while focused, computed styles were ${JSON.stringify(focused)}`,
  );
  assert.notDeepEqual(
    focused,
    this.unfocusedIndicator,
    'Expected the focus indicator to appear on focus rather than being present all the time',
  );
});
