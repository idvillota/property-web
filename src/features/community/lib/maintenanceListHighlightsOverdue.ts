/** COM-016: MaintenanceList_HighlightsOverdue */
export function MaintenanceList_HighlightsOverdue(tasks: { isOverdue: boolean }[]): boolean {
  return tasks.some((t) => t.isOverdue)
}
