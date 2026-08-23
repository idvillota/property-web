/** Spec REC-011 — PortalVisitApproval_Buttons */
export function portalVisitApprovalButtons(status: string | number | null | undefined): {
  showApprove: boolean
  showReject: boolean
} {
  const name = String(status ?? '')
  const pending = name === 'PendingApproval' || name === '1'
  return { showApprove: pending, showReject: pending }
}
