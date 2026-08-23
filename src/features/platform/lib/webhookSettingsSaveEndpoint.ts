/** Spec DIFF-006 — WebhookSettings_SaveEndpoint */
export type WebhookSavePayload = {
  name: string
  targetUrl: string
  secret: string
  eventTypes: string[]
  isActive: boolean
}

export type WebhookSaveValidation = {
  ok: boolean
  errors: string[]
}

export type WebhookSaveOptions = {
  requireSecret?: boolean
}

/** Pure validation for webhook endpoint save payload. */
export function WebhookSettings_SaveEndpoint(
  payload: WebhookSavePayload,
  options: WebhookSaveOptions = { requireSecret: true },
): WebhookSaveValidation {
  const errors: string[] = []
  const requireSecret = options.requireSecret !== false

  if (!payload.name.trim()) errors.push('Nombre obligatorio')
  if (!payload.targetUrl.trim()) {
    errors.push('URL obligatoria')
  } else {
    try {
      const url = new URL(payload.targetUrl.trim())
      if (!['http:', 'https:'].includes(url.protocol)) errors.push('URL debe ser http o https')
    } catch {
      errors.push('URL inválida')
    }
  }
  if (requireSecret && !payload.secret.trim()) errors.push('Secreto obligatorio')
  if (!payload.eventTypes.length) errors.push('Seleccione al menos un tipo de evento')

  return { ok: errors.length === 0, errors }
}
