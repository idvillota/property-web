import type { ChangeEvent } from 'react'

type TextControl = HTMLInputElement | HTMLTextAreaElement

/**
 * Text of the control at the moment the change handler runs.
 * Call it directly in the handler. React clears `currentTarget` before a
 * state updater runs, so the updater must receive this string, not the event.
 */
export function inputChangeValue(event: ChangeEvent<TextControl>): string {
  return event.currentTarget.value
}
