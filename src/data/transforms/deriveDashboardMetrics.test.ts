import { mockCrmSnapshot } from '../fixtures/mockCrmSnapshot'
import { deriveDashboardMetrics } from './deriveDashboardMetrics'
import { selectNextOutboundTarget } from './selectNextOutboundTarget'

describe('deriveDashboardMetrics', () => {
  it('derives today, overdue and upcoming relances', () => {
    const metrics = deriveDashboardMetrics(mockCrmSnapshot, '2026-06-17')

    expect(metrics.dueTodayRelances.map((item) => item.id)).toEqual(['R002'])
    expect(metrics.overdueRelances.map((item) => item.id)).toEqual(['R001'])
    expect(metrics.upcomingRelances.map((item) => item.id)).toContain('R003')
  })

  it('derives content and conversation signals', () => {
    const metrics = deriveDashboardMetrics(mockCrmSnapshot, '2026-06-17')

    expect(metrics.activeConversations.length).toBe(4)
    expect(metrics.unusedApprentissages.length).toBe(3)
    expect(metrics.unusedLeadMagnets.length).toBe(3)
  })
})

describe('selectNextOutboundTarget', () => {
  it('skips migrated targets and selects the best eligible target', () => {
    expect(selectNextOutboundTarget(mockCrmSnapshot)?.poolId).toBe(
      'OUT-20260616-007',
    )
  })

  it('prevents selecting an outbound target already present in prospects', () => {
    const snapshot = structuredClone(mockCrmSnapshot)
    const template = snapshot.outboundTargets[1]

    snapshot.outboundTargets = [
      {
        ...template,
        poolId: 'OUT-DUPLICATE',
        name: snapshot.prospects[0].contact,
        company: 'Nouvelle organisation',
        linkedinUrl: '',
        priority: 'A',
        preliminaryScore: 5,
        poolStatus: 'new',
        migratedToPipeline: false,
      },
      {
        ...template,
        poolId: 'OUT-ELIGIBLE',
        name: 'Prospect Eligible',
        company: 'Organisation Eligible',
        linkedinUrl: 'https://www.linkedin.com/in/prospect-eligible',
        priority: 'B',
        preliminaryScore: 3,
        poolStatus: 'new',
        migratedToPipeline: false,
      },
    ]

    expect(selectNextOutboundTarget(snapshot)?.poolId).toBe('OUT-ELIGIBLE')
  })
})
