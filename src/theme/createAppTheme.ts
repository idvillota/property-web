import { createTheme, rem, type MantineThemeOverride } from '@mantine/core'
import { getBrandThemeDefinition, type BrandThemeId } from './brandThemes'

const amber = [
  '#fffbeb',
  '#fef3c7',
  '#fde68a',
  '#fcd34d',
  '#fbbf24',
  '#f59e0b',
  '#d97706',
  '#b45309',
  '#92400e',
  '#78350f',
] as const

const sharedTheme: MantineThemeOverride = {
  colors: {
    amber: [...amber],
  },
  fontFamily: '"DM Sans Variable", system-ui, -apple-system, sans-serif',
  headings: {
    fontFamily: '"DM Sans Variable", system-ui, -apple-system, sans-serif',
    fontWeight: '700',
  },
  defaultRadius: 'md',
  cursorType: 'pointer',
  focusRing: 'auto',
  components: {
    Drawer: {
      defaultProps: {
        zIndex: 400,
      },
    },
    Modal: {
      defaultProps: {
        zIndex: 400,
      },
    },
    Select: {
      defaultProps: {
        comboboxProps: { zIndex: 450 },
      },
    },
    MultiSelect: {
      defaultProps: {
        comboboxProps: { zIndex: 450 },
      },
    },
    Button: {
      defaultProps: {
        size: 'sm',
      },
    },
    ActionIcon: {
      defaultProps: {
        size: 'lg',
      },
    },
    NavLink: {
      styles: {
        root: {
          borderRadius: rem(8),
          minHeight: rem(44),
        },
      },
    },
    Table: {
      styles: {
        th: {
          fontSize: rem(12),
          fontWeight: 600,
          whiteSpace: 'nowrap',
        },
        td: {
          fontSize: rem(14),
          verticalAlign: 'middle',
        },
      },
    },
  },
}

export function createAppTheme(brandThemeId: BrandThemeId) {
  const brand = getBrandThemeDefinition(brandThemeId)
  return createTheme({
    ...sharedTheme,
    primaryColor: brand.primaryColor,
  })
}

export const appTheme = createAppTheme('operations')
