import { Drawer } from '@mantine/core'
import type { ReactNode } from 'react'
import { useMediaQuery } from '@mantine/hooks'

type Props = {
  opened: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function FormDrawer({ opened, onClose, title, children }: Props) {
  const isMobile = useMediaQuery('(max-width: 48em)')

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={title}
      position={isMobile ? 'bottom' : 'right'}
      size={isMobile ? '92%' : 'md'}
      padding="md"
    >
      {children}
    </Drawer>
  )
}
