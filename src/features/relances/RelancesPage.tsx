import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import type { Relance } from '../../data/domain/crmTypes'
import {
  useCrmSnapshot,
  useUpdateRelance,
} from '../../data/queries/useCrmSnapshot'
import { deriveDashboardMetrics } from '../../data/transforms/deriveDashboardMetrics'
import { PageHeader } from '../../shared/ui/PageHeader'
import { getTodayDateString } from '../../shared/utils/dateUtils'

function RelanceCard({ relance }: { relance: Relance }) {
  const updateRelance = useUpdateRelance()
  const [newDate, setNewDate] = useState(relance.date)
  const [note, setNote] = useState('')
  const canPostpone = newDate.trim() !== '' && note.trim() !== ''

  return (
    <article className="relance-card">
      <div className="relance-card__main">
        <div>
          <Link className="table-link" to={`/prospects/${relance.prospectId}`}>
            {relance.prospectName}
          </Link>
          <p>{relance.action}</p>
          <span>
            {relance.date} - {relance.state}
          </span>
        </div>
        <button
          className="button"
          disabled={updateRelance.isPending || relance.state === 'Fait'}
          type="button"
          onClick={() =>
            updateRelance.mutate({
              relanceId: relance.id,
              input: {
                state: 'Fait',
                reference: relance.reference
                  ? `${relance.reference} | Fait depuis le CRM`
                  : 'Fait depuis le CRM',
              },
            })
          }
        >
          Marquer fait
        </button>
      </div>

      <details className="postpone-box">
        <summary>Reporter</summary>
        <form
          onSubmit={(event) => {
            event.preventDefault()

            if (!canPostpone) {
              return
            }

            updateRelance.mutate({
              relanceId: relance.id,
              input: {
                date: newDate,
                state: 'A faire',
                reference: note,
              },
            })
            setNote('')
          }}
        >
          <label>
            Nouvelle date
            <input
              value={newDate}
              onChange={(event) => setNewDate(event.target.value)}
              type="date"
            />
          </label>
          <label>
            Note courte
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Pourquoi reporter ?"
            />
          </label>
          <button
            className="button button--secondary"
            disabled={!canPostpone || updateRelance.isPending}
            type="submit"
          >
            Confirmer le report
          </button>
        </form>
      </details>
    </article>
  )
}

function RelanceSection({
  title,
  description,
  relances,
}: {
  title: string
  description: string
  relances: Relance[]
}) {
  return (
    <section className="dashboard-panel relance-section">
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <span className="badge">{relances.length}</span>
      </div>

      {relances.length > 0 ? (
        <div className="relance-list">
          {relances.map((relance) => (
            <RelanceCard key={relance.id} relance={relance} />
          ))}
        </div>
      ) : (
        <p className="muted-text">Aucune relance dans cette section.</p>
      )}
    </section>
  )
}

export function RelancesPage() {
  const today = getTodayDateString()
  const snapshotQuery = useCrmSnapshot()
  const sections = useMemo(() => {
    if (!snapshotQuery.data) {
      return null
    }

    const metrics = deriveDashboardMetrics(snapshotQuery.data, today)
    const doneRelances = snapshotQuery.data.relances.filter(
      (relance) => relance.state === 'Fait',
    )

    return {
      dueToday: metrics.dueTodayRelances,
      overdue: metrics.overdueRelances,
      upcoming: metrics.upcomingRelances,
      done: doneRelances,
    }
  }, [snapshotQuery.data, today])

  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Suivi"
        title="Relances"
        description="Toutes les actions datees a traiter, reporter ou marquer comme faites."
      />

      {snapshotQuery.isLoading ? (
        <section className="table-state">Chargement des relances...</section>
      ) : snapshotQuery.error ? (
        <section className="table-state table-state--error">
          {snapshotQuery.error.message}
        </section>
      ) : sections ? (
        <section className="relance-grid">
          <RelanceSection
            description="A traiter avant de travailler les actions futures."
            relances={sections.overdue}
            title="En retard"
          />
          <RelanceSection
            description="Les actions qui doivent sortir aujourd'hui."
            relances={sections.dueToday}
            title="Aujourd'hui"
          />
          <RelanceSection
            description="Les prochaines relances deja planifiees."
            relances={sections.upcoming}
            title="A venir"
          />
          <RelanceSection
            description="Historique des actions traitees."
            relances={sections.done}
            title="Faites"
          />
        </section>
      ) : null}
    </main>
  )
}
