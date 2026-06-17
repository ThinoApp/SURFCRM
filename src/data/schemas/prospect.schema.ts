import { z } from 'zod'

import { prospectStatuses } from '../domain/crmTypes'
import { numberOrNullField, requiredTextField, textField } from './schemaUtils'

const prospectStatusField = z.preprocess(
  (value) => {
    const v = String(value ?? '').trim().toLowerCase()
    if (prospectStatuses.includes(v as (typeof prospectStatuses)[number])) return v
    return 'identified'
  },
  z.enum(prospectStatuses),
)

export const prospectSchema = z.object({
  id: requiredTextField,
  contact: requiredTextField,
  organisation: requiredTextField,
  role: textField,
  commercialRole: textField,
  sector: textField,
  zone: textField,
  channel: textField,
  source: textField,
  website: textField,
  linkedin: textField,
  firstContactDate: textField,
  status: prospectStatusField,
  score: numberOrNullField,
  likelyOffer: textField,
  angle: textField,
  visibleProblem: textField,
  conversationGoal: textField,
  nextAction: textField,
  nextActionDate: textField,
  response: textField,
  objectionOrInsight: textField,
  linkedInIdea: textField,
  leadMagnet: textField,
  notes: textField,
})
