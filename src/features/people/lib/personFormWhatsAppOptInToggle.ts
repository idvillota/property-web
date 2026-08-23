/** Spec DIFF-003 — PersonForm_WhatsAppOptIn_Toggle */
export type PersonFormSchema = {
  initialValues: Record<string, unknown>
}

export type PersonFormValues = {
  documentType: string
  documentNumber: string
  firstName: string
  lastName: string
  email: string
  phone: string
  whatsAppOptIn: boolean
  isActive: boolean
}

export const PERSON_FORM_DEFAULTS: PersonFormValues = {
  documentType: 'CC',
  documentNumber: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  whatsAppOptIn: false,
  isActive: true,
}

/** Verifies the person create/edit form exposes WhatsApp opt-in in schema defaults. */
export function PersonForm_WhatsAppOptIn_Toggle(schema: PersonFormSchema): boolean {
  return Object.prototype.hasOwnProperty.call(schema.initialValues, 'whatsAppOptIn')
}
