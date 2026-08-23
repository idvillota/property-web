/** Spec REC-012 — GuardNotifyButton_CallsApi */
export function guardNotifyButtonCallsApi(args: {
  clicked: boolean
  apiCalled: boolean
  visitId?: string | null
}): boolean {
  return Boolean(args.clicked && args.apiCalled && args.visitId)
}
