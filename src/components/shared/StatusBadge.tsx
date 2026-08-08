import { Badge } from '@mantine/core'

type Variant = 'active' | 'inactive' | 'success' | 'warning' | 'danger' | 'neutral'

const VARIANT_MAP: Record<Variant, { color: string; label: string }> = {
  active: { color: 'green', label: 'Activo' },
  inactive: { color: 'gray', label: 'Inactivo' },
  success: { color: 'green', label: 'OK' },
  warning: { color: 'orange', label: 'Pendiente' },
  danger: { color: 'red', label: 'Error' },
  neutral: { color: 'gray', label: '—' },
}

type Props = {
  variant: Variant
  label?: string
}

export function StatusBadge({ variant, label }: Props) {
  const config = VARIANT_MAP[variant]
  return (
    <Badge variant="light" color={config.color} size="sm">
      {label ?? config.label}
    </Badge>
  )
}
