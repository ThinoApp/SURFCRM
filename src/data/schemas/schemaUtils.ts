import { z } from 'zod'

export const textField = z.preprocess((value) => {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value).trim()
}, z.string())

export const requiredTextField = textField.pipe(z.string().min(1))

export const numberOrNullField = z.preprocess((value) => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
}, z.number().nullable())

export const booleanField = z.preprocess((value) => {
  if (typeof value === 'boolean') {
    return value
  }

  const normalized = String(value ?? '').trim().toLowerCase()
  return ['true', 'oui', 'yes', '1'].includes(normalized)
}, z.boolean())
