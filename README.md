# Trading Bot Dashboard

Dashboard web pour monitorer ton trading bot Railway en temps réel.

## Deploy sur Vercel (5 min)

### Option A — Drag and drop (le plus simple)

1. Va sur https://vercel.com/new
2. Clique "Import" → "Browse all templates" → scroll en bas et cherche "Other"
3. Ou utilise "Clone Template" et upload ce dossier

En fait le plus simple c'est:

1. Sign in Vercel avec GitHub
2. Clique "Add New" → "Project"
3. Upload ce dossier zippé (ou push sur un repo GitHub)
4. Vercel détecte automatiquement Vite
5. Clique "Deploy"
6. 1-2 min plus tard tu as ton URL

### Option B — Via CLI (si tu as Node.js installé)

```bash
npm install -g vercel
cd dashboard-vite
npm install
vercel
```

## Deploy sur Netlify (alternative)

1. Va sur https://netlify.com
2. Clique "Add new site" → "Deploy manually"
3. Drag and drop ce dossier
4. Build command: `npm run build`
5. Publish directory: `dist`

## Configuration

Une fois déployé, ouvre l'URL, et configure:

- **Endpoint**: `https://worker-production-8df9.up.railway.app`
- **Token**: (vide, sauf si tu as mis DASHBOARD_TOKEN sur Railway)
- Clique **CONNECT**

Le dashboard va fetcher `/stats` toutes les 30 secondes automatiquement.

## Test local

```bash
npm install
npm run dev
```

Ouvre http://localhost:5173
