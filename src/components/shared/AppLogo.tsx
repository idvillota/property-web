import { Box, UnstyledButton } from '@mantine/core'
import { Link } from 'react-router-dom'

export const HOST_LOGO_SRC = '/host-logo.png'

type Variant = 'auth' | 'header' | 'nav'

const SIZES: Record<Variant, { height: number; maxWidth: number }> = {
  /** Login / register — full mark, centered above the form */
  auth: { height: 128, maxWidth: 200 },
  /** Top bar — compact, leaves room for burger + actions */
  header: { height: 40, maxWidth: 108 },
  /** Sidebar — medium, reinforces brand when the menu is open */
  nav: { height: 64, maxWidth: 132 },
}

type Props = {
  variant?: Variant
  /** When set, logo links to this route; pass `null` on public auth screens */
  to?: string | null
}

export function AppLogo({ variant = 'header', to = '/dashboard' }: Props) {
  const { height, maxWidth } = SIZES[variant]

  const image = (
    <Box
      component="img"
      src={HOST_LOGO_SRC}
      alt="Property"
      h={height}
      w="auto"
      maw={maxWidth}
      className="app-logo"
      style={{ objectFit: 'contain', display: 'block' }}
    />
  )

  if (to) {
    return (
      <UnstyledButton
        component={Link}
        to={to}
        aria-label="Property — go to dashboard"
        className="app-logo-link"
      >
        {image}
      </UnstyledButton>
    )
  }

  return image
}
