import { z } from 'zod'

import { prospectSchema } from './prospect.schema'
import { messageSchema } from './message.schema'
import { relanceSchema } from './relance.schema'
import { outboundTargetSchema } from './outbound.schema'
import { apprentissageSchema, leadMagnetSchema } from './insight.schema'
import { weeklyReviewSchema } from './weeklyReview.schema'

export const crmSnapshotSchema = z.object({
  prospects: z.array(prospectSchema),
  messages: z.array(messageSchema),
  relances: z.array(relanceSchema),
  outboundTargets: z.array(outboundTargetSchema),
  leadMagnets: z.array(leadMagnetSchema),
  apprentissages: z.array(apprentissageSchema),
  weeklyReviews: z.array(weeklyReviewSchema),
})
