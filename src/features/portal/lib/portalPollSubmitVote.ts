/** COM-018: PortalPoll_SubmitVote */
export function PortalPoll_SubmitVote(pollOptionId: string | null, unitId: string | null): boolean {
  return Boolean(pollOptionId && unitId)
}
