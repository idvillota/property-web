/** REC-014: ParkingSettings_SaveRates */
export function ParkingSettings_SaveRates(totalSpots: number, hourlyRate: number): boolean {
  return totalSpots >= 0 && hourlyRate >= 0
}
