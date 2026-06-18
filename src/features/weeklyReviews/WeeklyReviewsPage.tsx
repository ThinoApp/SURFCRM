import { useMemo, useState } from 'react'

import AlertTriangleIcon from 'lucide-react/dist/esm/icons/alert-triangle.mjs'
import CalendarDaysIcon from 'lucide-react/dist/esm/icons/calendar-days.mjs'
import CheckCircleIcon from 'lucide-react/dist/esm/icons/check-circle-2.mjs'
import ClipboardListIcon from 'lucide-react/dist/esm/icons/clipboard-list.mjs'
import ListChecksIcon from 'lucide-react/dist/esm/icons/list-checks.mjs'

import type { WeeklyReview } from '../../data/domain/crmTypes'
import { useCrmSnapshot } from '../../data/queries/useCrmSnapshot'
import { PageHeader } from '../../shared/ui/PageHeader'

type StatusFilter = 'all' | 'generated' | 'attention'

function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[-*•]\s*/, ''))
    .filter(Boolean)
}

function getStatusTone(status: string) {
  const normalizedStatus = status
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

  if (normalizedStatus.includes('genere') || normalizedStatus.includes('ok')) {
    return 'generated'
  }

  if (
    normalizedStatus.includes('erreur') ||
    normalizedStatus.includes('echec') ||
    normalizedStatus.includes('fail')
  ) {
    return 'attention'
  }

  return 'neutral'
}

function matchesStatusFilter(review: WeeklyReview, statusFilter: StatusFilter) {
  if (statusFilter === 'all') {
    return true
  }

  return getStatusTone(review.status) === statusFilter
}

function getSearchText(review: WeeklyReview) {
  return [
    review.week,
    review.analyzedPeriod,
    review.executiveSummary,
    review.highlights,
    review.keyNumbers,
    review.conclusions,
    review.nextWeekImprovements,
    review.priorityActions,
    review.risks,
    review.sourcesRead,
    review.status,
  ]
    .join(' ')
    .toLowerCase()
}

function compareReviewsDesc(a: WeeklyReview, b: WeeklyReview) {
  const dateComparison = b.reportDate.localeCompare(a.reportDate)

  if (dateComparison !== 0) {
    return dateComparison
  }

  return b.week.localeCompare(a.week)
}

function ReviewSummaryCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof CalendarDaysIcon
  label: string
  value: string | number
  hint: string
}) {
  return (
    <article className="weekly-summary-card">
      <div className="weekly-summary-card__icon" aria-hidden="true">
        <Icon size={17} strokeWidth={2.1} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{hint}</p>
    </article>
  )
}

function ReviewTextBlock({
  title,
  value,
  list,
}: {
  title: string
  value: string
  list?: boolean
}) {
  const lines = splitLines(value)

  if (lines.length === 0) {
    return null
  }

  return (
    <section className="weekly-review-block">
      <h3>{title}</h3>
      {list && lines.length > 1 ? (
        <ul>
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : (
        <p>{lines.join('\n')}</p>
      )}
    </section>
  )
}

function WeeklyReviewCard({
  review,
  isLatest,
}: {
  review: WeeklyReview
  isLatest: boolean
}) {
  const statusTone = getStatusTone(review.status)
  const priorityActions = splitLines(review.priorityActions)

  return (
    <article
      className={
        isLatest
          ? 'weekly-review-card weekly-review-card--latest'
          : 'weekly-review-card'
      }
    >
      <header className="weekly-review-card__header">
        <div>
          <div className="weekly-review-card__meta">
            <span className="badge">{review.week}</span>
            <span className="badge">{review.reportDate || 'Sans date'}</span>
            <span className={`badge badge--review-${statusTone}`}>
              {review.status || 'Statut libre'}
            </span>
          </div>
          <h2>{review.analyzedPeriod || 'Periode non renseignee'}</h2>
        </div>
        {isLatest ? <span className="weekly-review-latest">Dernier bilan</span> : null}
      </header>

      {review.executiveSummary ? (
        <p className="weekly-review-card__summary">{review.executiveSummary}</p>
      ) : null}

      <div className="weekly-review-section-grid">
        <ReviewTextBlock list title="Faits marquants" value={review.highlights} />
        <ReviewTextBlock list title="Chiffres cles" value={review.keyNumbers} />
        <ReviewTextBlock title="Conclusions" value={review.conclusions} />
        <ReviewTextBlock
          list
          title="Ameliorations semaine prochaine"
          value={review.nextWeekImprovements}
        />
        <ReviewTextBlock
          list
          title={`Actions prioritaires (${priorityActions.length})`}
          value={review.priorityActions}
        />
        <ReviewTextBlock
          list
          title="Risques / points de vigilance"
          value={review.risks}
        />
        <ReviewTextBlock title="Sources lues" value={review.sourcesRead} />
      </div>
    </article>
  )
}

export function WeeklyReviewsPage() {
  const snapshotQuery = useCrmSnapshot()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const sortedReviews = useMemo(
    () => [...(snapshotQuery.data?.weeklyReviews ?? [])].sort(compareReviewsDesc),
    [snapshotQuery.data?.weeklyReviews],
  )

  const latestReview = sortedReviews[0]
  const generatedCount = sortedReviews.filter(
    (review) => getStatusTone(review.status) === 'generated',
  ).length
  const attentionCount = sortedReviews.filter(
    (review) => getStatusTone(review.status) === 'attention',
  ).length

  const filteredReviews = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase()

    return sortedReviews.filter((review) => {
      const statusMatches = matchesStatusFilter(review, statusFilter)
      const searchMatches =
        normalizedSearch.length === 0 ||
        getSearchText(review).includes(normalizedSearch)

      return statusMatches && searchMatches
    })
  }, [searchQuery, sortedReviews, statusFilter])

  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Pilotage"
        title="Bilans hebdomadaires"
        description="Historique des bilans generes depuis le pipeline, avec conclusions et actions pour la semaine suivante."
      />

      {snapshotQuery.isLoading ? (
        <section className="table-state">Chargement des bilans...</section>
      ) : snapshotQuery.error ? (
        <section className="table-state table-state--error">
          {snapshotQuery.error.message}
        </section>
      ) : sortedReviews.length === 0 ? (
        <section className="table-state">
          Aucun bilan hebdomadaire n'a encore ete genere.
        </section>
      ) : (
        <>
          <section className="weekly-summary-grid" aria-label="Synthese des bilans">
            <ReviewSummaryCard
              icon={ClipboardListIcon}
              label="Bilans"
              value={sortedReviews.length}
              hint="lignes disponibles"
            />
            <ReviewSummaryCard
              icon={CalendarDaysIcon}
              label="Dernier"
              value={latestReview?.week ?? '-'}
              hint={latestReview?.reportDate || 'sans date'}
            />
            <ReviewSummaryCard
              icon={CheckCircleIcon}
              label="Generes"
              value={generatedCount}
              hint="ecritures confirmees"
            />
            <ReviewSummaryCard
              icon={AlertTriangleIcon}
              label="A surveiller"
              value={attentionCount}
              hint="statuts d'erreur ou atypiques"
            />
          </section>

          <section className="weekly-review-toolbar" aria-label="Filtres bilans">
            <label>
              Rechercher
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Prospect, action, conclusion..."
              />
            </label>
            <label>
              Statut
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              >
                <option value="all">Tous</option>
                <option value="generated">Generes</option>
                <option value="attention">A surveiller</option>
              </select>
            </label>
            <div className="weekly-review-count">
              <ListChecksIcon size={16} strokeWidth={2.1} aria-hidden="true" />
              {filteredReviews.length} resultat
              {filteredReviews.length > 1 ? 's' : ''}
            </div>
          </section>

          {filteredReviews.length > 0 ? (
            <section className="weekly-review-list" aria-label="Bilans">
              {filteredReviews.map((review) => (
                <WeeklyReviewCard
                  isLatest={review === latestReview}
                  key={`${review.week}-${review.reportDate}`}
                  review={review}
                />
              ))}
            </section>
          ) : (
            <section className="table-state">
              Aucun bilan ne correspond aux filtres actuels.
            </section>
          )}
        </>
      )}
    </main>
  )
}
