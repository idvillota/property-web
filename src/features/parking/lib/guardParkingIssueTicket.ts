/** REC-015: GuardParking_IssueTicket */
export function GuardParking_IssueTicket(plate: string | null | undefined): boolean {
  return Boolean(plate && plate.trim().length >= 3)
}
