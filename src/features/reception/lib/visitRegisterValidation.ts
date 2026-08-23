/** Spec REC-010 — VisitRegisterForm_ValidatesRequired */
export type VisitRegisterFormValues = {
  documentType: string
  documentNumber: string
  firstName: string
  lastName: string
  unitId: string
}

export function visitRegisterFormValidatesRequired(values: VisitRegisterFormValues): boolean {
  return Boolean(
    values.documentType.trim() &&
      values.documentNumber.trim() &&
      values.firstName.trim() &&
      values.unitId.trim(),
  )
}
