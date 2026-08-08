import { NumberInput, type NumberInputProps } from '@mantine/core'
import { moneyInputProps, type MoneyInputPrecision } from '../../lib/money'

export type MoneyInputProps = Omit<
  NumberInputProps,
  'thousandSeparator' | 'decimalSeparator' | 'decimalScale' | 'allowDecimal'
> & {
  /** Decimal places: 0 = whole pesos (default), 2 = unit costs, 4 = purchase line prices. */
  precision?: MoneyInputPrecision
}

export function MoneyInput({ precision = 0, ...props }: MoneyInputProps) {
  return <NumberInput {...moneyInputProps(precision)} {...props} />
}
