// Static data — all content loaded from backend API

export const COURSES = [];

export const TEACHERS = [];

export const VACANCIES = [];

export const PLACEMENT_TEST = [];

export const SUBJECT_COLORS = {
  math:    { bg: '#1976D21A', text: '#1976D2', label: 'Matematika' },
  english: { bg: '#EF44441A', text: '#EF4444', label: 'Ingliz tili' },
  uzbek:   { bg: '#10B9811A', text: '#10B981', label: 'Ona tili' },
  history: { bg: '#F59E0B1A', text: '#F59E0B', label: 'Tarix' },
  it:      { bg: '#7C3AED1A', text: '#7C3AED', label: 'IT' },
  other:   { bg: '#64748B1A', text: '#64748B', label: 'Boshqa' },
};

export const formatPrice = (amount) =>
  new Intl.NumberFormat('ru-RU').format(amount);
