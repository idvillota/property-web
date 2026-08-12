import { Button, Group, Switch } from '@mantine/core'
import type { ReactNode } from 'react'

type Props = {
  onAdd: () => void
  addLabel?: string
  includeInactive?: boolean
  onIncludeInactiveChange?: (value: boolean) => void
  extra?: ReactNode
}

export function ListToolbar({
  onAdd,
  addLabel = 'Agregar',
  includeInactive,
  onIncludeInactiveChange,
  extra,
}: Props) {
  return (
    <Group justify="space-between" gap="sm" align="center">
      <Group gap="sm" align="center">
        {onIncludeInactiveChange !== undefined && (
          <Switch
            label="Mostrar inactivos"
            checked={includeInactive}
            onChange={(e) => onIncludeInactiveChange(e.currentTarget.checked)}
            styles={{ root: { minHeight: 44 } }}
          />
        )}
      </Group>
      <Group gap="sm" align="center" wrap="wrap" justify="flex-end">
        {extra}
        <Button onClick={onAdd}>{addLabel}</Button>
      </Group>
    </Group>
  )
}
