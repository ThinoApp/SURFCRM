import { z } from 'zod'

import { requiredTextField, textField } from './schemaUtils'

const directionField = z.preprocess(
  (value) => {
    const v = String(value ?? '').trim()
    if (v === 'Entrant' || v === 'Sortant') return v
    // Fallback pour valeurs inattendues ou vides
    return 'Sortant'
  },
  z.enum(['Entrant', 'Sortant']),
)

export const messageSchema = z.object({
  prospectId: textField,
  contact: textField,
  organisation: textField,
  date: textField,
  sourceLabel: textField,
  type: textField,
  direction: directionField,
  state: textField,
  exactContent: textField,
  messageId: requiredTextField,
})
