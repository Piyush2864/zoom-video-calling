# Zoom Clone — Backend

Node.js + Express + TypeScript + MongoDB + Socket.io backend for a Zoom-like video
conferencing platform.

## Stack
- Express + TypeScript
- MongoDB (Mongoose)
- Socket.io (signaling, chat, whiteboard events)
- Redis + BullMQ (background jobs — recording processing, AI summary)
- JWT access + refresh token auth, with Google OAuth login

## Getting started

```bash
cp .env.example .env      # fill in real values
docker compose up -d      # starts local mongo + redis
npm install
npm run dev
```

## Google OAuth setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.
2. Create an **OAuth 2.0 Client ID** of type "Web application".
3. Add your frontend origin (e.g. `http://localhost:3000`) under Authorized JavaScript origins.
4. Copy the Client ID into `GOOGLE_CLIENT_ID` (backend `.env`) — the frontend will need
   the same Client ID to initialize Google Identity Services and get an `idToken`.
5. Frontend sends the `idToken` to `POST /api/v1/auth/google`; the backend verifies it
   server-side via `google-auth-library` and issues our own JWT access/refresh tokens.
   We never trust a token decoded on the client.

## Auth flow summary

- `POST /api/v1/auth/signup` — email/password signup
- `POST /api/v1/auth/login` — email/password login
- `POST /api/v1/auth/google` — Google login/signup (idToken based)
- `POST /api/v1/auth/refresh` — rotate access token using the httpOnly refresh cookie
- `POST /api/v1/auth/logout` — invalidates all refresh tokens (bumps `tokenVersion`)
- `POST /api/v1/auth/forgot-password` / `reset-password` — password reset flow

Access token is returned in the JSON body (kept in memory on frontend); refresh token
is set as an httpOnly cookie.

## Project structure

See `src/modules/*` for feature modules (auth, user, meeting, chat, etc.), each following
a Controller → Service → Repository pattern. Socket handlers live in `src/sockets/`.

## Roadmap (build order)

1. ✅ Project setup + auth module (incl. Google)
2. User module (profile, avatar, settings)
3. Meeting module (instant/scheduled meetings, waiting room)
4. Socket.io base (room join/leave)
5. WebRTC signaling over sockets
6. Chat module
7. Host controls
8. Recording (BullMQ)
9. Whiteboard
10. AI features (summary, captions)
11. Admin/analytics
