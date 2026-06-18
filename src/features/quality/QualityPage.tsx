import { useMemo, useState } from 'react'

import AlertTriangleIcon from 'lucide-react/dist/esm/icons/alert-triangle.mjs'
import CheckCircleIcon from 'lucide-react/dist/esm/icons/check-circle-2.mjs'
import InfoIcon from 'lucide-react/dist/esm/icons/info.mjs'
import ShieldCheckIcon from 'lucide-react/dist/esm/icons/shield-check.mjs'

import { useCrmQualityReport } from '../../data/queries/useCrmQualityReport'
import type {
  CrmQualityIssue,
  CrmQualitySeverity,
} from '../../data/transforms/deriveCrmQualityReport'
import { PageHeader } from '../../shared/ui/PageHeader'

const severityLabels: Record<CrmQualitySeverity | 'all', string> = {
  all: 'Toutes',
  critical: 'Critiques',
  warning: 'A surveiller',
  info: 'Infos',
}

const severityIcons = {
  critical: AlertTriangleIcon,
  warning: AlertTriangleIcon,
  info: InfoIcon,
} satisfies Record<CrmQualitySeverity, typeof AlertTriangleIcon>

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'critical' | 'warning' | 'info' | 'ok'
}) {
  return (
    <article className={`quality-summary-card quality-summary-card--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

function CheckRow({
  label,
  description,
  issueCount,
}: {
  label: string
  description: string
  issueCount: number
}) {
  const ok = issueCount === 0

  return (
    <article className="quality-check-row">
      <div className={ok ? 'quality-check-row__icon quality-check-row__icon--ok' : 'quality-check-row__icon'}>
        {ok ? (
          <CheckCircleIcon size={17} strokeWidth={2.2} />
        ) : (
          <AlertTriangleIcon size={17} strokeWidth={2.2} />
        )}
      </div>
      <div>
        <strong>{label}</strong>
        <span>{description}</span>
      </div>
      <span className={ok ? 'badge badge--soft' : 'badge badge--danger'}>
        {ok ? 'OK' : `${issueCount} souci${issueCount > 1 ? 's' : ''}`}
      </span>
    </article>
  )
}

function IssueCard({ issue }: { issue: CrmQualityIssue }) {
  const Icon = severityIcons[issue.severity]

  return (
    <article className={`quality-issue quality-issue--${issue.severity}`}>
      <div className="quality-issue__icon">
        <Icon size={17} strokeWidth={2.2} />
      </div>
      <div className="quality-issue__body">
        <div className="quality-issue__meta">
          <span className="badge">{severityLabels[issue.severity]}</span>
          <span>{issue.entityLabel}</span>
          {issue.rowNumber ? <span>Ligne {issue.rowNumber}</span> : null}
        </div>
        <h2>{issue.title}</h2>
        <p>{issue.detail}</p>
        <strong>{issue.fixHint}</strong>
      </div>
    </article>
  )
}

export function QualityPage() {
  const reportQuery = useCrmQualityReport()
  const [severityFilter, setSeverityFilter] = useState<CrmQualitySeverity | 'all'>('all')
  const [entityFilter, setEntityFilter] = useState('all')

  const report = reportQuery.data
  const entityOptions = useMemo(
    () =>
      report
        ? [...new Set(report.issues.map((issue) => issue.entityLabel))].toSorted()
        : [],
    [report],
  )
  const filteredIssues = useMemo(
    () =>
      report?.issues.filter((issue) => {
        const severityMatches =
          severityFilter === 'all' || issue.severity === severityFilter
        const entityMatches =
          entityFilter === 'all' || issue.entityLabel === entityFilter

        return severityMatches && entityMatches
      }) ?? [],
    [entityFilter, report?.issues, severityFilter],
  )

  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Contrôle"
        title="Qualité CRM"
        description="Détection des IDs manquants, références cassées, doublons et valeurs qui risquent de rendre le pipeline incohérent."
      />

      {reportQuery.isLoading ? (
        <section className="table-state">Analyse de la qualité CRM...</section>
      ) : reportQuery.error ? (
        <section className="table-state table-state--error">
          <strong>Impossible de contrôler le CRM</strong>
          <span>{reportQuery.error.message}</span>
        </section>
      ) : report ? (
        <>
          <section className="quality-summary-grid" aria-label="Synthese qualité CRM">
            <SummaryCard label="Critiques" tone="critical" value={report.summary.critical} />
            <SummaryCard label="A surveiller" tone="warning" value={report.summary.warning} />
            <SummaryCard label="Infos" tone="info" value={report.summary.info} />
            <SummaryCard
              label="Checks OK"
              tone="ok"
              value={report.checks.filter((check) => check.issueCount === 0).length}
            />
          </section>

          <section className="dashboard-panel">
            <div className="panel-heading">
              <div>
                <h2>Checks structurants</h2>
                <p>Les points qui garantissent que le CRM reste exploitable.</p>
              </div>
              <ShieldCheckIcon size={20} strokeWidth={2.1} />
            </div>
            <div className="quality-check-list">
              {report.checks.map((check) => (
                <CheckRow
                  key={check.id}
                  description={check.description}
                  issueCount={check.issueCount}
                  label={check.label}
                />
              ))}
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="panel-heading">
              <div>
                <h2>Anomalies détectées</h2>
                <p>
                  {report.summary.total === 0
                    ? 'Aucun problème structurel détecté.'
                    : `${filteredIssues.length} anomalie(s) affichée(s) sur ${report.summary.total}.`}
                </p>
              </div>
            </div>

            <div className="quality-toolbar">
              <label>
                Gravité
                <select
                  value={severityFilter}
                  onChange={(event) =>
                    setSeverityFilter(event.target.value as CrmQualitySeverity | 'all')
                  }
                >
                  {(Object.keys(severityLabels) as Array<CrmQualitySeverity | 'all'>).map(
                    (severity) => (
                      <option key={severity} value={severity}>
                        {severityLabels[severity]}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <label>
                Onglet
                <select
                  value={entityFilter}
                  onChange={(event) => setEntityFilter(event.target.value)}
                >
                  <option value="all">Tous</option>
                  {entityOptions.map((entity) => (
                    <option key={entity} value={entity}>
                      {entity}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {filteredIssues.length > 0 ? (
              <div className="quality-issue-list">
                {filteredIssues.map((issue) => (
                  <IssueCard issue={issue} key={issue.id} />
                ))}
              </div>
            ) : (
              <div className="quality-empty">
                <CheckCircleIcon size={26} strokeWidth={2.1} />
                <strong>Aucune anomalie dans cette vue.</strong>
                <span>Le filtre actuel ne retourne aucun problème.</span>
              </div>
            )}
          </section>
        </>
      ) : null}
    </main>
  )
}

export default QualityPage
