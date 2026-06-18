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
      weeklyReviews: [
        [
          'Date du bilan',
          'Semaine',
          'Periode analysee',
          'Resume executif',
          'Faits marquants',
          'Chiffres cles',
          'Conclusions',
          'Ameliorations semaine prochaine',
          'Actions prioritaires',
          'Risques / points de vigilance',
          'Sources lues',
          'Statut',
        ],
        [
          '2026-06-19',
          '2026-W25',
          '2026-06-15 au 2026-06-19',
          'Semaine active.',
          'Signal fort',
          '4 conversations',
          'Suivi a renforcer',
          'Relances plus rapides',
          'Relancer Coralie',
          'Silences a surveiller',
          'Prospects, Messages',
          'Genere',
        ],
      ],
    })

    expect(snapshot.prospects[0]?.score).toBe(4)
    expect(snapshot.relances[0]?.state).toBe('A faire')
    expect(snapshot.weeklyReviews[0]).toMatchObject({
      week: '2026-W25',
      status: 'Genere',
      priorityActions: 'Relancer Coralie',
    })
    expect(snapshot.messages).toEqual([])
  })
})
