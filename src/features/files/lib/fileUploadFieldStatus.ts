/** Spec ARCH-004 — FileUploadField_ShowsProgressOrError */

export type FileUploadUiStatus = 'idle' | 'uploading' | 'success' | 'error'

export function fileUploadFieldShowsProgressOrError(status: FileUploadUiStatus): boolean {
  return status === 'uploading' || status === 'error'
}

export function fileUploadStatusMessage(
  status: FileUploadUiStatus,
  errorMessage?: string | null,
): string | null {
  if (status === 'uploading') return 'Subiendo…'
  if (status === 'error') return errorMessage?.trim() || 'Error al subir el archivo'
  if (status === 'success') return 'Archivo cargado'
  return null
}
