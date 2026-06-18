import { useQuery } from '@tanstack/react-query'

import { activeSheetGateway } from '../sheetGateway/activeSheetGateway'
import { deriveCrmQualityReport } from '../transforms/deriveCrmQualityReport'

export const crmQualityReportQueryKey = ['crm-quality-report'] as const

export function useCrmQualityReport() {
  return useQuery({
    queryKey: crmQualityReportQueryKey,
    queryFn: async () => {
      const valuesByEntity = await activeSheetGateway.getRawValues()
      return deriveCrmQualityReport(valuesByEntity)
    },
    retry: false,
  })
}
