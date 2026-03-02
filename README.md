# My Little Magik Book

A modern web app for exploring Magic cards, building multiple decks, and sharing with friends.

## Tech stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- Secure cookie sessions
- PWA support

## Local development

### 1) Start PostgreSQL

```bash
docker compose up -d
```

### 2) Install dependencies

```bash
npm install
```

### 3) Configure environment

Use `.env` as the local template and verify values for `DATABASE_URL`, `SESSION_SECRET`, and API base URL.

### 4) Prisma setup

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 5) Run the app

```bash
npm run dev
```

Open http://localhost:3000.

## Security and privacy

See `SECURITY.md` and `security.txt`.

## Render production runbook

### Required environment variables

Set these in the Render Web Service environment:

- `DATABASE_URL` (Render Postgres connection string)
- `SESSION_SECRET` (minimum 32 chars, high-entropy)
- `APP_ENV=production`
- `APP_URL` (public app URL, e.g. `https://my-little-magik-book.onrender.com`)
- `MAGICTHEGATHERING_API_BASE=https://api.magicthegathering.io`
- `RATE_LIMIT_PER_MINUTE` (optional, defaults to `60`)
- `CARD_CACHE_TTL_SECONDS` (optional, defaults to `86400`)

Keep secrets in Render environment settings only. Do not commit production secrets.

### Build/start commands (Render Web Service)

- Build command:

```bash
npm ci && npx prisma generate && npx prisma migrate deploy && npm run build
```

- Start command:

```bash
npm run start
```

This ensures schema migrations are applied before the app boots.

### Prisma migration workflow

Use this sequence for schema updates:

1. Local: create and validate migration

```bash
npx prisma migrate dev --name <migration_name>
npm run test
```

2. Commit both:
   - `prisma/schema.prisma`
   - generated SQL under `prisma/migrations/...`
3. Deploy: Render runs `npx prisma migrate deploy` during build.

Avoid `prisma db push` in production.

### Health-check guidance

- Recommended health check path: `/learn`
  - public route (no auth redirect)
  - lightweight and stable content
- Expected healthy response: `HTTP 200`
- If health checks fail after deploy, verify:
  - `DATABASE_URL` connectivity
  - successful `prisma migrate deploy`
  - `SESSION_SECRET` and `APP_URL` are set correctly

### Render dashboard checklist (copy/paste)

Use this before clicking deploy:

```text
[ ] Service type: Web Service
[ ] Runtime: Node
[ ] Build Command: npm ci && npx prisma generate && npx prisma migrate deploy && npm run build
[ ] Start Command: npm run start
[ ] Health Check Path: /learn
[ ] Auto-Deploy: enabled (recommended)

[ ] Env: DATABASE_URL set
[ ] Env: SESSION_SECRET set (>=32 random chars)
[ ] Env: APP_ENV=production
[ ] Env: APP_URL set to public Render URL
[ ] Env: MAGICTHEGATHERING_API_BASE=https://api.magicthegathering.io
[ ] Env (optional): RATE_LIMIT_PER_MINUTE
[ ] Env (optional): CARD_CACHE_TTL_SECONDS

[ ] Latest prisma migration files committed
[ ] resource.txt still includes api.magicthegathering.io allowlist entry
```
