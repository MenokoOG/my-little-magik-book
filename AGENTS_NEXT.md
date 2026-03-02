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

### Runtime smoke re-proof (clean startup)

- Clean startup executed:

```bash
rm -rf .next && npm run dev
```

- Focused smoke status captured:
  - `COMMUNITY_ROUTE=200`
  - `EXPLORE_ROUTE=200`
  - `FRIENDS_API=200`
  - `USERS_API=200`
  - `CARDS_SEARCH_API=200`

### Recommendations endpoint + UI integration

- New endpoint implemented:
  - `POST /api/decks/:id/recommendations?mode=aggressive|defensive|yolo`
  - File: `src/app/api/decks/[id]/recommendations/route.ts`
- Explainable output implemented with shape:
  - `{ card_id, score, reason }`
- Recommendation heuristics module added:
  - `src/lib/decks/recommender.ts`
- Mode query validation added:
  - `src/lib/validation/deck.ts` (`RecommendationModeSchema`)
- Deck UI integration added:
  - `src/components/deck-builder.tsx`
  - Recommendation panel with add-to-deck actions.

Runtime smoke for recommendations:

- `RECOMMENDATIONS_API=200`
- `RECS_COUNT=8`
- `RECS_SHAPE_OK=YES`
- `DECK_ROUTE=200`

### Learn page completion

- `/learn` expanded from placeholder to full beginner-friendly public rules/how-to-play content:
  - goal, setup, card types, turn flow, combat, stack basics, deckbuilding tips, checklist
  - File: `src/app/learn/page.tsx`

Runtime smoke:

- `LEARN_ROUTE=200`
- `LEARN_CONTENT_OK=YES`

### PWA essentials + offline UX

- Manifest added:
  - `src/app/manifest.ts`
- Icons added:
  - `public/icons/icon-192.svg`
  - `public/icons/icon-512.svg`
- Service worker added and registered:
  - `public/sw.js`
  - `src/components/sw-register.tsx`
  - wired in `src/app/layout.tsx`
- Offline UX tightened:
  - Explore: explicit offline/degraded message (`src/components/explore-browser.tsx`)
  - Deck writes: explicit offline guard/disabled write controls (`src/components/deck-builder.tsx`)

Runtime smoke:

- `MANIFEST_ROUTE=200`
- `SW_ROUTE=200`
- `ICON_192=200`
- `EXPLORE_ROUTE=200`
- `DECK_ROUTE=200`

### Tests (unit + integration)

- Vitest config + setup added:
  - `vitest.config.ts`
  - `src/test/setup.ts`
  - `src/test/cookie-store.ts`
  - `src/test/db.ts`
  - `src/test/auth-test-utils.ts`
- Unit tests added:
  - `src/lib/decks/recommender.test.ts`
  - `src/lib/decks/stats.test.ts`
  - `src/lib/validation/deck.test.ts`
- Integration tests added:
  - `src/app/api/auth/auth.integration.test.ts`
  - `src/app/api/friends/community.integration.test.ts`
  - `src/app/api/decks/deck-privacy.integration.test.ts`

Test results:

- `npm run test` => 6 files passed, 13 tests passed.

### UI uplift pass (stunning baseline)

- Global light/dark theming added with persistent toggle:
  - `src/components/theme-toggle.tsx`
  - wired in `src/app/layout.tsx`
  - theme-aware base styles in `src/app/globals.css`
- Navigation/header and page shell upgraded to elevated card styling:
  - `src/app/layout.tsx`
  - `src/components/page-shell.tsx`
  - `src/components/logout-button.tsx`
- Card artwork now displayed in Explore and Deck experiences (with graceful fallback):
  - `src/components/explore-browser.tsx`
  - `src/components/deck-builder.tsx`
- Existing security/feature behavior preserved:
  - no auth/csrf/authorization relaxations
  - deck offline write-guard behavior remains in place

## 2) Validation status

All slices were validated with required gates.

- `npm run lint` passes
- `npm run build` passes
- `npm run test` passes

Latest UI pass validation (this session):

- `npm run lint` passes (warnings only from `@next/next/no-img-element` in image-heavy card views)
- `npm run build` passes
- Runtime smoke (`npm run dev`, dynamic port `3002`):
  - `LANDING=200`
  - `EXPLORE=307` (expected redirect for protected route when unauthenticated)
  - `LEARN=200`
  - `MANIFEST=200`
  - `SW=200`

Note on intermittent local dev runtime cache issue:

- A transient Next dev-cache/chunk error may still appear in long-running hot-reload sessions.
- Clean restart remains the reliable workaround:

```bash
rm -rf .next
npm run dev
```

## 3) Remaining scope (from master spec)

Functional slices requested in the prior handoff are complete.

Remaining follow-up work:

1. Render deployment hardening and production readiness docs pass.
2. Optional: migrate image tags in Explore/Deck to `next/image` (or keep as-is and explicitly suppress lint rule in a targeted way).
3. Optional: broaden recommendation quality with richer candidate expansion while preserving allowlist/rate-limit constraints.
4. Optional: deeper PWA QA (installability checks across browsers/devices and cache-strategy tuning).

## 4) Suggested next execution order

1. Perform Render-focused hardening/doc updates.
2. Run one final authenticated visual QA pass on `/explore` and `/deck` (theme persistence + artwork consistency).
3. Decide whether to adopt `next/image` for external card art optimization and lint cleanliness.
4. Prepare deployment runbook notes (env vars, migrations, health checks).

## 5) Critical constraints to keep enforcing

- Outbound calls must remain allowlisted by `resource.txt` only.
- Preserve CSRF on write routes and authz on protected resources.
- Keep data minimization and avoid secret leakage.
- Avoid overengineering; ship thin, secure slices with verification.

---

## 6) Follow-up execution (2026-03-02) — production-readiness + visual QA

This section captures the **remaining handoff tasks** that were completed in this pass.

### What changed

1. **Authenticated visual QA completed for `/explore` and `/deck`**
   - Verified theme toggle persistence after refresh.
   - Verified card artwork rendering in:
     - Explore list
     - Explore detail
     - Deck collection
     - Deck entries
     - Recommendations panel
   - Verified offline behavior:
     - Explore offline messaging is shown.
     - Deck offline messaging is shown.
     - Deck write path remains guarded while offline (controls disabled when rendered, or write controls not rendered when deck state is unavailable offline).

2. **Image strategy decision implemented: migrated from `img` to `next/image`**
   - Updated components:
     - `src/components/explore-browser.tsx`
     - `src/components/deck-builder.tsx`
   - Decision: use `next/image` with `unoptimized` for remote card art.
   - Rationale:
     - resolves `@next/next/no-img-element` lint warnings cleanly
     - avoids server-side image optimization fetches against non-allowlisted/variable third-party image hosts
     - preserves current visual behavior and security posture

3. **Render deployment hardening/docs pass completed**
   - Updated `README.md` with:
     - required production env vars (`DATABASE_URL`, `SESSION_SECRET`, `APP_ENV`, `APP_URL`, `MAGICTHEGATHERING_API_BASE`, optional rate-limit/cache vars)
     - Render build/start guidance
     - Prisma migration runbook (`migrate dev` locally, `migrate deploy` in prod)
     - health-check recommendation (`/learn` returning 200)

### Validation outputs (this pass)

- **Authenticated visual QA script results:**
  - PASS `theme_toggle_dark_applied`
  - PASS `theme_persists_refresh`
  - PASS `explore_result_rows_render`
  - PASS `explore_list_has_artwork`
  - PASS `explore_detail_has_artwork`
  - PASS `deck_collection_has_artwork`
  - PASS `deck_zone_has_artwork`
  - PASS `recommendations_has_artwork`
  - PASS `explore_offline_message`
  - PASS `deck_offline_message`
  - PASS deck offline write-guard checks

- `npm run lint`
  - PASS (`✔ No ESLint warnings or errors`)

- `npm run build`
  - PASS (`Compiled successfully`, static/dynamic routes generated)

- `npm run test`
  - PASS (`6` files passed, `13` tests passed)

### Known risks / decisions / next actions

- **Decision locked in:** keep `next/image` + `unoptimized` for remote card art to avoid broad remote host allowances while maintaining lint cleanliness.
- **Known local dev caveat:** if hot-reload chunk issues reappear in long sessions, use:

```bash
rm -rf .next
npm run dev
```

- **Next action before Render release:** confirm Render service config uses the README build/start commands and that health check is set to `/learn`.
