import type { CrmSnapshot } from '../domain/crmTypes'
import { crmSnapshotSchema } from '../schemas/crmSnapshot.schema'

const rawMockCrmSnapshot = {
  prospects: [
    {
      id: 'P003',
      contact: 'Girard RAJAONARIHAGA',
      organisation: 'Fifatech',
      role: 'Fondateur et dirigeant',
      commercialRole: 'Client direct potentiel',
      sector: 'Telecommunications, infrastructures reseau',
      zone: 'Madagascar',
      channel: 'LinkedIn',
      source: 'DM accepte',
      website: 'https://www.fifatech.mg',
      linkedin: '',
      firstContactDate: '2026-05-28',
      status: 'conversation',
      score: '4',
      likelyOffer: 'Diagnostic Clarte, puis SURF Presence + Care',
      angle: 'Site en reconstruction et qualification des demandes techniques',
      visibleProblem:
        'Site momentanement ferme et en reconstruction, moment favorable pour clarifier le role commercial du futur site.',
      conversationGoal:
        'Comprendre comment le futur site doit aider les prospects a formuler la bonne demande.',
      nextAction: 'Revue apres proposition de questions de cadrage',
      nextActionDate: '2026-06-18',
      response:
        'Le site a ete momentanement ferme et est actuellement en cours de construction.',
      objectionOrInsight:
        'Un site en reconstruction est une fenetre ideale pour clarifier son role commercial.',
      linkedInIdea:
        "Le bon moment pour penser le parcours client, c'est avant la mise en ligne.",
      leadMagnet:
        '9 questions a poser avant de remettre en ligne un site technique',
      notes: 'Conversation ouverte.',
    },
    {
      id: 'P006',
      contact: 'Rivo RAKOTONDRASANJY',
      organisation: 'AA Environment and Partners',
      role: 'Directeur General filiale Madagascar & Ocean Indien',
      commercialRole: 'Prescripteur potentiel',
      sector: 'Environnement, impact, recherche',
      zone: 'Madagascar / Ocean Indien',
      channel: 'LinkedIn',
      source: 'DM accepte',
      website: 'A renseigner',
      linkedin: 'https://www.linkedin.com/in/rivo-rakotondrasanjy-59641237/',
      firstContactDate: '2026-05-29',
      status: 'conversation',
      score: '5',
      likelyOffer: 'Partenariat prescripteur / Diagnostic Clarte',
      angle:
        'Identifier des structures a expertise forte mais besoin digital mal cadre.',
      visibleProblem:
        'Des projets a impact peuvent manquer de lisibilite pour les bons partenaires.',
      conversationGoal:
        'Explorer un cadre simple de recommandation de projets pertinents.',
      nextAction: 'Attendre reponse apres proposition de partenariat prescripteur',
      nextActionDate: '2026-06-18',
      response:
        'Toutes solutions doivent emaner ou implanter dans les Universites pour faciliter leur adaptation et adoption.',
      objectionOrInsight:
        "L'adoption depend aussi de l'ancrage universitaire, pas seulement de la visibilite.",
      linkedInIdea:
        "Une solution utile doit trouver son lieu d'adoption, pas seulement son canal de visibilite.",
      leadMagnet:
        'Structurer un partenariat de prescription sans solliciter un reseau au hasard',
      notes: 'Ton direct recommande.',
    },
    {
      id: 'P008',
      contact: 'Coralie Ramakavelo',
      organisation: 'A renseigner',
      role: 'Accompagnement entrepreneurial',
      commercialRole: 'Partenaire potentiel',
      sector: 'Entrepreneuriat, accompagnement',
      zone: 'Madagascar',
      channel: 'LinkedIn',
      source: 'Follower LinkedIn',
      website: 'A renseigner',
      linkedin: '',
      firstContactDate: '2026-06-04',
      status: 'pilot-discussion',
      score: '5',
      likelyOffer: 'Partenariat / prescription / Diagnostic Clarte',
      angle:
        'SURF comme ressource complementaire quand un projet accompagne passe a execution digitale.',
      visibleProblem:
        "Les entrepreneurs bloquent souvent avant le digital sur cible, marche, viabilite et tests.",
      conversationGoal:
        'Tester un pilote sur 2 ou 3 entrepreneurs accompagnes.',
      nextAction: 'Verifier son retour sur le PDF pilote',
      nextActionDate: '2026-06-19',
      response: 'Nous sommes toujours ouverts aux collaboration. Que proposez vous ?',
      objectionOrInsight:
        'Un pilote limite permet de clarifier les roles avant de formaliser un partenariat.',
      linkedInIdea:
        'Tester une collaboration sur de vrais projets avant de parler partenariat durable.',
      leadMagnet:
        'Un projet est-il pret a passer a execution digitale ?',
      notes: 'Pilote propose et document envoye.',
    },
    {
      id: 'P023',
      contact: 'Alfred Ratsararay',
      organisation: 'SAHAZA Group / CanCham Madagascar',
      role: 'Founder & Managing Director / Executive Secretary',
      commercialRole: 'Prescripteur',
      sector: 'Reseau business, entrepreneuriat, chambre de commerce',
      zone: 'Madagascar / Canada',
      channel: 'LinkedIn',
      source: 'OUTBOUND_POOL',
      website: 'A renseigner',
      linkedin:
        'https://www.linkedin.com/in/ACoAABip9o0BOOPqov98PKGGIEvgnN60ny1nyv0',
      firstContactDate: '2026-06-17',
      status: 'conversation',
      score: '5',
      likelyOffer: 'Echange exploratoire / partenariat prescripteur',
      angle:
        'Complementarite entre accompagnement digitalisation et cadrage SURF.',
      visibleProblem:
        'Des entreprises veulent accelerer leur digitalisation sans vision claire des priorites.',
      conversationGoal:
        'Obtenir un echange court sans se positionner en concurrent de leurs equipes.',
      nextAction: 'Attendre reponse a la proposition de court echange',
      nextActionDate: '2026-06-21',
      response:
        'Il rencontre des entreprises souhaitant accelerer leur digitalisation sans vision claire des priorites.',
      objectionOrInsight:
        'Ne pas remplacer leur approche, mais comparer les methodes de cadrage.',
      linkedInIdea:
        'Quand un reseau accompagne deja la digitalisation, le bon angle est la complementarite.',
      leadMagnet:
        'Comment echanger avec un acteur qui accompagne deja la digitalisation sans se positionner en concurrent ?',
      notes: 'Nom initial pool : Alfred ANDRIANJATOVO.',
    },
  ],
  messages: [
    {
      prospectId: 'P003',
      contact: 'Girard RAJAONARIHAGA',
      organisation: 'Fifatech',
      date: '2026-06-04',
      sourceLabel: 'Reponse envoyee le 2026-06-04',
      type: 'Reponse envoyee',
      direction: 'Sortant',
      state: 'Envoye',
      exactContent:
        "Justement, le fait que le site soit en reconstruction rend le sujet encore plus interessant. J'essaie de comprendre comment vous voulez que le futur site aide vos prospects a formuler la bonne demande.",
      messageId: 'MSG009',
    },
    {
      prospectId: 'P006',
      contact: 'Rivo RAKOTONDRASANJY',
      organisation: 'AA Environment and Partners',
      date: '2026-06-11',
      sourceLabel: 'Proposition de partenariat envoyee le 2026-06-11',
      type: 'Proposition',
      direction: 'Sortant',
      state: 'Envoye',
      exactContent:
        "Je vois une complementarite possible entre votre connaissance des universites, des entreprises et des projets a impact, et ce que je construis avec SURF.",
      messageId: 'MSG023',
    },
    {
      prospectId: 'P008',
      contact: 'Coralie Ramakavelo',
      organisation: 'A renseigner',
      date: '2026-06-12',
      sourceLabel: 'Proposition pilote envoyee le 2026-06-12',
      type: 'Proposition',
      direction: 'Sortant',
      state: 'Envoye',
      exactContent:
        'Je vous propose de commencer par un pilote simple sur 2 ou 3 entrepreneurs que vous accompagnez.',
      messageId: 'MSG037',
    },
    {
      prospectId: 'P023',
      contact: 'Alfred Ratsararay',
      organisation: 'SAHAZA Group / CanCham Madagascar',
      date: '2026-06-17',
      sourceLabel: 'Reponse recue le 2026-06-17',
      type: 'Reponse recue',
      direction: 'Entrant',
      state: 'Recu',
      exactContent:
        'Nous accompagnons deja nos clients dans leur digitalisation, mais je reste ouvert a echanger avec des acteurs du secteur.',
      messageId: 'MSG075',
    },
  ],
  relances: [
    {
      id: 'R001',
      date: '2026-06-16',
      prospectName: 'Rivo RAKOTONDRASANJY',
      action: 'Verifier si Rivo a repondu a la proposition de partenariat',
      reference: 'Relance de controle ajoutee au mock',
      state: 'A faire',
      prospectId: 'P006',
    },
    {
      id: 'R002',
      date: '2026-06-17',
      prospectName: 'Alfred Ratsararay',
      action: 'Repondre au signal positif sur la digitalisation sans priorites claires',
      reference: 'Reponse recue le 2026-06-17',
      state: 'A faire',
      prospectId: 'P023',
    },
    {
      id: 'R003',
      date: '2026-06-18',
      prospectName: 'Fifatech',
      action: 'Revue apres proposition de questions de cadrage',
      reference: 'Voir section detaillee',
      state: 'A faire',
      prospectId: 'P003',
    },
    {
      id: 'R004',
      date: '2026-06-18',
      prospectName: 'Rivo RAKOTONDRASANJY',
      action: 'Revue apres proposition de partenariat prescripteur',
      reference: 'Voir section detaillee',
      state: 'A faire',
      prospectId: 'P006',
    },
    {
      id: 'R006',
      date: '2026-06-19',
      prospectName: 'Coralie Ramakavelo',
      action: 'Verifier son retour sur le PDF et proposer un court cadrage si le pilote est valide',
      reference: 'Voir section detaillee',
      state: 'A faire',
      prospectId: 'P008',
    },
    {
      id: 'R020',
      date: '2026-06-21',
      prospectName: 'Alfred Ratsararay',
      action: 'Relance J+4 si silence apres proposition de court echange',
      reference: 'Voir message P023 dans Messages',
      state: 'A faire',
      prospectId: 'P023',
    },
  ],
  outboundTargets: [
    {
      poolId: 'OUT-20260616-006',
      extractionDate: '2026-06-16',
      source: 'LinkedIn followers - Codex Chrome',
      name: 'Alfred ANDRIANJATOVO',
      linkedinUrl:
        'https://www.linkedin.com/in/ACoAABip9o0BOOPqov98PKGGIEvgnN60ny1nyv0',
      headline:
        'Founder & Managing Director of SAHAZA Group - Executive Secretary at the CanCham Madagascar',
      company: 'SAHAZA Group / CanCham Madagascar',
      role: 'Founder & Managing Director',
      targetType: 'prescripteur',
      priority: 'A',
      preliminaryScore: '5',
      preliminaryAngle: 'Reseau business Madagascar-Canada',
      selectionReason: 'Position de reseau propice aux recommandations B2B',
      poolStatus: 'migrated',
      migratedToPipeline: 'TRUE',
      pipelineId: 'P023',
      lastAction: 'Migre vers Prospects le 2026-06-17',
      notes: 'Message envoye et pipeline mis a jour le 2026-06-17',
    },
    {
      poolId: 'OUT-20260616-007',
      extractionDate: '2026-06-16',
      source: 'LinkedIn followers - Codex Chrome',
      name: 'Tahiry RASAMOELISON',
      linkedinUrl:
        'https://www.linkedin.com/in/ACoAABq4O8YBXFBTXqY8rGyhpIMe6f02broKz0g',
      headline:
        "Directeur des Operations chez CCIMM - Chambre de Commerce et d'Industrie Maurice Madagascar & AIOCCI",
      company: 'CCIMM / AIOCCI',
      role: 'Directeur des Operations',
      targetType: 'prescripteur',
      priority: 'A',
      preliminaryScore: '5',
      preliminaryAngle: 'Reseau entreprises Maurice-Madagascar',
      selectionReason: 'Acteur chambre de commerce, bon canal prescripteur',
      poolStatus: 'new',
      migratedToPipeline: 'FALSE',
      pipelineId: '',
      lastAction: 'Extraction Codex 2026-06-16',
      notes: '',
    },
  ],
  leadMagnets: [
    {
      id: 'LM003',
      date: '2026-05-28',
      sourceProspect: 'Fifatech',
      type: 'Diagnostic Guide',
      provisionalTitle:
        '9 questions a poser avant de remettre en ligne un site technique',
      keyword: 'RECONSTRUCTION',
      angleOrUse:
        "Profiter d'une refonte pour clarifier le role commercial du futur site.",
      usedInPost: 'non',
      postUseDate: '',
      postTitle: '',
      postArchive: '',
      postFormat: '',
      contentStatus: 'a utiliser',
      sourceProspectId: 'P003',
    },
    {
      id: 'LM015',
      date: '2026-06-12',
      sourceProspect: 'Coralie Ramakavelo',
      type: 'Mini-diagnostic',
      provisionalTitle: 'Un projet est-il pret a passer a execution digitale ?',
      keyword: 'EXECUTION',
      angleOrUse:
        "Aider un accompagnateur et un entrepreneur a decider s'il faut construire une presence, un prototype, un outil ou attendre.",
      usedInPost: 'non',
      postUseDate: '',
      postTitle: '',
      postArchive: '',
      postFormat: '',
      contentStatus: 'a utiliser',
      sourceProspectId: 'P008',
    },
    {
      id: 'LM026',
      date: '2026-06-17',
      sourceProspect: 'Alfred ANDRIANJATOVO / CanCham Madagascar',
      type: 'Guide de prescription',
      provisionalTitle:
        'Dans quels cas un reseau business doit orienter une entreprise vers un cadrage digital ?',
      keyword: 'RESEAU',
      angleOrUse:
        "Aider les reseaux business a reconnaitre les entreprises qui veulent se digitaliser sans point de depart clair.",
      usedInPost: 'non',
      postUseDate: '',
      postTitle: '',
      postArchive: '',
      postFormat: '',
      contentStatus: 'a utiliser',
      sourceProspectId: 'P023',
    },
  ],
  apprentissages: [
    {
      id: 'AT007',
      date: '2026-06-01',
      fieldLearning:
        'Un site en reconstruction est une fenetre ideale pour clarifier son role commercial avant de figer les pages.',
      linkedInUse:
        "Post Pilier 2 : le bon moment pour penser le parcours client, c'est avant la mise en ligne.",
      usedInPost: 'non',
      postUseDate: '',
      postTitle: '',
      postArchive: '',
      postFormat: '',
      contentStatus: 'a utiliser',
      sourceProspectId: 'P003',
    },
    {
      id: 'AT016',
      date: '2026-06-12',
      fieldLearning:
        'Pour tester une collaboration avec un accompagnateur, commencer par 2 ou 3 projets permet de clarifier les roles.',
      linkedInUse:
        'Post Pilier 4 : tester une collaboration sur de vrais projets avant de parler partenariat durable.',
      usedInPost: 'non',
      postUseDate: '',
      postTitle: '',
      postArchive: '',
      postFormat: '',
      contentStatus: 'a utiliser',
      sourceProspectId: 'P008',
    },
    {
      id: 'AT027',
      date: '2026-06-17',
      fieldLearning:
        "Dans un reseau business, la valeur d'un prescripteur augmente quand il sait reconnaitre les signaux d'un besoin digital mal cadre.",
      linkedInUse:
        'Post Pilier 4 : un reseau ne doit pas seulement transmettre des contacts ; il peut aider les entreprises a reconnaitre le bon moment pour cadrer.',
      usedInPost: 'non',
      postUseDate: '',
      postTitle: '',
      postArchive: '',
      postFormat: '',
      contentStatus: 'a utiliser',
      sourceProspectId: 'P023',
    },
  ],
}

export const mockCrmSnapshot = crmSnapshotSchema.parse(
  rawMockCrmSnapshot,
) as CrmSnapshot
