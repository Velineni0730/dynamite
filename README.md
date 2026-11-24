# Dynamite — Your Study Hero

Dynamite is a cozy, gamified study workspace. This build includes Firebase Authentication, MongoDB-backed profiles and friend relationships, UID-based friend requests, and a real two-person shared focus room with synchronized focus/break phases and live avatar states.

## Stack

**Prerequisite:** Node.js 22.12+ recommended (Vite 8-compatible Node.js release) and npm.

- Frontend: React, Vite, Tailwind CSS, Framer Motion
- Authentication: Firebase Authentication (email/password)
- API: Node.js, Express
- Database: MongoDB Atlas + Mongoose
- Realtime: Socket.IO
- Hosting target: Vercel (frontend) + Render (API)

## Project structure

```text
Dynamite/
  src/                 React application
  server/              Express + Socket.IO API
  Dynamite/             Original visual source assets from the design pack
  .env.example          Vite/Firebase web configuration
  server/.env.example   Render/local API configuration
  vercel.json           SPA route fallback
```

## 1. Firebase setup

1. Open Firebase Console and create/select a project.
2. In **Authentication → Sign-in method**, enable **Email/Password**.
3. In **Project settings → General → Your apps**, create a Web App and copy its config values.
4. In **Authentication → Settings → Authorized domains**, add `localhost` and your Vercel domain.
5. In **Project settings → Service accounts**, generate a private key for the Admin SDK. Keep this file private.

The Firebase Web config is public client configuration and belongs in the root `.env` as `VITE_FIREBASE_*`. The Admin service account belongs only in `server/.env` / Render environment variables. Never put Firebase Admin credentials in a Vite variable.

## 2. MongoDB Atlas

1. Create a MongoDB Atlas cluster.
2. Create a database user and allow your development IP. For Render, configure the Atlas network allow-list appropriately.
3. Copy the Node.js connection string and put it in `MONGODB_URI` in `server/.env`.

## 3. Local environment files

Copy the examples:

```bash
cp .env.example .env
cp server/.env.example server/.env
```

Fill in the values.

### Root `.env` — Vite frontend

```dotenv
VITE_API_BASE_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
VITE_FIREBASE_API_KEY=your_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=your_web_app_id
```

### `server/.env` — Express backend

```dotenv
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account", ...}
CLIENT_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

`FIREBASE_SERVICE_ACCOUNT_JSON` must be the full service-account JSON minified onto one line. Alternatively, set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` as separate environment variables. Do not commit either `.env` file.

## 4. Run locally

Terminal 1 — backend:

```bash
cd server
npm install
npm run dev
```

Terminal 2 — frontend, from the project root:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. Check the API at `http://localhost:3000/api/health`.

## 5. Deploy later (Vercel + Render)

You do not need to deploy now. The project is configured so local and hosted origins are changed only through environment variables.

### Render API

- Create a **Web Service** from this repository.
- Set Root Directory to `server`.
- Build command: `npm install`.
- Start command: `npm start`.
- Add the server variables from `server/.env.example`.
- Set `CLIENT_ORIGINS` to `http://localhost:5173,https://YOUR-VERCEL-DOMAIN.vercel.app`.
- Set `MONGODB_URI` and Firebase Admin credentials in Render's Environment panel.

### Vercel frontend

- Import the repository.
- Root Directory: project root (the folder containing the root `package.json`).
- Build command: `npm run build`.
- Output directory: `dist`.
- Set the same `VITE_FIREBASE_*` values used locally.
- Set `VITE_API_BASE_URL=https://YOUR-RENDER-SERVICE.onrender.com/api`.
- Set `VITE_SOCKET_URL=https://YOUR-RENDER-SERVICE.onrender.com`.

The `vercel.json` rewrite routes client-side URLs back to `index.html`. After changing Vite environment variables on Vercel, trigger a new deployment because Vite values are embedded at build time.

## 6. Current functional scope

### Implemented

- Firebase email/password registration and login.
- Six selectable Hero presets (three boy and three girl designs).
- MongoDB profile persistence: Firebase UID mapping, public Dynamite UID, display name and avatar selection.
- Dashboard with real account XP/session totals and actual completed focus history.
- Friends list, public UID sharing, incoming/outgoing friend requests, accept/decline.
- Friend online/offline presence via Socket.IO.
- Private one-to-one study invitation, invitee acceptance and room membership checks.
- Shared study room with two user-specific avatars.
- Shared 25-minute focus phase followed by a 5-minute shared break (30 minutes total).
- Individual early-break state: one person can take a break during focus while the other remains in focus; both room participants and friends see the live activity state.
- Invitation acceptance/decline screen, single-active-room protection, and safe room cancellation when a participant leaves.
- Server-timestamp timer synchronization and MongoDB focus-session records.
- Navbar notification popover for friend and study invitations.

### Intentionally not part of this current build

- AI tutor / AI memory.
- Gmail or Calendar integration.
- Voice/video calls or shared whiteboard.
- Room decoration inventory editor.
- Push notifications or scheduled email delivery.
- More than two participants in a shared study room.

## 7. Important behaviour notes

- The avatar is idle by default and never starts studying automatically. The first boy and first girl presets have dedicated idle/focus/break artwork. The other four presets keep their selected appearance and use subtle state animation until matching focus/break artwork is added.
- A user's selected avatar is loaded from MongoDB after Firebase authentication, so the same selection is used on the dashboard, profile control, friends list, and shared room.
- Public UIDs look like `DYN-XXXXXXXX`. Share this public UID with friends; do not share Firebase authentication tokens.
- Study rooms are restricted to the host and the invited friend. A room is limited to two participants.
- The API verifies Firebase ID tokens. MongoDB records do not store user passwords.
- If a Firebase or MongoDB setting is missing, authentication/API routes will fail with a setup message rather than silently storing fake account data.

## 8. Security

- Do not commit `.env`, `server/.env`, Firebase service-account JSON, MongoDB credentials, or API keys.
- Rotate any credential that was accidentally committed or shared.
- Configure exact Vercel frontend origins in `CLIENT_ORIGINS` on Render.
- Keep Firebase Admin secrets exclusively on the backend.
