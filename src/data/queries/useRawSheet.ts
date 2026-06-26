import { useQuery } from '@tanstack/react-query'

import { activeSheetGateway } from '../sheetGateway/activeSheetGateway'
import type { RawSheetKey } from '../sheetGateway/sheetGateway'

export function rawSheetQueryKey(key: RawSheetKey) {
  return ['raw-sheet', key] as const
}

export function useRawSheet(key: RawSheetKey) {
  return useQuery({
    queryKey: rawSheetQueryKey(key),
    queryFn: () => activeSheetGateway.getRawSheet(key),
    retry: false,
  })
}
