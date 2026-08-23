/** Spec PRT-002 — AppLayout_MobileNav_Smoke */
export function appLayoutMobileNavSmoke(args: {
  isMobile: boolean
  burgerOpensNav: boolean
  hasQuickLinks: boolean
}): boolean {
  return args.isMobile && args.burgerOpensNav && args.hasQuickLinks
}
