import { z } from 'zod'

import { outboundStatuses, priorityLevels } from '../domain/crmTypes'
import {
  booleanField,
  numberOrNullField,
  requiredTextField,
  textField,
} from './schemaUtils'

const priorityField = z.preprocess(
  (value) => {
    const v = String(value ?? '').trim().toUpperCase()
    if (priorityLevels.includes(v as 'A' | 'B' | 'C')) return v
    return 'C'
  },
  z.enum(priorityLevels),
)

const poolStatusField = z.preprocess(
  (value) => {
    const v = String(value ?? '').trim().toLowerCase()
    if (outboundStatuses.includes(v as (typeof outboundStatuses)[number])) return v
    return 'new'
  },
  z.enum(outboundStatuses),
)

export const outboundTargetSchema = z.object({
  poolId: textField,
  extractionDate: textField,
  source: textField,
  name: textField,
  linkedinUrl: textField,
  headline: textField,
  company: textField,
  role: textField,
  targetType: textField,
  priority: priorityField,
  preliminaryScore: numberOrNullField.transform((value) => value ?? 0),
  preliminaryAngle: textField,
  selectionReason: textField,
  poolStatus: poolStatusField,
  migratedToPipeline: booleanField,
  pipelineId: textField,
  lastAction: textField,
  notes: textField,
})
