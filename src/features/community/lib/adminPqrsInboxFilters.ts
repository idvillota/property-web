/** Spec COM-013 — AdminPqrsInbox_Filters */
export function adminPqrsInboxFilters(
  items: Array<{ id: string; status: string | number }>,
  statusFilter: string | null | undefined,
): Array<{ id: string; status: string | number }> {
  if (!statusFilter || statusFilter === 'all')
    return items
  const want = String(statusFilter).toLowerCase()
  return items.filter((i) => String(i.status).toLowerCase() === want)
}
