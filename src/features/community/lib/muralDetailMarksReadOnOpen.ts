/** Spec COM-011 — MuralDetail_MarksRead_OnOpen */
export function muralDetailMarksReadOnOpen(args: {
  detailOpened: boolean
  markReadCalled: boolean
  postId?: string | null
}): boolean {
  if (!args.detailOpened || !args.postId)
    return false
  return args.markReadCalled
}
