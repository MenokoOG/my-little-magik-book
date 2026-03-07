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

---

## 7) Follow-up execution (2026-03-07) — recommendation v2 + PWA cache hardening

This section captures the latest implementation work started from this handoff.

### What changed

1. **Recommendation engine upgraded with deck-context scoring (v2 heuristics)**
   - Updated `src/lib/decks/recommender.ts`:
     - Added deck-profile extraction from current deck context (`colors`, average CMC, frequent subtypes, repeated combat keywords).
     - Added synergy scoring layer used by all modes:
       - color overlap boost / color mismatch penalty
       - subtype package synergy boost
       - repeated-keyword synergy boost
       - mana-curve fit boost / severe curve mismatch penalty
     - Preserved explainable output contract and deterministic yolo behavior:
       - output remains `{ card_id, score, reason }`
       - seeded random ordering remains deterministic for identical seed inputs.
   - Updated recommendation route integration in `src/app/api/decks/[id]/recommendations/route.ts`:
     - now passes `deckContextRaw` to recommender explicitly for profile-aware scoring.

2. **Recommendation unit coverage expanded**
   - Updated `src/lib/decks/recommender.test.ts`:
     - Existing tests retained.
     - Added tests for:
       - preference toward color/tribal synergy with deck context
       - graceful behavior on sparse candidate payloads (missing fields)
   - Test count for this file increased from `3` to `5`.

3. **PWA runtime caching hardened for offline resilience**
   - Updated `public/sw.js`:
     - cache version bumped to `mlmb-static-v2`
     - install now pre-caches `/` and `/learn`
     - documents use a network-first strategy with cached fallback
     - static assets switched to stale-while-revalidate
     - offline fallback response added when neither request nor fallback is cached
   - Updated `src/app/manifest.ts`:
     - added `id` and `scope`
     - added `display_override`
     - set icon `purpose` to `maskable`

### Validation outputs (this pass)

- `npm run test -- src/lib/decks/recommender.test.ts`
  - PASS (`1` file, `5` tests)

- `npm run lint`
  - PASS (`✔ No ESLint warnings or errors`)

- `npm run build`
  - PASS (`Compiled successfully`)

- `npm run test`
  - PASS (`6` files passed, `15` tests passed)

- Runtime smoke (`npm run dev`, localhost):
  - `LEARN=200`
  - `MANIFEST=200`
  - `SW=200`

### Notes

- Integration tests require local Postgres running (`localhost:5432`).
- If DB is down, run:

```bash
docker compose up -d
npx prisma migrate deploy
```

### Remaining release action

- Confirm live Render service configuration matches README checklist:
  - build command
  - start command
  - env vars
  - health check path `/learn`

---

## 8) Priority user follow-up request (next conversation)

User asked for a targeted UX + feature pass before continuing release work.

### A) Critical bug to resolve first

1. **Card images are not rendering at all in UI**

- Affects card presentation flows (Explore/Deck and any deck-sharing views).
- Investigate and fix root cause end-to-end.
- Verify image URLs from API payload and browser rendering path (including protocol/allowlist compatibility and fallback handling).

Acceptance checks:

- Explore card list image renders for multiple cards.
- Explore card detail image renders.
- Deck card image renders in both collection and deck pane.
- Missing image fallback still behaves gracefully.

### B) Community feature enhancement

2. **Open/view friend decks from community UI by clicking a friend name (or equivalent affordance)**

- Add clear interaction in community/home friends area to open a friend profile/deck view.
- Respect deck visibility rules (`PRIVATE`, `FRIENDS`, `PUBLIC`).
- If friend has not shared decks (or no visible decks), show clear explanatory message.

Acceptance checks:

- Clicking friend row/name leads to visible deck view flow (`/users/[id]` or equivalent).
- Shared deck appears when visibility allows access.
- Non-shared/private deck shows explicit user-facing message instead of silent empty state.

### C) Visual redesign request (light theme)

3. **Light theme needs major polish; card areas are currently too dark**

- Keep existing functionality/security, but redesign light-mode surfaces and card modules.
- Use a Magic-inspired palette and stronger visual identity.
- Incorporate tasteful themed graphics/motifs and improve overall "stunning" quality.

Design direction constraints:

- Improve contrast and readability in light mode.
- Card containers/surfaces must be visibly lighter and visually distinct.
- Keep responsive behavior for desktop/mobile.
- Preserve accessibility (focus states, keyboard support, readable text contrast).

### Suggested execution order

1. Fix image rendering regression first.
2. Add friend-click deck viewing UX + visibility messaging.
3. Apply light-theme visual redesign and validate core pages.
4. Re-run `npm run lint && npm run build && npm run test` and smoke-check affected routes.

---

## 9) Follow-up execution (2026-03-07) — priority UX + feature pass

This section captures the requested priority pass implementation.

### What changed

1. **Card image rendering bug fixed end-to-end**
   - Root cause confirmed: upstream MTG image URLs were primarily `http://...` and blocked by CSP (`img-src ... https:`).
   - Added shared image normalization module:
     - `src/lib/cards/image-url.ts`
     - `normalizeImageUrl` upgrades `http` to `https`, rejects non-HTTPS/invalid URLs.
     - `normalizeCardsPayload` sanitizes `cards[]` and `card` payload shapes.
   - Service + route integration updates:
     - `src/lib/cards/service.ts` now normalizes payloads before returning/cacheing search/detail responses.
     - `src/app/api/cards/[cardId]/route.ts` now normalizes cached payloads on read and normalized payloads on upsert.
   - UI fallback hardening:
     - `src/components/explore-browser.tsx` and `src/components/deck-builder.tsx` now normalize URLs client-side defensively and track image load failures with explicit fallback placeholders.

2. **Community click-to-profile/decks UX implemented**
   - Added explicit friend/user affordances linking to `/users/[id]` in:
     - `src/components/friends-widget.tsx`
     - `src/components/community-panel.tsx`
   - Updated profile/deck visibility messaging in:
     - `src/app/users/[id]/page.tsx`
   - Messaging now distinguishes:
     - viewer self with no decks
     - target user with no decks
     - friend viewer with no shared decks
     - non-friend viewer with no public decks
   - Removed misleading non-owner call to "Open your own deck builder" for viewed-user decks and replaced with explicit read-only context text.

3. **Light theme redesign pass (Magic-inspired)**
   - Added themed light-mode design tokens and motif background system in:
     - `src/app/globals.css`
   - New reusable themed classes:
     - `.mlmb-panel`, `.mlmb-panel-soft`, `.mlmb-chip`, `.mlmb-muted`
   - Applied redesigned surfaces and clearer contrast to key areas:
     - `src/components/page-shell.tsx`
     - `src/components/explore-browser.tsx`
     - `src/components/deck-builder.tsx`
     - `src/components/community-panel.tsx`
     - `src/components/friends-widget.tsx`
     - `src/app/home/page.tsx`
     - `src/app/users/[id]/page.tsx`

4. **New unit tests for image normalization**
   - Added `src/lib/cards/service.test.ts` covering:
     - http->https upgrades
     - invalid protocol rejection
     - search/detail payload normalization behavior

### Validation outputs (this pass)

- `docker compose up -d`
  - PASS (Postgres container started)

- `npx prisma migrate deploy`
  - PASS (migration `20260301234811_init` applied)

- `npm run lint`
  - PASS (`✔ No ESLint warnings or errors`)

- `npm run build`
  - PASS (`Compiled successfully`)

- `npm run test`
  - PASS (`7` files passed, `19` tests passed)

- Runtime smoke (`npm run dev`, localhost)
  - `GET /api/cards/search?q=dragon&pageSize=5` => `200`
  - Search payload image URLs sample: `http=0`, `https>0`
  - `GET /api/cards/:id` => `200`
  - Detail payload `card.imageUrl` observed as `https://...`

### Notes

- Security posture preserved:
  - no relaxations to authz/CSRF/rate limiting
  - no new non-allowlisted runtime outbound dependencies
  - allowlist/API origin checks remain in place
- Manual browser QA of visual rendering and click flows should still be performed for final release sign-off.

### Pre-existing Problems To Fix Next Session

The following diagnostics/issues were present in the working branch context and should be addressed in a follow-up cleanup pass:

- `src/components/deck-builder.tsx`
  - editor diagnostic for inline style usage on draggable transform.
  - editor diagnostics for list semantics where `<ul>` may contain non-`<li>` children in some render paths.
- `README.md`
  - markdownlint issues (`MD034` bare URL and ordered-list prefix style).
- `AGENTS_NEXT.md`
  - markdownlint issues from historical duplicated headings and ordered-list prefix style in older sections.
- `HANDOFF_PROMPT_NEXT_CONVERSATION.md`
  - markdownlint ordered-list prefix style if numbered list formatting is used.

### Next Session Cleanup Plan

- Fix semantic HTML/list structure and accessibility warnings in `src/components/deck-builder.tsx`.
- Normalize markdown formatting in:
  - `README.md`
  - `AGENTS_NEXT.md`
  - `HANDOFF_PROMPT_NEXT_CONVERSATION.md`
- Re-run full gates:
  - `npm run lint`
  - `npm run build`
  - `npm run test`
