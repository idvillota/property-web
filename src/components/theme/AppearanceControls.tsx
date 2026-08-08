import {
  Box,
  Group,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconCheck, IconPalette } from '@tabler/icons-react'
import { useUpdateUserPreferences } from '../../hooks/useUpdateUserPreferences'
import { usePreferencesStore } from '../../stores/preferencesStore'
import {
  BRAND_THEMES,
  COLOR_SCHEME_OPTIONS,
  type BrandThemeId,
  type ColorSchemePreference,
} from '../../theme/brandThemes'

type Props = {
  variant?: 'compact' | 'full'
}

export function AppearanceControls({ variant = 'full' }: Props) {
  const brandTheme = usePreferencesStore((s) => s.brandTheme)
  const colorScheme = usePreferencesStore((s) => s.colorScheme)
  const updatePreferences = useUpdateUserPreferences()

  const save = async (next: Partial<{ brandTheme: BrandThemeId; colorScheme: ColorSchemePreference }>) => {
    try {
      await updatePreferences.mutateAsync(next)
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'No se pudieron guardar las preferencias',
        color: 'red',
      })
    }
  }

  return (
    <Stack gap="md">
      <Stack gap={4}>
        <Group gap="xs">
          <ThemeIcon variant="light" size="sm" radius="md">
            <IconPalette size={14} stroke={1.75} />
          </ThemeIcon>
          <Text size="sm" fw={600}>
            Tema de marca
          </Text>
        </Group>
        {variant === 'full' ? (
          <Text size="sm" c="dimmed">
            Cada usuario puede elegir su propio estilo. El administrador, meseros y caja pueden usar combinaciones distintas.
          </Text>
        ) : null}
      </Stack>

      <SimpleGrid cols={variant === 'compact' ? 1 : { base: 1, sm: 3 }} spacing="sm">
        {BRAND_THEMES.map((theme) => {
          const selected = brandTheme === theme.id
          return (
            <UnstyledButton
              key={theme.id}
              onClick={() => save({ brandTheme: theme.id })}
              disabled={updatePreferences.isPending}
              aria-pressed={selected}
            >
              <Paper
                withBorder
                p="sm"
                radius="md"
                style={{
                  borderColor: selected ? theme.swatch : undefined,
                  boxShadow: selected ? `0 0 0 1px ${theme.swatch}` : undefined,
                }}
              >
                <Group gap="sm" wrap="nowrap" align="flex-start">
                  <Box
                    w={28}
                    h={28}
                    style={{
                      borderRadius: 8,
                      background: theme.swatch,
                      flexShrink: 0,
                    }}
                  />
                  <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                    <Group gap={6} wrap="nowrap">
                      <Text size="sm" fw={600} lineClamp={1}>
                        {theme.name}
                      </Text>
                      {selected ? <IconCheck size={14} stroke={2} color={theme.swatch} /> : null}
                    </Group>
                    {variant === 'full' ? (
                      <Text size="xs" c="dimmed" lineClamp={2}>
                        {theme.description}
                      </Text>
                    ) : null}
                  </Stack>
                </Group>
              </Paper>
            </UnstyledButton>
          )
        })}
      </SimpleGrid>

      <Stack gap={6}>
        <Text size="sm" fw={600}>
          Modo de color
        </Text>
        <SegmentedControl
          fullWidth
          value={colorScheme}
          onChange={(value) => save({ colorScheme: value as ColorSchemePreference })}
          disabled={updatePreferences.isPending}
          data={COLOR_SCHEME_OPTIONS}
        />
      </Stack>
    </Stack>
  )
}
