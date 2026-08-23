import { Select } from '@mantine/core'
import { useMemo } from 'react'
import type { HorizontalProperty } from '../../../api/types'
import { formDrawerSelectComboboxProps } from '../../../lib/formDrawerSelect'
import { PropertySwitcher_ListsAuthorized } from '../lib/propertySwitcherListsAuthorized'

type PropertySwitcherProps = {
  properties: HorizontalProperty[]
  value: string | null
  onChange: (propertyId: string | null) => void
  includeInactive?: boolean
  label?: string
  placeholder?: string
  clearable?: boolean
}

/** Lists authorized horizontal properties for multi-PH holding views. */
export function PropertySwitcher({
  properties,
  value,
  onChange,
  includeInactive = false,
  label = 'Propiedad horizontal',
  placeholder = 'Todas las propiedades',
  clearable = true,
}: PropertySwitcherProps) {
  const authorized = useMemo(
    () =>
      PropertySwitcher_ListsAuthorized(
        properties.map((p) => ({ id: p.id, name: p.name, isActive: p.isActive })),
        includeInactive,
      ),
    [properties, includeInactive],
  )

  const options = useMemo(
    () => authorized.map((p) => ({ value: p.id, label: p.name })),
    [authorized],
  )

  return (
    <Select
      label={label}
      placeholder={placeholder}
      clearable={clearable}
      searchable
      data={options}
      value={value}
      onChange={onChange}
      comboboxProps={formDrawerSelectComboboxProps}
    />
  )
}
