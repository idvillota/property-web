import { ActionIcon, Group, Text, UnstyledButton, useMantineColorScheme } from '@mantine/core'
import { IconMoon, IconSun } from '@tabler/icons-react'
import { usePreferencesStore } from '../../stores/preferencesStore'
import type { ColorSchemePreference } from '../../theme/brandThemes'

function nextGuestColorScheme(current: ColorSchemePreference): ColorSchemePreference {
  if (current === 'light') return 'dark'
  if (current === 'dark') return 'auto'
  return 'light'
}

function useGuestColorScheme() {
  const colorScheme = usePreferencesStore((s) => s.colorScheme)
  const setPreferences = usePreferencesStore((s) => s.setPreferences)
  const { colorScheme: resolvedScheme } = useMantineColorScheme()
  const isDark = resolvedScheme === 'dark'

  const toggle = () => {
    const next = nextGuestColorScheme(colorScheme)
    setPreferences({ brandTheme: usePreferencesStore.getState().brandTheme, colorScheme: next })
  }

  return { isDark, toggle, label: isDark ? 'Modo claro' : 'Modo oscuro' }
}

export function ColorSchemeToggle() {
  const { isDark, toggle, label } = useGuestColorScheme()

  return (
    <ActionIcon
      variant="default"
      size="lg"
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      {isDark ? <IconSun size={18} stroke={1.75} /> : <IconMoon size={18} stroke={1.75} />}
    </ActionIcon>
  )
}

/** Full-width row for sidebar footer (above logout). */
export function ColorSchemeNavButton() {
  const { isDark, toggle, label } = useGuestColorScheme()

  return (
    <UnstyledButton onClick={toggle} className="app-shell-logout" w="100%" aria-label={label}>
      <Group gap="sm">
        {isDark ? <IconSun size={18} stroke={1.75} /> : <IconMoon size={18} stroke={1.75} />}
        <Text size="sm">{label}</Text>
      </Group>
    </UnstyledButton>
  )
}
