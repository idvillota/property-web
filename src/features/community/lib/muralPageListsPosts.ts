/** Spec COM-003 — MuralPage_ListsPosts */
export type MuralListItem = {
  id: string
  title: string
  isActive?: boolean
}

export function muralPageListsPosts(posts: MuralListItem[] | null | undefined): boolean {
  return (
    Array.isArray(posts) &&
    posts.length > 0 &&
    posts.every((p) => Boolean(p.id && p.title?.trim()) && p.isActive !== false)
  )
}
