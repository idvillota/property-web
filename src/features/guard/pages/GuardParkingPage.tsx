import { Alert, Stack, Text, Title } from '@mantine/core'

export function GuardParkingPage() {
  return (
    <Stack gap="md">
      <Title order={3} style={{ fontFamily: 'Fraunces, Georgia, serif' }}>
        Parking
      </Title>
      <Alert color="gray">
        <Text size="sm">El módulo de parking estará disponible cuando se active en el tenant.</Text>
      </Alert>
    </Stack>
  )
}
