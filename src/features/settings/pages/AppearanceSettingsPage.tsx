import { Paper, Stack } from '@mantine/core'
import { AppearanceControls } from '../../../components/theme/AppearanceControls'
import { PageHeader } from '../../../components/shared/PageHeader'

export function AppearanceSettingsPage() {
  return (
    <Stack gap="lg">
      <PageHeader
        title="Apariencia"
        description="Personaliza el tema de marca y el modo claro/oscuro. Las preferencias se guardan en tu cuenta y aplican en todos los dispositivos."
      />
      <Paper withBorder radius="md" p="lg">
        <AppearanceControls variant="full" />
      </Paper>
    </Stack>
  )
}
