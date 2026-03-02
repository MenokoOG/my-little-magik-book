# agents.md — My Little Magik Book (Senior Agent Build Spec)

This repository is intended for agent-assisted development where the agent is expected to **build the full application** end-to-end.

---

## 0) Agent role: Senior Software Engineer

The agent must behave like a **senior software engineer / tech lead**:

- Owns architecture and implementation quality
- Prioritizes secure-by-default engineering
- Writes tests for non-trivial logic
- Produces clean commits and maintains docs
- Avoids over-engineering while ensuring scalability and correctness
- Flags requirement conflicts early and resolves them with the safest interpretation

---

## 1) Prime directive

Build “**My Little Magik Book**”: a modern, stunning **web application** (deployed on Render) with **PWA support** for installability.

Core features:

- Landing page with login + sign-up entrypoints
- Authenticated home page:
  - Buttons: Explore Cards / My Deck
  - Friends list widget
- Explore page: card search + filters + card details view
- My Deck page: two-pane deck builder with drag-and-drop
  - Left pane: general cards/search results
  - Right pane: user deck
  - Multiple decks per user: **Main**, **Aggressive**, **Defensive**, **YOLO**
- Profile page: change password + set game username
- Community page: list/search users + friend requests + friends list
- Friends can optionally view each other’s decks (privacy controls)
- Learn page: rules/how-to-play (**public**)
- Semi-intelligent recommendations per mode (explainable)

---

## 2) Hard guardrails (non-negotiable)

### 2.1 Network access: allowlist only (resource.txt)

The agent and any server-side fetching code MUST ONLY make outbound network calls to addresses explicitly listed in `resource.txt`.

**Rules**

- No calls to any domain/IP not in `resource.txt`.
- No redirects to non-allowlisted domains. Verify the final resolved URL remains allowlisted.
- HTTPS only unless `resource.txt` explicitly includes HTTP.
- Never accept user-provided URLs for server-side fetch unless allowlisted (SSRF defense).

**Important clarification**

- `https://docs.magicthegathering.io/` is documentation.
- Runtime card data calls must go to the **API** domain:
  - `https://api.magicthegathering.io`
    This MUST be present in `resource.txt` for the app to function.

### 2.2 Medium is not a runtime dependency

If Medium URLs exist in `resource.txt`, they are allowed for **human/agent reference only**.
Production code must not depend on Medium content.

### 2.3 Secrets

- Never commit secrets.
- Never print secrets in logs.
- All secrets must come from environment variables.
- `.env` is template-only.

### 2.4 Privacy and data minimization

Store only what is required:

- email
- password hash (Argon2id preferred)
- display/game username
- friend relationships + requests
- decks: card IDs + quantities + metadata + visibility

Do not collect: real names, addresses, location, payment info.

### 2.5 Security baseline

Must implement:

- Password hashing: Argon2id preferred (bcrypt acceptable with strong cost)
- Session auth: secure, httpOnly cookies
- CSRF protection if cookie-based auth is used
- Rate limiting for login and sensitive endpoints
- Server-side validation for every request (Zod or equivalent)
- Authorization checks on every protected resource
- Security headers: CSP, HSTS, X-Content-Type-Options, Referrer-Policy, frame-ancestors (via CSP)

---

## 3) Delivery targets: Web + Render + PWA

### 3.1 Deployment target

Primary deployment target: **Render** (web service + Postgres).

### 3.2 PWA requirements

The app must support:

- Installability (manifest + icons)
- Service worker for caching **static assets** (and optionally card search responses with safe TTL)
- Offline UX:
  - If offline, show cached pages/assets
  - Deck editing should still work for already-loaded deck data (best-effort)
  - Card search should degrade gracefully with a friendly offline message

PWA should not introduce data corruption:

- Avoid offline writes unless carefully handled (queue + retry). If not implemented, disable writes while offline.

---

## 4) Tech stack (agent should implement)

### 4.1 Frontend

- Next.js (App Router) + TypeScript
- Tailwind CSS + a component system (shadcn/ui acceptable)
- Drag & drop: `@dnd-kit/core`

### 4.2 Backend

- Next.js Route Handlers for API endpoints
- Sessions using secure cookies (implementation choice allowed)
- Prisma ORM

### 4.3 Database

- Postgres:
  - Local dev via **Docker**
  - Render-managed Postgres for production

### 4.4 Testing

- Unit: Vitest (or Jest)
- Integration: route handler tests for auth/community/decks
- Optional E2E: Playwright for critical flows (recommended)

---

## 5) Required repository files (must exist)

- `README.md`
- `.env` (template)
- `SECURITY.md`
- `robots.txt`
- `security.txt`
- `LICENSE` (MIT recommended unless specified otherwise)
- `Reporting Issues.md`
- `docs/dsa_explained_for_kids.md`
- `agents.md` (this file)
- `resource.txt` (allowlist of agent-callable addresses)

---

## 6) System architecture

### 6.1 Pages (routes)

Public:

- `/` Landing
- `/login`
- `/signup`
- `/learn` (public rules/how-to-play)

Authenticated:

- `/home`
- `/explore`
- `/deck`
- `/profile`
- `/community`
- `/users/[id]` (view other users; decks gated by visibility)

### 6.2 API endpoints (route handlers)

Auth:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/change-password` (authenticated)

Users:

- `GET /api/me`
- `PATCH /api/me` (update display_name / game username)

Community:

- `GET /api/users?query=...`
- `POST /api/friends/request` (to_user_id)
- `POST /api/friends/respond` (request_id, accept|reject)
- `GET /api/friends`
- `GET /api/friend-requests`

Decks:

- `GET /api/decks`
- `GET /api/decks/:id`
- `POST /api/decks`
- `PATCH /api/decks/:id` (rename, visibility, mode)
- `PUT /api/decks/:id/cards` (replace full deck list)
- `POST /api/decks/:id/recommendations?mode=aggressive|defensive|yolo`

Cards:

- `GET /api/cards/search?q=...&filters=...` (server fetch + cache)
- `GET /api/cards/:cardId` (server fetch + cache)

All card-related server calls must use allowlisted domains only.

---

## 7) Data model (Prisma schema guidance)

User

- id (uuid)
- email (unique)
- password_hash
- display_name
- created_at, updated_at

Session (if DB sessions)

- id
- user_id
- expires_at

FriendRequest

- id
- from_user_id
- to_user_id
- status: PENDING | ACCEPTED | REJECTED
- created_at, updated_at

Deck

- id
- owner_id
- name
- mode: MAIN | AGGRESSIVE | DEFENSIVE | YOLO
- visibility: PRIVATE | FRIENDS | PUBLIC
- created_at, updated_at

DeckCard

- deck_id
- card_id
- quantity
  Primary key: (deck_id, card_id)

CardCache (recommended)

- card_id
- payload_json
- updated_at
  Cache TTL enforced in code.

---

## 8) Recommendation engine (v1: explainable heuristics)

Outputs: list of `{ card_id, score, reason }`

Aggressive:

- Prefer lower mana cost, early pressure, efficient threats

Defensive:

- Prefer removal/control, life gain/stabilization, durable blockers

YOLO:

- Seeded randomness + constraints (playable curve, not all expensive, avoid duplicates)

Rules:

- Must be explainable (“Suggested because it helps early plays...”)
- Never claim guaranteed outcomes
- Degrade gracefully if API card fields are missing

---

## 9) UI/UX requirements (“stunning”)

- Consistent design system (spacing, typography, color tokens)
- Excellent empty/loading/error states
- Accessible:
  - keyboard navigation
  - focus states
  - aria labels where needed
  - contrast checks

Explore:

- debounced search
- card list + detail drawer/modal
- filters if supported

Deck builder:

- two panes + drag & drop
- quantity controls (+/-)
- deck stats (count + mana curve + warnings)
- tabs for modes
- optimistic UI with rollback

Community:

- user search
- request send/accept/reject
- friends widget on Home

---

## 10) Implementation plan (execution order)

Phase 1: Bootstrap

1. Next.js + TS + Tailwind + component library
2. Lint/format scripts
3. Add required repo files

Phase 2: Local Postgres via Docker

1. Add `docker-compose.yml` for Postgres
2. Prisma schema + migrations
3. Seed minimal dev data (optional)

Phase 3: Auth + Security

1. Signup/login/logout, secure sessions
2. Protected route middleware
3. Rate limiting for auth endpoints
4. Security headers baseline

Phase 4: Core pages

1. Landing/login/signup
2. Home
3. Profile (username + password change)

Phase 5: Card integration

1. Server-side card proxy endpoints w/ caching
2. Explore UI
3. Robust error handling + graceful degradation

Phase 6: Deck builder

1. Deck CRUD + cards persistence
2. Drag & drop UI + deck stats
3. Mode decks

Phase 7: Community + sharing

1. Friend requests + friends list
2. Deck visibility + authorized viewing

Phase 8: Recommendations

1. Heuristic scorer endpoint
2. UI surfacing + “Add to deck” from suggestions

Phase 9: Learn page

1. Public rules/how-to-play page content

Phase 10: PWA

1. Manifest + icons
2. Service worker + caching strategy
3. Offline-friendly UX

Phase 11: Tests + hardening

1. Unit tests (recommender, deck validation)
2. Integration tests (auth, friends, deck privacy)
3. Final doc sweep

---

## 11) Definition of done

A feature is complete only when:

- implemented end-to-end (UI + API + DB as needed)
- secure-by-default
- includes tests for key logic
- documented where appropriate

---

## 12) Non-permitted actions (must not do)

- No outbound calls beyond `resource.txt`
- No scraping non-allowlisted sites
- No plaintext passwords
- No leaking private decks
- No auto-accept friends
- No analytics/tracking by default

---

## 13) Notes about resource.txt (required update)

`resource.txt` must include:

- https://api.magicthegathering.io
- https://docs.magicthegathering.io/
- (optional) medium article for reference only

If the API domain is not present, implement card features with stubs and document the missing allowlist entry.

---

Security and privacy guardrails override convenience. Ship a high-quality, maintainable product.
