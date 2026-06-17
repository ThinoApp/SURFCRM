import type { CrmSnapshot } from '../domain/crmTypes'
import type {
  MarkContentUsedInput,
  SheetGateway,
  UpdateOutboundInput,
  UpdateProspectInput,
  UpdateRelanceInput,
} from './sheetGateway'
import { mapSheetsToCrmSnapshot } from './sheetMapper'
import type { SheetValuesByEntity } from './sheetMapper'

export type GoogleSheetsGatewayConfig = {
  proxyBaseUrl: string
  spreadsheetId: string
  allowMockFallback: boolean
  debug: boolean
  fallbackGateway?: SheetGateway
}

type SnapshotResponse =
  | { snapshot: CrmSnapshot; valuesByEntity?: never }
  | { snapshot?: never; valuesByEntity: SheetValuesByEntity }

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

function toReadableError(error: unknown) {
  if (error instanceof Error) {
    return error
  }

  return new Error(String(error))
}

function parseSnapshotResponse(response: SnapshotResponse) {
  // Le proxy retourne toujours valuesByEntity (lignes brutes du sheet).
  // On passe toujours par mapSheetsToCrmSnapshot qui filtre les lignes invalides.
  if ('valuesByEntity' in response && response.valuesByEntity) {
    return mapSheetsToCrmSnapshot(response.valuesByEntity)
  }

  // Fallback: snapshot déjà parsé (chemin legacy)
  return mapSheetsToCrmSnapshot(response.snapshot as never ?? {})
}

function createRequestUrl(baseUrl: string, path: string, spreadsheetId: string) {
  const url = new URL(`${trimTrailingSlash(baseUrl)}${path}`)

  if (spreadsheetId) {
    url.searchParams.set('spreadsheetId', spreadsheetId)
  }

  return url.toString()
}

export function createGoogleSheetsGateway(
  config: GoogleSheetsGatewayConfig,
): SheetGateway {
  async function requestSnapshot(path: string, init?: RequestInit) {
    const response = await fetch(
      createRequestUrl(config.proxyBaseUrl, path, config.spreadsheetId),
      {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers ?? {}),
        },
      },
    )

    if (!response.ok) {
      const message = await response.text()
      throw new Error(
        `Google Sheets indisponible (${response.status}): ${message}`,
      )
    }

    return parseSnapshotResponse((await response.json()) as SnapshotResponse)
  }

  async function readWithFallback() {
    try {
      return await requestSnapshot('/snapshot')
    } catch (error) {
      const readableError = toReadableError(error)

      if (config.debug) {
        console.warn(readableError)
      }

      if (config.allowMockFallback && config.fallbackGateway) {
        return config.fallbackGateway.getSnapshot()
      }

      throw readableError
    }
  }

  function patch(path: string, input: unknown) {
    return requestSnapshot(path, {
      method: 'PATCH',
      body: JSON.stringify({ input }),
    })
  }

  function post(path: string, input: unknown) {
    return requestSnapshot(path, {
      method: 'POST',
      body: JSON.stringify({ input }),
    })
  }

  return {
    getSnapshot: readWithFallback,
    updateProspect(prospectId: string, input: UpdateProspectInput) {
      return patch(`/prospects/${encodeURIComponent(prospectId)}`, input)
    },
    updateRelance(relanceId: string, input: UpdateRelanceInput) {
      return patch(`/relances/${encodeURIComponent(relanceId)}`, input)
    },
    updateOutboundTarget(poolId: string, input: UpdateOutboundInput) {
      return patch(`/outbound-targets/${encodeURIComponent(poolId)}`, input)
    },
    markLeadMagnetUsage(id: string, input: MarkContentUsedInput) {
      return patch(`/lead-magnets/${encodeURIComponent(id)}`, input)
    },
    markApprentissageUsage(id: string, input: MarkContentUsedInput) {
      return patch(`/apprentissages/${encodeURIComponent(id)}`, input)
    },
    appendRelance(input) {
      return post('/relances', input)
    },
    appendMessage(input) {
      return post('/messages', input)
    },
  }
}
