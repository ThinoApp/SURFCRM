import {
  contentStatuses,
  outboundStatuses,
  priorityLevels,
  prospectStatuses,
} from '../domain/crmTypes'
import { sheetDefinitions } from '../sheetGateway/sheetDefinitions'
import type { SheetDefinition, SheetEntity } from '../sheetGateway/sheetDefinitions'
import { normalizeSheetHeader } from '../sheetGateway/sheetMapper'
import type { SheetValuesByEntity } from '../sheetGateway/sheetMapper'

export type CrmQualitySeverity = 'critical' | 'warning' | 'info'

export type CrmQualityIssue = {
  id: string
  severity: CrmQualitySeverity
  entity: SheetEntity
  entityLabel: string
  rowNumber: number | null
  title: string
  detail: string
  fixHint: string
}

export type CrmQualityCheck = {
  id: string
  label: string
  description: string
  severity: CrmQualitySeverity
  issueCount: number
}

export type CrmQualityReport = {
  generatedAt: string
  summary: Record<CrmQualitySeverity, number> & { total: number }
  checks: CrmQualityCheck[]
  issues: CrmQualityIssue[]
}

type RawRow = {
  entity: SheetEntity
  rowNumber: number
  values: string[]
  get: (fieldKey: string) => string
}

const entityLabels: Record<SheetEntity, string> = {
  prospects: 'Prospects',
  messages: 'Messages',
  relances: 'Relances',
  outboundTargets: 'OUTBOUND_POOL',
  leadMagnets: 'Lead magnets',
  apprentissages: 'Apprentissages',
  weeklyReviews: 'Bilans hebdomadaires',
}

const idPatterns: Partial<Record<SheetEntity, RegExp>> = {
  prospects: /^P\d{3,}$/,
  messages: /^MSG\d{3,}$/,
  relances: /^R\d{3,}$/,
  outboundTargets: /^OUT-\d{8}-\d{3,}$/,
  leadMagnets: /^LM\d{3,}$/,
  apprentissages: /^AT\d{3,}$/,
}

const allowedMessageDirections = new Set(['Entrant', 'Sortant'])
const allowedRelanceStates = new Set([
  'A faire',
  'Fait',
  'Planifie',
  'Ignore',
  'Annulé - réponse reçue',
])

function hasCellValue(row: string[]) {
  return row.some((cell) => cell.trim().length > 0)
}

function normalizeIdentity(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/https?:\/\/(www\.)?/g, '')
    .replace(/\/+$/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function getFieldCandidates(field: SheetDefinition['fields'][number]) {
  return [field.key, field.header, ...(field.aliases ?? [])].map((item) =>
    normalizeSheetHeader(item),
  )
}

function buildColumnMap(definition: SheetDefinition, headerRow: string[]) {
  const normalizedHeaders = headerRow.map((header) => normalizeSheetHeader(header))
  const columnByField = new Map<string, number>()

  for (const field of definition.fields) {
    const candidates = getFieldCandidates(field)
    const columnIndex = normalizedHeaders.findIndex((header) =>
      candidates.includes(header),
    )

    if (columnIndex >= 0) {
      columnByField.set(field.key, columnIndex)
    }
  }

  return columnByField
}

function getSheetRowNumber(entity: SheetEntity, rawRowIndex: number) {
  if (entity === 'outboundTargets') {
    return rawRowIndex + 2
  }

  if (entity === 'weeklyReviews') {
    return rawRowIndex + 1
  }

  return rawRowIndex + 3
}

function createRawRows(entity: SheetEntity, values: string[][] = []) {
  const definition = sheetDefinitions[entity]
  const [headerRow, ...dataRows] = values

  if (!headerRow) {
    return []
  }

  const columnByField = buildColumnMap(definition, headerRow)

  return dataRows.reduce<RawRow[]>((rows, row, index) => {
    const normalizedRow = row.map((cell) => String(cell ?? '').trim())

    if (!hasCellValue(normalizedRow)) {
      return rows
    }

    rows.push({
      entity,
      rowNumber: getSheetRowNumber(entity, index + 1),
      values: normalizedRow,
      get(fieldKey) {
        const columnIndex = columnByField.get(fieldKey)
        return columnIndex === undefined ? '' : normalizedRow[columnIndex] ?? ''
      },
    })

    return rows
  }, [])
}

function issue(
  issues: CrmQualityIssue[],
  row: RawRow,
  code: string,
  severity: CrmQualitySeverity,
  title: string,
  detail: string,
  fixHint: string,
) {
  issues.push({
    id: `${row.entity}-${row.rowNumber}-${code}`,
    severity,
    entity: row.entity,
    entityLabel: entityLabels[row.entity],
    rowNumber: row.rowNumber,
    title,
    detail,
    fixHint,
  })
}

function pushDuplicateIssues(
  issues: CrmQualityIssue[],
  rows: RawRow[],
  keyLabel: string,
  getKey: (row: RawRow) => string,
  severity: CrmQualitySeverity,
  code: string,
) {
  const rowsByKey = new Map<string, RawRow[]>()

  for (const row of rows) {
    const key = getKey(row)

    if (!key) {
      continue
    }

    const existingRows = rowsByKey.get(key)
    if (existingRows) {
      existingRows.push(row)
    } else {
      rowsByKey.set(key, [row])
    }
  }

  for (const duplicateRows of rowsByKey.values()) {
    if (duplicateRows.length < 2) {
      continue
    }

    const rowNumbers = duplicateRows.map((row) => row.rowNumber).join(', ')

    for (const row of duplicateRows) {
      issue(
        issues,
        row,
        code,
        severity,
        `${keyLabel} en doublon`,
        `Même valeur détectée sur les lignes ${rowNumbers}.`,
        'Fusionner les lignes ou clarifier laquelle doit rester active.',
      )
    }
  }
}

function buildProspectIdSet(rows: RawRow[]) {
  return new Set(rows.map((row) => row.get('id')).filter(Boolean))
}

function checkPrimaryIds(issues: CrmQualityIssue[], rows: RawRow[]) {
  for (const row of rows) {
    const definition = sheetDefinitions[row.entity]
    const id = row.get(definition.idKey)

    if (!id) {
      issue(
        issues,
        row,
        'missing-id',
        'critical',
        'Identifiant manquant',
        `La ligne ${row.rowNumber} n'a pas de ${definition.idKey}.`,
        'Créer le prochain ID disponible avant de laisser cette ligne active.',
      )
      continue
    }

    const pattern = idPatterns[row.entity]
    if (pattern && !pattern.test(id)) {
      issue(
        issues,
        row,
        'bad-id-format',
        'warning',
        'Format ID inhabituel',
        `${id} ne suit pas le format attendu pour ${entityLabels[row.entity]}.`,
        'Conserver les IDs existants si déjà utilisés, sinon harmoniser le format.',
      )
    }
  }

  for (const entity of Object.keys(sheetDefinitions) as SheetEntity[]) {
    const entityRows = rows.filter((row) => row.entity === entity)
    const idKey = sheetDefinitions[entity].idKey
    pushDuplicateIssues(
      issues,
      entityRows,
      'Identifiant',
      (row) => normalizeIdentity(row.get(idKey)),
      'critical',
      'duplicate-id',
    )
  }
}

function checkReferences(
  issues: CrmQualityIssue[],
  rowsByEntity: Record<SheetEntity, RawRow[]>,
) {
  const prospectIds = buildProspectIdSet(rowsByEntity.prospects)

  for (const row of rowsByEntity.messages) {
    const prospectId = row.get('prospectId')

    if (!prospectId) {
      issue(
        issues,
        row,
        'missing-prospect-id',
        'critical',
        'Message sans prospect_id',
        'Ce message ne peut pas être rattaché à une fiche prospect.',
        'Retrouver le prospect dans Prospects et recopier son ID exact.',
      )
    } else if (!prospectIds.has(prospectId)) {
      issue(
        issues,
        row,
        'unknown-prospect-id',
        'critical',
        'Message rattaché à un prospect introuvable',
        `${prospectId} n'existe pas dans Prospects.`,
        'Corriger le prospect_id ou créer la fiche prospect correspondante.',
      )
    }
  }

  for (const row of rowsByEntity.relances) {
    const prospectId = row.get('prospectId')

    if (!prospectId) {
      issue(
        issues,
        row,
        'missing-prospect-id',
        'critical',
        'Relance sans prospect_id',
        'Cette relance ne peut pas apparaître correctement dans la fiche prospect.',
        'Retrouver le prospect dans Prospects et recopier son ID exact.',
      )
    } else if (!prospectIds.has(prospectId)) {
      issue(
        issues,
        row,
        'unknown-prospect-id',
        'critical',
        'Relance rattachée à un prospect introuvable',
        `${prospectId} n'existe pas dans Prospects.`,
        'Corriger le prospect_id ou créer la fiche prospect correspondante.',
      )
    }
  }

  for (const entity of ['leadMagnets', 'apprentissages'] as const) {
    for (const row of rowsByEntity[entity]) {
      const sourceProspectId = row.get('sourceProspectId')
      const sourceProspect = row.get('sourceProspect')

      if (!sourceProspectId && sourceProspect) {
        issue(
          issues,
          row,
          'missing-source-prospect-id',
          'warning',
          'Source prospect sans ID',
          'Cette ressource cite un prospect source mais ne contient pas son ID.',
          'Ajouter source_prospect_id si la ressource vient d’un prospect précis.',
        )
      } else if (sourceProspectId && !prospectIds.has(sourceProspectId)) {
        issue(
          issues,
          row,
          'unknown-source-prospect-id',
          'warning',
          'Source prospect introuvable',
          `${sourceProspectId} n'existe pas dans Prospects.`,
          'Corriger source_prospect_id ou laisser vide si la ressource est générique.',
        )
      }
    }
  }

  for (const row of rowsByEntity.outboundTargets) {
    const poolStatus = row.get('poolStatus').toLowerCase()
    const migratedToPipeline = row.get('migratedToPipeline').toLowerCase()
    const pipelineId = row.get('pipelineId')
    const isMigrated =
      poolStatus === 'migrated' || ['true', 'vrai', 'oui'].includes(migratedToPipeline)

    if (!isMigrated && !pipelineId) {
      continue
    }

    if (!pipelineId) {
      issue(
        issues,
        row,
        'missing-pipeline-id',
        'critical',
        'Cible migrée sans pipeline_id',
        'La cible outbound est marquée migrée mais ne pointe vers aucun prospect.',
        'Renseigner l’ID prospect créé dans Prospects.',
      )
    } else if (!prospectIds.has(pipelineId)) {
      issue(
        issues,
        row,
        'unknown-pipeline-id',
        'critical',
        'pipeline_id introuvable',
        `${pipelineId} n'existe pas dans Prospects.`,
        'Corriger pipeline_id ou créer la fiche prospect correspondante.',
      )
    }
  }
}

function checkDuplicates(
  issues: CrmQualityIssue[],
  rowsByEntity: Record<SheetEntity, RawRow[]>,
) {
  pushDuplicateIssues(
    issues,
    rowsByEntity.prospects,
    'Prospect',
    (row) =>
      normalizeIdentity(`${row.get('contact')} ${row.get('organisation')}`),
    'warning',
    'duplicate-prospect-identity',
  )

  pushDuplicateIssues(
    issues,
    rowsByEntity.prospects,
    'LinkedIn',
    (row) => normalizeIdentity(row.get('linkedin')),
    'warning',
    'duplicate-linkedin',
  )
}

function checkAllowedValues(
  issues: CrmQualityIssue[],
  rowsByEntity: Record<SheetEntity, RawRow[]>,
) {
  for (const row of rowsByEntity.prospects) {
    const status = row.get('status')
    if (status && !prospectStatuses.includes(status as never)) {
      issue(
        issues,
        row,
        'invalid-status',
        'critical',
        'Statut prospect non reconnu',
        `${status} n'est pas un statut prospect autorisé par le CRM.`,
        'Remplacer par un statut autorisé pour éviter un affichage incohérent.',
      )
    }
  }

  for (const row of rowsByEntity.messages) {
    const direction = row.get('direction')
    if (!direction) {
      issue(
        issues,
        row,
        'missing-direction',
        'warning',
        'Direction message manquante',
        'Le CRM a besoin de savoir si le message est entrant ou sortant.',
        'Renseigner Entrant ou Sortant.',
      )
    } else if (!allowedMessageDirections.has(direction)) {
      issue(
        issues,
        row,
        'invalid-direction',
        'warning',
        'Direction message non reconnue',
        `${direction} n'est ni Entrant ni Sortant.`,
        'Renseigner Entrant ou Sortant.',
      )
    }
  }

  for (const row of rowsByEntity.relances) {
    const state = row.get('state')
    if (state && !allowedRelanceStates.has(state)) {
      issue(
        issues,
        row,
        'invalid-relance-state',
        'warning',
        'État relance non standard',
        `${state} n'est pas un état strictement reconnu par le CRM.`,
        'Utiliser A faire, Fait, Planifie, Ignore ou Annulé - réponse reçue, et garder le détail dans la référence.',
      )
    }
  }

  for (const row of rowsByEntity.outboundTargets) {
    const priority = row.get('priority')
    const poolStatus = row.get('poolStatus')

    if (priority && !priorityLevels.includes(priority as never)) {
      issue(
        issues,
        row,
        'invalid-priority',
        'warning',
        'Priorité outbound non reconnue',
        `${priority} n'est pas A, B ou C.`,
        'Renseigner A, B ou C.',
      )
    }

    if (poolStatus && !outboundStatuses.includes(poolStatus as never)) {
      issue(
        issues,
        row,
        'invalid-pool-status',
        'warning',
        'Statut pool non reconnu par le CRM',
        `${poolStatus} sera mal interprété par l’application actuelle.`,
        'Aligner le statut avec les valeurs supportées par le CRM ou étendre le modèle.',
      )
    }
  }

  for (const entity of ['leadMagnets', 'apprentissages'] as const) {
    for (const row of rowsByEntity[entity]) {
      const status = row.get('contentStatus')
      if (status && !contentStatuses.includes(status as never)) {
        issue(
          issues,
          row,
          'invalid-content-status',
          'warning',
          'Statut contenu non reconnu',
          `${status} sera mal interprété par le CRM.`,
          'Utiliser a utiliser, draft, published ou archived, ou étendre le modèle.',
        )
      }
    }
  }
}

function buildChecks(issues: CrmQualityIssue[]): CrmQualityCheck[] {
  const issueCount = (predicate: (issue: CrmQualityIssue) => boolean) =>
    issues.filter(predicate).length

  return [
    {
      id: 'ids',
      label: 'Identifiants',
      description: 'IDs manquants, doublons ou formats inhabituels.',
      severity: 'critical',
      issueCount: issueCount((item) =>
        ['missing-id', 'duplicate-id', 'bad-id-format'].some((code) =>
          item.id.includes(code),
        ),
      ),
    },
    {
      id: 'references',
      label: 'Références',
      description: 'Liens entre messages, relances, contenus et prospects.',
      severity: 'critical',
      issueCount: issueCount((item) =>
        [
          'missing-prospect-id',
          'unknown-prospect-id',
          'missing-source-prospect-id',
          'unknown-source-prospect-id',
          'missing-pipeline-id',
          'unknown-pipeline-id',
        ].some((code) => item.id.includes(code)),
      ),
    },
    {
      id: 'duplicates',
      label: 'Doublons',
      description: 'Contacts, organisations ou liens LinkedIn répétés.',
      severity: 'warning',
      issueCount: issueCount((item) => item.id.includes('duplicate-prospect')),
    },
    {
      id: 'values',
      label: 'Valeurs',
      description: 'Statuts, directions et priorités non reconnues.',
      severity: 'warning',
      issueCount: issueCount((item) =>
        ['invalid-', 'missing-direction'].some((code) => item.id.includes(code)),
      ),
    },
  ]
}

export function deriveCrmQualityReport(
  valuesByEntity: SheetValuesByEntity,
): CrmQualityReport {
  const rowsByEntity = (Object.keys(sheetDefinitions) as SheetEntity[]).reduce(
    (acc, entity) => {
      acc[entity] = createRawRows(entity, valuesByEntity[entity])
      return acc
    },
    {} as Record<SheetEntity, RawRow[]>,
  )
  const rows = Object.values(rowsByEntity).flat()
  const issues: CrmQualityIssue[] = []

  checkPrimaryIds(issues, rows)
  checkReferences(issues, rowsByEntity)
  checkDuplicates(issues, rowsByEntity)
  checkAllowedValues(issues, rowsByEntity)

  const summary = issues.reduce<CrmQualityReport['summary']>(
    (counts, item) => {
      counts[item.severity] += 1
      counts.total += 1
      return counts
    },
    { critical: 0, warning: 0, info: 0, total: 0 },
  )

  return {
    generatedAt: new Date().toISOString(),
    summary,
    checks: buildChecks(issues),
    issues: issues.toSorted((left, right) => {
      const severityRank: Record<CrmQualitySeverity, number> = {
        critical: 0,
        warning: 1,
        info: 2,
      }
      return (
        severityRank[left.severity] - severityRank[right.severity] ||
        left.entityLabel.localeCompare(right.entityLabel) ||
        (left.rowNumber ?? 0) - (right.rowNumber ?? 0)
      )
    }),
  }
}
