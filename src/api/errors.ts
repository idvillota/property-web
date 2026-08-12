const API_ERROR_ES: Record<string, string> = {
  'The reservation overlaps an existing Pending or Confirmed reservation for this common area.':
    'Ya hay otra reserva en ese horario para esta zona. Por favor elige otra fecha u hora.',
  'AttendeesCount cannot exceed the common area capacity.':
    'La cantidad de asistentes supera el aforo de la zona común.',
  'EndsAtUtc must be greater than StartsAtUtc.':
    'La hora de fin debe ser posterior a la hora de inicio.',
}

function localizeApiMessage(message: string): string {
  return API_ERROR_ES[message] ?? message
}

export function getApiErrorMessage(err: unknown, fallback = 'Algo salió mal'): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const data = (err as { response?: { data?: { message?: string; title?: string } } }).response?.data
    if (data?.message) return localizeApiMessage(String(data.message))
    if (data?.title) return localizeApiMessage(String(data.title))
  }
  if (err instanceof Error && err.message) return localizeApiMessage(err.message)
  return fallback
}
