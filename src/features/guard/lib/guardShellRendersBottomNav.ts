/** Spec REC-013 — GuardShell_RendersBottomNav */
export function guardShellRendersBottomNav(tabs: Array<{ id: string; label: string }>): boolean {
  return (
    Array.isArray(tabs) &&
    tabs.length >= 2 &&
    tabs.some((t) => t.id === 'entregas') &&
    tabs.some((t) => t.id === 'visitas')
  )
}
