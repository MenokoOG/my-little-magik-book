# Handoff Prompt (copy/paste)

Read `agents.md` as master spec and `AGENTS_NEXT.md` as current status.

Continue implementation from remaining tasks only, in this order:

1. Re-run and prove runtime smoke for Community + Explore after clean dev startup (`rm -rf .next && npm run dev`).
2. Implement Recommendations endpoint + UI integration:
   - `POST /api/decks/:id/recommendations?mode=aggressive|defensive|yolo`
   - Explainable output `{ card_id, score, reason }`.
3. Complete `/learn` page with full public rules/how-to-play content.
4. Implement PWA essentials:
   - manifest + icons
   - service worker for static asset caching
   - clear offline UX behavior for card search and deck writes.
5. Add tests for non-trivial logic and integration paths:
   - recommender + deck validation/stats unit tests
   - auth/community/deck-privacy integration tests.

Guardrails:

- Keep security baseline intact (allowlist-only outbound calls, CSRF, authz, rate limiting, secure cookies, validation).
- Avoid overengineering and avoid unrelated refactors.
- For each slice, prove with `npm run lint && npm run build` plus focused runtime smoke test before moving to next slice.
