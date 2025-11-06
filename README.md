# Playlist & Screens — Monorepo

A small, pragmatic monorepo that contains:

- `backend`: Express + TypeScript + Mongoose API
- `frontend`: React (Vite) frontend using TanStack Router & Query

This doc is intentionally human and practical. Skim the bold bits, copy the commands, and you’re off.

---

## a) Setup steps

- **Prereqs**: Node 18+ and a running MongoDB (local or Atlas).
- **Install** (from repo root):

```bash
# from repo root
npm install                # installs root + both workspaces
```

- **Environment**: create `backend/.env` with at least:

```bash
MONGODB_URI=mongodb://localhost:27017/scpl
JWT_SECRET=super-secret-dev-key
ACCESS_TOKEN_TTL=15m
# Optional seed admin overrides
# SEED_ADMIN_EMAIL=admin@example.com
# SEED_ADMIN_NAME=Admin
# SEED_ADMIN_PASSWORD=Admin@12345
```

- **Run both apps together**:

```bash
npm run dev
```

- **Or run individually**:

```bash
npm run dev:backend    # API on http://localhost:3000
npm run dev:frontend   # Vite on http://localhost:3000 by default
```

Note: Backend also starts at 3000. If you’re running both, tweak the frontend port (vite) or backend port via env `PORT`.

---

## b) Data model diagram

Mermaid diagram for quick mental mapping:

```mermaid
erDiagram
  User {
    string _id
    string name
    string email
    string passwordHash
    string[] roles
    string refreshTokenHash?
    date refreshTokenExpiresAt?
  }
  Screen {
    string _id
    string name
    boolean isActive
  }
  Playlist {
    string _id
    string name
    PlaylistItem[] items
  }
  PlaylistItem {
    string url
  }
```

Notes:

- Users have roles: `ADMIN`, `EDITOR`, `VIEWER`.
- `refreshTokenHash` is a bcrypt hash of an opaque refresh token stored as an httpOnly cookie.
- Screens and Playlists are simple with indexes on `name` for case-insensitive search/sort.

---

## c) API shapes (req/res) + error shape

Base URL: `http://localhost:3000`

- **Health**
  - `GET /health`
  - Response: `{ "status": "ok" }`

- **Auth**
  - `POST /auth/login`
    - Body: `{ email: string, password: string }`
    - 200: `{ accessToken: string }` and sets `refreshToken` httpOnly cookie
    - 400: `{ message: "Invalid input", errors: ZodFlattenedErrors }`
    - 401: `{ message: "Invalid credentials" }`
  - `POST /auth/refresh`
    - Uses `refreshToken` cookie
    - 200: `{ accessToken: string }` and rotates refresh cookie
    - 400/401: `{ message: string }`
  - `POST /auth/logout` (requires `Authorization: Bearer <accessToken>`)
    - 204 (no body) and clears refresh cookie
  - `POST /auth/revoke-all` (requires auth)
    - 200: `{ message: "All tokens revoked successfully" }`

- **Screens**
  - `GET /screens`
    - Query: `search?: string, page?: number>=1, limit?: number 1..100`
    - 200: `{ items: Screen[], total: number, page: number, limit: number }`
    - 400: `{ message: "Invalid query", errors: ZodFlattenedErrors }`
  - `PUT /screens/:id`
    - Requires: `Authorization: Bearer <accessToken>` with role `EDITOR` or `ADMIN`
    - 200: `{ _id: string, isActive: boolean }`
    - 401: `{ message: "Unauthorized" }`
    - 403: `{ message: "Forbidden" }`
    - 404: `{ message: "Not found" }`

- **Playlists**
  - `GET /playlists`
    - Query: `search?: string, page?: number>=1, limit?: number 1..100`
    - 200: `{ items: { _id, name, itemCount }[], total, page, limit }`
    - 400: `{ message: "Invalid query", errors: ZodFlattenedErrors }`
  - `GET /playlists/:id`
    - 200: `{ _id: string, name: string, items: { url: string }[] }`
    - 400: `{ message: "Invalid id" }`
    - 404: `{ message: "Not found" }`
  - `POST /playlists`
    - Body: `{ name: string, itemUrls?: string[] (urls, max 10) }`
    - 201: `{ _id: string, name: string, itemCount: number }`
    - 400: `{ message: "Invalid input", errors: ZodFlattenedErrors }`

- **Error shape (general)**
  - Validation errors: `{ message: string, errors: ZodFlattenedErrors }`
  - Auth failures: `{ message: string }` with 401/403
  - Not found: `{ message: "Not found" }`

---

## d) Validation & security (how and why)

- **Validation**: `zod` on all incoming bodies/queries. Why: explicit, typed constraints and consistent 400 error shape.
- **Auth**: JWT access tokens (short TTL, default 15m). Why: stateless, fast checks in middleware.
- **Refresh tokens**: Opaque value stored as `httpOnly` cookie, hashed with bcrypt in DB, rotated on refresh. Why: mitigates theft and enables server-side invalidation per-user.
- **Role checks**: `authenticate` + `requireRole('EDITOR'|'ADMIN')` on protected routes. Why: least privilege.
- **Transport hardening**: `helmet`, CORS configured, `express-rate-limit` (per-minute caps), `cookie-parser`. Why: basic web hardening.
- **Other notes**: CSRF risk is minimized because refresh is cookie-based but access-token is header-based; protect refresh endpoints with same-site cookies and consider CSRF tokens if exposing from browsers across origins.

---

## e) Decisions log (what we skipped / trade-offs)

- Skipped implementing full user CRUD and registration to keep the focus on auth + domain flows.
- Kept `PUT /screens/:id` as a simple toggle for demo purposes (idempotent-ish, but not strictly). Real apps would accept an explicit boolean.
- Stored `refreshTokenHash` per-user (single session) to keep it simple; multi-device sessions would require a token table.
- Aggregated playlist listing to return `itemCount` only; detailed playlist retrieval (by id) isn’t implemented yet.
- Seed runs on server startup for convenience; can be decoupled for stricter environments.

---

## f) How to execute seed script

Seeding runs on backend startup automatically. If you want to trigger manually:

```bash
# from repo root
npm run dev:backend   # seeds at boot

# or run the explicit seed script
npm run seed -w backend
```

You can override the admin via env vars in `.env`.

---

## g) Test plan (what’s covered vs not)

- Covered (manually / happy-path):
  - Auth flow: login → access token issued → refresh → logout
  - Screens list and toggle (role-gated)
  - Playlists list and create with validation
- Not covered yet:
  - Automated unit/integration tests (placeholders exist in frontend)
  - E2E flows (Cypress/Playwright)
  - Negative-path fuzzing (malformed JWTs, rate limit thresholds)

If we keep building this out, we’d add:

- API tests (vitest/jest + supertest) in `backend`.
- E2E tests against a seeded DB and ephemeral env.

---

## Monorepo commands

```bash
# install all workspaces
npm install

# run both apps
npm run dev

# run individually
npm run dev:backend
npm run dev:frontend

# build both
npm run build

# lint both
npm run lint
```
