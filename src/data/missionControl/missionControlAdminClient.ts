export type MissionControlTesterStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED'

export type MissionControlAccess = {
  id: string
  label: string | null
  activatedAt: string | null
  lastSeenAt: string | null
  revokedAt: string | null
  scoreBatches: number
  postsScored: number
  createdAt: string
}

export type MissionControlTester = {
  id: string
  email: string
  name: string
  status: MissionControlTesterStatus
  expiresAt: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  accesses: MissionControlAccess[]
}

export type CreateMissionControlTesterInput = {
  name: string
  email: string
  expiresAt?: string
  notes?: string
}

export type CreatedMissionControlTester = MissionControlTester & {
  activationCode: string
  accessId: string
}

export type IssuedMissionControlAccess = {
  id: string
  label: string | null
  createdAt: string
  activationCode: string
}

type TestersResponse = {
  testers: MissionControlTester[]
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

function getProxyBaseUrl(baseUrl: string) {
  return trimTrailingSlash(baseUrl || '/api/crm')
}

async function requestMissionControlAdmin<TPayload>(
  baseUrl: string,
  path: string,
  init?: RequestInit,
) {
  const response = await fetch(`${getProxyBaseUrl(baseUrl)}${path}`, {
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
      .catch(() => ({ error: 'Mission Control indisponible.' }))

    throw new Error(payload.error ?? payload.message ?? 'Mission Control indisponible.')
  }

  return (await response.json()) as TPayload
}

export async function listMissionControlTesters(baseUrl: string) {
  const response = await requestMissionControlAdmin<TestersResponse>(
    baseUrl,
    '/mission-control/testers',
  )

  return response.testers
}

export function createMissionControlTester(
  baseUrl: string,
  input: CreateMissionControlTesterInput,
) {
  return requestMissionControlAdmin<CreatedMissionControlTester>(
    baseUrl,
    '/mission-control/testers',
    {
      method: 'POST',
      body: JSON.stringify({ input }),
    },
  )
}

export function issueMissionControlAccess(
  baseUrl: string,
  testerId: string,
  label = 'Generated from SURF CRM',
) {
  return requestMissionControlAdmin<IssuedMissionControlAccess>(
    baseUrl,
    `/mission-control/testers/${encodeURIComponent(testerId)}/accesses`,
    {
      method: 'POST',
      body: JSON.stringify({ input: { label } }),
    },
  )
}

export function updateMissionControlTesterStatus(
  baseUrl: string,
  testerId: string,
  status: MissionControlTesterStatus,
) {
  return requestMissionControlAdmin<{ id: string; status: MissionControlTesterStatus }>(
    baseUrl,
    `/mission-control/testers/${encodeURIComponent(testerId)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ input: { status } }),
    },
  )
}
