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
