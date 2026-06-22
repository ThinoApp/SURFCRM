import { describe, expect, it } from 'vitest'

import { deriveCrmQualityReport } from './deriveCrmQualityReport'

describe('deriveCrmQualityReport', () => {
  it('detects missing ids, orphan references and duplicate prospects', () => {
    const report = deriveCrmQualityReport({
      prospects: [
        ['ID', 'Contact', 'Organisation', 'LinkedIn', 'Statut'],
        ['P001', 'Alice', 'Acme', 'https://linkedin.com/in/alice', 'contacted'],
        ['P002', 'Alice', 'Acme', 'https://linkedin.com/in/alice', 'contacted'],
      ],
      messages: [
        ['Prospect ID', 'Contact', 'Organisation', 'Direction', 'Message ID'],
        ['P999', 'Ghost', 'No Org', 'Sortant', ''],
      ],
      relances: [
        ['ID', 'Date', 'Prospect', 'Action', 'Etat', 'Prospect ID'],
        ['R001', '2026-06-18', 'Alice', 'Relancer', 'Etat inconnu', 'P001'],
      ],
    })

    expect(report.summary.critical).toBeGreaterThanOrEqual(2)
    expect(report.issues.some((issue) => issue.title === 'Identifiant manquant')).toBe(true)
    expect(
      report.issues.some(
        (issue) => issue.title === 'Message rattaché à un prospect introuvable',
      ),
    ).toBe(true)
    expect(report.issues.some((issue) => issue.title === 'Prospect en doublon')).toBe(true)
    expect(report.issues.some((issue) => issue.title === 'État relance non standard')).toBe(true)
  })

  it('accepts cancelled relances with reply as coherent', () => {
    const report = deriveCrmQualityReport({
      prospects: [
        ['ID', 'Contact', 'Organisation', 'LinkedIn', 'Statut'],
        ['P001', 'Alice', 'Acme', 'https://linkedin.com/in/alice', 'contacted'],
      ],
      messages: [
        ['Prospect ID', 'Contact', 'Organisation', 'Direction', 'Message ID'],
        ['P001', 'Alice', 'Acme', 'Sortant', 'MSG001'],
      ],
      relances: [
        ['ID', 'Date', 'Prospect', 'Action', 'Etat', 'Prospect ID'],
        ['R001', '2026-06-18', 'Alice', 'Relancer', 'Annulé - réponse reçue', 'P001'],
      ],
    })

    expect(report.summary.total).toBe(0)
  })
})
