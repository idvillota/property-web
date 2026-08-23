/** ASM-003: AssemblyVote_Submit */
export function AssemblyVote_Submit(motionId: string | null, unitId: string | null): boolean {
  return Boolean(motionId && unitId)
}
