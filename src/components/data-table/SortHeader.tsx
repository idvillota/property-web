import { UnstyledButton } from '@mantine/core'
import { IconArrowsSort, IconSortAscending, IconSortDescending } from '@tabler/icons-react'

type SortHeaderProps = {
  label: string
  active: boolean
  dir: 'asc' | 'desc'
  onClick: () => void
}

export function SortHeader({ label, active, dir, onClick }: SortHeaderProps) {
  const Icon = active ? (dir === 'asc' ? IconSortAscending : IconSortDescending) : IconArrowsSort

  return (
    <UnstyledButton
      onClick={onClick}
      style={{
        fontWeight: 600,
        fontSize: 12,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {label}
      <Icon size={14} stroke={1.5} style={{ opacity: active ? 1 : 0.45 }} />
    </UnstyledButton>
  )
}
