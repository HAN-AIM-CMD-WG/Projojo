const assert = require('node:assert/strict');

const { Given, Then, When } = require('@qavajs/core');

const { E2E_TEACHER_ID } = require('../support/test-data.cjs');
const { page, authenticateInBrowser } = require('../support/e2e-session.cjs');
const {
  THEME_SEED_BASELINE,
  BASELINE_DUPLICATE_NAME,
  resetThemeCatalog,
  getThemeByName,
  waitForThemeByName,
} = require('../support/theme-catalog.cjs');

// This suite runs entirely against the real backend: the create happy path, the
// auto-assigned display_order and the comma-joined SDG code are asserted on what
// the backend actually persisted, and the AC-5/AC-6 error states are the real
// 400s the backend returns for an empty and a duplicate name. Nothing is stubbed,
// so the real POST /themes contract (including its slash redirect) is exercised.
//
// The shared baseline's highest display_order is on a theme whose name is not
// last alphabetically, so "max display order + 1" (AC-3) is an unambiguous target.
const MAX_BASELINE_DISPLAY_ORDER = Math.max(...THEME_SEED_BASELINE.map((theme) => theme.display_order));

// Canonical Dutch SDG labels (issue example "SDG1 — Geen armoede" +
// THEME_SDG_IMPLEMENTATION_PLAN.md §3.1). Hardcoded here on purpose so the
// assertion proves the component renders the right copy rather than mirroring
// the component's own constant.
const SDG_LABELS = {
  SDG1: 'Geen armoede',
  SDG2: 'Geen honger',
  SDG3: 'Goede gezondheid en welzijn',
  SDG4: 'Kwaliteitsonderwijs',
  SDG5: 'Gendergelijkheid',
  SDG6: 'Schoon water en sanitair',
  SDG7: 'Betaalbare en duurzame energie',
  SDG8: 'Waardig werk en economische groei',
  SDG9: 'Industrie, innovatie en infrastructuur',
  SDG10: 'Ongelijkheid verminderen',
  SDG11: 'Duurzame steden en gemeenschappen',
  SDG12: 'Verantwoorde consumptie en productie',
  SDG13: 'Klimaatactie',
  SDG14: 'Leven in het water',
  SDG15: 'Leven op het land',
  SDG16: 'Vrede, justitie en sterke instellingen',
  SDG17: 'Partnerschap om doelstellingen te bereiken',
};

function createModal(world) {
  return page(world).getByTestId('theme-create-modal');
}

/**
 * Read back the theme the scenario just created. Guards the implicit coupling to
 * the fill step: without it, a scenario that reads back without filling a name
 * polls for ten seconds and then fails with "a theme named 'undefined'".
 */
async function readCreatedTheme(world) {
  assert.ok(world.themeName, 'Expected the scenario to fill in a theme name before reading the created theme back');
  return waitForThemeByName(world.themeName);
}

Given('I am authenticated in the browser as the TS-task-011 teacher', async function () {
  await authenticateInBrowser(this, E2E_TEACHER_ID);
});

Given('the theme catalog contains only the TS-011 baseline themes', async function () {
  // Real backend: reset to the shared deterministic baseline so the create form
  // sees a known catalog (fixed max display_order, and an existing
  // "Duurzaamheid" for the duplicate-name scenario).
  await resetThemeCatalog();
});


When('I open the theme create modal', async function () {
  await page(this).getByRole('button', { name: 'Nieuw thema' }).click();
  await createModal(this).waitFor({ state: 'visible' });
});

When('I fill in the theme name {string}', async function (name) {
  // Remembered so the persisted-theme assertions know which theme to read back.
  this.themeName = name;
  await createModal(this).getByTestId('theme-name-input').fill(name);
});

When('I fill in the theme name of an existing theme', async function () {
  // Derived from the baseline so the duplicate-name scenario cannot silently
  // decouple from the fixture it depends on.
  this.themeName = BASELINE_DUPLICATE_NAME;
  await createModal(this).getByTestId('theme-name-input').fill(BASELINE_DUPLICATE_NAME);
});

When('I save the new theme', async function () {
  await createModal(this).getByTestId('theme-save-button').click();
});

When('I cancel the theme create modal', async function () {
  await createModal(this).getByTestId('theme-cancel-button').click();
});

When('I select the SDG options {string} and {string}', async function (firstCode, secondCode) {
  const modal = createModal(this);
  await modal.getByTestId('theme-sdg-trigger').click();
  for (const code of [firstCode, secondCode]) {
    await modal.getByTestId(`theme-sdg-checkbox-${code}`).check();
  }
});

When('I open the icon dropdown', async function () {
  await createModal(this).getByTestId('theme-icon-trigger').click();
});

When('I pick the color {string}', async function (hex) {
  // <input type="color"> is not fillable, and a controlled React input ignores a
  // direct value assignment. Use the native value setter so React's change
  // tracker fires onChange, mirroring a user picking a swatch.
  const input = createModal(this).getByTestId('theme-color-input');
  await input.evaluate((element, value) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }, hex);
});

Then('the theme create modal should be visible', async function () {
  assert.equal(await createModal(this).isVisible(), true, 'Expected the theme create modal to be visible');
});

Then('all theme create fields should be empty', async function () {
  const modal = createModal(this);
  assert.equal(await modal.getByTestId('theme-name-input').inputValue(), '', 'Expected the name field to be empty');
  assert.equal(await modal.getByTestId('theme-description-input').inputValue(), '', 'Expected the description field to be empty');

  const sdgTrigger = (await modal.getByTestId('theme-sdg-trigger').innerText()).trim();
  assert.ok(/geen|selecteer/i.test(sdgTrigger), `Expected the SDG selector to show its empty placeholder, got '${sdgTrigger}'`);

  const iconTrigger = (await modal.getByTestId('theme-icon-trigger').innerText()).trim();
  assert.ok(/selecteer/i.test(iconTrigger), `Expected the icon selector to show its empty placeholder, got '${iconTrigger}'`);
});

Then('the create form should show a required {string} text field', async function (label) {
  const modal = createModal(this);
  const input = modal.getByTestId('theme-name-input');
  await input.waitFor({ state: 'visible' });
  assert.equal(await input.getAttribute('type'), 'text', `Expected the '${label}' field to be a text input`);
  assert.equal(await input.getAttribute('required'), '', `Expected the '${label}' field to be marked required`);
  // The label must carry a visible required marker (*) next to the field name.
  const requiredLabel = modal.locator('label', { hasText: label }).filter({ hasText: '*' });
  assert.equal(await requiredLabel.count() >= 1, true, `Expected a '${label}' label with a required '*' marker`);
});

Then('the create form should show a {string} textarea with a {string} character counter', async function (label, counter) {
  const modal = createModal(this);
  const textarea = modal.getByTestId('theme-description-input');
  await textarea.waitFor({ state: 'visible' });
  assert.equal(
    await textarea.evaluate((element) => element.tagName.toLowerCase()),
    'textarea',
    `Expected the '${label}' field to be a textarea`,
  );
  const counterText = (await modal.getByTestId('theme-description-counter').innerText()).replace(/\s+/g, '');
  assert.ok(counterText.includes(counter), `Expected the description counter to show '${counter}', got '${counterText}'`);
});

Then('the create form should offer SDG1 through SDG17 as labelled multi-select options', async function () {
  const modal = createModal(this);
  await modal.getByTestId('theme-sdg-trigger').click();

  for (let n = 1; n <= 17; n += 1) {
    const code = `SDG${n}`;
    const checkbox = modal.getByTestId(`theme-sdg-checkbox-${code}`);
    assert.equal(await checkbox.count(), 1, `Expected a multi-select checkbox for ${code}`);

    const option = modal.getByTestId(`theme-sdg-option-${code}`);
    const optionText = (await option.innerText()).replace(/\s+/g, ' ').trim();
    assert.ok(optionText.includes(code), `Expected the ${code} option to be labelled with its code, got '${optionText}'`);
    assert.ok(
      optionText.includes(SDG_LABELS[code]),
      `Expected the ${code} option to include its Dutch label '${SDG_LABELS[code]}', got '${optionText}'`,
    );
  }
});

Then('the create form should offer an icon dropdown of at least {int} predefined icons', async function (minimum) {
  const modal = createModal(this);
  await modal.getByTestId('theme-icon-trigger').click();
  const count = await modal.getByTestId('theme-icon-option').count();
  assert.ok(count >= minimum, `Expected at least ${minimum} icon options, found ${count}`);
});

Then('the create form should show a native color picker with its hex value', async function () {
  const modal = createModal(this);
  const colorInput = modal.getByTestId('theme-color-input');
  assert.equal(await colorInput.getAttribute('type'), 'color', 'Expected a native <input type="color">');
  const hex = (await modal.getByTestId('theme-color-hex').innerText()).trim();
  assert.ok(/^#[0-9a-fA-F]{6}$/.test(hex), `Expected a hex value shown beside the picker, got '${hex}'`);
});

Then('the create form should not show a display order field', async function () {
  const modal = createModal(this);
  assert.equal(await modal.getByTestId('theme-display-order-input').count(), 0, 'Expected no display order input in the form');
  const text = await modal.innerText();
  assert.ok(!/sorteervolgorde|display.?order|weergavevolgorde/i.test(text), 'Expected no display order field label in the form');
});

Then('the created theme display_order should equal the highest baseline display order plus one', async function () {
  const created = await readCreatedTheme(this);
  assert.equal(
    created.display_order,
    MAX_BASELINE_DISPLAY_ORDER + 1,
    `Expected the persisted display_order to be ${MAX_BASELINE_DISPLAY_ORDER + 1}, got ${created.display_order}`,
  );
});

Then('the created theme display_order should equal {int}', async function (expected) {
  const created = await readCreatedTheme(this);
  assert.equal(
    created.display_order,
    expected,
    `Expected the persisted display_order to be ${expected}, got ${created.display_order}`,
  );
});

Then('the theme create modal should be closed', async function () {
  await createModal(this).waitFor({ state: 'detached', timeout: 10_000 });
  assert.equal(await createModal(this).count(), 0, 'Expected the theme create modal to be closed');
});

Then('a {string} success message should be shown', async function (message) {
  const toast = page(this).getByRole('alert').filter({ hasText: message });
  await toast.waitFor({ state: 'visible', timeout: 10_000 });
  assert.equal(await toast.isVisible(), true, `Expected a success message '${message}'`);
});

Then('a theme row named {string} should be listed', async function (name) {
  const row = page(this).getByTestId('theme-row').filter({ hasText: name });
  await row.waitFor({ state: 'visible', timeout: 10_000 });
  assert.equal(await row.count(), 1, `Expected exactly one theme row named '${name}'`);
});

Then('the theme create modal should stay open', async function () {
  // Ordered after the inline-error assertion, which waits for the failed response
  // to render. The save has therefore already resolved, so a still-visible modal
  // is a real assertion rather than a sleep racing the request.
  assert.equal(await createModal(this).isVisible(), true, 'Expected the create modal to stay open after a failed save');
});

Then('the inline create error {string} should be shown', async function (message) {
  const error = createModal(this).getByTestId('theme-form-error');
  await error.waitFor({ state: 'visible', timeout: 10_000 });
  assert.equal((await error.innerText()).trim(), message, `Expected the inline error to read '${message}'`);
});

Then('no theme named {string} should exist', async function (name) {
  // Give any (unwanted) in-flight create a chance to land before asserting absence.
  await page(this).waitForTimeout(500);
  assert.equal(await getThemeByName(name), null, `Expected no theme named '${name}' to have been created`);
});

Then('the created theme sdg_code should equal {string}', async function (expected) {
  const created = await readCreatedTheme(this);
  assert.equal(created.sdg_code, expected, `Expected the persisted sdg_code to be '${expected}', got '${created.sdg_code}'`);
});

Then('every icon option should render its Material Symbols glyph next to its name', async function () {
  const modal = createModal(this);
  await modal.getByTestId('theme-icon-option').first().waitFor({ state: 'visible' });

  // Inspected in a single round trip: walking ~90 options through the driver with
  // three calls each was slow and proved nothing extra.
  //
  // This asserts structure, not pixels: each option carries exactly one icon-font
  // element whose ligature is the icon name, plus that same name as separate
  // readable text. It deliberately does NOT assert that the font itself painted a
  // glyph - Material Symbols is loaded from the Google Fonts CDN (index.html), so
  // any such check would fail whenever the runner is offline or the CDN blips,
  // trading a real bug for a flake in a suite built to be deterministic.
  const { total, offenders } = await modal.evaluate((root) => {
    const options = [...root.querySelectorAll('[data-testid="theme-icon-option"]')];
    const bad = [];

    for (const option of options) {
      const glyphs = option.querySelectorAll('.material-symbols-outlined');
      const ligature = glyphs.length === 1 ? (glyphs[0].textContent || '').trim() : '';
      const label = [...option.children]
        .filter((child) => !child.classList.contains('material-symbols-outlined'))
        .map((child) => (child.textContent || '').trim())
        .join(' ')
        .trim();

      // The readable label must name the same icon the ligature renders.
      if (glyphs.length !== 1 || !ligature || !label || label !== ligature) {
        bad.push({ text: (option.textContent || '').trim(), glyphs: glyphs.length, ligature, label });
      }
    }

    return { total: options.length, offenders: bad.slice(0, 5) };
  });

  assert.ok(total > 0, 'Expected the icon dropdown to be open with options');
  assert.deepEqual(
    offenders,
    [],
    `Expected every icon option to render one icon-font glyph beside its readable name; first offenders: ${JSON.stringify(offenders)}`,
  );
});

Then('the color field should be a native color input', async function () {
  const colorInput = createModal(this).getByTestId('theme-color-input');
  assert.equal(await colorInput.getAttribute('type'), 'color', 'Expected a native <input type="color">');
});

Then('the color hex value {string} should be displayed next to the picker', async function (hex) {
  const hexDisplay = createModal(this).getByTestId('theme-color-hex');
  await assert.doesNotReject(
    hexDisplay.filter({ hasText: hex }).waitFor({ state: 'visible', timeout: 5_000 }),
    `Expected the hex value '${hex}' to be displayed`,
  );
  assert.equal((await hexDisplay.innerText()).trim().toLowerCase(), hex.toLowerCase(), `Expected the hex display to read '${hex}'`);
});
