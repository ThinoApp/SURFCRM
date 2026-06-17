import { mockCrmSnapshot } from '../fixtures/mockCrmSnapshot'
import type { CrmSnapshot } from '../domain/crmTypes'
import type {
  MarkContentUsedInput,
  SheetGateway,
  UpdateOutboundInput,
  UpdateProspectInput,
  UpdateRelanceInput,
} from './sheetGateway'

function cloneSnapshot(snapshot: CrmSnapshot): CrmSnapshot {
  return structuredClone(snapshot)
}

function createNotFoundError(entity: string, id: string) {
  return new Error(`${entity} introuvable: ${id}`)
}

function createDuplicateError(entity: string, id: string) {
  return new Error(`${entity} deja existant: ${id}`)
}

export function createMockSheetGateway(
  initialSnapshot = mockCrmSnapshot,
): SheetGateway {
  const snapshot = cloneSnapshot(initialSnapshot)

  const getSnapshot = async () => cloneSnapshot(snapshot)

  return {
    getSnapshot,
    async updateProspect(prospectId: string, input: UpdateProspectInput) {
      const prospect = snapshot.prospects.find((item) => item.id === prospectId)

      if (!prospect) {
        throw createNotFoundError('Prospect', prospectId)
      }

      Object.assign(prospect, input)
      return getSnapshot()
    },
    async updateRelance(relanceId: string, input: UpdateRelanceInput) {
      const relance = snapshot.relances.find((item) => item.id === relanceId)

      if (!relance) {
        throw createNotFoundError('Relance', relanceId)
      }

      Object.assign(relance, input)
      return getSnapshot()
    },
    async updateOutboundTarget(poolId: string, input: UpdateOutboundInput) {
      const outboundTarget = snapshot.outboundTargets.find(
        (item) => item.poolId === poolId,
      )

      if (!outboundTarget) {
        throw createNotFoundError('Cible outbound', poolId)
      }

      Object.assign(outboundTarget, input)
      return getSnapshot()
    },
    async markLeadMagnetUsage(id: string, input: MarkContentUsedInput) {
      const leadMagnet = snapshot.leadMagnets.find((item) => item.id === id)

      if (!leadMagnet) {
        throw createNotFoundError('Lead magnet', id)
      }

      Object.assign(leadMagnet, input)
      return getSnapshot()
    },
    async markApprentissageUsage(id: string, input: MarkContentUsedInput) {
      const apprentissage = snapshot.apprentissages.find(
        (item) => item.id === id,
      )

      if (!apprentissage) {
        throw createNotFoundError('Apprentissage', id)
      }

      Object.assign(apprentissage, input)
      return getSnapshot()
    },
    async appendRelance(input) {
      if (snapshot.relances.some((item) => item.id === input.id)) {
        throw createDuplicateError('Relance', input.id)
      }

      snapshot.relances.push({ ...input })
      return getSnapshot()
    },
    async appendMessage(input) {
      if (
        snapshot.messages.some((item) => item.messageId === input.messageId)
      ) {
        throw createDuplicateError('Message', input.messageId)
      }

      snapshot.messages.push({ ...input })
      return getSnapshot()
    },
  }
}

export const mockSheetGateway = createMockSheetGateway()
