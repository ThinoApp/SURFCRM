import { z } from 'zod'

import { contentStatuses } from '../domain/crmTypes'
import { booleanField, requiredTextField, textField } from './schemaUtils'

const contentStatusField = z.preprocess(
  (value) => {
    const v = String(value ?? '').trim().toLowerCase()
    if (contentStatuses.includes(v as (typeof contentStatuses)[number])) return v
    return 'a utiliser'
  },
  z.enum(contentStatuses),
)

export const leadMagnetSchema = z.object({
  id: requiredTextField,
  date: textField,
  sourceProspect: textField,
  type: textField,
  provisionalTitle: textField,
  keyword: textField,
  angleOrUse: textField,
  usedInPost: booleanField,
  postUseDate: textField,
  postTitle: textField,
  postArchive: textField,
  postFormat: textField,
  contentStatus: contentStatusField,
  sourceProspectId: textField,
})

export const apprentissageSchema = z.object({
  id: requiredTextField,
  date: textField,
  fieldLearning: textField,
  linkedInUse: textField,
  usedInPost: booleanField,
  postUseDate: textField,
  postTitle: textField,
  postArchive: textField,
  postFormat: textField,
  contentStatus: contentStatusField,
  sourceProspectId: textField,
})
