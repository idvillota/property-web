/** COM-017: InsuranceForm_Validation */
export function InsuranceForm_Validation(
  insurerName: string,
  policyNumber: string,
  endDate: string | null | undefined,
): boolean {
  return Boolean(insurerName.trim() && policyNumber.trim() && endDate)
}
