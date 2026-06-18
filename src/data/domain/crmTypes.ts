export const prospectStatuses = [
  'identified',
  'contacted',
  'replied',
  'conversation',
  'diagnostic-proposed',
  'diagnostic-scheduled',
  'diagnostic-done',
  'demo-proposed',
  'demo-scheduled',
  'demo-done',
  'pilot-discussion',
  'procurement-review',
  'proposal-sent',
  'won',
  'lost',
  'nurturing',
  'no-response',
  'archived',
] as const

export type ProspectStatus = (typeof prospectStatuses)[number]

export const relanceStates = ['A faire', 'Fait', 'Planifie', 'Ignore'] as const

export type RelanceState = (typeof relanceStates)[number]

export const outboundStatuses = [
  'new',
  'analyzed',
  'migrated',
  'skipped',
] as const

export type OutboundStatus = (typeof outboundStatuses)[number]

export const priorityLevels = ['A', 'B', 'C'] as const

export type PriorityLevel = (typeof priorityLevels)[number]

export const contentStatuses = [
  'a utiliser',
  'draft',
  'published',
  'archived',
] as const

export type ContentStatus = (typeof contentStatuses)[number]

export type DateString = string

export type Prospect = {
  id: string
  contact: string
  organisation: string
  role: string
  commercialRole: string
  sector: string
  zone: string
  channel: string
  source: string
  website: string
  linkedin: string
  firstContactDate: DateString
  status: ProspectStatus
  score: number | null
  likelyOffer: string
  angle: string
  visibleProblem: string
  conversationGoal: string
  nextAction: string
  nextActionDate: DateString
  response: string
  objectionOrInsight: string
  linkedInIdea: string
  leadMagnet: string
  notes: string
}

export type Message = {
  prospectId: string
  contact: string
  organisation: string
  date: DateString
  sourceLabel: string
  type: string
  direction: 'Entrant' | 'Sortant'
  state: string
  exactContent: string
  messageId: string
}

export type Relance = {
  id: string
  date: DateString
  prospectName: string
  action: string
  reference: string
  state: RelanceState
  prospectId: string
}

export type OutboundTarget = {
  poolId: string
  extractionDate: DateString
  source: string
  name: string
  linkedinUrl: string
  headline: string
  company: string
  role: string
  targetType: string
  priority: PriorityLevel
  preliminaryScore: number
  preliminaryAngle: string
  selectionReason: string
  poolStatus: OutboundStatus
  migratedToPipeline: boolean
  pipelineId: string
  lastAction: string
  notes: string
}

export type LeadMagnet = {
  id: string
  date: DateString
  sourceProspect: string
  type: string
  provisionalTitle: string
  keyword: string
  angleOrUse: string
  usedInPost: boolean
  postUseDate: DateString
  postTitle: string
  postArchive: string
  postFormat: string
  contentStatus: ContentStatus
  sourceProspectId: string
}

export type Apprentissage = {
  id: string
  date: DateString
  fieldLearning: string
  linkedInUse: string
  usedInPost: boolean
  postUseDate: DateString
  postTitle: string
  postArchive: string
  postFormat: string
  contentStatus: ContentStatus
  sourceProspectId: string
}

export type WeeklyReview = {
  reportDate: DateString
  week: string
  analyzedPeriod: string
  executiveSummary: string
  highlights: string
  keyNumbers: string
  conclusions: string
  nextWeekImprovements: string
  priorityActions: string
  risks: string
  sourcesRead: string
  status: string
}

export type CrmSnapshot = {
  prospects: Prospect[]
  messages: Message[]
  relances: Relance[]
  outboundTargets: OutboundTarget[]
  leadMagnets: LeadMagnet[]
  apprentissages: Apprentissage[]
  weeklyReviews: WeeklyReview[]
}
