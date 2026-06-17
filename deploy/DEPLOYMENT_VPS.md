# Deploiement VPS - SURF CRM

Objectif: servir le front React/Vite avec Nginx et garder le proxy Google Sheets actif avec PM2.

Architecture cible:

- GitHub est l'intermediaire CI/CD.
- A chaque push sur `main`, GitHub Actions verifie le projet puis declenche le deploiement par SSH.
- Front statique: `/var/www/surf-crm/app/dist`
- Backend local: `server/sheetsProxy.mjs` sur `127.0.0.1:8787`
- Nginx:
  - sert le front sur `https://crm.example.com`
  - reverse-proxy `/api/*` vers `http://127.0.0.1:8787`
- Google Sheets reste la base de donnees.

## 1. Prerequis VPS

Sur Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y nginx
node -v
npm -v
sudo npm install -g pm2
```

Utilise Node.js 20+.

## 2. Placer le projet

Exemple de chemin recommande:

```bash
sudo mkdir -p /var/www/surf-crm
sudo chown -R "$USER":"$USER" /var/www/surf-crm
```

Puis copier ou cloner le projet pour obtenir:

```text
/var/www/surf-crm/app
```

Si le VPS utilise GitHub comme source:

```bash
git clone git@github.com:TON_COMPTE/TON_REPO.git /var/www/surf-crm/app
```

## 3. Configurer les variables

Copier l'exemple:

```bash
cd /var/www/surf-crm/app
cp deploy/env.vps.example .env
```

Modifier `.env`:

- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `CRM_ALLOWED_ORIGIN`
- eventuellement les noms d'onglets

Important:

- partager le Google Sheet avec l'email du service account;
- garder `VITE_GOOGLE_SHEETS_PROXY_URL=/api/crm`;
- garder `VITE_GOOGLE_SHEETS_SPREADSHEET_ID=` vide en production si le proxy porte deja l'ID.

Si le navigateur tente d'appeler `http://127.0.0.1:8787`, cela veut dire que le front a ete build avec une variable locale. Sur le VPS, corriger `.env`:

```bash
VITE_GOOGLE_SHEETS_PROXY_URL=/api/crm
CRM_ALLOWED_ORIGIN=https://ton-domaine.com
```

Puis rebuild/redeploy.

## 4. Adapter PM2

Editer `deploy/ecosystem.config.cjs`:

```js
cwd: "/var/www/surf-crm/app",
```

Puis demarrer:

```bash
cd /var/www/surf-crm/app
npm ci
npm run sheets:proxy:check
npm run build
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup
```

Apres `pm2 startup`, PM2 affichera une commande `sudo ...`; execute-la une seule fois.

## 5. Configurer GitHub Actions

Le workflow est dans:

```text
.github/workflows/surf-crm-ci-cd.yml
```

Cette configuration suppose que le repo GitHub a `SURF_CRM/app` comme racine. Si ton repo GitHub est le dossier parent `PersonalBranding`, deplace `.github/workflows/surf-crm-ci-cd.yml` a la racine du repo et ajoute `working-directory: SURF_CRM/app` aux etapes `run`.

Il fait:

1. `npm ci`
2. `npm run sheets:proxy:check`
3. `npm run lint`
4. `npm run test`
5. `npm run build`
6. deploiement SSH vers le VPS uniquement sur `main`

Ajouter ces secrets dans GitHub:

- `VPS_HOST`: IP ou domaine du VPS
- `VPS_USER`: utilisateur SSH
- `VPS_SSH_KEY`: cle privee SSH autorisee sur le VPS
- `VPS_APP_DIR`: `/var/www/surf-crm/app`
- `VPS_PORT`: port SSH si different de `22`

Le deploiement lance:

```bash
DEPLOY_GIT_PULL=true DEPLOY_BRANCH=main bash deploy/deploy.sh
```

Le script fait un `git pull --ff-only`; si le VPS contient des changements locaux non prevus, le deploiement s'arrete au lieu de les ecraser.

## 6. Adapter Nginx

Copier la config:

```bash
sudo cp deploy/nginx/surf-crm.conf /etc/nginx/sites-available/surf-crm
sudo ln -s /etc/nginx/sites-available/surf-crm /etc/nginx/sites-enabled/surf-crm
```

Editer:

```bash
sudo nano /etc/nginx/sites-available/surf-crm
```

Remplacer:

- `crm.example.com` par ton domaine;
- `/var/www/surf-crm/app/dist` si tu changes le chemin.

Verifier et recharger:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 7. SSL

Avec Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d ton-domaine.com
```

## 8. Verification

Backend:

```bash
curl http://127.0.0.1:8787/api/crm/health
pm2 logs surf-crm-api
```

Front:

```bash
curl -I http://ton-domaine.com
```

Depuis le navigateur:

- dashboard charge les donnees reelles;
- une mutation non critique fonctionne;
- Google Sheet reflete la mutation;
- PM2 ne redemarre pas en boucle.

## 9. Mise a jour apres modification

En usage normal, il suffit de pousser sur `main`:

```bash
git push origin main
```

GitHub Actions verifie puis deploie.

Pour lancer manuellement depuis le VPS:

```bash
cd /var/www/surf-crm/app
bash deploy/deploy.sh
```

Le script fait:

1. `npm ci`
2. `npm run sheets:proxy:check`
3. `npm run build`
4. reload PM2
5. test + reload Nginx

## 10. Commandes utiles

```bash
pm2 status
pm2 logs surf-crm-api
pm2 reload surf-crm-api --update-env
pm2 restart surf-crm-api --update-env
sudo nginx -t
sudo systemctl reload nginx
```

## Notes de securite

- Ne jamais exposer `server/sheetsProxy.mjs` directement sur Internet.
- Le proxy doit rester lie a `127.0.0.1`.
- Ne jamais committer `.env`.
- Le service account doit avoir uniquement acces au Google Sheet du CRM.
