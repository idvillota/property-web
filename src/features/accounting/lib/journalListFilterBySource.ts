/** ACC-002: JournalList_FilterBySource */
export function JournalList_FilterBySource<T extends { sourceType: number }>(
  entries: T[],
  sourceType: number | null,
): T[] {
  if (sourceType === null) return entries
  return entries.filter((e) => e.sourceType === sourceType)
}
