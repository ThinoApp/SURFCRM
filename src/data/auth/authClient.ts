export type AuthSession = {
  authEnabled: boolean
  authenticated: boolean
  username?: string
}

export type LoginInput = {
  username: string
  password: string
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

function createAuthUrl(baseUrl: string, path: string) {
  return `${trimTrailingSlash(baseUrl)}${path}`
}

async function requestAuth<TPayload>(
  baseUrl: string,
  path: string,
  init?: RequestInit,
) {
  const response = await fetch(createAuthUrl(baseUrl, path), {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const payload = await response
      .json()
      .catch(() => ({ error: 'Authentification impossible.' }))

    throw new Error(payload.error ?? 'Authentification impossible.')
  }

  return (await response.json()) as TPayload
}

export function getAuthSession(baseUrl: string) {
  return requestAuth<AuthSession>(baseUrl, '/session')
}

export function login(baseUrl: string, input: LoginInput) {
  return requestAuth<AuthSession>(baseUrl, '/login', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function logout(baseUrl: string) {
  return requestAuth<AuthSession>(baseUrl, '/logout', {
    method: 'POST',
    body: JSON.stringify({}),
  })
}
