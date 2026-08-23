/** ACC-004: ApInvoiceForm_RequiresVendor */
export function ApInvoiceForm_RequiresVendor(vendorId: string | null | undefined): boolean {
  return Boolean(vendorId && vendorId.trim())
}
