/** Spec COM-012 — PortalPqrsForm_RequiresCategory */
export function portalPqrsFormRequiresCategory(values: {
  category?: string | null
  subject?: string | null
  description?: string | null
  unitId?: string | null
}): { ok: boolean; error?: string } {
  if (!values.unitId)
    return { ok: false, error: 'Selecciona una unidad' }
  if (!values.category)
    return { ok: false, error: 'Selecciona una categoría' }
  if (!values.subject?.trim())
    return { ok: false, error: 'Escribe el asunto' }
  if (!values.description?.trim() || values.description.trim().length < 5)
    return { ok: false, error: 'Describe el caso (mínimo 5 caracteres)' }
  return { ok: true }
}
