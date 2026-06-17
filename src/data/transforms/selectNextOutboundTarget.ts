import type { CrmSnapshot, OutboundTarget } from '../domain/crmTypes'

const priorityRank = {
  A: 0,
  B: 1,
  C: 2,
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

export function selectNextOutboundTarget(
  snapshot: CrmSnapshot,
): OutboundTarget | null {
  const prospectIdentitySet = new Set<string>()

  for (const prospect of snapshot.prospects) {
    prospectIdentitySet.add(normalize(prospect.contact))
    prospectIdentitySet.add(normalize(prospect.organisation))
    prospectIdentitySet.add(normalize(prospect.linkedin))
  }

  const eligibleTargets = snapshot.outboundTargets.filter((target) => {
    if (target.migratedToPipeline || target.poolStatus === 'migrated') {
      return false
    }

    return ![
      normalize(target.name),
      normalize(target.company),
      normalize(target.linkedinUrl),
    ].some((identity) => identity && prospectIdentitySet.has(identity))
  })

  if (eligibleTargets.length === 0) {
    return null
  }

  return eligibleTargets.toSorted((left, right) => {
    const priorityDelta =
      priorityRank[left.priority] - priorityRank[right.priority]

    if (priorityDelta !== 0) {
      return priorityDelta
    }

    return right.preliminaryScore - left.preliminaryScore
  })[0]
}
