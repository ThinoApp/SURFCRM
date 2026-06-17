import { createMockSheetGateway } from './mockSheetGateway'

describe('createMockSheetGateway', () => {
  it('returns snapshots and updates relances in memory', async () => {
    const gateway = createMockSheetGateway()

    await gateway.updateRelance('R003', {
      state: 'Fait',
      reference: 'Relance envoyee dans LinkedIn',
    })

    const snapshot = await gateway.getSnapshot()
    const relance = snapshot.relances.find((item) => item.id === 'R003')

    expect(relance?.state).toBe('Fait')
    expect(relance?.reference).toBe('Relance envoyee dans LinkedIn')
  })

  it('throws a readable error for unknown records', async () => {
    const gateway = createMockSheetGateway()

    await expect(gateway.updateProspect('P999', { status: 'contacted' }))
      .rejects.toThrow('Prospect introuvable: P999')
  })

  it('marks content usage for lead magnets and apprentissages', async () => {
    const gateway = createMockSheetGateway()
    const usage = {
      usedInPost: true,
      postUseDate: '2026-06-17',
      postTitle: 'Post test',
      postArchive: 'Drive/test',
      postFormat: 'LinkedIn post',
      contentStatus: 'draft' as const,
    }

    await gateway.markLeadMagnetUsage('LM003', usage)
    await gateway.markApprentissageUsage('AT007', usage)

    const snapshot = await gateway.getSnapshot()
    const leadMagnet = snapshot.leadMagnets.find((item) => item.id === 'LM003')
    const apprentissage = snapshot.apprentissages.find(
      (item) => item.id === 'AT007',
    )

    expect(leadMagnet?.usedInPost).toBe(true)
    expect(leadMagnet?.postTitle).toBe('Post test')
    expect(apprentissage?.usedInPost).toBe(true)
    expect(apprentissage?.postArchive).toBe('Drive/test')
  })

  it('appends relances and messages without overwriting existing rows', async () => {
    const gateway = createMockSheetGateway()

    await gateway.appendRelance({
      id: 'R999',
      date: '2026-06-22',
      prospectName: 'Test Prospect',
      action: 'Verifier la reponse',
      reference: 'Test',
      state: 'A faire',
      prospectId: 'P003',
    })
    await gateway.appendMessage({
      prospectId: 'P003',
      contact: 'Test Prospect',
      organisation: 'Test Org',
      date: '2026-06-22',
      sourceLabel: 'Test',
      type: 'Relance',
      direction: 'Sortant',
      state: 'Envoye',
      exactContent: 'Message test',
      messageId: 'MSG999',
    })

    const snapshot = await gateway.getSnapshot()

    expect(snapshot.relances.some((item) => item.id === 'R999')).toBe(true)
    expect(snapshot.messages.some((item) => item.messageId === 'MSG999')).toBe(
      true,
    )
    await expect(gateway.appendRelance(snapshot.relances.at(-1)!)).rejects.toThrow(
      'Relance deja existant',
    )
  })
})
