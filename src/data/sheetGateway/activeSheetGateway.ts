import { getCrmRuntimeConfig } from '../../app/crmConfig'
import { createGoogleSheetsGateway } from './googleSheetsGateway'
import { mockSheetGateway } from './mockSheetGateway'
import type { SheetGateway } from './sheetGateway'

function createUnavailableGateway(message: string): SheetGateway {
  const reject = () => Promise.reject(new Error(message))

  return {
    getSnapshot: reject,
    getRawValues: reject,
    getRawSheet: reject,
    updateProspect: reject,
    updateRelance: reject,
    updateOutboundTarget: reject,
    markLeadMagnetUsage: reject,
    markApprentissageUsage: reject,
    appendRelance: reject,
    appendMessage: reject,
  }
}

function createActiveSheetGateway(): SheetGateway {
  const config = getCrmRuntimeConfig()

  if (config.dataSource !== 'google-sheets') {
    return mockSheetGateway
  }

  if (!config.googleSheetsProxyUrl) {
    if (config.allowMockFallback) {
      return mockSheetGateway
    }

    return createUnavailableGateway('VITE_GOOGLE_SHEETS_PROXY_URL est requis.')
  }

  return createGoogleSheetsGateway({
    proxyBaseUrl: config.googleSheetsProxyUrl,
    spreadsheetId: config.spreadsheetId,
    allowMockFallback: config.allowMockFallback,
    debug: config.debugGateway,
    fallbackGateway: mockSheetGateway,
  })
}

export const activeSheetGateway = createActiveSheetGateway()
