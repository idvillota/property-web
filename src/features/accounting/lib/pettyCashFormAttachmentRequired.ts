/** ACC-005: PettyCashForm_AttachmentRequired */
export function PettyCashForm_AttachmentRequired(fileAssetId: string | null | undefined): boolean {
  return Boolean(fileAssetId && fileAssetId.trim())
}
