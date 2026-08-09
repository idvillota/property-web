import { Drawer } from '@mantine/core'
import type { ReactNode } from 'react'
import { useMediaQuery } from '@mantine/hooks'

type Props = {
  opened: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  /** Desktop drawer width; ignored on mobile (full-bleed bottom sheet). */
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function FormDrawer({ opened, onClose, title, children, size = 'md' }: Props) {
  const isMobile = useMediaQuery('(max-width: 48em)')

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={title}
      position={isMobile ? 'bottom' : 'right'}
      size={isMobile ? '92%' : size}
      padding="md"
    >
      {children}
    </Drawer>
  )
}
