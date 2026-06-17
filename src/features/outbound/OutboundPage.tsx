import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import type { OutboundTarget } from '../../data/domain/crmTypes'
import {
  useCrmSnapshot,
  useUpdateOutboundTarget,
} from '../../data/queries/useCrmSnapshot'
import { selectNextOutboundTarget } from '../../data/transforms/selectNextOutboundTarget'
import { DataTable } from '../../shared/components/DataTable'
import { PageHeader } from '../../shared/ui/PageHeader'
import { getTodayDateString } from '../../shared/utils/dateUtils'

type OutboundRow = OutboundTarget & {
  isNextTarget: boolean
}

function OutboundActions({ target }: { target: OutboundTarget }) {
  const updateOutbound = useUpdateOutboundTarget()
  const [pipelineId, setPipelineId] = useState(target.pipelineId)
  const [notes, setNotes] = useState(target.notes)
  const migrated = target.migratedToPipeline || target.poolStatus === 'migrated'

  return (
    <div className="outbound-actions">
      <button
        className="button button--secondary"
        disabled={updateOutbound.isPending || migrated}
        type="button"
        onClick={() =>
          updateOutbound.mutate({
            poolId: target.poolId,
            input: {
              poolStatus: 'analyzed',
              lastAction: `Analyse marquee dans le CRM le ${getTodayDateString()}`,
            },
          })
        }
      >
        Marquer analysee
      </button>

      <details className="postpone-box">
        <summary>Migrer</summary>
        <form
          onSubmit={(event) => {
            event.preventDefault()

            if (!pipelineId.trim()) {
              return
            }

            updateOutbound.mutate({
              poolId: target.poolId,
              input: {
                poolStatus: 'migrated',
                migratedToPipeline: true,
                pipelineId,
                notes,
                lastAction: `Migre vers Prospects le ${getTodayDateString()}`,
              },
            })
          }}
        >
          <label>
            Pipeline ID
            <input
              value={pipelineId}
              onChange={(event) => setPipelineId(event.target.value)}
              placeholder="P025"
            />
          </label>
          <label>
            Notes
            <input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Message envoye, analyse faite..."
            />
          </label>
          <button
            className="button button--secondary"
            disabled={!pipelineId.trim() || updateOutbound.isPending || migrated}
            type="submit"
          >
            Confirmer migration
          </button>
        </form>
      </details>
    </div>
  )
}

const outboundColumns: ColumnDef<OutboundRow>[] = [
  {
    accessorKey: 'isNextTarget',
    header: 'Focus',
    cell: (info) =>
      info.getValue() ? <span className="badge">Prochaine</span> : null,
    enableColumnFilter: false,
  },
  {
    accessorKey: 'priority',
    header: 'Priorite',
    cell: (info) => <span className="badge">Prio {String(info.getValue())}</span>,
  },
  {
    accessorKey: 'preliminaryScore',
    header: 'Score',
  },
  {
    accessorKey: 'name',
    header: 'Nom',
    cell: ({ row }) => (
      <a
        className="table-link"
        href={row.original.linkedinUrl}
        rel="noreferrer"
        target="_blank"
      >
        {row.original.name}
      </a>
    ),
  },
  {
    accessorKey: 'company',
    header: 'Organisation',
  },
  {
    accessorKey: 'targetType',
    header: 'Type cible',
  },
  {
    accessorKey: 'poolStatus',
    header: 'Statut pool',
    cell: (info) => <span className="badge">{String(info.getValue())}</span>,
  },
  {
    accessorKey: 'preliminaryAngle',
    header: 'Angle',
    cell: (info) => <span className="cell-text-long">{String(info.getValue())}</span>,
  },
  {
    accessorKey: 'selectionReason',
    header: 'Raison selection',
    cell: (info) => <span className="cell-text-long">{String(info.getValue())}</span>,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <OutboundActions target={row.original} />,
    enableColumnFilter: false,
    enableSorting: false,
  },
]

export function OutboundPage() {
  const snapshotQuery = useCrmSnapshot()
  const [focusedPoolId, setFocusedPoolId] = useState<string | null>(null)
  const nextTarget = useMemo(
    () => (snapshotQuery.data ? selectNextOutboundTarget(snapshotQuery.data) : null),
    [snapshotQuery.data],
  )
  const rows = useMemo<OutboundRow[]>(
    () =>
      snapshotQuery.data?.outboundTargets.map((target) => ({
        ...target,
        isNextTarget:
          target.poolId === (focusedPoolId ?? nextTarget?.poolId ?? null),
      })) ?? [],
    [focusedPoolId, nextTarget?.poolId, snapshotQuery.data],
  )

  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Acquisition"
        title="Outbound pool"
        description="Reserve de cibles issues des followers LinkedIn, triee par priorite et potentiel SURF."
      />

      <section className="dashboard-panel">
        <div className="panel-heading">
          <div>
            <h2>Prochaine cible a analyser</h2>
            <p>
              Exclut les cibles migrees et les doublons deja presents dans le
              pipeline.
            </p>
          </div>
          <button
            className="button"
            disabled={!nextTarget}
            type="button"
            onClick={() => setFocusedPoolId(nextTarget?.poolId ?? null)}
          >
            Cibler la prochaine
          </button>
        </div>

        {nextTarget ? (
          <div className="focus-block">
            <div className="focus-block__header">
              {nextTarget.linkedinUrl ? (
                <a
                  className="focus-block__name table-link"
                  href={nextTarget.linkedinUrl}
                  rel="noreferrer"
                  target="_blank"
                  title="Ouvrir le profil LinkedIn"
                >
                  {nextTarget.name}
                  <svg
                    aria-hidden="true"
                    fill="currentColor"
                    height="14"
                    viewBox="0 0 24 24"
                    width="14"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ marginLeft: '6px', opacity: 0.7, verticalAlign: 'middle' }}
                  >
                    <path d="M14 3h7v7h-2V6.41l-9.3 9.3-1.41-1.41L17.59 5H14V3zM5 5h7V3H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7H5V5z" />
                  </svg>
                </a>
              ) : (
                <strong className="focus-block__name">{nextTarget.name}</strong>
              )}
              <span className="badge">Priorité {nextTarget.priority}</span>
            </div>
            <span className="focus-block__company">{nextTarget.company}</span>
            <p className="focus-block__reason">{nextTarget.selectionReason}</p>
            {nextTarget.preliminaryAngle && (
              <p className="focus-block__angle muted-text">{nextTarget.preliminaryAngle}</p>
            )}
          </div>
        ) : (
          <p className="muted-text">Aucune cible outbound eligible.</p>
        )}
      </section>

      <DataTable
        columns={outboundColumns}
        data={rows}
        emptyTitle="Aucune cible outbound"
        emptyDescription="Le pool ne contient aucune cible correspondant aux filtres."
        error={snapshotQuery.error}
        getRowId={(row) => row.poolId}
        isLoading={snapshotQuery.isLoading}
        searchPlaceholder="Rechercher nom, organisation, type, statut..."
      />
    </main>
  )
}
