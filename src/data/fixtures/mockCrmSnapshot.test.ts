import { mockCrmSnapshot } from './mockCrmSnapshot'

describe('mockCrmSnapshot', () => {
  it('contains parsed representative CRM data for every MVP sheet', () => {
    expect(mockCrmSnapshot.prospects.length).toBeGreaterThan(0)
    expect(mockCrmSnapshot.messages.length).toBeGreaterThan(0)
    expect(mockCrmSnapshot.relances.length).toBeGreaterThan(0)
    expect(mockCrmSnapshot.outboundTargets.length).toBeGreaterThan(0)
    expect(mockCrmSnapshot.leadMagnets.length).toBeGreaterThan(0)
    expect(mockCrmSnapshot.apprentissages.length).toBeGreaterThan(0)
  })

  it('normalizes numeric and boolean sheet values', () => {
    expect(mockCrmSnapshot.prospects.find((item) => item.id === 'P023')?.score)
      .toBe(5)
    expect(
      mockCrmSnapshot.outboundTargets.find(
        (item) => item.poolId === 'OUT-20260616-007',
      )?.migratedToPipeline,
    ).toBe(false)
  })
})
