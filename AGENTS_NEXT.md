# AGENTS_NEXT.md — Current Implementation Handoff

Use this as the source of truth for the next session, alongside `agents.md` (master spec).

## 1) Completed in this pass

### Deck slice

- Deck API remains implemented and secured (`/api/decks`, `/api/decks/:id`, `/api/decks/:id/cards`).
- `GET /api/decks` now auto-creates missing mode decks for authenticated users:
  - `MAIN`, `AGGRESSIVE`, `DEFENSIVE`, `YOLO`
- Deck UI remains wired in `src/components/deck-builder.tsx` and `src/app/deck/page.tsx`.

### Community APIs (new)

- `GET /api/users?query=...` implemented in `src/app/api/users/route.ts`.
- `GET /api/friends` implemented in `src/app/api/friends/route.ts`.
- `GET /api/friend-requests` implemented in `src/app/api/friend-requests/route.ts`.
- `POST /api/friends/request` implemented in `src/app/api/friends/request/route.ts`.
- `POST /api/friends/respond` implemented in `src/app/api/friends/respond/route.ts`.
- Validation schemas added in `src/lib/validation/community.ts`.

Security guardrails preserved:

- Auth checks on all routes.
- CSRF enforced on mutation routes.
- Rate limiting applied to friend request/respond routes.
- Authorization rules enforced for request ownership and pending status.

### Community + Home + user visibility UI

- `/community` wired with search + requests + friends via `src/components/community-panel.tsx`.
- `/home` now includes required entry buttons + friends widget:
  - `src/app/home/page.tsx`
  - `src/components/friends-widget.tsx`
- `/users/[id]` now enforces deck visibility (`PRIVATE` / `FRIENDS` / `PUBLIC`) in server-rendered page logic:
  - `src/app/users/[id]/page.tsx`
- Middleware updated to protect `/users` route segment:
  - `src/middleware.ts`

### Explore UI wiring

- `/explore` now wired to interactive client UI:
  - `src/app/explore/page.tsx`
  - `src/components/explore-browser.tsx`
- Includes:
  - debounced search
  - rarity/type filters
  - result list
  - card details panel (`/api/cards/:cardId`)
  - loading / empty / error / offline messaging

## 2) Validation status

- `npm run lint && npm run build` passes after latest edits.

Runtime smoke context:

- API smoke was attempted and partially observed through dev logs.
- A transient Next.js dev cache/chunk issue appeared (`Cannot find module './331.js'`) while running long smoke scripts against hot-reloading dev server.
- This appears environmental/cache-related (not type/build failure). Use clean dev startup before smoke:

```bash
rm -rf .next
npm run dev
```

Then rerun focused runtime smoke tests.

## 3) Remaining scope (from master spec)

1. Recommendations endpoint + UI integration:
   - `POST /api/decks/:id/recommendations?mode=aggressive|defensive|yolo`
   - explainable output `{ card_id, score, reason }`
2. Learn page full content (`/learn`) beyond placeholder.
3. PWA implementation:
   - manifest + icons
   - service worker static caching
   - offline UX consistency
4. Test coverage:
   - unit tests (recommender + deck stats/validation)
   - integration tests (auth/community/privacy)
5. Render deployment hardening + docs updates.

## 4) Suggested next execution order

1. Stabilize runtime smoke environment (`rm -rf .next && npm run dev`) and confirm Community + Explore API/UI flow.
2. Implement recommendation endpoint and connect to deck UI.
3. Complete `/learn` content.
4. Add PWA layer and offline fallbacks.
5. Add tests and finalize deployment hardening docs.

## 5) Critical constraints to keep enforcing

- Outbound calls must remain allowlisted by `resource.txt` only.
- Preserve CSRF on write routes and authz on protected resources.
- Keep data minimization and avoid secret leakage.
- Avoid overengineering; ship thin, secure slices with verification.
