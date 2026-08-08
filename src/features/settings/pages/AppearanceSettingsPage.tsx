import { Paper, Stack } from '@mantine/core'
import { AppearanceControls } from '../../../components/theme/AppearanceControls'
import { PageHeader } from '../../../components/shared/PageHeader'

export function AppearanceSettingsPage() {
  return (
    <Stack gap="lg">
      <PageHeader
        title="Appearance"
        description="Customize brand theme and light/dark mode. Preferences are saved to your account and apply across devices."
      />
      <Paper withBorder radius="md" p="lg">
        <AppearanceControls variant="full" />
      </Paper>
    </Stack>
  )
}
