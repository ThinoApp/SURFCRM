import type {
  Apprentissage,
  CrmSnapshot,
  LeadMagnet,
  Message,
  OutboundTarget,
  Prospect,
  Relance,
} from '../domain/crmTypes'

export type CrmIndexes = {
  prospectById: Map<string, Prospect>
  messagesByProspectId: Map<string, Message[]>
  relancesByProspectId: Map<string, Relance[]>
  leadMagnetsByProspectId: Map<string, LeadMagnet[]>
  apprentissagesByProspectId: Map<string, Apprentissage[]>
  outboundByPipelineId: Map<string, OutboundTarget>
  prospectNames: Set<string>
}

function pushToMapList<T>(
  map: Map<string, T[]>,
  key: string,
  item: T,
) {
  const list = map.get(key)

  if (list) {
    list.push(item)
    return
  }

  map.set(key, [item])
}

export function buildCrmIndexes(snapshot: CrmSnapshot): CrmIndexes {
  const prospectById = new Map<string, Prospect>()
  const messagesByProspectId = new Map<string, Message[]>()
  const relancesByProspectId = new Map<string, Relance[]>()
  const leadMagnetsByProspectId = new Map<string, LeadMagnet[]>()
  const apprentissagesByProspectId = new Map<string, Apprentissage[]>()
  const outboundByPipelineId = new Map<string, OutboundTarget>()
  const prospectNames = new Set<string>()

  for (const prospect of snapshot.prospects) {
    prospectById.set(prospect.id, prospect)
    prospectNames.add(prospect.contact.toLowerCase())
    prospectNames.add(prospect.organisation.toLowerCase())
  }

  for (const message of snapshot.messages) {
    pushToMapList(messagesByProspectId, message.prospectId, message)
  }

  for (const relance of snapshot.relances) {
    pushToMapList(relancesByProspectId, relance.prospectId, relance)
  }

  for (const leadMagnet of snapshot.leadMagnets) {
    if (leadMagnet.sourceProspectId) {
      pushToMapList(
        leadMagnetsByProspectId,
        leadMagnet.sourceProspectId,
        leadMagnet,
      )
    }
  }

  for (const apprentissage of snapshot.apprentissages) {
    if (apprentissage.sourceProspectId) {
      pushToMapList(
        apprentissagesByProspectId,
        apprentissage.sourceProspectId,
        apprentissage,
      )
    }
  }

  for (const outboundTarget of snapshot.outboundTargets) {
    if (outboundTarget.pipelineId) {
      outboundByPipelineId.set(outboundTarget.pipelineId, outboundTarget)
    }
  }

  return {
    prospectById,
    messagesByProspectId,
    relancesByProspectId,
    leadMagnetsByProspectId,
    apprentissagesByProspectId,
    outboundByPipelineId,
    prospectNames,
  }
}
