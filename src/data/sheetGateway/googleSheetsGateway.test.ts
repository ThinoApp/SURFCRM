import { vi } from 'vitest'

import { createGoogleSheetsGateway } from './googleSheetsGateway'
import { createMockSheetGateway } from './mockSheetGateway'

const minimalValuesByEntity = {
  prospects: [
    ['ID', 'Contact', 'Entreprise', 'Statut', 'Score'],
    ['P100', 'Test Prospect', 'SURF Test', 'contacted', '4'],
  ],
}

describe('createGoogleSheetsGateway', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads a CRM snapshot through the Sheets proxy', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ valuesByEntity: minimalValuesByEntity }), {
        status: 200,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const gateway = createGoogleSheetsGateway({
      proxyBaseUrl: 'http://127.0.0.1:8787/api/crm/',
      spreadsheetId: 'sheet-123',
      allowMockFallback: false,
      debug: false,
    })

    const snapshot = await gateway.getSnapshot()

    expect(snapshot.prospects[0]?.contact).toBe('Test Prospect')
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8787/api/crm/snapshot?spreadsheetId=sheet-123',
      expect.any(Object),
    )
  })

  it('falls back to the mock gateway for read failures when enabled', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('Forbidden', { status: 403 })),
    )

    const gateway = createGoogleSheetsGateway({
      proxyBaseUrl: 'http://127.0.0.1:8787/api/crm',
      spreadsheetId: 'sheet-123',
      allowMockFallback: true,
      debug: false,
      fallbackGateway: createMockSheetGateway(),
    })

    const snapshot = await gateway.getSnapshot()

    expect(snapshot.prospects.length).toBeGreaterThan(0)
  })
})
