export const FEE_CHARGE_TYPE_OPTIONS = [
  { value: 'Ordinary', label: 'Ordinary' },
  { value: 'Extraordinary', label: 'Extraordinary' },
  { value: 'Interest', label: 'Interest' },
  { value: 'Adjustment', label: 'Adjustment' },
] as const

export const MANUAL_CHARGE_TYPE_OPTIONS = [
  { value: 'Adjustment', label: 'Adjustment' },
  { value: 'Extraordinary', label: 'Extraordinary' },
] as const

export const FEE_CHARGE_STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Partial', label: 'Partial' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Waived', label: 'Waived' },
  { value: 'Cancelled', label: 'Cancelled' },
] as const

export const OPEN_CHARGE_STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Partial', label: 'Partial' },
] as const

export const BILLING_PERIOD_STATUS_OPTIONS = [
  { value: 'Open', label: 'Open' },
  { value: 'Closed', label: 'Closed' },
] as const

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Transfer', label: 'Transfer' },
  { value: 'Check', label: 'Check' },
  { value: 'Other', label: 'Other' },
] as const

export const MONTH_OPTIONS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
] as const

/** Normalize API enum (name or numeric) to the option value/name. */
export function asEnumName(
  value: string | number | null | undefined,
  options: readonly { value: string; label: string }[],
): string {
  if (value === null || value === undefined || value === '') return ''
  if (typeof value === 'number') return options[value]?.value ?? String(value)
  const asNum = Number(value)
  if (
    Number.isInteger(asNum) &&
    String(asNum) === String(value).trim() &&
    options[asNum]
  ) {
    return options[asNum]!.value
  }
  return String(value)
}

/** Numeric enum value for JSON bodies (API has no JsonStringEnumConverter yet). */
export function enumIndex(
  value: string,
  options: readonly { value: string; label: string }[],
): number {
  const idx = options.findIndex((o) => o.value === value)
  return idx >= 0 ? idx : 0
}

export function labelForOption(
  options: readonly { value: string; label: string }[],
  value: string | number | null | undefined,
) {
  const name = asEnumName(value, options)
  if (!name) return '—'
  return options.find((o) => o.value === name)?.label ?? name
}

export function chargeBalance(amount: number, amountPaid: number) {
  return Math.round((amount - amountPaid) * 100) / 100
}

/** Suggest FIFO allocations by due date across open charges. */
export function suggestFifoAllocations(
  totalAmount: number,
  charges: Array<{ id: string; amount: number; amountPaid: number; dueDate: string }>,
): Array<{ feeChargeId: string; amount: number }> {
  let remaining = Math.round(totalAmount * 100) / 100
  if (remaining <= 0) return []

  const sorted = [...charges].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const allocations: Array<{ feeChargeId: string; amount: number }> = []

  for (const charge of sorted) {
    if (remaining <= 0) break
    const balance = chargeBalance(charge.amount, charge.amountPaid)
    if (balance <= 0) continue
    const allocated = Math.min(remaining, balance)
    allocations.push({ feeChargeId: charge.id, amount: allocated })
    remaining = Math.round((remaining - allocated) * 100) / 100
  }

  return allocations
}
