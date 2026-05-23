# Structure du projet Solola / NexTalk

> **Dépôt canonique** : tout le développement actif se fait dans ce dossier (`nextalk/`).

## Arborescence

```
nextalk/
├── apps/
│   ├── backend/          # API Express + Prisma + Socket.io (CANONIQUE)
│   ├── frontend/         # App web Next.js (feed, chat, settings, reels…)
│   ├── solola-gateway/   # Landing auth déployable séparément (optionnel)
│   └── firebase-backend/ # Upload médias mobile Firebase
├── mobile/               # Apps natives iOS + Android
├── packages/shared/      # Types partagés (@nextalk/shared)
├── firebase/             # Règles Firestore / Storage
├── docs/                 # Documentation
├── scripts/              # Utilitaires (superadmin, git-autopush)
├── db/                   # Schéma SQL de secours
└── tools/render-cli/     # Doc CLI Render (pas de binaires versionnés)
```

## Racine `d:\solola\` (hors monorepo)

| Dossier | Statut |
|---------|--------|
| `nextalk/` | **Actif** — monorepo principal |
| `backend/` | **Legacy** — prototype NestJS, non utilisé en prod |
| `mobile/` | Flutter séparé (README racine) |
| `docs/`, `infra/`, `scripts/` | Docs / infra globaux |

Les copies `SOLOLA/` et `solola-gateway/` à la racine ont été **supprimées** (doublons du monorepo).

## Frontend — où trouver quoi

| Besoin | Fichier / dossier |
|--------|-------------------|
| Auth Firebase (page `/auth`) | `components/solola/MainPage.tsx` |
| Auth email API + 2FA | `components/auth/BackendEmailPanel.tsx` + `lib/nextalkbackendemailauth.ts` |
| Client HTTP | `lib/nextalkapi.ts` (+ `lib/nextalkapiresolve.ts`) |
| Chat Telegram-like | `components/nextalkultratelegramchat.tsx` (alias `nextalkchat.tsx`) |
| Paramètres | `app/settings/` (+ `security/`, `plan/`) |
| Skeletons UI | `components/sololaskeleton.tsx` |
| Plans UI | `lib/sololaplan.ts` + `hooks/useSololaPlan.ts` |

## Backend — routes principales

| Préfixe | Rôle |
|---------|------|
| `/api/auth/*` | Login Firebase, email, 2FA, refresh |
| `/api/chats/*` | Messagerie (groupes, canaux, lock PIN) |
| `/api/messages/*` | Messages dating/matchs (domaine séparé) |
| `/api/profile/security/*` | 2FA, sessions, export RGPD |

## Fichiers supprimés (nettoyage)

- Composants orphelins : `nextalkauthenforcer`, `nextalkglobalsearch*`, `nextalkconditionalappshell`, `nextalkaidatingcoach`
- Auth dupliquée : `app/auth/nextalkauthclientsimple.tsx` → fusionnée dans `BackendEmailPanel`
- Pages mock : `/dashboard`, `/publications` → redirection vers `/`
- Artefacts PWA générés : `public/sw.js`, `workbox-*.js`
- Scripts migration one-shot (`inline-nextalk-*`, `generate-nextalk-aliases`, etc.)

## Déploiement Render

- **Root Directory** : vide (`.` à la racine du repo `nextalk`)
- Build : `npm install && npm run build`
- Start : `npm run start:render`
