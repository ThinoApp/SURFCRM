import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import CheckIcon from 'lucide-react/dist/esm/icons/check-circle-2.mjs'

import { contentStatuses } from '../../data/domain/crmTypes'
import type { ContentStatus } from '../../data/domain/crmTypes'
import {
  useCrmSnapshot,
  useMarkApprentissageUsage,
  useMarkLeadMagnetUsage,
} from '../../data/queries/useCrmSnapshot'
import { buildCrmIndexes } from '../../data/transforms/buildCrmIndexes'
import { PageHeader } from '../../shared/ui/PageHeader'
import { getTodayDateString } from '../../shared/utils/dateUtils'

type InsightTab = 'apprentissages' | 'leadMagnets'
type UsageFilter = 'all' | 'unused' | 'used'
type StatusFilter = ContentStatus | 'all'

type InsightRow = {
  id: string
  tab: InsightTab
  date: string
  title: string
  body: string
  type: string
  sourceProspectId: string
  sourceName: string
  usedInPost: boolean
  postUseDate: string
  postTitle: string
  postArchive: string
  postFormat: string
  contentStatus: ContentStatus
}

const tabLabels: Record<InsightTab, string> = {
  apprentissages: 'Apprentissages',
  leadMagnets: 'Lead magnets',
}

function getUsageLabel(usedInPost: boolean) {
  return usedInPost ? 'Deja utilise' : 'A exploiter'
}

function UseContentForm({ row }: { row: InsightRow }) {
  const markLeadMagnet = useMarkLeadMagnetUsage()
  const markApprentissage = useMarkApprentissageUsage()
  const [postUseDate, setPostUseDate] = useState(() =>
    row.postUseDate || getTodayDateString(),
  )
  const [postTitle, setPostTitle] = useState(() => row.postTitle || row.title)
  const [postArchive, setPostArchive] = useState(() => row.postArchive)
  const [postFormat, setPostFormat] = useState(
    () => row.postFormat || 'LinkedIn post',
  )
  const [contentStatus, setContentStatus] = useState<ContentStatus>(
    () => (row.contentStatus === 'a utiliser' ? 'draft' : row.contentStatus),
  )
  const isPending = markLeadMagnet.isPending || markApprentissage.isPending

  return (
    <form
      className="insight-use-form"
      onSubmit={(event) => {
        event.preventDefault()

        const input = {
          usedInPost: true,
          postUseDate,
          postTitle,
          postArchive,
          postFormat,
          contentStatus,
        }

        if (row.tab === 'leadMagnets') {
          markLeadMagnet.mutate({ leadMagnetId: row.id, input })
          return
        }

        markApprentissage.mutate({ apprentissageId: row.id, input })
      }}
    >
      <label>
        Titre du post
        <input
          required
          value={postTitle}
          onChange={(event) => setPostTitle(event.target.value)}
        />
      </label>
      <label>
        Date usage
        <input
          required
          type="date"
          value={postUseDate}
          onChange={(event) => setPostUseDate(event.target.value)}
        />
      </label>
      <label>
        Format
        <input
          required
          value={postFormat}
          onChange={(event) => setPostFormat(event.target.value)}
        />
      </label>
      <label>
        Archive
        <input
          value={postArchive}
          onChange={(event) => setPostArchive(event.target.value)}
          placeholder="Lien Drive ou reference interne"
        />
      </label>
      <label>
        Statut
        <select
          value={contentStatus}
          onChange={(event) => setContentStatus(event.target.value as ContentStatus)}
        >
          {contentStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
      <button
        className="button"
        disabled={isPending || !postTitle.trim()}
        type="submit"
      >
        <CheckIcon aria-hidden="true" size={16} strokeWidth={2.2} />
        Marquer utilise
      </button>
    </form>
  )
}

function InsightCard({ row }: { row: InsightRow }) {
  return (
    <article className="insight-card">
      <div className="insight-card__main">
        <div className="insight-card__meta">
          <span className="badge">{row.type}</span>
          <span className="badge">{row.contentStatus}</span>
          <span className="badge">{getUsageLabel(row.usedInPost)}</span>
        </div>
        <h2>{row.title}</h2>
        <p>{row.body}</p>
        <div className="insight-card__source">
          <span>{row.date || 'Sans date'}</span>
          <Link className="table-link" to={`/prospects/${row.sourceProspectId}`}>
            {row.sourceName}
          </Link>
        </div>
        {row.usedInPost ? (
          <div className="insight-usage-note">
            <strong>{row.postTitle || 'Post reference'}</strong>
            <span>
              {row.postUseDate || 'Sans date'} - {row.postFormat || 'Format libre'}
            </span>
            {row.postArchive ? <span>{row.postArchive}</span> : null}
          </div>
        ) : null}
      </div>
      <UseContentForm row={row} />
    </article>
  )
}

export function InsightsPage() {
  const snapshotQuery = useCrmSnapshot()
  const [activeTab, setActiveTab] = useState<InsightTab>('apprentissages')
  const [usageFilter, setUsageFilter] = useState<UsageFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const rows = useMemo<InsightRow[]>(() => {
    if (!snapshotQuery.data) {
      return []
    }

    const indexes = buildCrmIndexes(snapshotQuery.data)

    const leadMagnetRows = snapshotQuery.data.leadMagnets.map((item) => ({
      id: item.id,
      tab: 'leadMagnets' as const,
      date: item.date,
      title: item.provisionalTitle,
      body: item.angleOrUse,
      type: item.type || 'Lead magnet',
      sourceProspectId: item.sourceProspectId,
      sourceName:
        indexes.prospectById.get(item.sourceProspectId)?.contact ||
        item.sourceProspect ||
        'Source a renseigner',
      usedInPost: item.usedInPost,
      postUseDate: item.postUseDate,
      postTitle: item.postTitle,
      postArchive: item.postArchive,
      postFormat: item.postFormat,
      contentStatus: item.contentStatus,
    }))

    const apprentissageRows = snapshotQuery.data.apprentissages.map((item) => ({
      id: item.id,
      tab: 'apprentissages' as const,
      date: item.date,
      title: item.fieldLearning,
      body: item.linkedInUse,
      type: 'Apprentissage terrain',
      sourceProspectId: item.sourceProspectId,
      sourceName:
        indexes.prospectById.get(item.sourceProspectId)?.contact ||
        'Source a renseigner',
      usedInPost: item.usedInPost,
      postUseDate: item.postUseDate,
      postTitle: item.postTitle,
      postArchive: item.postArchive,
      postFormat: item.postFormat,
      contentStatus: item.contentStatus,
    }))

    return [...apprentissageRows, ...leadMagnetRows]
  }, [snapshotQuery.data])

  const activeRows = useMemo(
    () => rows.filter((row) => row.tab === activeTab),
    [activeTab, rows],
  )
  const typeOptions = useMemo(
    () => [...new Set(activeRows.map((row) => row.type))].toSorted(),
    [activeRows],
  )
  const filteredRows = useMemo(
    () =>
      activeRows.filter((row) => {
        const usageMatches =
          usageFilter === 'all' ||
          (usageFilter === 'used' && row.usedInPost) ||
          (usageFilter === 'unused' && !row.usedInPost)
        const statusMatches =
          statusFilter === 'all' || row.contentStatus === statusFilter
        const typeMatches = typeFilter === 'all' || row.type === typeFilter

        return usageMatches && statusMatches && typeMatches
      }),
    [activeRows, statusFilter, typeFilter, usageFilter],
  )
  const unusedCount = useMemo(
    () => activeRows.filter((row) => !row.usedInPost).length,
    [activeRows],
  )
  const usedCount = activeRows.length - unusedCount

  if (snapshotQuery.isLoading) {
    return (
      <main className="page-shell">
        <section className="table-state">Chargement des insights...</section>
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

  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Apprentissage"
        title="Insights et lead magnets"
        description="Memoire terrain issue des conversations, posts potentiels et ressources a exploiter."
      />

      <section className="insight-toolbar" aria-label="Pilotage insights">
        <div className="segmented-control" role="tablist" aria-label="Type de contenu">
          {(Object.keys(tabLabels) as InsightTab[]).map((tab) => (
            <button
              aria-selected={activeTab === tab}
              className={
                activeTab === tab
                  ? 'segmented-control__item segmented-control__item--active'
                  : 'segmented-control__item'
              }
              key={tab}
              role="tab"
              type="button"
              onClick={() => {
                setActiveTab(tab)
                setTypeFilter('all')
              }}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>

        <div className="insight-filters">
          <label>
            Usage
            <select
              value={usageFilter}
              onChange={(event) => setUsageFilter(event.target.value as UsageFilter)}
            >
              <option value="all">Tous</option>
              <option value="unused">A exploiter</option>
              <option value="used">Deja utilises</option>
            </select>
          </label>
          <label>
            Statut
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            >
              <option value="all">Tous</option>
              {contentStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label>
            Type
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
            >
              <option value="all">Tous</option>
              {typeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="insight-stats" aria-label="Synthese contenu">
          <span>{activeRows.length} total</span>
          <span>{unusedCount} a exploiter</span>
          <span>{usedCount} deja utilises</span>
        </div>
      </section>

      {filteredRows.length > 0 ? (
        <section className="insight-list" aria-label={tabLabels[activeTab]}>
          {filteredRows.map((row) => (
            <InsightCard key={`${row.tab}-${row.id}`} row={row} />
          ))}
        </section>
      ) : (
        <section className="table-state">
          Aucun element ne correspond aux filtres actuels.
        </section>
      )}
    </main>
  )
}
