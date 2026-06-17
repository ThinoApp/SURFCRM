import type { ColumnDef } from '@tanstack/react-table'
import { Link } from 'react-router-dom'
import { useMemo } from 'react'

import { useCrmSnapshot } from '../../data/queries/useCrmSnapshot'
import type { Prospect } from '../../data/domain/crmTypes'
import { DataTable } from '../../shared/components/DataTable'
import { PageHeader } from '../../shared/ui/PageHeader'

type ProspectRow = Prospect & {
  priority: 'A' | 'B' | 'C'
}

function getProspectPriority(prospect: Prospect): ProspectRow['priority'] {
  if ((prospect.score ?? 0) >= 5) {
    return 'A'
  }

  if ((prospect.score ?? 0) >= 4) {
    return 'B'
  }

  return 'C'
}

function StatusBadge({ status }: { status: string }) {
  return <span className="badge">{status}</span>
}

const prospectColumns: ColumnDef<ProspectRow>[] = [
  {
    accessorKey: 'priority',
    header: 'Priorite',
    cell: (info) => <span className="badge">P{String(info.getValue())}</span>,
  },
  {
    accessorKey: 'contact',
    header: 'Prospect',
    cell: ({ row }) => (
      <Link className="table-link" to={`/prospects/${row.original.id}`}>
        {row.original.contact}
      </Link>
    ),
  },
  {
    accessorKey: 'organisation',
    header: 'Organisation',
  },
  {
    accessorKey: 'status',
    header: 'Statut',
    cell: (info) => <StatusBadge status={String(info.getValue())} />,
  },
  {
    accessorKey: 'commercialRole',
    header: 'Type cible',
  },
  {
    accessorKey: 'angle',
    header: 'Angle',
    cell: (info) => <span className="cell-text-long">{String(info.getValue())}</span>,
  },
  {
    accessorKey: 'nextAction',
    header: 'Prochaine action',
    cell: (info) => <span className="cell-text-long">{String(info.getValue())}</span>,
  },
  {
    accessorKey: 'nextActionDate',
    header: 'Date action',
  },
  {
    accessorKey: 'likelyOffer',
    header: 'Offre probable',
  },
]

export function ProspectsPage() {
  const snapshotQuery = useCrmSnapshot()
  const prospects = useMemo<ProspectRow[]>(
    () =>
      snapshotQuery.data?.prospects.map((prospect) => ({
        ...prospect,
        priority: getProspectPriority(prospect),
      })) ?? [],
    [snapshotQuery.data],
  )

  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Pipeline"
        title="Prospects"
        description="Liste active des prospects SURF, avec statut, angle, prochaine action et historique."
      />
      <DataTable
        columns={prospectColumns}
        data={prospects}
        emptyTitle="Aucun prospect"
        emptyDescription="Aucun prospect ne correspond aux filtres actuels."
        error={snapshotQuery.error}
        getRowId={(row) => row.id}
        isLoading={snapshotQuery.isLoading}
        searchPlaceholder="Rechercher prospect, organisation, statut..."
      />
    </main>
  )
}
