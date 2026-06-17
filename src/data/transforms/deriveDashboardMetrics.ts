import type {
  Apprentissage,
  CrmSnapshot,
  LeadMagnet,
  OutboundTarget,
  Prospect,
  Relance,
} from '../domain/crmTypes'
import { selectNextOutboundTarget } from './selectNextOutboundTarget'

export type DashboardStatusItem = {
  status: string
  count: number
}

export type DashboardMetrics = {
  dueTodayRelances: Relance[]
  overdueRelances: Relance[]
  upcomingRelances: Relance[]
  activeConversations: Prospect[]
  contactedWithoutReply: Prospect[]
  unusedApprentissages: Apprentissage[]
  unusedLeadMagnets: LeadMagnet[]
  nextOutboundTarget: OutboundTarget | null
  prospectsByStatus: DashboardStatusItem[]
  relancesByState: DashboardStatusItem[]
  conversationSignalData: DashboardStatusItem[]
}

function countBy<T>(items: T[], getKey: (item: T) => string) {
  const counts = new Map<string, number>()

  for (const item of items) {
    const key = getKey(item)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return [...counts.entries()].map(([status, count]) => ({ status, count }))
}

export function deriveDashboardMetrics(
  snapshot: CrmSnapshot,
  today: string,
): DashboardMetrics {
  const activeRelances = snapshot.relances.filter(
    (relance) => relance.state === 'A faire' || relance.state === 'Planifie',
  )

  const dueTodayRelances = activeRelances.filter(
    (relance) => relance.date === today,
  )
  const overdueRelances = activeRelances.filter(
    (relance) => relance.date < today,
  )
  const upcomingRelances = activeRelances
    .filter((relance) => relance.date > today)
    .toSorted((left, right) => left.date.localeCompare(right.date))

  const activeConversations = snapshot.prospects.filter((prospect) =>
    ['replied', 'conversation', 'pilot-discussion', 'diagnostic-proposed'].includes(
      prospect.status,
    ),
  )

  const contactedWithoutReply = snapshot.prospects.filter(
    (prospect) =>
      prospect.status === 'contacted' &&
      ['en attente', ''].includes(prospect.response.trim().toLowerCase()),
  )

  const unusedApprentissages = snapshot.apprentissages.filter(
    (item) => !item.usedInPost,
  )
  const unusedLeadMagnets = snapshot.leadMagnets.filter(
    (item) => !item.usedInPost,
  )

  return {
    dueTodayRelances,
    overdueRelances,
    upcomingRelances,
    activeConversations,
    contactedWithoutReply,
    unusedApprentissages,
    unusedLeadMagnets,
    nextOutboundTarget: selectNextOutboundTarget(snapshot),
    prospectsByStatus: countBy(snapshot.prospects, (prospect) => prospect.status),
    relancesByState: countBy(snapshot.relances, (relance) => relance.state),
    conversationSignalData: [
      { status: 'Conversations', count: activeConversations.length },
      { status: 'Sans reponse', count: contactedWithoutReply.length },
    ],
  }
}
