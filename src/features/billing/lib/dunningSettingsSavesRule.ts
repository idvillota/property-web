/** Spec BIL-012 — DunningSettings_SavesRule */
export type DunningRuleFormValues = {
  daysOverdue: number
  isEnabled: boolean
  cooldownDays: number
  emailSubjectTemplate: string
  emailBodyTemplate: string
}

export function dunningSettingsSavesRule(
  before: DunningRuleFormValues | null | undefined,
  after: DunningRuleFormValues | null | undefined,
): boolean {
  if (!before || !after) return false
  return (
    before.daysOverdue === after.daysOverdue &&
    before.isEnabled === after.isEnabled &&
    before.cooldownDays === after.cooldownDays &&
    before.emailSubjectTemplate.trim() === after.emailSubjectTemplate.trim() &&
    before.emailBodyTemplate.trim() === after.emailBodyTemplate.trim()
  )
}
