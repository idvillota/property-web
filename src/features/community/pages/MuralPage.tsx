import {
  ActionIcon,
  Button,
  Center,
  Collapse,
  FloatingWindow,
  Group,
  Loader,
  Pagination,
  SegmentedControl,
  Select,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
  UnstyledButton,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useMediaQuery } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconGripHorizontal,
  IconPlus,
  IconSearch,
  IconX,
} from '@tabler/icons-react'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useState, type CSSProperties } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { MuralPost } from '../../../api/types'
import { FormDrawer } from '../../../components/crud/FormDrawer'
import { useInvalidate } from '../../../hooks/useInvalidate'
import { usePagedListQuery } from '../../../hooks/usePagedListQuery'
import { usePagedListState } from '../../../hooks/usePagedListState'
import { usePropertyId } from '../../../hooks/usePropertyId'
import { formDrawerSelectComboboxProps } from '../../../lib/formDrawerSelect'
import {
  asEnumName,
  enumIndex,
  isOfficialMuralKind,
  labelForOption,
  MURAL_CATEGORY_OPTIONS,
  MURAL_KIND_OPTIONS,
} from '../../../lib/muralEnums'
import { muralPageListsPosts } from '../lib/muralPageListsPosts'

function defaultExpiryIso() {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  return d.toISOString().slice(0, 10)
}

function formatPublished(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso.slice(0, 10)
  }
}

function slipTilt(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) | 0
  const tilts = [-1.6, -0.8, 0.4, 1.2, -1.1, 0.9]
  return tilts[Math.abs(hash) % tilts.length]
}

type ComposeMode = 'create' | MuralPost

export function MuralPage() {
  const propertyId = usePropertyId()
  const isMobile = useMediaQuery('(max-width: 48em)')
  const [compose, setCompose] = useState<ComposeMode | null>(null)
  const [detail, setDetail] = useState<MuralPost | null>(null)
  const [showExtras, setShowExtras] = useState(false)
  const invalidate = useInvalidate(['mural-posts'])
  const list = usePagedListState('publishedatutc', {
    columnFilters: { horizontalPropertyId: propertyId },
    sortDir: 'desc',
    pageSize: 24,
  })
  const listQuery = usePagedListQuery<MuralPost>('mural-posts', '/api/MuralPosts', list)

  useEffect(() => {
    list.setFilter('horizontalPropertyId', propertyId)
  }, [propertyId, list.setFilter])

  const form = useForm({
    initialValues: {
      kind: 'Community',
      category: 'Other',
      title: '',
      body: '',
      contactPhone: '',
      contactEmail: '',
      contactNote: '',
      areaLabel: '',
      isPinned: false,
      isHidden: false,
      expiresAt: defaultExpiryIso(),
      isActive: true,
    },
    validate: {
      title: (v) => (v.trim().length < 3 ? 'Mínimo 3 caracteres' : null),
      body: (v) => (v.trim().length < 5 ? 'Escribe el aviso' : null),
    },
  })

  const openCreate = () => {
    form.setValues({
      kind: 'Community',
      category: 'Other',
      title: '',
      body: '',
      contactPhone: '',
      contactEmail: '',
      contactNote: '',
      areaLabel: '',
      isPinned: false,
      isHidden: false,
      expiresAt: defaultExpiryIso(),
      isActive: true,
    })
    setShowExtras(false)
    setDetail(null)
    setCompose('create')
  }

  const openEdit = (item: MuralPost) => {
    form.setValues({
      kind: asEnumName(item.kind, MURAL_KIND_OPTIONS) || 'Community',
      category: asEnumName(item.category, MURAL_CATEGORY_OPTIONS) || 'Other',
      title: item.title,
      body: item.body,
      contactPhone: item.contactPhone ?? '',
      contactEmail: item.contactEmail ?? '',
      contactNote: item.contactNote ?? '',
      areaLabel: item.areaLabel ?? '',
      isPinned: item.isPinned,
      isHidden: item.isHidden,
      expiresAt: item.expiresAtUtc ? item.expiresAtUtc.slice(0, 10) : '',
      isActive: item.isActive,
    })
    setShowExtras(true)
    setDetail(null)
    setCompose(item)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const expiresAtUtc = form.values.expiresAt.trim()
        ? new Date(`${form.values.expiresAt}T23:59:59.000Z`).toISOString()
        : null
      const payload = {
        horizontalPropertyId: propertyId,
        kind: enumIndex(form.values.kind, MURAL_KIND_OPTIONS),
        category: enumIndex(form.values.category, MURAL_CATEGORY_OPTIONS),
        title: form.values.title.trim(),
        body: form.values.body.trim(),
        contactPhone: form.values.contactPhone.trim() || null,
        contactEmail: form.values.contactEmail.trim() || null,
        contactNote: form.values.contactNote.trim() || null,
        areaLabel: form.values.areaLabel.trim() || null,
        unitId: null,
        isPinned: form.values.kind === 'Official' && form.values.isPinned,
        expiresAtUtc,
      }
      if (compose === 'create') {
        const { data } = await api.post<MuralPost>('/api/MuralPosts', payload)
        return data
      }
      const { data } = await api.put<MuralPost>(`/api/MuralPosts/${compose!.id}`, {
        ...payload,
        isHidden: form.values.isHidden,
        isActive: form.values.isActive,
      })
      return data
    },
    onSuccess: () => {
      notifications.show({ title: 'Guardado', message: 'Aviso en el mural', color: 'teal' })
      setCompose(null)
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/MuralPosts/${id}`),
    onSuccess: () => {
      notifications.show({ title: 'Retirado', message: 'Aviso retirado del mural', color: 'gray' })
      setDetail(null)
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  const kindFilter = list.state.columnFilters.kind || 'all'
  const categoryFilter = list.state.columnFilters.category || ''
  const items = listQuery.data?.items ?? []
  const totalPages = listQuery.data?.totalPages ?? 1
  const listsPosts = !list.state.includeInactive && muralPageListsPosts(items)

  const composeForm = (
    <form onSubmit={form.onSubmit(() => saveMutation.mutate())}>
      <Stack gap="sm">
        <SegmentedControl
          fullWidth
          data={MURAL_KIND_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          {...form.getInputProps('kind')}
        />
        <TextInput
          label="Título"
          required
          placeholder="Ej. Corte de agua el jueves"
          {...form.getInputProps('title')}
        />
        <Textarea
          label="Aviso"
          required
          minRows={4}
          placeholder="Qué pasó, cuándo y qué deben saber los vecinos…"
          {...form.getInputProps('body')}
        />

        <UnstyledButton
          type="button"
          onClick={() => setShowExtras((v) => !v)}
          style={{ fontSize: 13, fontWeight: 600, color: 'var(--mantine-color-dimmed)' }}
        >
          {showExtras ? 'Ocultar detalles' : 'Más detalles (opcional)'}
        </UnstyledButton>

        <Collapse expanded={showExtras}>
          <Stack gap="sm">
            <Select
              label="Categoría"
              data={[...MURAL_CATEGORY_OPTIONS]}
              comboboxProps={formDrawerSelectComboboxProps}
              {...form.getInputProps('category')}
            />
            <TextInput
              label="Lugar"
              placeholder="Torre A, gimnasio…"
              {...form.getInputProps('areaLabel')}
            />
            <TextInput
              label="Teléfono de contacto"
              placeholder="Solo si alguien debe responder"
              {...form.getInputProps('contactPhone')}
            />
            <TextInput label="Correo de contacto" {...form.getInputProps('contactEmail')} />
            <TextInput
              label="Nota de contacto"
              placeholder="WhatsApp por la tarde"
              {...form.getInputProps('contactNote')}
            />
            <TextInput
              label="Vigente hasta"
              type="date"
              description="Por defecto 14 días"
              {...form.getInputProps('expiresAt')}
            />
            {form.values.kind === 'Official' && (
              <Switch
                label="Fijar arriba del mural"
                {...form.getInputProps('isPinned', { type: 'checkbox' })}
              />
            )}
            {compose !== 'create' && (
              <>
                <Switch label="Oculto" {...form.getInputProps('isHidden', { type: 'checkbox' })} />
                <Switch label="Activo" {...form.getInputProps('isActive', { type: 'checkbox' })} />
              </>
            )}
          </Stack>
        </Collapse>

        <Button type="submit" fullWidth loading={saveMutation.isPending}>
          {compose === 'create' ? 'Publicar en el mural' : 'Guardar cambios'}
        </Button>
      </Stack>
    </form>
  )

  const detailBody = detail ? (
    <Stack gap="sm">
      <Group gap={6}>
        <Text size="xs" tt="uppercase" c="dimmed" fw={700}>
          {labelForOption(MURAL_KIND_OPTIONS, detail.kind)}
        </Text>
        <Text size="xs" c="dimmed">
          · {labelForOption(MURAL_CATEGORY_OPTIONS, detail.category)}
        </Text>
      </Group>
      <Text fw={700} style={{ fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
        {detail.title}
      </Text>
      <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
        {detail.body}
      </Text>
      <Text size="xs" c="dimmed">
        {detail.authorDisplayName} · {formatPublished(detail.publishedAtUtc)}
        {detail.areaLabel ? ` · ${detail.areaLabel}` : ''}
        {detail.unitCode ? ` · ${detail.unitCode}` : ''}
      </Text>
      {(detail.contactPhone || detail.contactEmail || detail.contactNote) && (
        <Stack
          gap={4}
          p="sm"
          style={{
            borderRadius: 10,
            background: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))',
          }}
        >
          <Text size="sm" fw={600}>
            Contacto
          </Text>
          {detail.contactPhone ? <Text size="sm">{detail.contactPhone}</Text> : null}
          {detail.contactEmail ? <Text size="sm">{detail.contactEmail}</Text> : null}
          {detail.contactNote ? (
            <Text size="sm" c="dimmed">
              {detail.contactNote}
            </Text>
          ) : null}
        </Stack>
      )}
      <Group grow>
        <Button variant="default" onClick={() => openEdit(detail)}>
          Editar
        </Button>
        <Button
          color="red"
          variant="light"
          onClick={() => {
            if (window.confirm(`¿Retirar el aviso "${detail.title}"?`))
              deleteMutation.mutate(detail.id)
          }}
        >
          Retirar
        </Button>
      </Group>
    </Stack>
  ) : null

  const dockHeader = (title: string, onClose: () => void) => (
    <Group
      className="mural-dock-window__handle"
      justify="space-between"
      wrap="nowrap"
      data-mural-drag-handle
    >
      <Group gap={6} wrap="nowrap">
        {!isMobile ? <IconGripHorizontal size={16} stroke={1.5} opacity={0.55} /> : null}
        <Text fw={700} size="sm">
          {title}
        </Text>
      </Group>
      <ActionIcon variant="subtle" color="gray" onClick={onClose} aria-label="Cerrar">
        <IconX size={16} stroke={1.75} />
      </ActionIcon>
    </Group>
  )

  return (
    <div className="mural-page">
      <section className="mural-board" aria-label="Mural de avisos">
        <header className="mural-board__hero">
          <div>
            <h1 className="mural-board__brand">Mural</h1>
            <p className="mural-board__lede">
              Avisos oficiales y de vecinos — un tablero, no una tabla.
              {listsPosts ? ` · ${items.length} activo${items.length === 1 ? '' : 's'}` : ''}
            </p>
          </div>
          {!isMobile ? (
            <Button
              variant="white"
              color="dark"
              leftSection={<IconPlus size={16} stroke={1.75} />}
              onClick={openCreate}
            >
              Publicar
            </Button>
          ) : null}
        </header>

        <div className="mural-board__filters">
          <SegmentedControl
            size="xs"
            data={[
              { value: 'all', label: 'Todos' },
              ...MURAL_KIND_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
            ]}
            value={kindFilter}
            onChange={(v) => list.setColumnFilter('kind', v === 'all' ? '' : v)}
          />
          <Select
            size="xs"
            placeholder="Categoría"
            clearable
            searchable
            w={180}
            data={[...MURAL_CATEGORY_OPTIONS]}
            value={categoryFilter || null}
            onChange={(v) => list.setColumnFilter('category', v ?? '')}
            styles={{
              input: {
                background: 'light-dark(rgb(247 243 234 / 88%), rgb(20 32 36 / 75%))',
                borderColor: 'transparent',
              },
            }}
          />
          <TextInput
            size="xs"
            placeholder="Buscar…"
            leftSection={<IconSearch size={14} stroke={1.75} />}
            value={list.state.search}
            onChange={(e) => list.setSearch(e.currentTarget.value)}
            style={{ flex: '1 1 180px', maxWidth: 260 }}
            styles={{
              input: {
                background: 'light-dark(rgb(247 243 234 / 88%), rgb(20 32 36 / 75%))',
                borderColor: 'transparent',
              },
            }}
          />
          <Switch
            size="xs"
            label="Incluir inactivos"
            checked={list.state.includeInactive}
            onChange={(e) => list.setIncludeInactive(e.currentTarget.checked)}
          />
        </div>

        {listQuery.isLoading && !listQuery.data ? (
          <Center py="xl">
            <Loader size="sm" color="gray.2" />
          </Center>
        ) : (
          <div className="mural-board__grid">
            {items.length === 0 ? (
              <div className="mural-board__empty">
                <Text fw={600} mb={6}>
                  El mural está vacío
                </Text>
                <Text size="sm" mb="md">
                  Publica el primer aviso para la comunidad.
                </Text>
                <Button variant="white" color="dark" onClick={openCreate}>
                  Publicar aviso
                </Button>
              </div>
            ) : (
              items.map((item, index) => {
                const official = isOfficialMuralKind(item.kind)
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={[
                      'mural-slip',
                      official ? 'mural-slip--official' : '',
                      item.isPinned ? 'mural-slip--pinned' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    style={
                      {
                        '--tilt': `${slipTilt(item.id)}deg`,
                        '--delay': `${Math.min(index, 10) * 35}ms`,
                        position: 'relative',
                      } as CSSProperties
                    }
                    onClick={() => {
                      setCompose(null)
                      setDetail(item)
                    }}
                  >
                    {item.isPinned ? <span className="mural-slip__pin" aria-hidden /> : null}
                    <div className="mural-slip__meta">
                      <span
                        className={[
                          'mural-slip__chip',
                          official ? 'mural-slip__chip--official' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {labelForOption(MURAL_KIND_OPTIONS, item.kind)}
                      </span>
                      <span className="mural-slip__chip">
                        {labelForOption(MURAL_CATEGORY_OPTIONS, item.category)}
                      </span>
                    </div>
                    <h2 className="mural-slip__title">{item.title}</h2>
                    <p className="mural-slip__body">{item.body}</p>
                    <div className="mural-slip__foot">
                      {item.authorDisplayName} · {formatPublished(item.publishedAtUtc)}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        )}

        {totalPages > 1 ? (
          <Group justify="center" mt="lg" style={{ position: 'relative', zIndex: 1 }}>
            <Pagination
              value={list.state.page}
              onChange={list.setPage}
              total={totalPages}
              color="gray"
            />
          </Group>
        ) : null}
      </section>

      {compose === null && isMobile ? (
        <div className="mural-compose-dock">
          <span className="mural-compose-dock__label">Publicar</span>
          <ActionIcon
            size="lg"
            radius="xl"
            variant="filled"
            color="orange"
            onClick={openCreate}
            aria-label="Publicar aviso"
          >
            <IconPlus size={18} stroke={2} />
          </ActionIcon>
        </div>
      ) : null}

      {/* Compose dock */}
      {compose !== null && isMobile ? (
        <FormDrawer
          opened
          onClose={() => setCompose(null)}
          title={compose === 'create' ? 'Publicar aviso' : 'Editar aviso'}
        >
          {composeForm}
        </FormDrawer>
      ) : null}

      {compose !== null && !isMobile ? (
        <FloatingWindow
          className="mural-dock-window"
          withBorder
          constrainToViewport
          dragHandleSelector="[data-mural-drag-handle]"
          initialPosition={{ top: 88, right: 24 }}
          zIndex={420}
        >
          {dockHeader(compose === 'create' ? 'Publicar aviso' : 'Editar aviso', () =>
            setCompose(null),
          )}
          {composeForm}
        </FloatingWindow>
      ) : null}

      {/* Detail dock */}
      {detail && isMobile ? (
        <FormDrawer opened onClose={() => setDetail(null)} title="Aviso">
          {detailBody}
        </FormDrawer>
      ) : null}

      {detail && !isMobile ? (
        <FloatingWindow
          className="mural-dock-window"
          withBorder
          constrainToViewport
          dragHandleSelector="[data-mural-drag-handle]"
          initialPosition={{ top: 110, left: 36 }}
          zIndex={410}
        >
          {dockHeader('Aviso', () => setDetail(null))}
          {detailBody}
        </FloatingWindow>
      ) : null}
    </div>
  )
}
