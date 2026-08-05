// Expected SDG data and the theme fixtures for the TS-task-022 badge suite.
//
// The 17 official UN colours and their Dutch names are spelled out here straight
// from the GitHub issue (TS-task-022 AC-2 and the Technical Notes), deliberately
// NOT imported from projojo_frontend/src/utils/sdg.js. A step that read the
// colours out of the code under test would only prove that file agrees with
// itself; hardcoding the expectation is what makes "the badge uses the official
// UN colour" an assertion rather than a tautology. This mirrors the same choice
// theme-color.cjs makes about the WCAG maths.

const assert = require('node:assert/strict');

/** Official UN SDG colours, keyed by goal number (TS-task-022 AC-2). */
const SDG_COLORS = Object.freeze({
  1: '#E5243B',
  2: '#DDA63A',
  3: '#4C9F38',
  4: '#C5192D',
  5: '#FF3A21',
  6: '#26BDE2',
  7: '#FCC30B',
  8: '#A21942',
  9: '#FD6925',
  10: '#DD1367',
  11: '#FD9D24',
  12: '#BF8B2E',
  13: '#3F7E44',
  14: '#0A97D9',
  15: '#56C02B',
  16: '#00689D',
  17: '#19486A',
});

/** Dutch SDG names, keyed by goal number (TS-task-022 AC-3 and Technical Notes). */
const SDG_NAMES_NL = Object.freeze({
  1: 'Geen armoede',
  2: 'Geen honger',
  3: 'Goede gezondheid en welzijn',
  4: 'Kwaliteitsonderwijs',
  5: 'Gendergelijkheid',
  6: 'Schoon water en sanitair',
  7: 'Betaalbare en duurzame energie',
  8: 'Waardig werk en economische groei',
  9: 'Industrie, innovatie en infrastructuur',
  10: 'Ongelijkheid verminderen',
  11: 'Duurzame steden en gemeenschappen',
  12: 'Verantwoorde consumptie en productie',
  13: 'Klimaatactie',
  14: 'Leven in het water',
  15: 'Leven op het land',
  16: 'Vrede, justitie en sterke instellingen',
  17: 'Partnerschap om doelstellingen te bereiken',
});

/** Every code SDG1..SDG17, in canonical order. */
const ALL_SDG_CODES = Object.freeze(Object.keys(SDG_COLORS).map((number) => `SDG${number}`));

/** 'SDG12' -> 12, failing loudly on anything the fixtures did not intend. */
function sdgNumber(code) {
  const match = /^SDG(\d+)$/.exec(code);
  assert.ok(match, `Expected an SDG code like 'SDG12', got '${code}'`);
  const number = Number(match[1]);
  assert.ok(SDG_COLORS[number], `Expected a known SDG number in '${code}'`);
  return number;
}

const expectedColor = (code) => SDG_COLORS[sdgNumber(code)];
const expectedName = (code) => SDG_NAMES_NL[sdgNumber(code)];

/** The full accessible name AC-8 requires, e.g. 'SDG 12: Verantwoorde consumptie en productie'. */
const expectedAccessibleName = (code) => `SDG ${sdgNumber(code)}: ${expectedName(code)}`;

/** The UN goal page AC-4 requires the badge to link to. */
const expectedGoalUrl = (code) => `https://sdgs.un.org/goals/goal${sdgNumber(code)}`;

// Theme fixtures for the TS-task-022 scenarios. Each theme isolates one badge
// behaviour, so a scenario never depends on another scenario's theme:
//
//   SDG Enkel         single code            AC-1, AC-3, AC-4, AC-8
//   SDG Samengesteld  compound code          AC-5
//   SDG Donker        dark fill  (SDG17)     AC-7
//   SDG Licht         light fill (SDG7)      AC-7
//   SDG Alle          all 17 codes at once   AC-2, AC-7 (contrast sweep)
//   SDG Geen          no sdg_code at all     AC-6
//
// "SDG Enkel" carries display_order 1 so it renders in the first theme row: the
// keyboard-focus scenario tabs to it from the top of the page, and a first row
// keeps that walk short. Omitting sdg_code entirely on "SDG Geen" is what sends
// a null sdgCode into the component, which is exactly what AC-6 is about.
const TS022_THEME_FIXTURES = Object.freeze([
  Object.freeze({ name: 'SDG Enkel', sdg_code: 'SDG12', icon: 'eco', color: '#4CAF50', display_order: 1, description: 'Eén SDG-code.' }),
  Object.freeze({ name: 'SDG Samengesteld', sdg_code: 'SDG2,SDG12', icon: 'restaurant', color: '#FF9800', display_order: 2, description: 'Twee SDG-codes.' }),
  Object.freeze({ name: 'SDG Donker', sdg_code: 'SDG17', icon: 'handshake', color: '#3F51B5', display_order: 3, description: 'Donkere SDG-kleur.' }),
  Object.freeze({ name: 'SDG Licht', sdg_code: 'SDG7', icon: 'bolt', color: '#FFC107', display_order: 4, description: 'Lichte SDG-kleur.' }),
  Object.freeze({ name: 'SDG Alle', sdg_code: ALL_SDG_CODES.join(','), icon: 'public', color: '#2196F3', display_order: 5, description: 'Alle zeventien SDG-codes.' }),
  Object.freeze({ name: 'SDG Geen', sdg_code: null, icon: 'category', color: '#9E9E9E', display_order: 6, description: 'Geen SDG-code.' }),
]);

/** The fixture themes as the theme API accepts them: a null sdg_code is omitted, not sent. */
const TS022_THEME_PAYLOADS = Object.freeze(
  TS022_THEME_FIXTURES.map(({ sdg_code: sdgCode, ...rest }) => Object.freeze(sdgCode ? { ...rest, sdg_code: sdgCode } : rest)),
);

/** The codes a fixture theme must render badges for, in order; [] when it has none. */
function expectedCodesFor(themeName) {
  const fixture = TS022_THEME_FIXTURES.find((theme) => theme.name === themeName);
  assert.ok(fixture, `Expected a TS-task-022 fixture theme named '${themeName}'`);
  return fixture.sdg_code ? fixture.sdg_code.split(',') : [];
}

module.exports = {
  SDG_COLORS,
  SDG_NAMES_NL,
  ALL_SDG_CODES,
  TS022_THEME_FIXTURES,
  TS022_THEME_PAYLOADS,
  sdgNumber,
  expectedColor,
  expectedName,
  expectedAccessibleName,
  expectedGoalUrl,
  expectedCodesFor,
};
