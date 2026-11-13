import { Category, Subject } from '../types';

export interface ColorOption {
  id: string;
  label: string;
  badgeClasses: string;
  dotClass: string;
  swatchClass: string;
  ringClass: string;
}

export const COLOR_PALETTE: ColorOption[] = [
  {
    id: 'indigo',
    label: 'Indigo',
    badgeClasses: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300',
    dotClass: 'bg-indigo-400',
    swatchClass: 'bg-indigo-500',
    ringClass: 'ring-indigo-400',
  },
  {
    id: 'emerald',
    label: 'Emerald',
    badgeClasses: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    dotClass: 'bg-emerald-400',
    swatchClass: 'bg-emerald-500',
    ringClass: 'ring-emerald-400',
  },
  {
    id: 'amber',
    label: 'Amber',
    badgeClasses: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
    dotClass: 'bg-amber-400',
    swatchClass: 'bg-amber-500',
    ringClass: 'ring-amber-400',
  },
  {
    id: 'violet',
    label: 'Violet',
    badgeClasses: 'bg-violet-500/15 border-violet-500/30 text-violet-300',
    dotClass: 'bg-violet-400',
    swatchClass: 'bg-violet-500',
    ringClass: 'ring-violet-400',
  },
  {
    id: 'rose',
    label: 'Rose',
    badgeClasses: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
    dotClass: 'bg-rose-400',
    swatchClass: 'bg-rose-500',
    ringClass: 'ring-rose-400',
  },
  {
    id: 'sky',
    label: 'Sky',
    badgeClasses: 'bg-sky-500/15 border-sky-500/30 text-sky-300',
    dotClass: 'bg-sky-400',
    swatchClass: 'bg-sky-500',
    ringClass: 'ring-sky-400',
  },
  {
    id: 'cyan',
    label: 'Cyan',
    badgeClasses: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
    dotClass: 'bg-cyan-400',
    swatchClass: 'bg-cyan-500',
    ringClass: 'ring-cyan-400',
  },
  {
    id: 'teal',
    label: 'Teal',
    badgeClasses: 'bg-teal-500/15 border-teal-500/30 text-teal-300',
    dotClass: 'bg-teal-400',
    swatchClass: 'bg-teal-500',
    ringClass: 'ring-teal-400',
  },
  {
    id: 'orange',
    label: 'Orange',
    badgeClasses: 'bg-orange-500/15 border-orange-500/30 text-orange-300',
    dotClass: 'bg-orange-400',
    swatchClass: 'bg-orange-500',
    ringClass: 'ring-orange-400',
  },
  {
    id: 'fuchsia',
    label: 'Fuchsia',
    badgeClasses: 'bg-fuchsia-500/15 border-fuchsia-500/30 text-fuchsia-300',
    dotClass: 'bg-fuchsia-400',
    swatchClass: 'bg-fuchsia-500',
    ringClass: 'ring-fuchsia-400',
  },
  {
    id: 'lime',
    label: 'Lime',
    badgeClasses: 'bg-lime-500/15 border-lime-500/30 text-lime-300',
    dotClass: 'bg-lime-400',
    swatchClass: 'bg-lime-500',
    ringClass: 'ring-lime-400',
  },
  {
    id: 'pink',
    label: 'Pink',
    badgeClasses: 'bg-pink-500/15 border-pink-500/30 text-pink-300',
    dotClass: 'bg-pink-400',
    swatchClass: 'bg-pink-500',
    ringClass: 'ring-pink-400',
  },
];

const COLOR_MAP: Record<string, ColorOption> = Object.fromEntries(
  COLOR_PALETTE.map(c => [c.id, c])
);

export function getColorOption(color?: string): ColorOption {
  if (color && COLOR_MAP[color]) {
    return COLOR_MAP[color];
  }
  return COLOR_MAP.indigo;
}

export function getColorClasses(color?: string): string {
  return getColorOption(color).badgeClasses;
}

export function getDotColorClass(color?: string): string {
  return getColorOption(color).dotClass;
}

/**
 * Returns all assigned category IDs for a subject (supporting both multi-category and legacy single category).
 */
export function getSubjectCategoryIds(subject: Subject): string[] {
  if (subject.categoryIds && subject.categoryIds.length > 0) {
    return subject.categoryIds;
  }
  return subject.categoryId ? [subject.categoryId] : [];
}

/**
 * Returns all category display objects (id, name, color) for a subject.
 */
export function getSubjectCategories(
  subject: Subject,
  categories: Category[]
): { id: string; name: string; color: string }[] {
  const ids = getSubjectCategoryIds(subject);
  if (ids.length === 0) {
    return [{ id: 'general', name: subject.categoryName || 'General', color: subject.color || 'indigo' }];
  }

  return ids.map((id, index) => {
    const matched = categories.find(c => c.id === id);
    const fallbackName = subject.categoryNames?.[index] || subject.categoryName || 'General';
    return {
      id,
      name: matched?.name || fallbackName,
      color: matched?.color || subject.color || 'indigo',
    };
  });
}

/**
 * Resolves the effective accent color for a subject (subject override color or primary category color).
 */
export function getSubjectColor(subject: Subject, categories: Category[]): string {
  if (subject.color) return subject.color;
  const primaryId = getSubjectCategoryIds(subject)[0];
  const primaryCat = categories.find(c => c.id === primaryId);
  return primaryCat?.color || 'indigo';
}

/**
 * Checks if a subject belongs to any of the selected category IDs (empty filter array = match all).
 */
export function subjectMatchesCategories(subject: Subject, selectedCategoryIds: string[]): boolean {
  if (selectedCategoryIds.length === 0) return true;
  const subjectCatIds = getSubjectCategoryIds(subject);
  return subjectCatIds.some(id => selectedCategoryIds.includes(id));
}
