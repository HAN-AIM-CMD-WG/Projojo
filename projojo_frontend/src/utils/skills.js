/**
 * Helpers to normalize skill objects from various backend shapes into a single
 * canonical shape used across the frontend:
 *   { skillId, name, isPending }
 *
 * Backend can return variations like:
 * - { id, name, is_pending }
 * - { skillId, name, isPending }
 * - { skill_name }
 *
 * This module provides stable normalization and a convenience for arrays.
 *
 * Notes:
 * - normalizeSkill returns null for invalid/missing input (caller should filter falsy values).
 * - We require a human-readable name for display; we do not fallback to stringified IDs as a name.
 * - skillId may be undefined if the backend does not provide one; callers should handle that.
 */

/**
 * @param {any} s
 * @returns {{ skillId: string|number|undefined, name: string, isPending: boolean } | null}
 */
export function normalizeSkill(s) {
  if (!s) {
    console.warn('normalizeSkill: received falsy skill', s);
    return null;
  }

  // Prefer explicit display name fields
  const name = s.name ?? s.skill_name;
  if (!name || String(name).trim() === '') {
    console.warn('normalizeSkill: skill missing name, dropping skill', s);
    return null;
  }

  // Prefer explicit id fields; do not use the name as an id fallback
  const skillId = s.skillId ?? s.id ?? undefined;
  const isPending = !!(s.is_pending ?? s.isPending);

  return {
    skillId,
    name,
    isPending
  };
}

/**
 * @param {any[]} arr
 * @returns {{ skillId: string|number|undefined, name: string, isPending: boolean }[]}
 */
export function normalizeSkills(arr = []) {
  return (arr || []).map(normalizeSkill).filter(Boolean);
}

/**
 * Returns a normalized, visibility-filtered list of skills for a given user context.
 * - Students should not see pending skills
 * - Supervisors/teachers see all
 *
 * @param {{ type?: string }} authData
 * @param {any[]} skills
 * @returns {{ skillId: string|number|undefined, name: string, isPending: boolean }[]}
 */
export function filterVisibleSkillsForUser(authData = {}, skills = []) {
  const normalized = normalizeSkills(skills);
  if ((authData?.type || "") === "student") {
    return normalized.filter((s) => !s.isPending);
  }
  return normalized;
}
