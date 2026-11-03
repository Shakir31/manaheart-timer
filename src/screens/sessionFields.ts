// Shared by Log manually and Edit session.

export const CATEGORY_OPTIONS = [
  { value: 'meditation' as const, label: 'Meditation' },
  { value: 'study' as const, label: 'Study' },
]

/** Note length (TextInput spec: 280 characters). The database allows up to 500. */
export const NOTE_MAX = 280
