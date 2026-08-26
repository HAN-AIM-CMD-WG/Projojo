/**
 * The 17 UN Sustainable Development Goals, in goal order.
 *
 * One table serves every SDG surface: the Dutch labels in the theme form's
 * multi-select (TS-task-011/012) and the official UN colours on SdgBadge
 * (TS-task-022). Keeping the names in a single place is what stops the picker
 * and the badge from ever disagreeing about what SDG 12 is called.
 *
 * A goal's `number` is its identity; the stored `sdg_code` form is "SDG" + that
 * number, single ("SDG12") or comma-separated ("SDG2,SDG12"), which is exactly
 * what the backend validates.
 */
const SDG_GOALS = Object.freeze([
    { number: 1, name: "Geen armoede", color: "#E5243B" },
    { number: 2, name: "Geen honger", color: "#DDA63A" },
    { number: 3, name: "Goede gezondheid en welzijn", color: "#4C9F38" },
    { number: 4, name: "Kwaliteitsonderwijs", color: "#C5192D" },
    { number: 5, name: "Gendergelijkheid", color: "#FF3A21" },
    { number: 6, name: "Schoon water en sanitair", color: "#26BDE2" },
    { number: 7, name: "Betaalbare en duurzame energie", color: "#FCC30B" },
    { number: 8, name: "Waardig werk en economische groei", color: "#A21942" },
    { number: 9, name: "Industrie, innovatie en infrastructuur", color: "#FD6925" },
    { number: 10, name: "Ongelijkheid verminderen", color: "#DD1367" },
    { number: 11, name: "Duurzame steden en gemeenschappen", color: "#FD9D24" },
    { number: 12, name: "Verantwoorde consumptie en productie", color: "#BF8B2E" },
    { number: 13, name: "Klimaatactie", color: "#3F7E44" },
    { number: 14, name: "Leven in het water", color: "#0A97D9" },
    { number: 15, name: "Leven op het land", color: "#56C02B" },
    { number: 16, name: "Vrede, justitie en sterke instellingen", color: "#00689D" },
    { number: 17, name: "Partnerschap om doelstellingen te bereiken", color: "#19486A" },
].map(Object.freeze));

const GOAL_BY_CODE = new Map(SDG_GOALS.map(goal => [`SDG${goal.number}`, goal]));

/** SDG1–SDG17 with their Dutch labels and official UN colours, for the theme form's multi-select. */
export const SDG_OPTIONS = SDG_GOALS.map(goal => ({ code: `SDG${goal.number}`, label: goal.name, color: goal.color }));

/** Join selected SDG codes into the canonical SDG1..SDG17 order, regardless of click order. */
export function joinSdgCodes(sdgCodes) {
    return SDG_OPTIONS.filter(option => sdgCodes.includes(option.code)).map(option => option.code).join(",");
}

/** Parse a stored "SDG2,SDG12" code string back into an array of codes. */
export function parseSdgCodes(sdgCode) {
    return sdgCode ? sdgCode.split(",").map(code => code.trim()).filter(Boolean) : [];
}

/**
 * The distinct goals a stored sdg_code names, in stored order.
 *
 * One goal is one badge however often it is named, so a repeated code collapses
 * rather than rendering twice. TS-task-028 rejects repeats on write, making this
 * defensive rather than load-bearing; it stays because a display component should
 * not duplicate on data it is handed, and because deduplicating is what keeps the
 * goal number usable as a React key.
 *
 * A null or empty code yields an empty list. So does an unrecognised one, which
 * the backend's pattern already rules out; dropping it keeps this function total
 * rather than handing a caller a hole where a goal should be.
 */
export function parseSdgGoals(sdgCode) {
    return [...new Set(parseSdgCodes(sdgCode))].map(code => GOAL_BY_CODE.get(code)).filter(Boolean);
}
