import { z } from 'zod'

import { requiredTextField, textField } from './schemaUtils'

export const weeklyReviewSchema = z.object({
  reportDate: textField,
  week: requiredTextField,
  analyzedPeriod: textField,
  executiveSummary: textField,
  highlights: textField,
  keyNumbers: textField,
  conclusions: textField,
  nextWeekImprovements: textField,
  priorityActions: textField,
  risks: textField,
  sourcesRead: textField,
  status: textField,
})
