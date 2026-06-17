import { mockCrmSnapshot } from '../fixtures/mockCrmSnapshot'
import { buildCrmIndexes } from './buildCrmIndexes'

describe('buildCrmIndexes', () => {
  it('indexes related CRM records by prospect id', () => {
    const indexes = buildCrmIndexes(mockCrmSnapshot)

    expect(indexes.prospectById.get('P008')?.contact).toBe('Coralie Ramakavelo')
    expect(indexes.messagesByProspectId.get('P008')).toHaveLength(1)
    expect(indexes.relancesByProspectId.get('P008')).toHaveLength(1)
    expect(indexes.leadMagnetsByProspectId.get('P008')).toHaveLength(1)
    expect(indexes.apprentissagesByProspectId.get('P008')).toHaveLength(1)
  })

  it('indexes migrated outbound targets by pipeline id', () => {
    const indexes = buildCrmIndexes(mockCrmSnapshot)

    expect(indexes.outboundByPipelineId.get('P023')?.poolStatus).toBe('migrated')
  })
})
