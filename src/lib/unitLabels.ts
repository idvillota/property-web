import type { Building, Unit } from '../api/types'
import { isDwellingUnitType } from './structureEnums'

/** Prefer building code, then name. */
export function buildingDisplayLabel(
  building: Pick<Building, 'name' | 'code'> | null | undefined,
): string | null {
  if (!building) return null
  const code = building.code?.trim()
  if (code) return code
  const name = building.name?.trim()
  return name || null
}

/** Standard unit option label: `Torre A · 203` (or just `203` if no building). */
export function formatUnitOptionLabel(
  unit: Pick<Unit, 'code' | 'buildingId'>,
  buildingById: ReadonlyMap<string, Pick<Building, 'name' | 'code'>>,
): string {
  const building = unit.buildingId ? buildingById.get(unit.buildingId) : undefined
  const prefix = buildingDisplayLabel(building)
  return prefix ? `${prefix} · ${unit.code}` : unit.code
}

export function toUnitSelectOptions(
  units: readonly Unit[],
  buildingById: ReadonlyMap<string, Pick<Building, 'name' | 'code'>>,
  formatExtra?: (unit: Unit, baseLabel: string) => string,
): { value: string; label: string }[] {
  return units.map((u) => {
    const base = formatUnitOptionLabel(u, buildingById)
    return {
      value: u.id,
      label: formatExtra ? formatExtra(u, base) : base,
    }
  })
}

/** Unit Select options limited to Apartment / House (no parking, storage, terrace). */
export function toDwellingUnitSelectOptions(
  units: readonly Unit[],
  buildingById: ReadonlyMap<string, Pick<Building, 'name' | 'code'>>,
  formatExtra?: (unit: Unit, baseLabel: string) => string,
): { value: string; label: string }[] {
  return toUnitSelectOptions(
    units.filter((u) => isDwellingUnitType(u.unitType)),
    buildingById,
    formatExtra,
  )
}
