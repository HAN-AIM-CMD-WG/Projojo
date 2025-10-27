/**
 * Helpers to normalize skill objects from various backend shapes into a single
 * canonical shape used across the frontend:
 *   { skillId, name, isPending }
 *
 * Backend can return variations like:
 * - { id, name, is_pending }
 * - { skillId, name, isPending }
 * - { skill_name }
 * - { name } (no id)
 *
 * This module provides stable normalization and a convenience for arrays.
 */

/**
 * @param {any} s
 * @returns {{ skillId: string|number, name: string, isPending: boolean }}
 */
export function normalizeSkill(s) {
  if (!s) return { skillId: undefined, name: '', isPending: false };

  const name = s.name ?? s.skill_name ?? String(s.id ?? s.skillId ?? '');
  // Prefer explicit skillId fields, fall back to id, finally fallback to name
  const skillId = s.skillId ?? s.id ?? (typeof name === 'string' && name.length > 0 ? name : undefined);
  const isPending = !!(s.is_pending ?? s.isPending);

  return {
    skillId,
    name,
    isPending
  };
}

/**
 * @param {any[]} arr
 * @returns {{ skillId: string|number, name: string, isPending: boolean }[]}
 */
export function normalizeSkills(arr = []) {
  return (arr || []).map(normalizeSkill);
}
