const DARK_TEXT = '#000000';
const WHITE_TEXT = '#FFFFFF';

/**
 * Fill for a theme that carries no colour of its own. Colour is optional on a theme,
 * and every surface that renders one - the card badge, the details section, the
 * picker, the supervisor dashboard - falls back to the same coral, so a colourless
 * theme looks like one theme rather than four different ones.
 */
export const COLORLESS_THEME_FILL = '#FF7F50';

/**
 * Choose a legible { backgroundColor, color } for a colour-filled theme pill: use
 * whichever of white or black text has the higher contrast against `hex`.
 *
 * Pure black and pure white bracket the whole sRGB cube: white clears WCAG AA
 * (4.5:1) against every background with relative luminance <= 0.1833 and black
 * against every one >= 0.175, so the two ranges overlap and the better of the
 * pair is always at least 4.58:1 (worst case around #CF0DCC). The fill itself
 * therefore never has to be altered to stay legible.
 *
 * This only holds for PURE black - the #1A1512 dark-surface token leaves a gap
 * around luminance 0.197 (worst case 4.26:1, ~5.7% of sRGB) where neither
 * option reaches AA, which is why that token is deliberately not used here.
 */
export function legibleFill(hex) {
    const bgLum = luminance(...toRgb(hex));
    const white = contrast(bgLum, luminance(...toRgb(WHITE_TEXT)));
    const dark = contrast(bgLum, luminance(...toRgb(DARK_TEXT)));
    return { backgroundColor: hex, color: white >= dark ? WHITE_TEXT : DARK_TEXT };
}

function contrast(lumA, lumB) {
    return (Math.max(lumA, lumB) + 0.05) / (Math.min(lumA, lumB) + 0.05);
}

function toRgb(hex) {
    const value = hex.replace('#', '');
    return [value.slice(0, 2), value.slice(2, 4), value.slice(4, 6)].map((c) => parseInt(c, 16));
}

function luminance(r, g, b) {
    const toLinear = (channel) => {
        const c = channel / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}
