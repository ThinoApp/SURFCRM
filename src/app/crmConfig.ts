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

function isLoopbackProxyUrl(value: string) {
  return /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/|$)/i.test(value)
}

function isAppRunningOnLoopback() {
  if (typeof window === 'undefined') {
    return false
  }

  return ['127.0.0.1', 'localhost', '::1'].includes(window.location.hostname)
}

function normalizeGoogleSheetsProxyUrl(value: string | undefined) {
  const proxyUrl = value?.trim() ?? ''

  if (
    proxyUrl &&
    !import.meta.env.DEV &&
    !isAppRunningOnLoopback() &&
    isLoopbackProxyUrl(proxyUrl)
  ) {
    return '/api/crm'
  }

  return proxyUrl
}

export function getCrmRuntimeConfig(): CrmRuntimeConfig {
  return {
    dataSource: parseDataSource(import.meta.env.VITE_CRM_DATA_SOURCE),
    googleSheetsProxyUrl: normalizeGoogleSheetsProxyUrl(
      import.meta.env.VITE_GOOGLE_SHEETS_PROXY_URL,
    ),
    spreadsheetId: import.meta.env.VITE_GOOGLE_SHEETS_SPREADSHEET_ID ?? '',
    allowMockFallback: parseBoolean(
      import.meta.env.VITE_CRM_ALLOW_MOCK_FALLBACK,
      true,
    ),
    debugGateway: parseBoolean(import.meta.env.VITE_CRM_DEBUG_GATEWAY, false),
  }
}
