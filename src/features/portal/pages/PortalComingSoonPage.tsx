import { Alert, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router-dom'

export function PortalComingSoonPage({ title }: { title: string }) {
  return (
    <Stack gap="md" maw={480}>
      <Title order={2} style={{ fontFamily: 'Fraunces, Georgia, serif' }}>
        {title}
      </Title>
      <Alert color="gray" title="Próximamente">
        Esta sección del portal se habilitará en una siguiente entrega.
      </Alert>
      <Text size="sm">
        <Link to="/portal">Volver al inicio</Link>
      </Text>
    </Stack>
  )
}
