import { Box, Button, Card, Checkbox, Stack, Table, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Fragment, useMemo, useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { RolePermissionMatrix } from '../../../api/types'
import { PageHeader } from '../../../components/shared/PageHeader'
import { FeatureCodes, ROLE_LABELS, featureLabel, featureModuleLabel } from '../../../lib/permissions'
import { useAuthStore } from '../../../stores/authStore'

export function RolePermissionsPage() {
  const queryClient = useQueryClient()
  const canEdit = useAuthStore((s) => s.hasPermission(FeatureCodes.organizationRoles))

  const matrixQuery = useQuery({
    queryKey: ['rolePermissions'],
    queryFn: async () => {
      const { data } = await api.get<RolePermissionMatrix>('/api/role-permissions')
      return data
    },
  })

  const [draft, setDraft] = useState<Record<string, Set<string>>>({})

  const effectiveDraft = useMemo(() => {
    const matrix = matrixQuery.data
    if (!matrix) return draft

    const next: Record<string, Set<string>> = { ...draft }
    for (const role of matrix.roles) {
      if (!next[role.id]) {
        next[role.id] = new Set(role.featureCodes)
      }
    }
    return next
  }, [draft, matrixQuery.data])

  const saveMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const codes = [...(effectiveDraft[roleId] ?? [])]
      await api.put(`/api/role-permissions/${roleId}`, { featureCodes: codes })
    },
    onSuccess: () => {
      notifications.show({ title: 'Guardado', message: 'Permisos actualizados', color: 'teal' })
      void queryClient.invalidateQueries({ queryKey: ['rolePermissions'] })
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const features = matrixQuery.data?.features ?? []
  const roles = matrixQuery.data?.roles ?? []
  const modules = [...new Set(features.map((f) => f.module))]

  const toggle = (roleId: string, code: string, checked: boolean) => {
    setDraft((prev) => {
      const base = new Set(prev[roleId] ?? effectiveDraft[roleId] ?? [])
      if (checked) base.add(code)
      else base.delete(code)
      return { ...prev, [roleId]: base }
    })
  }

  return (
    <Stack gap="md">
      <PageHeader
        title="Roles y permisos"
        description="Define qué módulos puede usar cada rol. Los cambios aplican en el próximo inicio de sesión."
      />

      {!canEdit && (
        <Text size="sm" c="orange">
          Solo lectura: no tienes permiso para editar roles.
        </Text>
      )}

      <Card withBorder padding="md" radius="md">
        {matrixQuery.isLoading ? (
          <Text size="sm" c="dimmed">
            Cargando…
          </Text>
        ) : (
          <Stack gap="md">
            <div style={{ overflowX: 'auto' }}>
              <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Módulo / función</Table.Th>
                    {roles.map((role) => (
                      <Table.Th key={role.id} ta="center" style={{ minWidth: 120 }}>
                        {ROLE_LABELS[role.name] ?? role.name}
                      </Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {modules.map((module) => (
                    <Fragment key={module}>
                      <Table.Tr>
                        <Table.Td colSpan={roles.length + 1}>
                          <Text fw={600} size="sm">
                            {featureModuleLabel(module)}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                      {features
                        .filter((f) => f.module === module)
                        .map((feature) => (
                          <Table.Tr key={feature.id}>
                            <Table.Td>
                              <Text size="sm">{featureLabel(feature.code, feature.name)}</Text>
                              <Text size="xs" c="dimmed">
                                {feature.code}
                              </Text>
                            </Table.Td>
                            {roles.map((role) => {
                              const checked = effectiveDraft[role.id]?.has(feature.code) ?? false
                              return (
                                <Table.Td key={role.id}>
                                  <Box display="flex" style={{ justifyContent: 'center' }}>
                                    <Checkbox
                                      checked={checked}
                                      disabled={!canEdit}
                                      onChange={(e) =>
                                        toggle(role.id, feature.code, e.currentTarget.checked)
                                      }
                                      aria-label={`${ROLE_LABELS[role.name] ?? role.name} · ${featureLabel(feature.code, feature.name)}`}
                                    />
                                  </Box>
                                </Table.Td>
                              )
                            })}
                          </Table.Tr>
                        ))}
                    </Fragment>
                  ))}
                </Table.Tbody>
                {canEdit && (
                  <Table.Tfoot>
                    <Table.Tr>
                      <Table.Td />
                      {roles.map((role) => (
                        <Table.Td key={role.id}>
                          <Box display="flex" style={{ justifyContent: 'center' }}>
                            <Button
                              variant="light"
                              size="sm"
                              loading={saveMutation.isPending}
                              onClick={() => saveMutation.mutate(role.id)}
                            >
                              Guardar
                            </Button>
                          </Box>
                        </Table.Td>
                      ))}
                    </Table.Tr>
                  </Table.Tfoot>
                )}
              </Table>
            </div>
          </Stack>
        )}
      </Card>

    </Stack>
  )
}
