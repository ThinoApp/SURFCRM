import type { CrmSnapshot } from '../domain/crmTypes'
import { prospectSchema } from '../schemas/prospect.schema'
import { messageSchema } from '../schemas/message.schema'
import { relanceSchema } from '../schemas/relance.schema'
import { outboundTargetSchema } from '../schemas/outbound.schema'
import { leadMagnetSchema, apprentissageSchema } from '../schemas/insight.schema'
import { sheetDefinitions, sheetEntityKeys } from './sheetDefinitions'
import type { SheetDefinition, SheetEntity } from './sheetDefinitions'

export type SheetValues = string[][]
export type SheetValuesByEntity = Partial<Record<SheetEntity, SheetValues>>

type RawSheetRecord = Record<string, string>

export function normalizeSheetHeader(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function getHeaderCandidates(field: SheetDefinition['fields'][number]) {
  return [field.key, field.header, ...(field.aliases ?? [])].map((item) =>
    normalizeSheetHeader(item),
  )
}

function buildColumnIndex(definition: SheetDefinition, headerRow: string[]) {
  const normalizedHeaders = headerRow.map((header) => normalizeSheetHeader(header))
  const columnByField = new Map<string, number>()

  for (const field of definition.fields) {
    const candidates = getHeaderCandidates(field)
    const columnIndex = normalizedHeaders.findIndex((header) =>
      candidates.includes(header),
    )

    if (columnIndex >= 0) {
      columnByField.set(field.key, columnIndex)
    }
  }

  return columnByField
}

function hasCellValue(row: string[]) {
  return row.some((cell) => String(cell ?? '').trim().length > 0)
}

export function mapSheetValuesToRecords(
  definition: SheetDefinition,
  values: SheetValues = [],
) {
  const [headerRow, ...dataRows] = values

  if (!headerRow) {
    return []
  }

  const columnByField = buildColumnIndex(definition, headerRow)
  const idColumn = columnByField.get(definition.idKey)
  // Si la colonne ID n'est pas trouvée dans les headers, on utilise la
  // colonne 0 comme proxy : toute ligne sans valeur dans la première colonne
  // est considérée comme une ligne vide à ignorer.
  const effectiveIdColumn = idColumn ?? 0

  return dataRows.reduce<RawSheetRecord[]>((records, row) => {
    if (!hasCellValue(row)) {
      return records
    }

    if (!String(row[effectiveIdColumn] ?? '').trim()) {
      return records
    }

    const record: RawSheetRecord = {}

    for (const field of definition.fields) {
      const columnIndex = columnByField.get(field.key)
      record[field.key] =
        columnIndex === undefined ? '' : String(row[columnIndex] ?? '').trim()
    }

    records.push(record)
    return records
  }, [])
}

function safeParseRows<T>(
  schema: { safeParse: (val: unknown) => { success: boolean; data?: T; error?: unknown } },
  rows: RawSheetRecord[],
  entityName: string,
): T[] {
  const results: T[] = []

  for (const row of rows) {
    const result = schema.safeParse(row)

    if (result.success && result.data !== undefined) {
      results.push(result.data)
    } else {
      console.warn(`[sheetMapper] Ligne ignorée dans "${entityName}":`, result.error, row)
    }
  }

  return results
}

export function mapSheetsToCrmSnapshot(
  valuesByEntity: SheetValuesByEntity,
): CrmSnapshot {
  const prospects = safeParseRows(
    prospectSchema,
    mapSheetValuesToRecords(sheetDefinitions.prospects, valuesByEntity.prospects),
    'prospects',
  )
  const messages = safeParseRows(
    messageSchema,
    mapSheetValuesToRecords(sheetDefinitions.messages, valuesByEntity.messages),
    'messages',
  )
  const relances = safeParseRows(
    relanceSchema,
    mapSheetValuesToRecords(sheetDefinitions.relances, valuesByEntity.relances),
    'relances',
  )
  const outboundTargets = safeParseRows(
    outboundTargetSchema,
    mapSheetValuesToRecords(sheetDefinitions.outboundTargets, valuesByEntity.outboundTargets),
    'outboundTargets',
  )
  const leadMagnets = safeParseRows(
    leadMagnetSchema,
    mapSheetValuesToRecords(sheetDefinitions.leadMagnets, valuesByEntity.leadMagnets),
    'leadMagnets',
  )
  const apprentissages = safeParseRows(
    apprentissageSchema,
    mapSheetValuesToRecords(sheetDefinitions.apprentissages, valuesByEntity.apprentissages),
    'apprentissages',
  )

  return { prospects, messages, relances, outboundTargets, leadMagnets, apprentissages }
}

export function getSheetRangesByEntity(
  tabNames: Partial<Record<SheetEntity, string>> = {},
) {
  return sheetEntityKeys.reduce<Record<SheetEntity, string>>((ranges, entity) => {
    ranges[entity] = tabNames[entity] ?? sheetDefinitions[entity].defaultTabName
    return ranges
  }, {} as Record<SheetEntity, string>)
}
