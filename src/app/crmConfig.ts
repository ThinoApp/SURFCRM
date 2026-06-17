export type CrmDataSource = 'mock' | 'google-sheets'

export type CrmRuntimeConfig = {
  dataSource: CrmDataSource
  googleSheetsProxyUrl: string
  spreadsheetId: string
  allowMockFallback: boolean
  debugGateway: boolean
}

function parseBoolean(value: string | undefined, defaultValue: boolean) {
  if (value === undefined) {
    return defaultValue
  }

  return ['1', 'true', 'yes', 'oui'].includes(value.trim().toLowerCase())
}

function parseDataSource(value: string | undefined): CrmDataSource {
  return value === 'google-sheets' ? 'google-sheets' : 'mock'
}

export function getCrmRuntimeConfig(): CrmRuntimeConfig {
  return {
    dataSource: parseDataSource(import.meta.env.VITE_CRM_DATA_SOURCE),
    googleSheetsProxyUrl: import.meta.env.VITE_GOOGLE_SHEETS_PROXY_URL ?? '',
    spreadsheetId: import.meta.env.VITE_GOOGLE_SHEETS_SPREADSHEET_ID ?? '',
    allowMockFallback: parseBoolean(
      import.meta.env.VITE_CRM_ALLOW_MOCK_FALLBACK,
      true,
    ),
    debugGateway: parseBoolean(import.meta.env.VITE_CRM_DEBUG_GATEWAY, false),
  }
}
