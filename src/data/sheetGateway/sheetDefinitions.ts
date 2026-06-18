import type { CrmSnapshot } from '../domain/crmTypes'

export type SheetEntity = keyof CrmSnapshot

export type SheetFieldDefinition = {
  key: string
  header: string
  aliases?: readonly string[]
}

export type SheetDefinition = {
  entity: SheetEntity
  defaultTabName: string
  idKey: string
  fields: readonly SheetFieldDefinition[]
}

const prospectFields = [
  { key: 'id', header: 'id', aliases: ['ID', 'Prospect ID'] },
  { key: 'contact', header: 'contact', aliases: ['Contact', 'Prospect', 'Nom'] },
  {
    key: 'organisation',
    header: 'organisation',
    aliases: ['Organisation', 'Entreprise', 'Company'],
  },
  { key: 'role', header: 'role', aliases: ['Role', 'Rôle', 'Titre'] },
  {
    key: 'commercialRole',
    header: 'commercialRole',
    aliases: ['Role commercial', 'Rôle commercial', 'Type cible'],
  },
  { key: 'sector', header: 'sector', aliases: ['Secteur', 'Industry'] },
  { key: 'zone', header: 'zone', aliases: ['Zone', 'Pays'] },
  { key: 'channel', header: 'channel', aliases: ['Canal', 'Channel'] },
  { key: 'source', header: 'source', aliases: ['Source'] },
  { key: 'website', header: 'website', aliases: ['Site', 'Site web', 'Website'] },
  { key: 'linkedin', header: 'linkedin', aliases: ['LinkedIn', 'Linkedin URL'] },
  {
    key: 'firstContactDate',
    header: 'firstContactDate',
    aliases: ['Date premier contact', 'First contact date'],
  },
  { key: 'status', header: 'status', aliases: ['Statut', 'Status'] },
  { key: 'score', header: 'score', aliases: ['Score', 'Fit'] },
  {
    key: 'likelyOffer',
    header: 'likelyOffer',
    aliases: ['Offre probable', 'Offer'],
  },
  { key: 'angle', header: 'angle', aliases: ['Angle'] },
  {
    key: 'visibleProblem',
    header: 'visibleProblem',
    aliases: ['Probleme visible', 'Problème visible'],
  },
  {
    key: 'conversationGoal',
    header: 'conversationGoal',
    aliases: ['But conversation', 'Objectif conversation'],
  },
  {
    key: 'nextAction',
    header: 'nextAction',
    aliases: ['Prochaine action', 'Next action'],
  },
  {
    key: 'nextActionDate',
    header: 'nextActionDate',
    aliases: ['Date prochaine action', 'Next action date'],
  },
  { key: 'response', header: 'response', aliases: ['Reponse', 'Réponse'] },
  {
    key: 'objectionOrInsight',
    header: 'objectionOrInsight',
    aliases: ['Objection ou insight', 'Objection / Insight'],
  },
  {
    key: 'linkedInIdea',
    header: 'linkedInIdea',
    aliases: ['Idee LinkedIn', 'Idée LinkedIn'],
  },
  {
    key: 'leadMagnet',
    header: 'leadMagnet',
    aliases: ['Lead magnet', 'Lead Magnet'],
  },
  { key: 'notes', header: 'notes', aliases: ['Notes'] },
] as const

const messageFields = [
  {
    key: 'prospectId',
    header: 'prospectId',
    aliases: [
      'Prospect ID', 'ID prospect', 'ID Prospect', 'prospect_id', 'ProspectID',
    ],
  },
  { key: 'contact', header: 'contact', aliases: ['Contact', 'Prospect', 'Nom'] },
  {
    key: 'organisation',
    header: 'organisation',
    aliases: ['Organisation', 'Entreprise', 'Company'],
  },
  { key: 'date', header: 'date', aliases: ['Date'] },
  {
    key: 'sourceLabel',
    header: 'sourceLabel',
    aliases: [
      'Source label', 'Libelle source', 'Libellé source',
      'Libell\u00e9 source', 'Libelle', 'Source',
    ],
  },
  { key: 'type', header: 'type', aliases: ['Type'] },
  { key: 'direction', header: 'direction', aliases: ['Direction', 'Sens'] },
  { key: 'state', header: 'state', aliases: ['Etat', 'État', 'Statut', 'Status'] },
  {
    key: 'exactContent',
    header: 'exactContent',
    aliases: ['Contenu exact', 'Message', 'Contenu'],
  },
  {
    key: 'messageId',
    header: 'messageId',
    aliases: ['Message ID', 'message_id', 'ID', 'MessageID'],
  },
] as const

const relanceFields = [
  { key: 'id', header: 'id', aliases: ['ID', 'Relance ID', 'relance_id'] },
  { key: 'date', header: 'date', aliases: ['Date'] },
  {
    key: 'prospectName',
    header: 'prospectName',
    aliases: ['Prospect', 'Nom prospect', 'Nom'],
  },
  { key: 'action', header: 'action', aliases: ['Action', 'Prochaine action', 'Next action'] },
  {
    key: 'reference',
    header: 'reference',
    aliases: [
      'Reference', 'Référence', 'Ref',
      'Message / reference', 'Message / référence',
      'Message/reference', 'Message/référence',
    ],
  },
  { key: 'state', header: 'state', aliases: ['Etat', 'État', 'Statut', 'Status'] },
  {
    key: 'prospectId',
    header: 'prospectId',
    aliases: ['Prospect ID', 'ID prospect', 'ID Prospect', 'prospect_id'],
  },
] as const

const outboundFields = [
  {
    key: 'poolId',
    header: 'poolId',
    aliases: ['Pool ID', 'POOL_ID', 'ID', 'pool_id', 'PoolID'],
  },
  {
    key: 'extractionDate',
    header: 'extractionDate',
    aliases: ['Date extraction', 'Extraction date'],
  },
  { key: 'source', header: 'source', aliases: ['Source'] },
  { key: 'name', header: 'name', aliases: ['Nom', 'Name', 'Nom complet', 'Full name', 'Prénom Nom'] },
  {
    key: 'linkedinUrl',
    header: 'linkedinUrl',
    aliases: ['LinkedIn URL', 'Lien LinkedIn', 'LinkedIn', 'Linkedin', 'URL LinkedIn'],
  },
  { key: 'headline', header: 'headline', aliases: ['Headline', 'Titre', 'Poste'] },
  {
    key: 'company',
    header: 'company',
    aliases: ['Entreprise', 'Company', 'Organisation', 'Société'],
  },
  { key: 'role', header: 'role', aliases: ['Role', 'Rôle', 'Poste', 'Fonction'] },
  { key: 'targetType', header: 'targetType', aliases: ['Type cible', 'Type', 'Cible'] },
  {
    key: 'priority',
    header: 'priority',
    aliases: ['Priorite', 'Priorité', 'Priority', 'Prio'],
  },
  {
    key: 'preliminaryScore',
    header: 'preliminaryScore',
    aliases: ['Score preliminaire', 'Score préliminaire', 'Score /5', 'Score'],
  },
  {
    key: 'preliminaryAngle',
    header: 'preliminaryAngle',
    aliases: ['Angle preliminaire', 'Angle préliminaire', 'Angle'],
  },
  {
    key: 'selectionReason',
    header: 'selectionReason',
    aliases: ['Raison selection', 'Raison sélection', 'Raison', 'Pourquoi'],
  },
  {
    key: 'poolStatus',
    header: 'poolStatus',
    aliases: ['Statut pool', 'Pool status', 'Statut', 'Status', 'Etat', 'État'],
  },
  {
    key: 'migratedToPipeline',
    header: 'migratedToPipeline',
    aliases: ['Migre pipeline', 'Migré pipeline', 'Migré pipeline ?', 'Pipeline'],
  },
  {
    key: 'pipelineId',
    header: 'pipelineId',
    aliases: ['Pipeline ID', 'pipeline_id'],
  },
  {
    key: 'lastAction',
    header: 'lastAction',
    aliases: ['Derniere action', 'Dernière action', 'Last action'],
  },
  { key: 'notes', header: 'notes', aliases: ['Notes', 'Commentaires'] },
] as const

const leadMagnetFields = [
  { key: 'id', header: 'id', aliases: ['ID', 'Lead magnet ID'] },
  { key: 'date', header: 'date', aliases: ['Date'] },
  {
    key: 'sourceProspect',
    header: 'sourceProspect',
    aliases: ['Prospect source', 'Source prospect'],
  },
  { key: 'type', header: 'type', aliases: ['Type'] },
  {
    key: 'provisionalTitle',
    header: 'provisionalTitle',
    aliases: ['Titre provisoire', 'Titre'],
  },
  { key: 'keyword', header: 'keyword', aliases: ['Mot cle', 'Mot clé'] },
  {
    key: 'angleOrUse',
    header: 'angleOrUse',
    aliases: ['Angle ou usage', 'Usage'],
  },
  {
    key: 'usedInPost',
    header: 'usedInPost',
    aliases: ['Utilise post', 'Utilisé post'],
  },
  {
    key: 'postUseDate',
    header: 'postUseDate',
    aliases: ['Date usage post'],
  },
  { key: 'postTitle', header: 'postTitle', aliases: ['Titre post'] },
  { key: 'postArchive', header: 'postArchive', aliases: ['Archive post'] },
  { key: 'postFormat', header: 'postFormat', aliases: ['Format post'] },
  {
    key: 'contentStatus',
    header: 'contentStatus',
    aliases: ['Statut contenu'],
  },
  {
    key: 'sourceProspectId',
    header: 'sourceProspectId',
    aliases: ['Prospect source ID', 'Source prospect ID'],
  },
] as const

const apprentissageFields = [
  { key: 'id', header: 'id', aliases: ['ID', 'Apprentissage ID'] },
  { key: 'date', header: 'date', aliases: ['Date'] },
  {
    key: 'fieldLearning',
    header: 'fieldLearning',
    aliases: ['Apprentissage terrain', 'Learning'],
  },
  {
    key: 'linkedInUse',
    header: 'linkedInUse',
    aliases: ['Usage LinkedIn', 'LinkedIn use'],
  },
  {
    key: 'usedInPost',
    header: 'usedInPost',
    aliases: ['Utilise post', 'Utilisé post'],
  },
  {
    key: 'postUseDate',
    header: 'postUseDate',
    aliases: ['Date usage post'],
  },
  { key: 'postTitle', header: 'postTitle', aliases: ['Titre post'] },
  { key: 'postArchive', header: 'postArchive', aliases: ['Archive post'] },
  { key: 'postFormat', header: 'postFormat', aliases: ['Format post'] },
  {
    key: 'contentStatus',
    header: 'contentStatus',
    aliases: ['Statut contenu'],
  },
  {
    key: 'sourceProspectId',
    header: 'sourceProspectId',
    aliases: ['Prospect source ID', 'Source prospect ID'],
  },
] as const

const weeklyReviewFields = [
  {
    key: 'reportDate',
    header: 'reportDate',
    aliases: ['Date du bilan', 'Date bilan'],
  },
  { key: 'week', header: 'week', aliases: ['Semaine', 'Week'] },
  {
    key: 'analyzedPeriod',
    header: 'analyzedPeriod',
    aliases: ['Periode analysee', 'Période analysée', 'Periode analyse'],
  },
  {
    key: 'executiveSummary',
    header: 'executiveSummary',
    aliases: ['Resume executif', 'Résumé exécutif', 'Summary'],
  },
  {
    key: 'highlights',
    header: 'highlights',
    aliases: ['Faits marquants', 'Highlights'],
  },
  {
    key: 'keyNumbers',
    header: 'keyNumbers',
    aliases: ['Chiffres cles', 'Chiffres clés', 'Key numbers'],
  },
  {
    key: 'conclusions',
    header: 'conclusions',
    aliases: ['Conclusions'],
  },
  {
    key: 'nextWeekImprovements',
    header: 'nextWeekImprovements',
    aliases: [
      'Ameliorations semaine prochaine',
      'Améliorations semaine prochaine',
      'Improvements',
    ],
  },
  {
    key: 'priorityActions',
    header: 'priorityActions',
    aliases: ['Actions prioritaires', 'Priority actions'],
  },
  {
    key: 'risks',
    header: 'risks',
    aliases: [
      'Risques / points de vigilance',
      'Risques',
      'Points de vigilance',
    ],
  },
  {
    key: 'sourcesRead',
    header: 'sourcesRead',
    aliases: ['Sources lues', 'Sources'],
  },
  { key: 'status', header: 'status', aliases: ['Statut', 'Status'] },
] as const

export const sheetDefinitions = {
  prospects: {
    entity: 'prospects',
    defaultTabName: 'Prospects',
    idKey: 'id',
    fields: prospectFields,
  },
  messages: {
    entity: 'messages',
    defaultTabName: 'Messages',
    idKey: 'messageId',
    fields: messageFields,
  },
  relances: {
    entity: 'relances',
    defaultTabName: 'Relances',
    idKey: 'id',
    fields: relanceFields,
  },
  outboundTargets: {
    entity: 'outboundTargets',
    defaultTabName: 'OUTBOUND_POOL',
    idKey: 'poolId',
    fields: outboundFields,
  },
  leadMagnets: {
    entity: 'leadMagnets',
    defaultTabName: 'Lead_Magnets',
    idKey: 'id',
    fields: leadMagnetFields,
  },
  apprentissages: {
    entity: 'apprentissages',
    defaultTabName: 'Apprentissages',
    idKey: 'id',
    fields: apprentissageFields,
  },
  weeklyReviews: {
    entity: 'weeklyReviews',
    defaultTabName: 'Bilans hebdomadaires',
    idKey: 'week',
    fields: weeklyReviewFields,
  },
} as const satisfies Record<SheetEntity, SheetDefinition>

export const sheetEntityKeys = Object.keys(sheetDefinitions) as SheetEntity[]
