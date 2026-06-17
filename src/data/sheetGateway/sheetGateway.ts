import type {
  CrmSnapshot,
  Message,
  OutboundStatus,
  Relance,
  ProspectStatus,
  RelanceState,
} from '../domain/crmTypes'

export type UpdateProspectInput = {
  status?: ProspectStatus
  nextAction?: string
  nextActionDate?: string
}

export type UpdateRelanceInput = {
  date?: string
  state?: RelanceState
  action?: string
  reference?: string
}

export type UpdateOutboundInput = {
  poolStatus?: OutboundStatus
  migratedToPipeline?: boolean
  pipelineId?: string
  lastAction?: string
  notes?: string
}

export type MarkContentUsedInput = {
  usedInPost: boolean
  postUseDate: string
  postTitle: string
  postArchive: string
  postFormat: string
  contentStatus: 'draft' | 'published' | 'archived' | 'a utiliser'
}

export type SheetGateway = {
  getSnapshot: () => Promise<CrmSnapshot>
  updateProspect: (
    prospectId: string,
    input: UpdateProspectInput,
  ) => Promise<CrmSnapshot>
  updateRelance: (
    relanceId: string,
    input: UpdateRelanceInput,
  ) => Promise<CrmSnapshot>
  updateOutboundTarget: (
    poolId: string,
    input: UpdateOutboundInput,
  ) => Promise<CrmSnapshot>
  markLeadMagnetUsage: (
    id: string,
    input: MarkContentUsedInput,
  ) => Promise<CrmSnapshot>
  markApprentissageUsage: (
    id: string,
    input: MarkContentUsedInput,
  ) => Promise<CrmSnapshot>
  appendRelance: (input: Relance) => Promise<CrmSnapshot>
  appendMessage: (input: Message) => Promise<CrmSnapshot>
}
