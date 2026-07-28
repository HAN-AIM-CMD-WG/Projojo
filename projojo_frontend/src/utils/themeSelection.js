/**
 * Set equality for two arrays of unique theme ids.
 *
 * Both theme-editing surfaces (the project edit form and the inline editor on the
 * project details page) use this to decide whether a save has anything to write:
 * linking replaces every link, so an unchanged selection must not be rewritten.
 * They share one implementation so they can never disagree on what "unchanged" is.
 */
export function sameIds(a, b) {
    return a.length === b.length && a.every((id) => b.includes(id));
}