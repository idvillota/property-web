/** ASM-002: AssemblyAttendance_ShowsQuorum */
export function AssemblyAttendance_ShowsQuorum(quorum: {
  achievedPercent: number
  hasQuorum: boolean
} | null | undefined): boolean {
  return quorum != null && quorum.achievedPercent >= 0 && typeof quorum.hasQuorum === 'boolean'
}
