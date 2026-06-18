export type CrmDataSource = 'mock' | 'google-sheets'

export type CrmRuntimeConfig = {
  dataSource: CrmDataSource
  googleSheetsProxyUrl: string
  spreadsheetId: string
  allowMockFallback: boolean
  debugGateway: boolean
  authEnabled: boolean
  authApiUrl: string
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

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

function deriveAuthApiUrl(proxyUrl: string) {
  const normalizedProxyUrl = trimTrailingSlash(proxyUrl)

  if (!normalizedProxyUrl) {
    return '/api/auth'
  }

  if (normalizedProxyUrl.endsWith('/api/crm')) {
    return `${normalizedProxyUrl.slice(0, -'/api/crm'.length)}/api/auth`
  }

  if (normalizedProxyUrl.endsWith('/crm')) {
    return `${normalizedProxyUrl.slice(0, -'/crm'.length)}/auth`
  }

  return `${normalizedProxyUrl}/auth`
}

export function getCrmRuntimeConfig(): CrmRuntimeConfig {
  const googleSheetsProxyUrl = import.meta.env.VITE_GOOGLE_SHEETS_PROXY_URL ?? ''

  return {
    dataSource: parseDataSource(import.meta.env.VITE_CRM_DATA_SOURCE),
    googleSheetsProxyUrl,
    spreadsheetId: import.meta.env.VITE_GOOGLE_SHEETS_SPREADSHEET_ID ?? '',
    allowMockFallback: parseBoolean(
      import.meta.env.VITE_CRM_ALLOW_MOCK_FALLBACK,
      true,
    ),
    debugGateway: parseBoolean(import.meta.env.VITE_CRM_DEBUG_GATEWAY, false),
    authEnabled: parseBoolean(import.meta.env.VITE_CRM_AUTH_ENABLED, false),
    authApiUrl:
      import.meta.env.VITE_CRM_AUTH_API_URL ?? deriveAuthApiUrl(googleSheetsProxyUrl),
  }
}
