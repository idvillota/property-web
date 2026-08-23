export const FEE_CHARGE_TYPE_OPTIONS = [
  { value: 'Ordinary', label: 'Ordinaria' },
  { value: 'Extraordinary', label: 'Extraordinaria' },
  { value: 'Interest', label: 'Intereses' },
  { value: 'Adjustment', label: 'Ajuste' },
] as const

export const MANUAL_CHARGE_TYPE_OPTIONS = [
  { value: 'Adjustment', label: 'Ajuste' },
  { value: 'Extraordinary', label: 'Extraordinaria' },
] as const

export const FEE_CHARGE_STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pendiente' },
  { value: 'Partial', label: 'Parcial' },
  { value: 'Paid', label: 'Pagado' },
  { value: 'Waived', label: 'Condonado' },
  { value: 'Cancelled', label: 'Cancelado' },
] as const

export const OPEN_CHARGE_STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pendiente' },
  { value: 'Partial', label: 'Parcial' },
] as const

export const BILLING_PERIOD_STATUS_OPTIONS = [
  { value: 'Open', label: 'Abierto' },
  { value: 'Closed', label: 'Cerrado' },
] as const

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'Cash', label: 'Efectivo' },
  { value: 'Transfer', label: 'Transferencia' },
  { value: 'Check', label: 'Cheque' },
  { value: 'Other', label: 'Otro' },
  { value: 'Pse', label: 'PSE' },
] as const

export const MONTH_OPTIONS = [
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
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
