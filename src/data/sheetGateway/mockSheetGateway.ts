import { mockCrmSnapshot } from '../fixtures/mockCrmSnapshot'
import type { CrmSnapshot } from '../domain/crmTypes'
import { sheetDefinitions, sheetEntityKeys } from './sheetDefinitions'
import type {
  MarkContentUsedInput,
  RawSheetKey,
  RawSheetPayload,
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

function stringifySheetValue(value: unknown) {
  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE'
  }

  return String(value ?? '')
}

function createRawValuesFromSnapshot(snapshot: CrmSnapshot) {
  return sheetEntityKeys.reduce((valuesByEntity, entity) => {
    const definition = sheetDefinitions[entity]
    const rows = snapshot[entity].map((item) =>
      definition.fields.map((field) =>
        stringifySheetValue((item as Record<string, unknown>)[field.key]),
      ),
    )

    valuesByEntity[entity] = [
      definition.fields.map((field) => field.header),
      ...rows,
    ]

    return valuesByEntity
  }, {} as SheetGateway extends { getRawValues: () => Promise<infer T> } ? T : never)
}

const mockRawSheets: Record<RawSheetKey, RawSheetPayload> = {
  questionnaire: {
    key: 'questionnaire',
    tabName: 'questionnaire',
    values: [
      ['Horodateur', 'Nom', 'Profil LinkedIn', 'Objectif principal', 'Frequence LinkedIn'],
      [
        '2026-06-24 14:10',
        'Xavier N.',
        'https://www.linkedin.com/in/example',
        'Identifier des signaux marche et conversations utiles',
        'Quotidienne',
      ],
      [
        '2026-06-24 15:42',
        'Davide B.',
        '',
        'Faire de la veille et reperer des contacts a relancer',
        'Hebdomadaire',
      ],
    ],
  },
  waitlist: {
    key: 'waitlist',
    tabName: 'waitlist',
    values: [
      ['Horodateur', 'Nom', 'Contact', 'Role', 'Mission prioritaire'],
      ['2026-06-25 09:02', 'Iary R.', 'iary@example.com', 'Founder', 'Veille sectorielle'],
      ['2026-06-25 11:18', 'Manda R.', 'manda@example.com', 'Consultant', 'Prospection'],
    ],
  },
  feedback: {
    key: 'feedback',
    tabName: 'Feedback',
    values: [
      ['Horodateur', 'Nom', 'Mission', 'Score rapport', 'Blocage principal'],
      ['2026-06-25 18:22', 'Beta tester 1', 'Veille sectorielle', '4', 'Installation'],
      ['2026-06-26 08:34', 'Beta tester 2', 'Prospection', '5', 'Aucun'],
    ],
  },
}

export function createMockSheetGateway(
  initialSnapshot = mockCrmSnapshot,
): SheetGateway {
  const snapshot = cloneSnapshot(initialSnapshot)

  const getSnapshot = async () => cloneSnapshot(snapshot)
  const getRawValues = async () => createRawValuesFromSnapshot(snapshot)
  const getRawSheet = async (key: RawSheetKey) => structuredClone(mockRawSheets[key])

  return {
    getSnapshot,
    getRawValues,
    getRawSheet,
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
