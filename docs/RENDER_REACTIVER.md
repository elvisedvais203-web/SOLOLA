# Remettre Solola en ligne sur Render (gratuit)

Le code est sur GitHub : **https://github.com/elvisedvais203-web/SOLOLA** (branche `main`).

Je ne peux pas cliquer à ta place dans ton compte Render. Suis ces étapes (5–15 min).

## 1. Pourquoi tu vois « Service Suspended »

Render coupe les services **gratuits** quand :

- les **750 h** d’instance du mois sont épuisées ;
- la **bande passante** incluse est dépassée sans carte bancaire ;
- trop de **trafic sortant** (cron, boucles API, etc.) ;
- suspension **manuelle** dans le dashboard.

Ce n’est en général **pas** un bug du dépôt GitHub.

## 2. Réactiver les services existants

1. Va sur [dashboard.render.com](https://dashboard.render.com).
2. Ouvre **solola-frontend** → bouton **Resume** (ou **Settings** → **Instance Type** → **Free** → sauvegarder).
3. Ouvre **solola-api** → **Resume** (vérifie que l’instance est **Free**, pas Starter payant).
4. Si le message parle de **quota mensuel** : attendre le **1er du mois** ou passer en instance payante le temps d’un test.
5. **Manual Deploy** → **Deploy latest commit** sur chaque service (après le push GitHub).

URLs attendues :

- App : `https://solola-frontend.onrender.com/auth`
- API : `https://solola-api.onrender.com/health` → doit répondre `200`

## 3. Recréer depuis le Blueprint (si les services ont été supprimés)

1. Render → **New** → **Blueprint**.
2. Connecte le repo **elvisedvais203-web/SOLOLA**.
3. Render lit `render.yaml` à la racine (2 services web + Postgres gratuit).
4. Renseigne au minimum dans **solola-api** :
   - `REDIS_URL` — optionnel (Upstash gratuit) ; sans Redis, le backend utilise un fallback mémoire.
   - `FIREBASE_*` ou `FIREBASE_SERVICE_ACCOUNT_JSON` — si tu utilises Google / Apple / SMS Firebase.
5. Dans **solola-frontend**, ajoute les `NEXT_PUBLIC_FIREBASE_*` si tu veux OAuth Firebase.
6. Deploy.

Le service **solola-gateway** n’est plus dans le blueprint (auth = `/auth` sur le frontend).

## 4. Variables minimales pour tester sans Firebase

- Backend : `MEDIA_PROVIDER=mock` (déjà dans `render.yaml`) pour stories sans Cloudinary.
- Frontend : pas de Firebase → onglet **E-mail** avec l’API backend (inscription / 2FA).

Génère des secrets JWT : Render peut les créer via `generateValue: true` dans le blueprint pour `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`.

## 5. Après le deploy

1. Ouvre `https://solola-frontend.onrender.com/auth` (première requête peut prendre ~1 min — instance gratuite « endormie »).
2. Si erreur API : vérifie `https://solola-api.onrender.com/health`.
3. **CORS** : `CORS_ORIGIN` sur l’API doit être exactement l’URL du frontend Render.

## 6. Alternative gratuite (frontend seulement)

Si Render refuse de réactiver l’API : déploie **uniquement** `apps/frontend` sur [Vercel](https://vercel.com) (gratuit), avec `API_PROXY_TARGET=https://solola-api.onrender.com` quand l’API revient.

## 7. En local (sans Render)

```bash
cd nextalk/apps/frontend
npm run dev
```

Puis : **http://localhost:3000/auth**
