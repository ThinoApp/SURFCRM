import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'

import { prospectStatuses } from '../../data/domain/crmTypes'
import type { Prospect, ProspectStatus } from '../../data/domain/crmTypes'
import {
  useCrmSnapshot,
  useUpdateProspect,
} from '../../data/queries/useCrmSnapshot'
import { buildCrmIndexes } from '../../data/transforms/buildCrmIndexes'
import { PageHeader } from '../../shared/ui/PageHeader'

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-field">
      <span>{label}</span>
      <strong>{value || 'A renseigner'}</strong>
    </div>
  )
}

function LinkedList({
  title,
  items,
  renderItem,
}: {
  title: string
  items: unknown[]
  renderItem: (item: unknown) => ReactNode
}) {
  return (
    <section className="detail-panel">
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          <p>{items.length} element(s) lie(s)</p>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="detail-list">{items.map(renderItem)}</div>
      ) : (
        <p className="muted-text">Aucune donnee liee.</p>
      )}
    </section>
  )
}

function ProspectEditForm({ prospect }: { prospect: Prospect }) {
  const updateProspect = useUpdateProspect()
  const [status, setStatus] = useState<ProspectStatus>(prospect.status)
  const [nextAction, setNextAction] = useState(prospect.nextAction)
  const [nextActionDate, setNextActionDate] = useState(prospect.nextActionDate)

  return (
    <form
      className="detail-panel edit-form"
      onSubmit={(event) => {
        event.preventDefault()
        updateProspect.mutate({
          prospectId: prospect.id,
          input: {
            status,
            nextAction,
            nextActionDate,
          },
        })
      }}
    >
      <div className="panel-heading">
        <div>
          <h2>Pilotage</h2>
          <p>Statut et prochaine action du prospect.</p>
        </div>
        {updateProspect.isSuccess ? <span className="badge">Mis a jour</span> : null}
      </div>

      <label>
        Statut
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as ProspectStatus)}
        >
          {prospectStatuses.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      <label>
        Prochaine action
        <textarea
          value={nextAction}
          onChange={(event) => setNextAction(event.target.value)}
          rows={3}
        />
      </label>

      <label>
        Date prochaine action
        <input
          value={nextActionDate}
          onChange={(event) => setNextActionDate(event.target.value)}
          type="date"
        />
      </label>

      <button className="button" disabled={updateProspect.isPending} type="submit">
        Enregistrer
      </button>
    </form>
  )
}

export function ProspectDetailPage() {
  const { prospectId } = useParams()
  const snapshotQuery = useCrmSnapshot()
  const indexes = useMemo(
    () => (snapshotQuery.data ? buildCrmIndexes(snapshotQuery.data) : null),
    [snapshotQuery.data],
  )
  const prospect = prospectId ? indexes?.prospectById.get(prospectId) : null

  if (snapshotQuery.isLoading) {
    return (
      <main className="page-shell">
        <section className="table-state">Chargement de la fiche prospect...</section>
      </main>
    )
  }

  if (snapshotQuery.error) {
    return (
      <main className="page-shell">
        <section className="table-state table-state--error">
          {snapshotQuery.error.message}
        </section>
      </main>
    )
  }

  if (!prospect || !indexes) {
    return (
      <main className="page-shell">
        <Link className="table-link" to="/prospects">
          Retour aux prospects
        </Link>
        <section className="table-state">Prospect introuvable.</section>
      </main>
    )
  }

  const messages = indexes.messagesByProspectId.get(prospect.id) ?? []
  const relances = indexes.relancesByProspectId.get(prospect.id) ?? []
  const leadMagnets = indexes.leadMagnetsByProspectId.get(prospect.id) ?? []
  const apprentissages = indexes.apprentissagesByProspectId.get(prospect.id) ?? []

  return (
    <main className="page-shell">
      <Link className="table-link" to="/prospects">
        Retour aux prospects
      </Link>
      <PageHeader
        eyebrow={prospect.status}
        title={prospect.contact}
        description={`${prospect.organisation} - ${prospect.angle}`}
      />

      <section className="detail-grid">
        <section className="detail-panel detail-panel--wide">
          <div className="panel-heading">
            <div>
              <h2>Lecture rapide</h2>
              <p>Contexte commercial et angle SURF.</p>
            </div>
            <span className="badge">Score {prospect.score ?? '-'}/5</span>
          </div>
          <div className="detail-fields">
            <DetailField label="Organisation" value={prospect.organisation} />
            <DetailField label="Role" value={prospect.role} />
            <DetailField label="Type cible" value={prospect.commercialRole} />
            <DetailField label="Offre probable" value={prospect.likelyOffer} />
            <DetailField label="Prochaine action" value={prospect.nextAction} />
            <DetailField
              label="Date prochaine action"
              value={prospect.nextActionDate}
            />
          </div>
          <p className="detail-note">{prospect.visibleProblem}</p>
        </section>

        <ProspectEditForm
          key={`${prospect.id}-${prospect.status}-${prospect.nextAction}-${prospect.nextActionDate}`}
          prospect={prospect}
        />
      </section>

      <section className="detail-grid">
        <LinkedList
          items={messages}
          title="Messages"
          renderItem={(item) => {
            const message = item as (typeof messages)[number]
            return (
              <article className="detail-list-item" key={message.messageId}>
                <strong>{message.type}</strong>
                <span>
                  {message.date || 'Sans date'} - {message.direction} -{' '}
                  {message.state}
                </span>
                <p>{message.exactContent}</p>
              </article>
            )
          }}
        />
        <LinkedList
          items={relances}
          title="Relances"
          renderItem={(item) => {
            const relance = item as (typeof relances)[number]
            return (
              <article className="detail-list-item" key={relance.id}>
                <strong>{relance.action}</strong>
                <span>
                  {relance.date} - {relance.state}
                </span>
                <p>{relance.reference}</p>
              </article>
            )
          }}
        />
        <LinkedList
          items={leadMagnets}
          title="Lead magnets"
          renderItem={(item) => {
            const leadMagnet = item as (typeof leadMagnets)[number]
            return (
              <article className="detail-list-item" key={leadMagnet.id}>
                <strong>{leadMagnet.provisionalTitle}</strong>
                <span>
                  {leadMagnet.type} - {leadMagnet.contentStatus}
                </span>
                <p>{leadMagnet.angleOrUse}</p>
              </article>
            )
          }}
        />
        <LinkedList
          items={apprentissages}
          title="Apprentissages"
          renderItem={(item) => {
            const apprentissage = item as (typeof apprentissages)[number]
            return (
              <article className="detail-list-item" key={apprentissage.id}>
                <strong>{apprentissage.date}</strong>
                <span>{apprentissage.contentStatus}</span>
                <p>{apprentissage.fieldLearning}</p>
              </article>
            )
          }}
        />
      </section>
    </main>
  )
}
