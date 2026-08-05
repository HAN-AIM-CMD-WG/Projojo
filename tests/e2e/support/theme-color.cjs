// Colour maths shared by the theme UI suites: the picker (TS-task-014), the project
// card badge (TS-task-018), the details page (TS-task-019) and the supervisor
// dashboard (TS-task-021). All four read colours back out of the browser and have to
// turn them into something assertable.
//
// The WCAG 2.1 luminance and contrast maths here is deliberately an independent
// re-implementation rather than an import of the frontend's own legibleFill helper:
// a step that used the helper would only prove the helper agrees with itself, never
// that the rendered pill is legible.

const assert = require('node:assert/strict');

// The fill a theme carrying no colour of its own falls back to. The app declares the
// same value as COLORLESS_THEME_FILL in projojo_frontend/src/utils/themeColor.js;
// spelling it out here keeps the expectation independent of the code under test.
const COLORLESS_THEME_FILL = '#FF7F50';

// WCAG AA for normal text. Black-or-white always clears at least 4.58:1 against any
// sRGB fill, so anything below this is a real defect rather than a borderline choice.
const MINIMUM_CONTRAST_RATIO = 4.5;

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

/** WCAG contrast ratio between two [r, g, b] triples, as parseCssColor returns them. */
function contrastRatio(foreground, background) {
  const [light, dark] = [relativeLuminance(foreground), relativeLuminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

module.exports = {
  COLORLESS_THEME_FILL,
  MINIMUM_CONTRAST_RATIO,
  hexToRgb,
  parseCssColor,
  contrastRatio,
};
