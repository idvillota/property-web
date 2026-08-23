import { Anchor, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import {
  IconBook,
  IconCashBanknote,
  IconFileInvoice,
  IconReportMoney,
  IconScale,
  IconReceiptTax,
  IconBuildingBank,
  IconWallet,
} from '@tabler/icons-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../../components/shared/PageHeader'
import { usePropertyId } from '../../../hooks/usePropertyId'
import { FeatureCodes, hasPermission } from '../../../lib/permissions'
import { useAuthStore } from '../../../stores/authStore'

const LINKS = [
  { to: 'coa', label: 'Plan de cuentas', description: 'PUC adaptado a PH', icon: IconBook, permission: FeatureCodes.accountingCoa },
  { to: 'journals', label: 'Asientos', description: 'Diario contable', icon: IconScale, permission: FeatureCodes.accountingJournals },
  { to: 'budget', label: 'Presupuesto', description: 'Presupuesto y ejecución', icon: IconReportMoney, permission: FeatureCodes.accountingBudget },
  { to: 'ap', label: 'Cuentas por pagar', description: 'Proveedores y facturas', icon: IconFileInvoice, permission: FeatureCodes.accountingAp },
  { to: 'petty-cash', label: 'Caja menor', description: 'Legalización con soporte', icon: IconWallet, permission: FeatureCodes.accountingPettyCash },
  { to: 'tax', label: 'Retenciones', description: 'ReteFuente / ICA', icon: IconReceiptTax, permission: FeatureCodes.accountingTax },
  { to: 'reports', label: 'Estados y cierre', description: 'EEFF y cierre de período', icon: IconCashBanknote, permission: FeatureCodes.accountingReports },
  { to: 'bank-rec', label: 'Conciliación', description: 'Extracto vs pagos', icon: IconBuildingBank, permission: FeatureCodes.accountingBank },
] as const

export function AccountingHubPage() {
  const propertyId = usePropertyId()
  const permissions = useAuthStore((s) => s.permissions)

  return (
    <Stack gap="lg">
      <PageHeader
        title="Contabilidad"
        description="Plan de cuentas, asientos, presupuesto, CxP, caja menor, retenciones y conciliación."
      />
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        {LINKS.filter((l) => hasPermission(permissions, l.permission)).map((item) => (
          <Anchor
            key={item.to}
            component={Link}
            to={`/properties/${propertyId}/accounting/${item.to}`}
            underline="never"
            c="inherit"
          >
            <Stack gap="xs" p="md" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 8 }}>
              <ThemeIcon variant="light" size="lg">
                <item.icon size={18} />
              </ThemeIcon>
              <Title order={4}>{item.label}</Title>
              <Text size="sm" c="dimmed">
                {item.description}
              </Text>
            </Stack>
          </Anchor>
        ))}
      </SimpleGrid>
    </Stack>
  )
}
