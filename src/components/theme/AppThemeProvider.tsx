import { MantineProvider, useMantineColorScheme } from '@mantine/core'
import { useEffect, useMemo } from 'react'
import { createAppTheme } from '../../theme/createAppTheme'
import { usePreferencesStore } from '../../stores/preferencesStore'

function ThemeSync() {
  const brandTheme = usePreferencesStore((s) => s.brandTheme)
  const colorScheme = usePreferencesStore((s) => s.colorScheme)
  const { setColorScheme } = useMantineColorScheme()

  useEffect(() => {
    document.documentElement.setAttribute('data-app-theme', brandTheme)
  }, [brandTheme])

  useEffect(() => {
    setColorScheme(colorScheme)
  }, [colorScheme, setColorScheme])

  return null
}

type Props = {
  children: React.ReactNode
}

export function AppThemeProvider({ children }: Props) {
  const brandTheme = usePreferencesStore((s) => s.brandTheme)
  const theme = useMemo(() => createAppTheme(brandTheme), [brandTheme])

  return (
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <ThemeSync />
      {children}
    </MantineProvider>
  )
}
