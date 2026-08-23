/** Spec DIFF-001 — SetupMode_Blocks_WhenNoUnits */
export function setupModeBlocksWhenNoUnits(enabledUnitCount: number): boolean {
  return enabledUnitCount < 1
}
