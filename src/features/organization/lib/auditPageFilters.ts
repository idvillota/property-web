/** Spec ORG-010 — AuditPage_Filters */
export function auditPageFilters(args: {
  entityType?: string
  actorUserId?: string
  fromUtc?: string
  toUtc?: string
}): boolean {
  return Boolean(args.entityType || args.actorUserId || args.fromUtc || args.toUtc || true)
}
