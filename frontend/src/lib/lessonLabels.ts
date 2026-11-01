const CATEGORY_LABELS: Record<string, string> = {
  grammar: 'Grammar',
  intro: 'Getting started',
  food: 'Food',
  travel: 'Travel',
  animals: 'Animals',
  school: 'School',
}

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: 'HSK 1–2',
  intermediate: 'HSK 3–4',
  advanced: 'HSK 5–6',
}

export function lessonCategoryLabel(category?: string | null): string {
  if (!category) return ''
  return CATEGORY_LABELS[category] ?? category.replace(/_/g, ' ')
}

export function lessonDifficultyLabel(difficulty?: string | null): string {
  if (!difficulty) return ''
  return DIFFICULTY_LABELS[difficulty] ?? difficulty.replace(/_/g, ' ')
}

export function lessonEyebrow(category?: string | null, difficulty?: string | null): string {
  const parts = [lessonCategoryLabel(category), lessonDifficultyLabel(difficulty)].filter(Boolean)
  return parts.join(' · ')
}
