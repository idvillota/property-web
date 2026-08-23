/** Spec BIL-013 — PaymentDetail_DownloadReceipt_Visible */
export function paymentDetailDownloadReceiptVisible(args: {
  isActive: boolean
  hasReceipt?: boolean | null
  receiptFileAssetId?: string | null
}): boolean {
  if (!args.isActive) return false
  return Boolean(args.hasReceipt || args.receiptFileAssetId)
}
