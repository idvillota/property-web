/** Spec ARCH-001 — PersonLinkUser_Form_RequiresEmailOrUser */
export function personLinkUserFormRequiresEmailOrUser(email: string, userId: string): boolean {
  return Boolean(email.trim() || userId.trim())
}
