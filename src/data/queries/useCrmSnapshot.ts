import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { CrmSnapshot, Message, Relance } from '../domain/crmTypes'
import { activeSheetGateway } from '../sheetGateway/activeSheetGateway'
import type {
  MarkContentUsedInput,
  UpdateOutboundInput,
  UpdateProspectInput,
  UpdateRelanceInput,
} from '../sheetGateway/sheetGateway'

export const crmSnapshotQueryKey = ['crm-snapshot'] as const

export function useCrmSnapshot() {
  return useQuery({
    queryKey: crmSnapshotQueryKey,
    queryFn: () => activeSheetGateway.getSnapshot(),
    retry: false,
  })
}

export function useUpdateProspect() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      prospectId,
      input,
    }: {
      prospectId: string
      input: UpdateProspectInput
    }) => activeSheetGateway.updateProspect(prospectId, input),
    onSuccess: (snapshot) => {
      queryClient.setQueryData(crmSnapshotQueryKey, snapshot)
    },
  })
}

export function useUpdateRelance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      relanceId,
      input,
    }: {
      relanceId: string
      input: UpdateRelanceInput
    }) => activeSheetGateway.updateRelance(relanceId, input),
    onMutate: async ({ relanceId, input }) => {
      await queryClient.cancelQueries({ queryKey: crmSnapshotQueryKey })
      const previousSnapshot =
        queryClient.getQueryData<CrmSnapshot>(crmSnapshotQueryKey)

      queryClient.setQueryData<CrmSnapshot>(crmSnapshotQueryKey, (current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          relances: current.relances.map((relance) =>
            relance.id === relanceId ? { ...relance, ...input } : relance,
          ),
        }
      })

      return { previousSnapshot }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousSnapshot) {
        queryClient.setQueryData(crmSnapshotQueryKey, context.previousSnapshot)
      }
    },
    onSuccess: (snapshot) => {
      queryClient.setQueryData(crmSnapshotQueryKey, snapshot)
    },
  })
}

export function useUpdateOutboundTarget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      poolId,
      input,
    }: {
      poolId: string
      input: UpdateOutboundInput
    }) => activeSheetGateway.updateOutboundTarget(poolId, input),
    onMutate: async ({ poolId, input }) => {
      await queryClient.cancelQueries({ queryKey: crmSnapshotQueryKey })
      const previousSnapshot =
        queryClient.getQueryData<CrmSnapshot>(crmSnapshotQueryKey)

      queryClient.setQueryData<CrmSnapshot>(crmSnapshotQueryKey, (current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          outboundTargets: current.outboundTargets.map((target) =>
            target.poolId === poolId ? { ...target, ...input } : target,
          ),
        }
      })

      return { previousSnapshot }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousSnapshot) {
        queryClient.setQueryData(crmSnapshotQueryKey, context.previousSnapshot)
      }
    },
    onSuccess: (snapshot) => {
      queryClient.setQueryData(crmSnapshotQueryKey, snapshot)
    },
  })
}

export function useMarkLeadMagnetUsage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      leadMagnetId,
      input,
    }: {
      leadMagnetId: string
      input: MarkContentUsedInput
    }) => activeSheetGateway.markLeadMagnetUsage(leadMagnetId, input),
    onMutate: async ({ leadMagnetId, input }) => {
      await queryClient.cancelQueries({ queryKey: crmSnapshotQueryKey })
      const previousSnapshot =
        queryClient.getQueryData<CrmSnapshot>(crmSnapshotQueryKey)

      queryClient.setQueryData<CrmSnapshot>(crmSnapshotQueryKey, (current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          leadMagnets: current.leadMagnets.map((leadMagnet) =>
            leadMagnet.id === leadMagnetId
              ? { ...leadMagnet, ...input }
              : leadMagnet,
          ),
        }
      })

      return { previousSnapshot }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousSnapshot) {
        queryClient.setQueryData(crmSnapshotQueryKey, context.previousSnapshot)
      }
    },
    onSuccess: (snapshot) => {
      queryClient.setQueryData(crmSnapshotQueryKey, snapshot)
    },
  })
}

export function useMarkApprentissageUsage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      apprentissageId,
      input,
    }: {
      apprentissageId: string
      input: MarkContentUsedInput
    }) => activeSheetGateway.markApprentissageUsage(apprentissageId, input),
    onMutate: async ({ apprentissageId, input }) => {
      await queryClient.cancelQueries({ queryKey: crmSnapshotQueryKey })
      const previousSnapshot =
        queryClient.getQueryData<CrmSnapshot>(crmSnapshotQueryKey)

      queryClient.setQueryData<CrmSnapshot>(crmSnapshotQueryKey, (current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          apprentissages: current.apprentissages.map((apprentissage) =>
            apprentissage.id === apprentissageId
              ? { ...apprentissage, ...input }
              : apprentissage,
          ),
        }
      })

      return { previousSnapshot }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousSnapshot) {
        queryClient.setQueryData(crmSnapshotQueryKey, context.previousSnapshot)
      }
    },
    onSuccess: (snapshot) => {
      queryClient.setQueryData(crmSnapshotQueryKey, snapshot)
    },
  })
}

export function useAppendRelance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: Relance) => activeSheetGateway.appendRelance(input),
    onSuccess: (snapshot) => {
      queryClient.setQueryData(crmSnapshotQueryKey, snapshot)
    },
  })
}

export function useAppendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: Message) => activeSheetGateway.appendMessage(input),
    onSuccess: (snapshot) => {
      queryClient.setQueryData(crmSnapshotQueryKey, snapshot)
    },
  })
}
