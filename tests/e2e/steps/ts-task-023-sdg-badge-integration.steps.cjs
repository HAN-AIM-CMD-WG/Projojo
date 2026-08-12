// TS-task-023 - SDG badge integration across the theme surfaces.
//
// This suite proves the SdgBadge (TS-task-022) is wired into every remaining theme
// surface. It reuses the navigation and staging steps of the sibling suites through
// Cucumber's global step registry - the TS-022 teacher catalog steps, the TS-019
// per-project link staging and details-page open, and the TS-018 card/public-page
// open - and defines only the SDG-badge assertions those suites do not carry.
//
// Expected SDG colours, names and goal URLs come from support/sdg-catalog.cjs, which
// hardcodes them from the issue rather than importing utils/sdg.js, so these steps
// answer to the specification instead of to the code under test.
//
// The badge is a link (SdgBadge default) on the surfaces where a link is safe -
// the ThemePicker pills and the details pills, where it sits ADJACENT to its pill -
// and a passive indicator on the project cards, where the card is a single <Link>
// and a nested <a> would be invalid HTML. Each assertion checks the shape the
// surface is meant to have, not just that some badge rendered.

const assert = require('node:assert/strict');

const { Given, When, Then } = require('@qavajs/core');

const { FRONTEND_URL, PROOF_PROJECT_ID } = require('../support/test-data.cjs');
const { page } = require('../support/e2e-session.cjs');
const { fetchThemes } = require('../support/theme-catalog.cjs');
const { stubThemesEndpoint } = require('../support/theme-stub.cjs');
const { hexToRgb } = require('../support/theme-color.cjs');
const { expectedColor, expectedGoalUrl, sdgNumber } = require('../support/sdg-catalog.cjs');

const PICKER_HARNESS_PATH = '/dev/theme-picker';

// --- shared element helpers ------------------------------------------------------

/** A theme catalog row whose name cell reads exactly `name`. */
async function themeRowByName(world, name) {
  await page(world).getByTestId('theme-row').first().waitFor({ state: 'visible' });
  for (const row of await page(world).getByTestId('theme-row').all()) {
    if ((await row.getByTestId('theme-name').innerText()).trim() === name) return row;
  }
  return assert.fail(`Expected a theme row named '${name}'`);
}

/** Resolve a catalog theme name to the id the backend assigned it. */
async function themeIdByName(name) {
  const catalog = await fetchThemes();
  const theme = catalog.find((candidate) => candidate?.name === name);
  assert.ok(theme?.id, `Expected a theme named '${name}' in the catalog`);
  return theme.id;
}

/** The SdgBadge for `code` under `scope`, asserting it renders exactly once. */
async function sdgBadge(scope, code) {
  const badge = scope.locator(`[data-testid="sdg-badge"][data-sdg-code="${code}"]`);
  await badge.first().waitFor({ state: 'visible', timeout: 12_000 });
  assert.equal(await badge.count(), 1, `Expected exactly one '${code}' SDG badge`);
  return badge;
}

/** Assert a badge is a link to its own UN goal page, opening in a new tab. */
async function assertGoalLink(badge, urlCode) {
  assert.equal(await badge.evaluate((el) => el.tagName), 'A', `Expected the '${urlCode}' SDG badge to be a link`);
  assert.equal(await badge.getAttribute('href'), expectedGoalUrl(urlCode), `Expected the '${urlCode}' SDG badge to link to its UN goal page`);
  assert.equal(await badge.getAttribute('target'), '_blank', `Expected the '${urlCode}' SDG badge to open in a new tab`);
}

// --- AC-1: the teacher theme management list ------------------------------------

Then('the theme row {string} shows its SDG badge for {string} beside the theme name', async function (themeName, code) {
  const row = await themeRowByName(this, themeName);
  // The name cell and the SDG cell share the same row, so a badge found within this
  // row is rendered beside the name (the SDG column sits right after the Naam column).
  assert.equal((await row.getByTestId('theme-name').innerText()).trim(), themeName);
  await sdgBadge(row, code);
});

// --- AC-2: the SDG picker inside the create/edit modal --------------------------

function createModal(world) {
  return page(world).getByTestId('theme-create-modal');
}

When('I open the SDG code dropdown', async function () {
  await createModal(this).getByTestId('theme-sdg-trigger').click();
});

Then('the SDG option {string} shows a UN colour preview filled with {string}', async function (code, hex) {
  // Guard the feature literal against a typo: it must be the official UN colour.
  assert.equal(hex.toUpperCase(), expectedColor(code), `Scenario colour for ${code} must be its official UN colour`);
  const swatch = createModal(this).getByTestId(`theme-sdg-swatch-${code}`);
  await swatch.first().waitFor({ state: 'attached', timeout: 10_000 });
  const background = await swatch.first().evaluate((el) => getComputedStyle(el).backgroundColor);
  assert.equal(background, hexToRgb(hex), `Expected the ${code} option's colour preview to be filled with ${hex}`);
});

Then('the SDG option {string} still reads {string}', async function (code, expectedText) {
  const option = createModal(this).getByTestId(`theme-sdg-option-${code}`);
  const text = (await option.innerText()).replace(/\s+/g, ' ').trim();
  assert.ok(text.includes(expectedText), `Expected the ${code} option to still read '${expectedText}', got '${text}'`);
});

Then('every SDG option shows a UN colour preview in its own official UN colour', async function () {
  const modal = createModal(this);
  for (let number = 1; number <= 17; number += 1) {
    const code = `SDG${number}`;
    const swatch = modal.getByTestId(`theme-sdg-swatch-${code}`);
    assert.equal(await swatch.count(), 1, `Expected a colour preview for ${code}`);
    const background = await swatch.evaluate((el) => getComputedStyle(el).backgroundColor);
    assert.equal(
      background,
      hexToRgb(expectedColor(code)),
      `Expected the ${code} colour preview to show its official UN colour ${expectedColor(code)}`,
    );
  }
});

// --- AC-3: the ThemePicker pills (driven through the dev harness) ----------------

Given('the theme picker lists a theme {string} with SDG code {string} and a theme {string} with no SDG code', async function (themedName, code, plainName) {
  // Guard the feature literal so a typo cannot silently pick an unknown code.
  sdgNumber(code);
  this.pickerThemes = [
    { id: 'ts023-picker-themed', name: themedName, color: '#4CAF50', sdg_code: code },
    { id: 'ts023-picker-plain', name: plainName, color: '#9E9E9E' },
  ];
  await stubThemesEndpoint(page(this), { body: this.pickerThemes });
});

When('I open the SDG-themed theme picker demo', async function () {
  await page(this).goto(`${FRONTEND_URL}${PICKER_HARNESS_PATH}`);
  await page(this).getByTestId('theme-picker').waitFor({ state: 'visible', timeout: 15_000 });
});

/** The per-theme group (pill + optional badge) the picker renders for `name`. */
function pickerGroup(world, name) {
  const theme = (world.pickerThemes || []).find((candidate) => candidate.name === name);
  assert.ok(theme, `Unknown picker theme '${name}' - stage it in the Given first`);
  return page(world).locator(`[data-testid="theme-pill-group"][data-theme-id="${theme.id}"]`);
}

Then('the theme picker pill {string} shows an adjacent SDG badge for {string}', async function (name, code) {
  const group = pickerGroup(this, name);
  await group.getByTestId('theme-pill').waitFor({ state: 'visible', timeout: 12_000 });
  await sdgBadge(group, code);
});

Then('the picker SDG badge for {string} links to the UN goal page for {string}', async function (code, urlCode) {
  const badge = page(this).locator(`[data-testid="theme-pill-group"] [data-testid="sdg-badge"][data-sdg-code="${code}"]`).first();
  await badge.waitFor({ state: 'visible', timeout: 12_000 });
  await assertGoalLink(badge, urlCode);
});

Then('the theme picker pill {string} shows no SDG badge', async function (name) {
  const group = pickerGroup(this, name);
  await group.getByTestId('theme-pill').waitFor({ state: 'visible', timeout: 12_000 });
  assert.equal(await group.getByTestId('sdg-badge').count(), 0, `Expected no SDG badge beside the '${name}' pill`);
});

// --- AC-4 / AC-6: the project details theme section -----------------------------

/** The per-theme group (pill + optional badge) the details section renders for `name`. */
async function detailsGroup(world, name) {
  const id = await themeIdByName(name);
  return page(world).getByTestId('project-themes').locator(`[data-testid="project-theme"][data-theme-id="${id}"]`);
}

Then('the project theme pill {string} shows an adjacent SDG badge for {string}', async function (name, code) {
  const group = await detailsGroup(this, name);
  await group.getByTestId('project-theme-pill').waitFor({ state: 'visible', timeout: 12_000 });
  await sdgBadge(group, code);
});

Then('the details SDG badge for {string} links to the UN goal page for {string}', async function (code, urlCode) {
  const badge = page(this).getByTestId('project-themes').locator(`[data-testid="sdg-badge"][data-sdg-code="${code}"]`).first();
  await badge.waitFor({ state: 'visible', timeout: 12_000 });
  await assertGoalLink(badge, urlCode);
});

Then('the project theme pill {string} shows no SDG badge', async function (name) {
  const group = await detailsGroup(this, name);
  await group.getByTestId('project-theme-pill').waitFor({ state: 'visible', timeout: 12_000 });
  assert.equal(await group.getByTestId('sdg-badge').count(), 0, `Expected no SDG badge beside the '${name}' pill`);
});

// --- AC-5 / AC-6: the project cards ---------------------------------------------

function projectCard(world) {
  return page(world).locator(`#project-${PROOF_PROJECT_ID}`);
}

function publicProjectCard(world) {
  return page(world).locator(`a[href="/publiek/${PROOF_PROJECT_ID}"]`);
}

Then('the project card theme badge shows an SDG badge for {string}', async function (code) {
  const card = projectCard(this);
  await card.getByTestId('project-theme-badge').waitFor({ state: 'visible', timeout: 12_000 });
  await sdgBadge(card, code);
});

Then('the public project card theme badge shows an SDG badge for {string}', async function (code) {
  const card = publicProjectCard(this);
  await card.getByTestId('project-theme-badge').waitFor({ state: 'visible', timeout: 12_000 });
  await sdgBadge(card, code);
});

Then('the project card SDG badge is a passive indicator, not a link', async function () {
  const badge = projectCard(this).getByTestId('sdg-badge').first();
  await badge.waitFor({ state: 'visible', timeout: 12_000 });
  // Inside the card's own <Link>, a nested <a> would be invalid HTML, so the card
  // badge must be a passive element carrying no href of its own.
  assert.notEqual(await badge.evaluate((el) => el.tagName), 'A', 'Expected the card SDG badge not to be a nested <a>');
  assert.equal(await badge.getAttribute('href'), null, 'Expected the card SDG badge to carry no href');
});

Then('the project card theme badge shows no SDG badge', async function () {
  const card = projectCard(this);
  await card.getByTestId('project-theme-badge').waitFor({ state: 'visible', timeout: 12_000 });
  assert.equal(await card.getByTestId('sdg-badge').count(), 0, 'Expected no SDG badge on the project card');
});

Then('the project card shows exactly {int} SDG badges', async function (count) {
  const card = projectCard(this);
  await card.getByTestId('project-theme-badge').waitFor({ state: 'visible', timeout: 12_000 });
  assert.equal(await card.getByTestId('sdg-badge').count(), count, `Expected exactly ${count} SDG badge(s) on the card`);
});

Then('the project card SDG badge shows an overflow count of {string}', async function (expected) {
  const overflow = projectCard(this).getByTestId('sdg-badge-overflow');
  await overflow.waitFor({ state: 'visible', timeout: 12_000 });
  assert.equal((await overflow.innerText()).trim(), expected, `Expected the card SDG overflow to read '${expected}'`);
});

Then('the project card SDG badges show no overflow count', async function () {
  const card = projectCard(this);
  await card.getByTestId('project-theme-badge').waitFor({ state: 'visible', timeout: 12_000 });
  assert.equal(await card.getByTestId('sdg-badge-overflow').count(), 0, 'Expected no +N SDG overflow on the card');
});
