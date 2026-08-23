import { Alert, Button, FileButton, Group, Progress, Stack, Text } from '@mantine/core'
import { useRef, useState } from 'react'
import { api } from '../../../api/client'
import { getApiErrorMessage } from '../../../api/errors'
import type { FileAsset } from '../../../api/types'
import {
  fileUploadFieldShowsProgressOrError,
  fileUploadStatusMessage,
  type FileUploadUiStatus,
} from '../lib/fileUploadFieldStatus'

type FileUploadFieldProps = {
  purpose?: string
  accept?: string
  label?: string
  onUploaded?: (asset: FileAsset) => void
}

/** Reusable upload control for PQRS, recibos, etc. (ARCH-004). */
export function FileUploadField({
  purpose,
  accept,
  label = 'Subir archivo',
  onUploaded,
}: FileUploadFieldProps) {
  const resetRef = useRef<() => void>(null)
  const [status, setStatus] = useState<FileUploadUiStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const showBanner = fileUploadFieldShowsProgressOrError(status)
  const message = fileUploadStatusMessage(status, error)

  async function handleFile(file: File | null) {
    if (!file) return
    setFileName(file.name)
    setError(null)
    setStatus('uploading')
    setProgress(0)

    const body = new FormData()
    body.append('file', file)
    if (purpose) body.append('purpose', purpose)

    try {
      const { data } = await api.post<FileAsset>('/api/files', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (!evt.total) return
          setProgress(Math.round((evt.loaded / evt.total) * 100))
        },
      })
      setProgress(100)
      setStatus('success')
      onUploaded?.(data)
    } catch (err) {
      setStatus('error')
      setError(getApiErrorMessage(err))
    } finally {
      resetRef.current?.()
    }
  }

  return (
    <Stack gap="xs">
      <Group gap="sm">
        <FileButton resetRef={resetRef} onChange={handleFile} accept={accept}>
          {(props) => (
            <Button {...props} loading={status === 'uploading'} variant="light">
              {label}
            </Button>
          )}
        </FileButton>
        {fileName ? (
          <Text size="sm" c="dimmed" lineClamp={1}>
            {fileName}
          </Text>
        ) : null}
      </Group>

      {status === 'uploading' ? <Progress value={progress} animated /> : null}

      {showBanner && message ? (
        <Alert color={status === 'error' ? 'red' : 'blue'} title={status === 'error' ? 'Error' : 'Progreso'}>
          {message}
        </Alert>
      ) : null}

      {status === 'success' && message ? (
        <Text size="sm" c="teal">
          {message}
        </Text>
      ) : null}
    </Stack>
  )
}
