import { Alert, Button, NumberInput, Stack, Text, Textarea } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { FeeSettings } from '../../../api/types'
import { MoneyInput } from '../../../components/shared/MoneyInput'
import { PageHeader } from '../../../components/shared/PageHeader'
import { useInvalidate } from '../../../hooks/useInvalidate'
import { usePropertyId } from '../../../hooks/usePropertyId'
import { formatMoney } from '../../../lib/money'

export function BillingSettingsPage() {
  const propertyId = usePropertyId()
  const invalidate = useInvalidate(['fee-settings'])

  const settingsQuery = useQuery({
    queryKey: ['fee-settings', propertyId],
    queryFn: async () => {
      const { data } = await api.get<FeeSettings>(`/api/FeeSettings/${propertyId}`)
      return data
    },
  })

  const form = useForm({
    initialValues: {
      monthlyBudgetAmount: 0,
      dueDayOfMonth: 5,
      lateInterestMonthlyPercent: 0,
      notes: '',
    },
    validate: {
      dueDayOfMonth: (v) =>
        v < 1 || v > 28 ? 'Due day must be between 1 and 28' : null,
      monthlyBudgetAmount: (v) => (v < 0 ? 'Must be zero or greater' : null),
      lateInterestMonthlyPercent: (v) => (v < 0 ? 'Must be zero or greater' : null),
    },
  })

  useEffect(() => {
    const data = settingsQuery.data
    if (!data) return
    form.setValues({
      monthlyBudgetAmount: data.monthlyBudgetAmount,
      dueDayOfMonth: data.dueDayOfMonth,
      lateInterestMonthlyPercent: data.lateInterestMonthlyPercent,
      notes: data.notes ?? '',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync when server data loads
  }, [settingsQuery.data])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        monthlyBudgetAmount: Number(form.values.monthlyBudgetAmount) || 0,
        dueDayOfMonth: Number(form.values.dueDayOfMonth) || 5,
        lateInterestMonthlyPercent: Number(form.values.lateInterestMonthlyPercent) || 0,
        notes: form.values.notes.trim() || null,
      }
      const { data } = await api.put<FeeSettings>(`/api/FeeSettings/${propertyId}`, payload)
      return data
    },
    onSuccess: () => {
      notifications.show({ title: 'Saved', message: 'Billing settings updated', color: 'teal' })
      invalidate()
    },
    onError: (err) =>
      notifications.show({ title: 'Error', message: getApiErrorMessage(err), color: 'red' }),
  })

  return (
    <Stack gap="md" maw={560}>
      <PageHeader
        title="Billing settings"
        description="Monthly budget, due day, and late interest for this property."
      />

      <Alert color="gray" title="Ordinary unit fee">
        Ordinary unit fee = budget × (coefficient / 100). Current budget:{' '}
        <Text span fw={600}>
          {formatMoney(form.values.monthlyBudgetAmount || 0)}
        </Text>
      </Alert>

      <form onSubmit={form.onSubmit(() => saveMutation.mutate())}>
        <Stack gap="sm">
          <MoneyInput
            label="Monthly budget amount"
            precision={2}
            required
            {...form.getInputProps('monthlyBudgetAmount')}
          />
          <NumberInput
            label="Due day of month"
            description="Day 1–28 each billing period"
            min={1}
            max={28}
            required
            {...form.getInputProps('dueDayOfMonth')}
          />
          <NumberInput
            label="Late interest monthly %"
            description="Applied when generating interest charges"
            min={0}
            decimalScale={4}
            {...form.getInputProps('lateInterestMonthlyPercent')}
          />
          <Textarea label="Notes" minRows={3} {...form.getInputProps('notes')} />
          <Button type="submit" loading={saveMutation.isPending || settingsQuery.isLoading}>
            Save settings
          </Button>
        </Stack>
      </form>
    </Stack>
  )
}
