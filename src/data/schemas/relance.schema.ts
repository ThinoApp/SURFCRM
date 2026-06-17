import { z } from 'zod'

import { relanceStates } from '../domain/crmTypes'
import { requiredTextField, textField } from './schemaUtils'

const relanceStateField = z.preprocess(
  (value) => {
    const v = String(value ?? '').trim()
    if (relanceStates.includes(v as (typeof relanceStates)[number])) return v
    return 'A faire'
  },
  z.enum(relanceStates),
)

export const relanceSchema = z.object({
  id: requiredTextField,
  date: requiredTextField,
  prospectName: requiredTextField,
  action: requiredTextField,
  reference: textField,
  state: relanceStateField,
  prospectId: textField,
})
