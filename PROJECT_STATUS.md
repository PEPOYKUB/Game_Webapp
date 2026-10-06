# CyberEscape KKU — Project Status

_Last updated: 2026-10-06_

## Done

| Area | Status |
| --- | --- |
| Domain model | 14 tables in `prisma/schema.prisma`, names/keys follow the ER diagram; migration `prisma/migrations/*_init_domain_model` adds CHECK constraints and a partial unique index |
| Seed | `prisma/seed.ts` (idempotent): 16 faculties, 4 categories, 5 achievements, room `KKU-WEB-01` (original 5 challenges), bonus room `KKU-WEB-BONUS`, admin from `ADMIN_EMAIL` |
| Accounts | Register / login / logout, any email domain, bcrypt hashes, HMAC-signed httpOnly cookie, PLAYER by default, ADMIN via seed or dashboard |
| Player site | Server-side sessions, ordered stage unlock, attempts, multi-level hints, stage progress, score, resume after refresh, timer, summary, achievements, room picker |
| Admin dashboard | `/admin`, rooms (+categories), stages, puzzles, hints, users, attempts, leaderboard, analytics, achievements — CRUD where applicable |
| Leaderboard / analytics | Best run per player and room; filters by room, faculty, year level; pass rate per stage, most-failed stages, slowest puzzles, most-used hints, faculty breakdown |
| Security | Server-only flag checks; keyed answer hashes; redacted correct answers; ADMIN check on every admin API and page; ownership via cookie; rate limits; CSRF origin check; production refuses missing `FLAG_SECRET` / `NEXTAUTH_SECRET` |
| Target site | Original 5 vulnerable simulations unchanged; `files` and `proxy` remain mock-data + allowlist only; added fetch error handling |

## Verification (2026-10-06)

- `npm run build` — passes (type check + 31 static pages, all API routes dynamic)
- End-to-end script against `next start` + PostgreSQL 16 (Docker): 98/98 checks passed — registration/login rules, CSRF, locked stages, hint charging, scoring (475 with one hint, 500 perfect), achievements, leaderboard filters, player 403/404 on admin, admin CRUD, constraint errors (409), suspend/promote/demote taking effect immediately, simulations rejecting real files/URLs
- Client bundle (`.next/static`) contains no flag prefixes or secrets

## Known limitations / next steps

- Rate limiting is in-memory (single process). Use Redis or similar for multi-instance deployments.
- Logout clears the cookie but the signed token is stateless until it expires (7 days); suspending a user takes effect immediately because status is checked on every request.
- No email verification or password reset yet — `ADMIN_EMAIL` is therefore only honoured by the seed, never at self-registration.
- Changing `FLAG_SECRET` requires `npm run db:seed` or *Resync built-in flag hashes*; custom admin answers cannot be re-hashed (re-enter them).
- `npm audit` reports advisories for `next@14.2.5` (critical, pre-existing), its bundled `postcss`, and `deepmerge-ts` (pulled in by Prisma). The suggested fixes are major-version upgrades, so they were not applied here — plan a Next.js upgrade separately.
- Training endpoints under `/target/api/*` are intentionally vulnerable — deploy only as an isolated lab.
