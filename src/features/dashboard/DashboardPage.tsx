import { lazy, Suspense, useMemo } from 'react'
import {
  Waves,
  AlertTriangle,
  Clock,
  MessageCircle,
  Mail,
  Lightbulb,
  Target,
  TrendingUp,
  ExternalLink,
  BookOpen,
  Magnet,
} from 'lucide-react'

import { useCrmSnapshot } from '../../data/queries/useCrmSnapshot'
import { deriveDashboardMetrics } from '../../data/transforms/deriveDashboardMetrics'
import type { DashboardMetrics } from '../../data/transforms/deriveDashboardMetrics'
import { PageHeader } from '../../shared/ui/PageHeader'
import { getTodayDateString } from '../../shared/utils/dateUtils'

const DashboardCharts = lazy(() =>
  import('./DashboardCharts').then((module) => ({
    default: module.DashboardCharts,
  })),
)

/* ─── KPI Card ─────────────────────────────────────────────── */
function KpiCard({
  label,
  value,
  tone,
  icon: Icon,
  sublabel,
}: {
  label: string
  value: number
  tone: 'blue' | 'green' | 'amber' | 'red' | 'cyan'
  icon: React.ElementType
  sublabel?: string
}) {
  return (
    <article className={`kpi-card kpi-card--${tone}`}>
      <div className="kpi-card__top">
        <span className="kpi-card__label">{label}</span>
        <div className="kpi-card__icon-wrap">
          <Icon size={16} strokeWidth={2.1} />
        </div>
      </div>
      <strong className="kpi-card__value">{value}</strong>
      {sublabel && <span className="kpi-card__sub">{sublabel}</span>}
    </article>
  )
}

/* ─── Action List ───────────────────────────────────────────── */
function ActionList({ metrics }: { metrics: DashboardMetrics }) {
  const today = getTodayDateString()

  const overdueItems = metrics.overdueRelances.map((r) => ({ ...r, urgency: 'overdue' as const }))
  const todayItems = metrics.dueTodayRelances.map((r) => ({ ...r, urgency: 'today' as const }))
  const upcomingItems = metrics.upcomingRelances
    .slice(0, 3)
    .map((r) => ({ ...r, urgency: 'upcoming' as const }))

  const allItems = [...overdueItems, ...todayItems, ...upcomingItems]
  const total = allItems.length

  return (
    <section className="dashboard-panel dashboard-panel--wide">
      <div className="panel-heading">
        <div>
          <h2>Priorité de suivi</h2>
          <p>Relances en retard, du jour, puis les prochaines actions.</p>
        </div>
        <span className={`badge ${metrics.overdueRelances.length > 0 ? 'badge--danger' : ''}`}>
          {total} action{total > 1 ? 's' : ''}
        </span>
      </div>

      <div className="action-list">
        {allItems.length === 0 ? (
          <p className="muted-text" style={{ fontSize: '0.9rem', padding: '8px 0' }}>
            ✓ Aucune relance urgente — bonne journée !
          </p>
        ) : (
          allItems.map((relance) => (
            <article
              className={`action-row action-row--${relance.urgency}`}
              key={relance.id}
            >
              <div className="action-row__indicator" aria-hidden="true" />
              <div className="action-row__body">
                <strong>{relance.prospectName}</strong>
                <span>{relance.action}</span>
              </div>
              <time
                className={relance.date < today ? 'action-row__date--overdue' : ''}
                dateTime={relance.date}
              >
                {relance.date}
              </time>
            </article>
          ))
        )}
      </div>
    </section>
  )
}

/* ─── Outbound Panel ────────────────────────────────────────── */
function OutboundPanel({ metrics }: { metrics: DashboardMetrics }) {
  const target = metrics.nextOutboundTarget

  return (
    <section className="dashboard-panel">
      <div className="panel-heading">
        <div>
          <h2>Prochaine cible outbound</h2>
          <p>Première cible non migrée et non dupliquée.</p>
        </div>
        <Target size={18} strokeWidth={2} style={{ color: 'var(--surf-blue)', opacity: 0.7, flexShrink: 0, marginTop: 2 }} />
      </div>

      {target ? (
        <div className="focus-block">
          <div className="focus-block__header">
            {target.linkedinUrl ? (
              <a
                className="focus-block__name table-link"
                href={target.linkedinUrl}
                rel="noreferrer"
                target="_blank"
                title="Ouvrir le profil LinkedIn"
              >
                {target.name}
                <ExternalLink size={12} style={{ opacity: 0.6 }} />
              </a>
            ) : (
              <strong className="focus-block__name">{target.name}</strong>
            )}
            <span className={`badge badge--priority-${target.priority?.toLowerCase()}`}>
              Priorité {target.priority}
            </span>
          </div>
          <span className="focus-block__company">{target.company}</span>
          {target.selectionReason && (
            <p className="focus-block__reason">{target.selectionReason}</p>
          )}
          {target.preliminaryAngle && (
            <p className="focus-block__angle muted-text">{target.preliminaryAngle}</p>
          )}
        </div>
      ) : (
        <p className="muted-text" style={{ fontSize: '0.9rem' }}>
          Aucune cible outbound éligible.
        </p>
      )}
    </section>
  )
}

/* ─── Content Panel ─────────────────────────────────────────── */
function ContentPanel({ metrics }: { metrics: DashboardMetrics }) {
  const apprentissages = metrics.unusedApprentissages.length
  const leadMagnets = metrics.unusedLeadMagnets.length

  return (
    <section className="dashboard-panel">
      <div className="panel-heading">
        <div>
          <h2>Contenus exploitables</h2>
          <p>Apprentissages et lead magnets non encore publiés.</p>
        </div>
        <Lightbulb size={18} strokeWidth={2} style={{ color: 'var(--surf-cyan)', opacity: 0.7, flexShrink: 0, marginTop: 2 }} />
      </div>

      <div className="content-signal-grid">
        <div className="content-signal-card content-signal-card--cyan">
          <div className="content-signal-card__icon">
            <BookOpen size={16} strokeWidth={2} />
          </div>
          <strong>{apprentissages}</strong>
          <span>apprentissage{apprentissages !== 1 ? 's' : ''}</span>
        </div>
        <div className="content-signal-card content-signal-card--blue">
          <div className="content-signal-card__icon">
            <Magnet size={16} strokeWidth={2} />
          </div>
          <strong>{leadMagnets}</strong>
          <span>lead magnet{leadMagnets !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {apprentissages + leadMagnets > 0 && (
        <p className="content-signal-hint">
          <TrendingUp size={13} strokeWidth={2} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle', color: 'var(--surf-green)' }} />
          {apprentissages + leadMagnets} contenu{apprentissages + leadMagnets > 1 ? 's' : ''} prêt{apprentissages + leadMagnets > 1 ? 's' : ''} à transformer en post LinkedIn
        </p>
      )}
    </section>
  )
}

/* ─── Page ──────────────────────────────────────────────────── */
export function DashboardPage() {
  const today = getTodayDateString()
  const snapshotQuery = useCrmSnapshot()
  const metrics = useMemo(() => {
    if (!snapshotQuery.data) return null
    return deriveDashboardMetrics(snapshotQuery.data, today)
  }, [snapshotQuery.data, today])

  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Cockpit"
        title="Actions du jour"
        description="Le résumé opérationnel des relances, conversations, cibles outbound et contenus exploitables."
      />

      {snapshotQuery.isLoading ? (
        <section className="table-state">
          <Waves size={32} strokeWidth={1.5} style={{ opacity: 0.3, margin: '0 auto' }} />
          <span>Chargement du cockpit SURF…</span>
        </section>
      ) : snapshotQuery.error ? (
        <section className="table-state table-state--error">
          <strong>Impossible de charger le CRM</strong>
          <span>{snapshotQuery.error.message}</span>
        </section>
      ) : metrics ? (
        <>
          <section className="kpi-grid" aria-label="Indicateurs du jour">
            <KpiCard
              label="Relances aujourd'hui"
              value={metrics.dueTodayRelances.length}
              tone="amber"
              icon={Clock}
              sublabel="à traiter"
            />
            <KpiCard
              label="En retard"
              value={metrics.overdueRelances.length}
              tone="red"
              icon={AlertTriangle}
              sublabel={metrics.overdueRelances.length > 0 ? 'urgent' : 'aucune'}
            />
            <KpiCard
              label="Conversations"
              value={metrics.activeConversations.length}
              tone="green"
              icon={MessageCircle}
              sublabel="actives"
            />
            <KpiCard
              label="Sans réponse"
              value={metrics.contactedWithoutReply.length}
              tone="blue"
              icon={Mail}
              sublabel="à relancer"
            />
            <KpiCard
              label="Contenus à exploiter"
              value={metrics.unusedApprentissages.length + metrics.unusedLeadMagnets.length}
              tone="cyan"
              icon={Lightbulb}
              sublabel="non publiés"
            />
          </section>

          <section className="dashboard-grid">
            <ActionList metrics={metrics} />
            <OutboundPanel metrics={metrics} />
            <ContentPanel metrics={metrics} />
          </section>

          <Suspense
            fallback={
              <section className="table-state">Chargement des graphiques…</section>
            }
          >
            <DashboardCharts metrics={metrics} />
          </Suspense>
        </>
      ) : null}
    </main>
  )
}
