/** Colombian Spanish: thousands `.`, decimals `,`, COP. */
export const MONEY_LOCALE = 'es-CO'
export const MONEY_CURRENCY = 'COP'
export const MONEY_THOUSAND_SEPARATOR = '.'
export const MONEY_DECIMAL_SEPARATOR = ','

export function formatMoney(value: number): string {
  return value.toLocaleString(MONEY_LOCALE, {
    style: 'currency',
    currency: MONEY_CURRENCY,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** Unit cost per g/ml/und — up to 2 decimals when needed. */
export function formatUnitCost(value: number): string {
  return value.toLocaleString(MONEY_LOCALE, {
    style: 'currency',
    currency: MONEY_CURRENCY,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

export type MoneyInputPrecision = 0 | 2 | 4

/** Mantine NumberInput props for money fields (es-CO grouping). */
export function moneyInputProps(precision: MoneyInputPrecision = 0) {
  return {
    thousandSeparator: MONEY_THOUSAND_SEPARATOR,
    decimalSeparator: MONEY_DECIMAL_SEPARATOR,
    min: 0,
    decimalScale: precision,
    allowDecimal: precision > 0,
  } as const
}
