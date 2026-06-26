import type { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'

import { useRawSheet } from '../../data/queries/useRawSheet'
import type { RawSheetKey } from '../../data/sheetGateway/sheetGateway'
import { DataTable } from '../../shared/components/DataTable'
import { PageHeader } from '../../shared/ui/PageHeader'

type RawSheetRow = {
  __rowId: string
  __rowNumber: number
} & Record<string, string | number>

type RawSheetPageConfig = {
  eyebrow: string
  title: string
  description: string
  searchPlaceholder: string
}

const rawSheetPageConfig: Record<RawSheetKey, RawSheetPageConfig> = {
  questionnaire: {
    eyebrow: 'Google Sheets',
    title: 'Questionnaire',
    description:
      'Lecture directe des reponses au questionnaire LinkedIn Mission Control.',
    searchPlaceholder: 'Rechercher nom, besoin, objectif, profil...',
  },
  waitlist: {
    eyebrow: 'Google Sheets',
    title: 'Waitlist',
    description:
      'Liste des personnes inscrites pour tester ou suivre la beta Mission Control.',
    searchPlaceholder: 'Rechercher nom, contact, role, mission...',
  },
  feedback: {
    eyebrow: 'Google Sheets',
    title: 'Feedback',
    description:
      'Retours beta, scores, blocages et signaux qualitatifs remontes depuis le portfolio.',
    searchPlaceholder: 'Rechercher testeur, mission, score, blocage...',
  },
}

function normalizeHeader(value: string, index: number) {
  const label = value.trim() || `Colonne ${index + 1}`

  return label.replace(/\s+/g, ' ')
}

function makeAccessor(label: string, index: number) {
  return `col_${index}_${label
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'value'}`
}

function buildUniqueHeaders(headerRow: string[]) {
  const counts = new Map<string, number>()

  return headerRow.map((header, index) => {
    const label = normalizeHeader(header, index)
    const count = counts.get(label) ?? 0
    counts.set(label, count + 1)

    return {
      label: count === 0 ? label : `${label} (${count + 1})`,
      accessor: makeAccessor(label, index),
      sourceIndex: index,
    }
  })
}

function hasValue(row: string[]) {
  return row.some((cell) => String(cell ?? '').trim().length > 0)
}

function getPreviewValue(row: RawSheetRow, columns: ReturnType<typeof buildUniqueHeaders>) {
  const firstTextColumn = columns.find((column) => {
    const value = row[column.accessor]
    return typeof value === 'string' && value.trim().length > 0
  })

  if (!firstTextColumn) {
    return `Ligne ${row.__rowNumber}`
  }

  return String(row[firstTextColumn.accessor])
}

function useRawSheetTable(values: string[][] = []) {
  return useMemo(() => {
    const [headerRow = [], ...dataRows] = values
    const maxColumns = Math.max(
      headerRow.length,
      ...dataRows.map((row) => row.length),
      1,
    )
    const normalizedHeaderRow = Array.from({ length: maxColumns }, (_, index) =>
      String(headerRow[index] ?? ''),
    )
    const headers = buildUniqueHeaders(normalizedHeaderRow)
    const rows = dataRows.filter(hasValue).map((row, rowIndex) => {
      const record: RawSheetRow = {
        __rowId: `row-${rowIndex + 1}`,
        __rowNumber: rowIndex + 2,
      }

      for (const header of headers) {
        record[header.accessor] = String(row[header.sourceIndex] ?? '').trim()
      }

      return record
    })

    const columns: ColumnDef<RawSheetRow>[] = [
      {
        accessorKey: '__rowNumber',
        header: 'Ligne',
        cell: (info) => <span className="badge">#{String(info.getValue())}</span>,
      },
      ...headers.map<ColumnDef<RawSheetRow>>((header, index) => ({
        accessorKey: header.accessor,
        header: header.label,
        cell: (info) => (
          <span className={index > 1 ? 'cell-text-long' : undefined}>
            {String(info.getValue() ?? '') || '-'}
          </span>
        ),
      })),
    ]

    return { columns, headers, rows }
  }, [values])
}

function RawSheetPage({ sheetKey }: { sheetKey: RawSheetKey }) {
  const config = rawSheetPageConfig[sheetKey]
  const query = useRawSheet(sheetKey)
  const values = query.data?.values ?? []
  const { columns, headers, rows } = useRawSheetTable(values)
  const latestRow = rows[0]

  return (
    <main className="page-shell">
      <PageHeader
        eyebrow={config.eyebrow}
        title={config.title}
        description={config.description}
      />

      <section className="raw-sheet-summary" aria-label="Resume de l'onglet">
        <article>
          <span>Onglet source</span>
          <strong>{query.data?.tabName ?? config.title}</strong>
        </article>
        <article>
          <span>Lignes remplies</span>
          <strong>{rows.length}</strong>
        </article>
        <article>
          <span>Colonnes detectees</span>
          <strong>{headers.length}</strong>
        </article>
        <article>
          <span>Derniere entree</span>
          <strong>{latestRow ? getPreviewValue(latestRow, headers) : '-'}</strong>
        </article>
      </section>

      <DataTable
        columns={columns}
        data={rows}
        emptyTitle={`Aucune donnee dans ${config.title}`}
        emptyDescription="Le Sheet est accessible, mais aucune ligne remplie n'a ete trouvee."
        error={query.error}
        getRowId={(row) => row.__rowId}
        isLoading={query.isLoading}
        searchPlaceholder={config.searchPlaceholder}
      />
    </main>
  )
}

export function QuestionnaireSheetPage() {
  return <RawSheetPage sheetKey="questionnaire" />
}

export function WaitlistSheetPage() {
  return <RawSheetPage sheetKey="waitlist" />
}

export function FeedbackSheetPage() {
  return <RawSheetPage sheetKey="feedback" />
}
