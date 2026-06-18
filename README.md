# SURF CRM MVP

Cockpit local de prospection SURF construit avec React, TypeScript, Vite, TanStack Query et TanStack Table.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run test
npm run sheets:proxy
npm run sheets:proxy:check
npm run auth:hash -- "mot-de-passe"
```

## Mode mock

Le mode par defaut utilise `mockSheetGateway`.

```bash
npm run dev
```

Ce mode permet de travailler l'UI et les workflows sans connexion Google active.

## Mode Google Sheets

1. Copier `.env.example` vers `.env.local`.
2. Mettre `VITE_CRM_DATA_SOURCE=google-sheets`.
3. Renseigner `VITE_GOOGLE_SHEETS_PROXY_URL` et `VITE_GOOGLE_SHEETS_SPREADSHEET_ID`.
4. Partager le Google Sheet avec l'email du service account.
5. Lancer le proxy avec les variables serveur:

```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL="..." \
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n" \
GOOGLE_SHEETS_SPREADSHEET_ID="1lEehF5FbtT8E1rL5CTQ3PkVPRARfvk9SskdfyhpLLDc" \
npm run sheets:proxy
```

Puis lancer l'app:

```bash
npm run dev
```

Le proxy expose `http://127.0.0.1:8787/api/crm`.

## Authentification CRM

Le login est desactive par defaut en local. Pour l'activer:

```bash
npm run auth:hash -- "mot-de-passe-fort"
```

Puis renseigner les variables:

```bash
VITE_CRM_AUTH_ENABLED=true
VITE_CRM_AUTH_API_URL=http://127.0.0.1:8787/api/auth
CRM_AUTH_ENABLED=true
CRM_AUTH_USERNAME=admin
CRM_AUTH_PASSWORD_HASH="scrypt$..."
CRM_SESSION_SECRET="secret-long-aleatoire"
CRM_COOKIE_SECURE=false
```

Quand l'auth est activee, les routes `/api/crm/*` refusent les requetes sans cookie de session `HttpOnly`.

## Onglets attendus

- `Prospects`
- `Messages`
- `Relances`
- `OUTBOUND_POOL`
- `Lead magnets`
- `Apprentissages`

Les noms d'onglets peuvent etre remplaces avec:

- `GOOGLE_SHEET_TAB_PROSPECTS`
- `GOOGLE_SHEET_TAB_MESSAGES`
- `GOOGLE_SHEET_TAB_RELANCES`
- `GOOGLE_SHEET_TAB_OUTBOUND_POOL`
- `GOOGLE_SHEET_TAB_LEAD_MAGNETS`
- `GOOGLE_SHEET_TAB_APPRENTISSAGES`

## Mutations MVP

- mettre a jour statut/prochaine action prospect;
- marquer/reporter une relance;
- mettre a jour le statut `OUTBOUND_POOL`;
- marquer apprentissage ou lead magnet comme utilise;
- append relance;
- append message.

## Verification

Avant de considerer un changement stable:

```bash
npm run build
npm run lint
npm run test
npm run sheets:proxy:check
```

## Deploiement VPS

Un kit de deploiement est disponible dans `deploy/`:

- `deploy/DEPLOYMENT_VPS.md`: procedure Nginx + PM2;
- `.github/workflows/surf-crm-ci-cd.yml`: verification + deploiement GitHub Actions;
- `deploy/ecosystem.config.cjs`: configuration PM2 du proxy Sheets;
- `deploy/nginx/surf-crm.conf`: configuration Nginx pour servir `dist/` et proxyfier `/api/`;
- `deploy/env.vps.example`: exemple de `.env` pour le VPS;
- `deploy/deploy.sh`: script de mise a jour apres modification.
