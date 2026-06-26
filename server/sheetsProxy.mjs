import {
  createHash,
  createHmac,
  createSign,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";

function parseEnvLine(line) {
  const trimmedLine = line.trim();

  if (!trimmedLine || trimmedLine.startsWith("#")) {
    return null;
  }

  const normalizedLine = trimmedLine.startsWith("export ")
    ? trimmedLine.slice(7).trim()
    : trimmedLine;

  const separatorIndex = normalizedLine.indexOf("=");

  if (separatorIndex < 1) {
    return null;
  }

  const key = normalizedLine.slice(0, separatorIndex).trim();
  let value = normalizedLine.slice(separatorIndex + 1).trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return { key, value };
}

function loadEnvFile(path) {
  if (!existsSync(path)) {
    return;
  }

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const entry = parseEnvLine(line);

    if (entry && process.env[entry.key] === undefined) {
      process.env[entry.key] = entry.value;
    }
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const DEFAULT_PORT = 8787;
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_SHEETS_BASE_URL = "https://sheets.googleapis.com/v4/spreadsheets";
const GOOGLE_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const AUTH_ENABLED = parseBooleanEnv(process.env.CRM_AUTH_ENABLED, false);
const AUTH_USERNAME = process.env.CRM_AUTH_USERNAME || "admin";
const AUTH_PASSWORD_HASH = process.env.CRM_AUTH_PASSWORD_HASH || "";
const AUTH_PASSWORD = process.env.CRM_AUTH_PASSWORD || "";
const SESSION_SECRET = process.env.CRM_SESSION_SECRET || "";
const SESSION_TTL_SECONDS = parsePositiveNumber(
  process.env.CRM_SESSION_TTL_SECONDS,
  60 * 60 * 8,
);
const SESSION_COOKIE_NAME =
  process.env.CRM_SESSION_COOKIE_NAME || "surf_crm_session";
const SESSION_COOKIE_SECURE = parseBooleanEnv(
  process.env.CRM_COOKIE_SECURE,
  process.env.NODE_ENV === "production",
);
const MAX_FAILED_LOGINS = parsePositiveNumber(
  process.env.CRM_AUTH_MAX_FAILED_LOGINS,
  5,
);
const LOGIN_WINDOW_MS =
  parsePositiveNumber(process.env.CRM_AUTH_WINDOW_SECONDS, 15 * 60) * 1000;

const HEADER_ROW_NUMBER = Number(process.env.GOOGLE_SHEET_HEADER_ROW || 3);
const READ_LAST_COLUMN = process.env.GOOGLE_SHEET_READ_LAST_COLUMN || "Z";

const entityOrder = [
  "prospects",
  "messages",
  "relances",
  "outboundTargets",
  "leadMagnets",
  "apprentissages",
  "weeklyReviews",
];

const entityTabs = {
  prospects: "Prospects",
  messages: "Messages",
  relances: "Relances",
  outboundTargets: "OUTBOUND_POOL",
  leadMagnets: "Lead magnets",
  apprentissages: "Apprentissages",
  weeklyReviews: "Bilans hebdomadaires",
};

const entityTabEnv = {
  prospects: "GOOGLE_SHEET_TAB_PROSPECTS",
  messages: "GOOGLE_SHEET_TAB_MESSAGES",
  relances: "GOOGLE_SHEET_TAB_RELANCES",
  outboundTargets: "GOOGLE_SHEET_TAB_OUTBOUND_POOL",
  leadMagnets: "GOOGLE_SHEET_TAB_LEAD_MAGNETS",
  apprentissages: "GOOGLE_SHEET_TAB_APPRENTISSAGES",
  weeklyReviews: "GOOGLE_SHEET_TAB_WEEKLY_REVIEWS",
};

const rawSheetTabs = {
  questionnaire: "LINKEDIN_FILTER_RESPONSES",
  waitlist: "LINKEDIN_MISSION_CONTROL_WAITLIST",
  feedback: "LINKEDIN_MISSION_CONTROL_FEEDBACK",
};

const rawSheetTabEnv = {
  questionnaire: "GOOGLE_SHEET_TAB_QUESTIONNAIRE",
  waitlist: "GOOGLE_SHEET_TAB_WAITLIST",
  feedback: "GOOGLE_SHEET_TAB_FEEDBACK",
};

const entityIdKeys = {
  prospects: "id",
  messages: "messageId",
  relances: "id",
  outboundTargets: "poolId",
  leadMagnets: "id",
  apprentissages: "id",
  weeklyReviews: "week",
};

const entityHeaderRows = {
  weeklyReviews: 1,
};

// Headers synthétiques pour les onglets qui ne disposent pas d'une ligne
// d'en-tête à la ligne HEADER_ROW_NUMBER. Les colonnes doivent correspondre
// à l'ordre réel des colonnes dans le Google Sheet.
const syntheticHeaders = {
  outboundTargets: [
    "Pool ID",
    "Date extraction",
    "Source",
    "Nom",
    "LinkedIn URL",
    "Headline",
    "Entreprise",
    "Role",
    "Type cible",
    "Priorité",
    "Score préliminaire",
    "Angle préliminaire",
    "Raison sélection",
    "Statut pool",
    "Migré pipeline",
    "Pipeline ID",
    "Dernière action",
    "Notes",
  ],
};

const fieldAliases = {
  id: ["ID", "Relance ID", "Lead magnet ID", "Apprentissage ID"],

  prospectId: ["Prospect ID", "ID prospect", "ID Prospect"],
  messageId: ["Message ID", "message_id", "ID"],
  poolId: ["Pool ID", "POOL_ID", "ID"],

  contact: ["Contact", "Prospect", "Nom"],
  organisation: ["Organisation", "Entreprise", "Company"],
  role: ["Role", "R\u00f4le"],
  commercialRole: ["Role commercial", "R\u00f4le commercial"],
  sector: ["Secteur"],
  zone: ["Zone"],
  channel: ["Canal"],
  source: ["Source"],
  website: ["Site", "Website"],
  linkedin: ["LinkedIn", "Linkedin"],
  firstContactDate: ["Date premier contact"],
  score: ["Score /5", "Score"],

  offer: ["Offre probable"],
  probableOffer: ["Offre probable"],
  angle: ["Angle utilise", "Angle utilis\u00e9"],
  usedAngle: ["Angle utilise", "Angle utilis\u00e9"],
  visibleProblem: ["Probleme visible", "Probl\u00e8me visible"],
  conversationGoal: ["But de la conversation"],
  nextAction: ["Prochaine action", "Next action"],
  nextActionDate: ["Date prochaine action", "Next action date"],
  response: ["Reponse", "R\u00e9ponse"],
  insight: ["Objection / insight"],
  objectionInsight: ["Objection / insight"],
  linkedinIdea: ["Idee LinkedIn", "Id\u00e9e LinkedIn"],
  leadMagnet: ["Lead magnet"],
  notes: ["Notes"],

  date: ["Date"],
  sourceLabel: ["Source label", "Libelle source", "Libell\u00e9 source"],
  type: ["Type"],
  direction: ["Direction"],
  state: ["Etat", "\u00c9tat", "Statut", "Status"],
  status: ["Statut", "Status", "Etat", "\u00c9tat"],
  exactContent: ["Contenu exact", "Message"],

  prospectName: ["Prospect", "Nom prospect"],
  action: ["Action"],
  reference: ["Reference", "R\u00e9f\u00e9rence", "Message / reference", "Message / r\u00e9f\u00e9rence"],

  // Outbound targets
  name: ["Nom", "Name", "Nom complet", "Full name"],
  extractionDate: ["Date extraction", "Extraction date"],
  linkedinUrl: ["LinkedIn URL", "Lien LinkedIn", "LinkedIn"],
  headline: ["Headline", "Titre"],
  company: ["Entreprise", "Company", "Organisation"],
  targetType: ["Type cible", "Type"],
  priority: ["Priorit\u00e9", "Priorite", "Priority", "Prio"],
  preliminaryScore: ["Score pr\u00e9liminaire", "Score preliminaire", "Score /5"],
  preliminaryAngle: ["Angle pr\u00e9liminaire", "Angle preliminaire"],
  selectionReason: ["Raison s\u00e9lection", "Raison selection"],
  poolStatus: ["Statut pool", "Pool status"],
  migratedToPipeline: ["Migr\u00e9 pipeline", "Migre pipeline", "Migr\u00e9 pipeline ?"],
  pipelineId: ["Pipeline ID"],
  lastAction: ["Derni\u00e8re action", "Derniere action"],

  sourceProspect: ["Source prospect"],
  sourceProspectId: ["source_prospect_id", "Source prospect ID"],
  provisionalTitle: ["Titre provisoire", "Titre"],
  title: ["Titre provisoire", "Titre", "Post / titre"],
  keyword: ["Mot cle", "Mot cl\u00e9"],
  angleUsage: ["Angle / usage"],
  usedInPost: ["Utilise post", "Utilis\u00e9 post", "Utilis\u00e9 en post ?"],
  postUseDate: ["Date usage post", "Date utilisation post"],
  postTitle: ["Titre post", "Post / titre"],
  postArchive: ["Archive post"],
  postFormat: ["Format post"],
  contentStatus: ["Statut contenu"],

  reportDate: ["Date du bilan", "Date bilan"],
  week: ["Semaine", "Week"],
  analyzedPeriod: ["Periode analysee", "P\u00e9riode analys\u00e9e"],
  executiveSummary: ["Resume executif", "R\u00e9sum\u00e9 ex\u00e9cutif"],
  highlights: ["Faits marquants", "Highlights"],
  keyNumbers: ["Chiffres cles", "Chiffres cl\u00e9s", "Key numbers"],
  conclusions: ["Conclusions"],
  nextWeekImprovements: [
    "Ameliorations semaine prochaine",
    "Am\u00e9liorations semaine prochaine",
  ],
  priorityActions: ["Actions prioritaires"],
  risks: ["Risques / points de vigilance", "Risques", "Points de vigilance"],
  sourcesRead: ["Sources lues", "Sources"],
};

const patchRoutes = [
  { pattern: /^\/api\/crm\/prospects\/([^/]+)$/, entity: "prospects" },
  { pattern: /^\/api\/crm\/relances\/([^/]+)$/, entity: "relances" },
  {
    pattern: /^\/api\/crm\/outbound-targets\/([^/]+)$/,
    entity: "outboundTargets",
  },
  { pattern: /^\/api\/crm\/lead-magnets\/([^/]+)$/, entity: "leadMagnets" },
  {
    pattern: /^\/api\/crm\/apprentissages\/([^/]+)$/,
    entity: "apprentissages",
  },
];

const postRoutes = [
  { path: "/api/crm/prospects", entity: "prospects" },
  { path: "/api/crm/relances", entity: "relances" },
  { path: "/api/crm/messages", entity: "messages" },
  { path: "/api/crm/lead-magnets", entity: "leadMagnets" },
  { path: "/api/crm/apprentissages", entity: "apprentissages" },
];

let cachedAccessToken = null;
let cachedAccessTokenExpiresAt = 0;
const activeSessions = new Map();
const failedLoginAttempts = new Map();

validateAuthConfig();

function parseBooleanEnv(value, defaultValue) {
  if (value === undefined) {
    return defaultValue;
  }

  return ["1", "true", "yes", "oui"].includes(value.trim().toLowerCase());
}

function parsePositiveNumber(value, defaultValue) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return defaultValue;
  }

  return parsedValue;
}

function validateAuthConfig() {
  if (!AUTH_ENABLED) {
    return;
  }

  const missingSettings = [];

  if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
    missingSettings.push("CRM_SESSION_SECRET (32 caracteres minimum)");
  }

  if (!AUTH_PASSWORD_HASH && !AUTH_PASSWORD) {
    missingSettings.push("CRM_AUTH_PASSWORD_HASH");
  }

  if (missingSettings.length > 0) {
    throw new Error(
      `Configuration auth incomplete: ${missingSettings.join(", ")}.`,
    );
  }

  if (AUTH_PASSWORD && !AUTH_PASSWORD_HASH) {
    console.warn(
      "CRM_AUTH_PASSWORD est accepte comme secours. Utilisez CRM_AUTH_PASSWORD_HASH en production.",
    );
  }
}

function digestText(value) {
  return createHash("sha256").update(String(value)).digest();
}

function timingSafeEqualText(left, right) {
  return timingSafeEqual(digestText(left), digestText(right));
}

function verifyScryptPassword(password, passwordHash) {
  const [, salt, storedHash] = passwordHash.split("$");

  if (!salt || !storedHash) {
    return false;
  }

  try {
    const expectedKey = Buffer.from(storedHash, "base64url");
    const actualKey = scryptSync(password, salt, expectedKey.length);

    return (
      actualKey.length === expectedKey.length &&
      timingSafeEqual(actualKey, expectedKey)
    );
  } catch {
    return false;
  }
}

function verifyPassword(password) {
  if (AUTH_PASSWORD_HASH) {
    if (!AUTH_PASSWORD_HASH.startsWith("scrypt$")) {
      return false;
    }

    return verifyScryptPassword(password, AUTH_PASSWORD_HASH);
  }

  return AUTH_PASSWORD ? timingSafeEqualText(password, AUTH_PASSWORD) : false;
}

function parseCookies(request) {
  const cookieHeader = request.headers.cookie || "";

  return cookieHeader.split(";").reduce((cookies, cookie) => {
    const separatorIndex = cookie.indexOf("=");

    if (separatorIndex < 1) {
      return cookies;
    }

    const key = cookie.slice(0, separatorIndex).trim();
    const value = cookie.slice(separatorIndex + 1).trim();

    try {
      cookies[key] = decodeURIComponent(value);
    } catch {
      cookies[key] = value;
    }

    return cookies;
  }, {});
}

function createSessionSignature(token) {
  return createHmac("sha256", SESSION_SECRET).update(token).digest("base64url");
}

function createSession() {
  pruneExpiredSessions();

  const token = randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;

  activeSessions.set(token, {
    expiresAt,
    username: AUTH_USERNAME,
  });

  return `${token}.${createSessionSignature(token)}`;
}

function readSessionToken(request) {
  const sessionValue = parseCookies(request)[SESSION_COOKIE_NAME];

  if (!sessionValue) {
    return null;
  }

  const [token, signature] = sessionValue.split(".");

  if (!token || !signature) {
    return null;
  }

  const expectedSignature = createSessionSignature(token);

  if (!timingSafeEqualText(signature, expectedSignature)) {
    return null;
  }

  return token;
}

function getValidSession(request) {
  if (!AUTH_ENABLED) {
    return {
      expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000,
      username: AUTH_USERNAME,
    };
  }

  const token = readSessionToken(request);

  if (!token) {
    return null;
  }

  const session = activeSessions.get(token);

  if (!session) {
    return null;
  }

  if (Date.now() >= session.expiresAt) {
    activeSessions.delete(token);
    return null;
  }

  return session;
}

function destroySession(request) {
  const token = readSessionToken(request);

  if (token) {
    activeSessions.delete(token);
  }
}

function pruneExpiredSessions() {
  const now = Date.now();

  for (const [token, session] of activeSessions) {
    if (now >= session.expiresAt) {
      activeSessions.delete(token);
    }
  }
}

function buildSessionCookie(value, maxAgeSeconds) {
  return [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${maxAgeSeconds}`,
    SESSION_COOKIE_SECURE ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function getClientAddress(request) {
  const forwardedFor = request.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return request.socket.remoteAddress || "unknown";
}

function getLoginAttemptKey(request, username) {
  return `${getClientAddress(request)}:${String(username).trim().toLowerCase()}`;
}

function isLoginRateLimited(key) {
  const attempt = failedLoginAttempts.get(key);

  if (!attempt || Date.now() >= attempt.resetAt) {
    failedLoginAttempts.delete(key);
    return false;
  }

  return attempt.count >= MAX_FAILED_LOGINS;
}

function recordLoginFailure(key) {
  const now = Date.now();
  const attempt = failedLoginAttempts.get(key);

  if (!attempt || now >= attempt.resetAt) {
    failedLoginAttempts.set(key, {
      count: 1,
      resetAt: now + LOGIN_WINDOW_MS,
    });
    return;
  }

  attempt.count += 1;
}

function clearLoginFailures(key) {
  failedLoginAttempts.delete(key);
}

function buildSessionPayload(request) {
  const session = getValidSession(request);

  return {
    authEnabled: AUTH_ENABLED,
    authenticated: Boolean(session),
    username: session?.username,
  };
}

async function handleAuthRequest(request, response, url) {
  if (request.method === "GET" && url.pathname === "/api/auth/session") {
    sendJson(response, 200, buildSessionPayload(request));
    return true;
  }

  if (request.method === "POST" && url.pathname === "/api/auth/login") {
    if (!AUTH_ENABLED) {
      sendJson(response, 200, buildSessionPayload(request));
      return true;
    }

    const body = await readBody(request);
    const username = String(body.username ?? "");
    const password = String(body.password ?? "");
    const attemptKey = getLoginAttemptKey(request, username);

    if (isLoginRateLimited(attemptKey)) {
      sendJson(response, 429, {
        error: "Trop de tentatives. Reessayez dans quelques minutes.",
      });
      return true;
    }

    if (
      !timingSafeEqualText(username, AUTH_USERNAME) ||
      !verifyPassword(password)
    ) {
      recordLoginFailure(attemptKey);
      sendJson(response, 401, {
        error: "Identifiants invalides.",
      });
      return true;
    }

    clearLoginFailures(attemptKey);
    response.setHeader(
      "Set-Cookie",
      buildSessionCookie(createSession(), SESSION_TTL_SECONDS),
    );
    sendJson(response, 200, {
      authEnabled: AUTH_ENABLED,
      authenticated: true,
      username: AUTH_USERNAME,
    });
    return true;
  }

  if (request.method === "POST" && url.pathname === "/api/auth/logout") {
    if (AUTH_ENABLED) {
      destroySession(request);
    }

    response.setHeader("Set-Cookie", buildSessionCookie("", 0));
    sendJson(response, 200, {
      authEnabled: AUTH_ENABLED,
      authenticated: !AUTH_ENABLED,
      username: !AUTH_ENABLED ? AUTH_USERNAME : undefined,
    });
    return true;
  }

  return false;
}

function requireAuthenticatedRequest(request, response, url) {
  if (!AUTH_ENABLED || !url.pathname.startsWith("/api/crm/")) {
    return true;
  }

  if (getValidSession(request)) {
    return true;
  }

  sendJson(response, 401, {
    error: "Authentification requise.",
  });

  return false;
}

function normalizeHeader(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getTabName(entity) {
  return process.env[entityTabEnv[entity]] || entityTabs[entity];
}

function getRawSheetTabName(key) {
  return process.env[rawSheetTabEnv[key]] || rawSheetTabs[key];
}

function getHeaderRowNumber(entity) {
  return entityHeaderRows[entity] || HEADER_ROW_NUMBER;
}

function getEntityRange(entity) {
  return `${quoteSheetName(getTabName(entity))}!A${getHeaderRowNumber(entity)}:${READ_LAST_COLUMN}`;
}

function getRawSheetRange(key) {
  return `${quoteSheetName(getRawSheetTabName(key))}!A1:${READ_LAST_COLUMN}`;
}

function getSpreadsheetId(url) {
  return (
    url.searchParams.get("spreadsheetId") ||
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID ||
    process.env.VITE_GOOGLE_SHEETS_SPREADSHEET_ID ||
    ""
  );
}

function requireSpreadsheetId(url) {
  const spreadsheetId = getSpreadsheetId(url);

  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID est requis.");
  }

  return spreadsheetId;
}

function getServiceAccountCredentials() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );

  if (!email || !privateKey) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_EMAIL et GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY sont requis.",
    );
  }

  return { email, privateKey };
}

function encodeBase64Url(value) {
  const source = typeof value === "string" ? value : JSON.stringify(value);
  return Buffer.from(source).toString("base64url");
}

function createServiceAccountAssertion() {
  const { email, privateKey } = getServiceAccountCredentials();
  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const payload = {
    iss: email,
    scope: GOOGLE_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    exp: now + 3600,
    iat: now,
  };

  const unsignedToken = `${encodeBase64Url(header)}.${encodeBase64Url(payload)}`;
  const signer = createSign("RSA-SHA256");

  signer.update(unsignedToken);
  signer.end();

  return `${unsignedToken}.${signer.sign(privateKey, "base64url")}`;
}

async function getAccessToken() {
  if (cachedAccessToken && Date.now() < cachedAccessTokenExpiresAt) {
    return cachedAccessToken;
  }

  const assertion = createServiceAccountAssertion();

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `OAuth Google refuse la connexion: ${await response.text()}`,
    );
  }

  const payload = await response.json();

  cachedAccessToken = payload.access_token;
  cachedAccessTokenExpiresAt = Date.now() + (payload.expires_in - 60) * 1000;

  return cachedAccessToken;
}

async function googleSheetsFetch(spreadsheetId, path, init = {}) {
  const accessToken = await getAccessToken();

  const response = await fetch(
    `${GOOGLE_SHEETS_BASE_URL}/${encodeURIComponent(spreadsheetId)}${path}`,
    {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Google Sheets API ${response.status}: ${await response.text()}`,
    );
  }

  return response.json();
}

function quoteSheetName(tabName) {
  return `'${String(tabName).replace(/'/g, "''")}'`;
}

function columnName(columnNumber) {
  let name = "";
  let current = columnNumber;

  while (current > 0) {
    const remainder = (current - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    current = Math.floor((current - 1) / 26);
  }

  return name;
}

function findColumnIndex(headerRow, fieldKey) {
  const candidates = [fieldKey, ...(fieldAliases[fieldKey] ?? [])].map(
    normalizeHeader,
  );

  return headerRow.findIndex((header) =>
    candidates.includes(normalizeHeader(header)),
  );
}

function getWritableEntries(headerRow, input) {
  return Object.entries(input)
    .map(([fieldKey, value]) => ({
      fieldKey,
      value,
      columnIndex: findColumnIndex(headerRow, fieldKey),
    }))
    .filter((entry) => entry.columnIndex >= 0);
}

function toSheetValue(value) {
  if (typeof value === "boolean") {
    return value ? "TRUE" : "FALSE";
  }

  return value ?? "";
}

async function readEntityValues(spreadsheetId, entity) {
  const range = encodeURIComponent(getEntityRange(entity));
  const payload = await googleSheetsFetch(spreadsheetId, `/values/${range}`);

  const values = payload.values ?? [];

  // Si un header synthétique est défini pour cet onglet, le préposer afin que
  // le mapper dispose toujours d'une ligne d'en-tête valide.
  if (syntheticHeaders[entity]) {
    return [syntheticHeaders[entity], ...values];
  }

  return values;
}

async function readRawSheetValues(spreadsheetId, key) {
  if (!rawSheetTabs[key]) {
    throw new Error(`Onglet brut non autorise: ${key}`);
  }

  const range = encodeURIComponent(getRawSheetRange(key));
  const payload = await googleSheetsFetch(spreadsheetId, `/values/${range}`);

  return {
    key,
    tabName: getRawSheetTabName(key),
    values: payload.values ?? [],
  };
}

async function readValuesByEntity(spreadsheetId) {
  const params = new URLSearchParams({
    majorDimension: "ROWS",
  });

  for (const entity of entityOrder) {
    params.append("ranges", getEntityRange(entity));
  }

  const payload = await googleSheetsFetch(
    spreadsheetId,
    `/values:batchGet?${params.toString()}`,
  );

  return entityOrder.reduce((valuesByEntity, entity, index) => {
    const values = payload.valueRanges?.[index]?.values ?? [];

    // Injecter le header synthétique si défini pour cet onglet.
    valuesByEntity[entity] = syntheticHeaders[entity]
      ? [syntheticHeaders[entity], ...values]
      : values;

    return valuesByEntity;
  }, {});
}

async function updateExistingRow(spreadsheetId, entity, id, input) {
  const values = await readEntityValues(spreadsheetId, entity);
  const [headerRow, ...dataRows] = values;

  if (!headerRow) {
    throw new Error(`Onglet ${getTabName(entity)} sans entete.`);
  }

  const idColumnIndex = findColumnIndex(headerRow, entityIdKeys[entity]);

  if (idColumnIndex < 0) {
    throw new Error(`Colonne ID introuvable dans ${getTabName(entity)}.`);
  }

  const dataRowIndex = dataRows.findIndex(
    (row) => String(row[idColumnIndex] ?? "").trim() === id,
  );

  if (dataRowIndex < 0) {
    throw new Error(`${entity} introuvable: ${id}`);
  }

  const rowNumber = dataRowIndex + getHeaderRowNumber(entity) + 1;
  const writableEntries = getWritableEntries(headerRow, input);

  if (writableEntries.length === 0) {
    throw new Error("Aucune colonne compatible pour cette mutation.");
  }

  await googleSheetsFetch(spreadsheetId, "/values:batchUpdate", {
    method: "POST",
    body: JSON.stringify({
      valueInputOption: "USER_ENTERED",
      data: writableEntries.map((entry) => ({
        range: `${quoteSheetName(getTabName(entity))}!${columnName(
          entry.columnIndex + 1,
        )}${rowNumber}`,
        values: [[toSheetValue(entry.value)]],
      })),
    }),
  });

  return readValuesByEntity(spreadsheetId);
}

async function appendRow(spreadsheetId, entity, input) {
  const values = await readEntityValues(spreadsheetId, entity);
  const [headerRow] = values;

  if (!headerRow) {
    throw new Error(`Onglet ${getTabName(entity)} sans entete.`);
  }

  const row = new Array(headerRow.length).fill("");

  for (const entry of getWritableEntries(headerRow, input)) {
    row[entry.columnIndex] = toSheetValue(entry.value);
  }

  const appendRange = encodeURIComponent(getEntityRange(entity));
  const query = new URLSearchParams({
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
  }).toString();

  await googleSheetsFetch(
    spreadsheetId,
    `/values/${appendRange}:append?${query}`,
    {
      method: "POST",
      body: JSON.stringify({
        values: [row],
      }),
    },
  );

  return readValuesByEntity(spreadsheetId);
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    request.on("data", (chunk) => chunks.push(chunk));
    request.on("error", reject);
    request.on("end", () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function writeCorsHeaders(response) {
  response.setHeader(
    "Access-Control-Allow-Origin",
    process.env.CRM_ALLOWED_ORIGIN || "http://127.0.0.1:5173",
  );
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Allow-Credentials", "true");
  response.setHeader("Vary", "Origin");
}

function sendJson(response, statusCode, payload) {
  writeCorsHeaders(response);
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
  });
  response.end(JSON.stringify(payload));
}

function sendError(response, error) {
  const message = error instanceof Error ? error.message : String(error);
  sendJson(response, 500, {
    error: message,
  });
}

function matchPatchRoute(pathname) {
  for (const route of patchRoutes) {
    const match = pathname.match(route.pattern);

    if (match?.[1]) {
      return {
        entity: route.entity,
        id: decodeURIComponent(match[1]),
      };
    }
  }

  return null;
}

function matchPostRoute(pathname) {
  return postRoutes.find((route) => route.path === pathname) ?? null;
}

async function handleRequest(request, response) {
  writeCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);

  try {
    if (url.pathname.startsWith("/api/auth/")) {
      if (await handleAuthRequest(request, response, url)) {
        return;
      }
    }

    if (!requireAuthenticatedRequest(request, response, url)) {
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/crm/health") {
      sendJson(response, 200, {
        ok: true,
        headerRowNumber: HEADER_ROW_NUMBER,
        readLastColumn: READ_LAST_COLUMN,
        tabs: Object.fromEntries(
          entityOrder.map((entity) => [entity, getTabName(entity)]),
        ),
        rawTabs: Object.fromEntries(
          Object.keys(rawSheetTabs).map((key) => [key, getRawSheetTabName(key)]),
        ),
      });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/crm/snapshot") {
      const spreadsheetId = requireSpreadsheetId(url);
      const valuesByEntity = await readValuesByEntity(spreadsheetId);

      sendJson(response, 200, {
        valuesByEntity,
      });
      return;
    }

    if (request.method === "GET") {
      const rawSheetMatch = url.pathname.match(/^\/api\/crm\/raw-sheets\/([^/]+)$/);

      if (rawSheetMatch?.[1]) {
        const spreadsheetId = requireSpreadsheetId(url);
        const payload = await readRawSheetValues(
          spreadsheetId,
          decodeURIComponent(rawSheetMatch[1]),
        );

        sendJson(response, 200, payload);
        return;
      }
    }

    if (request.method === "PATCH") {
      const route = matchPatchRoute(url.pathname);

      if (route) {
        const spreadsheetId = requireSpreadsheetId(url);
        const body = await readBody(request);

        const valuesByEntity = await updateExistingRow(
          spreadsheetId,
          route.entity,
          route.id,
          body.input ?? {},
        );

        sendJson(response, 200, {
          valuesByEntity,
        });
        return;
      }
    }

    if (request.method === "POST") {
      const route = matchPostRoute(url.pathname);

      if (route) {
        const spreadsheetId = requireSpreadsheetId(url);
        const body = await readBody(request);

        const valuesByEntity = await appendRow(
          spreadsheetId,
          route.entity,
          body.input ?? {},
        );

        sendJson(response, 200, {
          valuesByEntity,
        });
        return;
      }
    }

    sendJson(response, 404, {
      error: "Route inconnue.",
    });
  } catch (error) {
    sendError(response, error);
  }
}

const port = Number(process.env.CRM_PROXY_PORT || DEFAULT_PORT);
const server = createServer(handleRequest);

server.listen(port, "127.0.0.1", () => {
  console.log(`SURF CRM Sheets proxy listening on http://127.0.0.1:${port}`);
});
