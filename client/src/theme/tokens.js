/**
 * Design Tokens — single source of truth for semantic colors used across all pages.
 * Import from here instead of defining inline in each page.
 *
 * Usage:
 *   import { SUBJECT_COLORS, LEVEL_META, COURSE_BADGE_COLOR } from '../../../theme/tokens.js';
 */

/** Subject / fan bo'yicha asosiy rang */
export const SUBJECT_COLORS = {
  math:      '#1976D2',
  english:   '#EF4444',
  uzbek:     '#10B981',
  history:   '#F59E0B',
  it:        '#7C3AED',
  russian:   '#0288D1',
  biology:   '#388E3C',
  chemistry: '#7B1FA2',
  physics:   '#0097A7',
  other:     '#64748B',
};

/** Daraja meta — label + rang */
export const LEVEL_META = {
  beginner:     { label: "Boshlang'ich", color: '#10B981' },
  intermediate: { label: "O'rta",        color: '#F59E0B' },
  advanced:     { label: 'Yuqori',       color: '#EF4444' },
};

/** To'lov holati */
export const PAYMENT_STATUS = {
  paid:    { label: "To'langan",      color: 'success' },
  pending: { label: 'Kutilmoqda',     color: 'warning' },
  overdue: { label: "Muddati o'tgan", color: 'error'   },
  partial: { label: 'Qisman',         color: 'info'    },
};

/** Sharh holati */
export const REVIEW_STATUS = {
  pending:  { label: 'Kutilmoqda',    color: 'warning' },
  approved: { label: 'Tasdiqlangan',  color: 'success' },
  rejected: { label: 'Rad etilgan',   color: 'error'   },
};

/** Rol rangi + label */
export const ROLE_META = {
  student: { label: 'Talaba',        color: '#1976D2' },
  teacher: { label: "O'qituvchi",   color: '#10B981' },
  admin:   { label: 'Administrator', color: '#7C3AED' },
};

/** Guruh holati */
export const GROUP_STATUS = {
  active:    { label: 'Faol',    color: 'success' },
  inactive:  { label: 'Nofaol', color: 'default' },
  full:      { label: "To'liq", color: 'error'   },
  completed: { label: 'Tugadi', color: 'info'    },
};

/** Avatar ranglari yangi entity uchun (round-robin) */
export const AVATAR_PALETTE = [
  '#1976D2', '#EF4444', '#10B981', '#F59E0B',
  '#7C3AED', '#0288D1', '#388E3C', '#7B1FA2',
  '#0097A7', '#F97316', '#E91E63', '#FF5722',
];

/** Raqamdan avatar rangi */
export const avatarColor = (index) => AVATAR_PALETTE[index % AVATAR_PALETTE.length];

/** Hex rangga alpha qo'shish (18 = ~10%) */
export const alpha10 = (hex) => hex + '1A';
export const alpha15 = (hex) => hex + '26';
export const alpha20 = (hex) => hex + '33';
