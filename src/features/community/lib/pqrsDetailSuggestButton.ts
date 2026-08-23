/** Spec DIFF-004 — PqrsDetail_SuggestButton */
const OPEN_PQRS_STATUSES = new Set(['Open', 'InProgress'])

/** Returns true when the suggest-response action should be shown for an open PQRS. */
export function PqrsDetail_SuggestButton(
  status: string | number,
  hasAiPermission: boolean,
): boolean {
  if (!hasAiPermission) return false
  return OPEN_PQRS_STATUSES.has(String(status))
}
