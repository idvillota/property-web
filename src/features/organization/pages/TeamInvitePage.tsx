import { Button, Paper, PasswordInput, Select, Stack, Text, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation } from '@tanstack/react-query'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { InvitedTenantUser } from '../../../api/types'
import { PageHeader } from '../../../components/shared/PageHeader'
import { TEAM_ROLES } from '../../../lib/enums'

export function TeamInvitePage() {
  const form = useForm({
    initialValues: {
      email: '',
      password: '',
      displayName: '',
      role: 'Manager',
    },
    validate: {
      email: (v) => (/^\S+@\S+$/.test(v) ? null : 'Invalid email'),
      role: (v) => (v ? null : 'Required'),
    },
  })

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<InvitedTenantUser>('/api/TenantUsers/invite', {
        email: form.values.email.trim(),
        password: form.values.password || undefined,
        displayName: form.values.displayName.trim() || undefined,
        role: form.values.role,
      })
      return data
    },
    onSuccess: (data) => {
      notifications.show({
        title: 'User invited',
        message: `Tenant user ID: ${data.tenantUserId}`,
        color: 'teal',
      })
      form.reset()
    },
    onError: (err) =>
      notifications.show({ title: 'Invite failed', message: getApiErrorMessage(err), color: 'red' }),
  })

  return (
    <Stack gap="md" maw={480}>
      <PageHeader
        title="Invite team"
        description="Add access for this tenant. Use the tenant user ID when linking an employee record."
      />
      <Paper withBorder p="md" radius="md">
        <form onSubmit={form.onSubmit(() => inviteMutation.mutate())}>
          <Stack gap="sm">
            <TextInput label="Email" type="email" required {...form.getInputProps('email')} />
            <PasswordInput
              label="Password"
              description="Required for new emails; leave empty if the user already exists globally"
              {...form.getInputProps('password')}
            />
            <TextInput label="Display name" {...form.getInputProps('displayName')} />
            <Select label="Role" data={[...TEAM_ROLES]} required {...form.getInputProps('role')} />
            <Button type="submit" fullWidth loading={inviteMutation.isPending} mt="sm">
              Send invite
            </Button>
          </Stack>
        </form>
      </Paper>
      <Text size="xs" c="dimmed">
        Administrators and managers can invite users. Invite role is Manager.
      </Text>
    </Stack>
  )
}
