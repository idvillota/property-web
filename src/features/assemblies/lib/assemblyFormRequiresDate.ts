/** ASM-001: AssemblyForm_RequiresDate */
export function AssemblyForm_RequiresDate(scheduledAt: string | null | undefined): boolean {
  return Boolean(scheduledAt && scheduledAt.trim().length > 0)
}
