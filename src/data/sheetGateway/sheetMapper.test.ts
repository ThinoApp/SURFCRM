import {
  mapSheetValuesToRecords,
  mapSheetsToCrmSnapshot,
  normalizeSheetHeader,
} from './sheetMapper'
import { sheetDefinitions } from './sheetDefinitions'

describe('sheetMapper', () => {
  it('normalizes human readable headers', () => {
    expect(normalizeSheetHeader('Date prochaine action')).toBe(
      'dateprochaineaction',
    )
    expect(normalizeSheetHeader('Problème visible')).toBe('problemevisible')
  })

  it('maps sheet rows with header aliases to CRM records', () => {
    const records = mapSheetValuesToRecords(sheetDefinitions.prospects, [
      ['ID', 'Contact', 'Entreprise', 'Statut', 'Score'],
      ['P100', 'Test Prospect', 'SURF Test', 'contacted', '4'],
    ])

    expect(records[0]).toMatchObject({
      id: 'P100',
      contact: 'Test Prospect',
      organisation: 'SURF Test',
      status: 'contacted',
      score: '4',
    })
  })

  it('builds a validated CRM snapshot from tab values', () => {
    const snapshot = mapSheetsToCrmSnapshot({
      prospects: [
        ['ID', 'Contact', 'Entreprise', 'Statut', 'Score'],
        ['P100', 'Test Prospect', 'SURF Test', 'contacted', '4'],
      ],
      relances: [
        ['ID', 'Date', 'Prospect', 'Action', 'Etat', 'Prospect ID'],
        ['R100', '2026-06-18', 'Test Prospect', 'Relancer', 'A faire', 'P100'],
      ],
    })

    expect(snapshot.prospects[0]?.score).toBe(4)
    expect(snapshot.relances[0]?.state).toBe('A faire')
    expect(snapshot.messages).toEqual([])
  })
})
