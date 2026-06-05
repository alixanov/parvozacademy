/**
 * Single source of truth for course color & icon resolution.
 *
 * Priority:
 *   1. course.color / course.iconKey  (saved in MongoDB — most reliable)
 *   2. courseCustomizations[id]       (Redux/localStorage cache)
 *   3. deterministic hash of course._id (same result on every page, every session)
 */

export const COURSE_PALETTE = [
  '#1976D2', '#10B981', '#F59E0B', '#7C3AED',
  '#EC4899', '#EF4444', '#06B6D4', '#D97706',
];

/**
 * Returns a stable palette index derived from the course _id.
 * Works the same on all pages regardless of display order.
 */
function idToIndex(id) {
  if (!id) return 0;
  const hex = id.slice(-4);
  return parseInt(hex, 16) % COURSE_PALETTE.length;
}

/**
 * @param {object} course   - course object from API (may have .color / .iconKey)
 * @param {object} customs  - courseCustomizations from Redux  { [id]: { color, iconKey } }
 * @returns {{ color: string, iconKey: string }}
 */
export function getCourseAppearance(course, customs = {}) {
  const id     = course?._id;
  const custom = customs[id] ?? {};

  const color   = course?.color   || custom.color   || COURSE_PALETTE[idToIndex(id)];
  const iconKey = course?.iconKey || custom.iconKey || 'menuBook';

  return { color, iconKey };
}
