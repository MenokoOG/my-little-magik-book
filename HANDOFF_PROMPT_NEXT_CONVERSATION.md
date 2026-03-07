# Handoff Prompt For Next Conversation

Use this handoff to continue work in a new chat.

## Context

- Project: **My Little Magik Book**
- Master spec: `agents.md`
- Current implementation log: `AGENTS_NEXT.md`
- Latest implementation pass completed the priority UX/feature work (image rendering fix, friend click flow, light theme redesign).

## Completed In Latest Pass

- Card image rendering fixed end-to-end by normalizing MTG image URLs to HTTPS.
- Explore and Deck UIs now include runtime image-failure fallback placeholders.
- Friends/community surfaces now include clear links to `/users/[id]`.
- User profile/deck page has explicit visibility-state messaging.
- Light theme updated with Magic-inspired palette/tokens and lighter panel surfaces.
- Validation passed: `docker compose up -d`, `npx prisma migrate deploy`, `npm run lint`, `npm run build`, `npm run test`.

## Environment Quick Start

```bash
docker compose up -d
npx prisma migrate deploy
npm run dev
```

App URL: `http://127.0.0.1:3000`

## Priority Next Session Tasks

- Run manual browser QA for all UX acceptance criteria:
	- Explore list/detail artwork renders.
	- Deck collection/deck-pane/recommendation artwork renders.
	- Friend click flows open `/users/[id]`.
	- Visibility messaging appears correctly when no visible/shared decks.
	- Light theme quality looks polished on desktop + mobile.
- Resolve pre-existing diagnostics debt listed below.
- Keep security guardrails unchanged (authz, CSRF, allowlist-only outbound calls).

## Pre-existing Problems To Fix Next Session

These diagnostics were already present in the working branch context and should be cleaned up next:

- `src/components/deck-builder.tsx`
	- Inline style warning on draggable element transform usage.
	- list-content warnings where `<ul>` may include non-`<li>` children in some branches/render paths.
- `README.md`
	- Markdownlint issues (`MD034` bare URL, ordered-list prefix style).
- `AGENTS_NEXT.md`
	- Markdownlint issues (duplicate headings, ordered-list prefix style in older sections).
- `HANDOFF_PROMPT_NEXT_CONVERSATION.md`
	- Markdownlint ordered-list prefix style if numbered lists are used.

## Suggested Cleanup Order

- Fix semantic HTML/list structure in `src/components/deck-builder.tsx` first.
- Standardize markdown style in `README.md`, `AGENTS_NEXT.md`, and this handoff file.
- Re-run:

```bash
npm run lint
npm run build
npm run test
```
