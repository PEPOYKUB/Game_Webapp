# CyberEscape KKU

เกม Web Security Awareness แบบเล่นคนเดียว ผู้เล่นใช้ Chrome DevTools ตรวจ Request/Response ของเว็บไซต์จำลอง หา Flag จากช่องโหว่ใน API แล้วนำกลับมาตอบ คะแนน ความคืบหน้า และสถิติทั้งหมดเก็บใน PostgreSQL

> ทุกช่องโหว่เป็น simulation ภายในโปรเจกต์นี้เท่านั้น ไม่มีการอ่านไฟล์จริง ไม่มีการ fetch URL ภายนอก และไม่มีการโจมตีระบบจริง

## Quick start

ต้องมี Node.js 18.18+ และ PostgreSQL 13+

```bash
npm install                 # รัน prisma generate ให้อัตโนมัติ (postinstall)
cp .env.example .env        # แล้วกรอก DATABASE_URL, DIRECT_URL, FLAG_SECRET, NEXTAUTH_SECRET, ADMIN_EMAIL
npm run db:migrate          # สร้างตารางทั้ง 14 ตาราง (prisma migrate dev)
npm run db:seed             # คณะ, หมวดหมู่, Achievement, ห้อง 5 ด่าน + ห้องโบนัส, และโปรโมต ADMIN_EMAIL
npm run dev                 # http://localhost:3000
```

ถ้ายังไม่มี PostgreSQL ในเครื่อง ใช้ Docker ได้:

```bash
docker run -d --name cyberescape-pg -e POSTGRES_USER=cyber -e POSTGRES_PASSWORD=change-me -e POSTGRES_DB=cyberescape -p 5432:5432 postgres:16-alpine
```

ใช้ไฟล์ `.env` (ไม่ใช่ `.env.local`) เพราะ Prisma CLI อ่านเฉพาะ `.env` · ทั้ง `.env` และ `.env.*` ถูก ignore ใน Git แล้ว

### Production

```bash
npm run build               # prisma generate && next build
npm run db:deploy           # prisma migrate deploy (ไม่สร้าง migration ใหม่)
npm run db:seed             # ปลอดภัยที่จะรันซ้ำ (idempotent)
npm start
```

`FLAG_SECRET` และ `NEXTAUTH_SECRET` **ต้อง** ตั้งค่าใน production — ถ้าไม่ตั้ง server จะ throw error แทนที่จะใช้ dev secret ที่อยู่ใน source

## Environment variables

| ตัวแปร | ใช้ทำอะไร |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string ที่ app ใช้ |
| `DIRECT_URL` | connection แบบไม่ผ่าน pooler สำหรับ migration (ถ้าไม่ใช้ pooler ให้ใส่ค่าเดียวกับ `DATABASE_URL`) |
| `FLAG_SECRET` | สร้าง Flag ทุกด่าน และเป็น key ของ answer hash · เปลี่ยนแล้วต้องรัน `npm run db:seed` ใหม่ (หรือกด *Resync built-in flag hashes* ใน `/admin/puzzles`) |
| `NEXTAUTH_SECRET` | ใช้เซ็น session cookie ของการ login |
| `NEXTAUTH_URL` | URL ของเว็บ (ใช้อ้างอิงเท่านั้น) |
| `ADMIN_EMAIL` | บัญชีนี้จะถูกโปรโมตเป็น ADMIN ตอนรัน seed |
| `ADMIN_PASSWORD` | (ไม่บังคับ) ถ้าตั้งไว้และบัญชี `ADMIN_EMAIL` ยังไม่มี seed จะสร้างบัญชี admin ให้ |

## วิธีสร้าง Admin

ผู้สมัครใหม่เป็น `PLAYER` เสมอ ไม่มี API ใดให้ผู้เล่นตั้ง role ตัวเองได้ เลือกได้ 3 วิธี:

1. **ADMIN_EMAIL (แนะนำ)** — ตั้ง `ADMIN_EMAIL` ใน `.env` → สมัครด้วยอีเมลนั้นที่ `/register` → รัน `npm run db:seed` → บัญชีนั้นกลายเป็น ADMIN
2. **ADMIN_EMAIL + ADMIN_PASSWORD** — seed สร้างบัญชี admin ให้ทันที (ใช้ตอน setup ครั้งแรก แล้วเปลี่ยนรหัส/ลบค่าออกจาก `.env`)
3. **ผ่าน Database / Dashboard** — admin ที่มีอยู่แล้วกด *MAKE ADMIN* ที่ `/admin/users` หรือแก้ตรงใน DB: `UPDATE app_user SET role = 'ADMIN' WHERE email = '...';`

ระบบกันไม่ให้ admin ลดสิทธิ์หรือระงับบัญชีตัวเอง และต้องเหลือ admin ที่ ACTIVE อย่างน้อย 1 คน

## Routes

| Route | หน้าที่ |
| --- | --- |
| `/` | **Answer Website** — เลือกห้อง, เริ่ม/เล่นต่อ session, ส่ง Flag, ใช้ Hint, ดูคะแนน/เวลา, สรุปผลและ Achievement |
| `/login`, `/register` | สมาชิก (อีเมลใดก็ได้ ไม่จำกัด @kku.ac.th) |
| `/leaderboard` | Leaderboard สาธารณะ (กรองตาม Room / Faculty / Year Level) แสดงเฉพาะ username |
| `/target` | **Target Website** — เว็บมหาวิทยาลัยจำลองที่มีช่องโหว่ใน API |
| `/admin` … | **Admin Dashboard** — เฉพาะ role ADMIN (ผู้เล่นได้ 404, guest ถูกส่งไป `/login`) |

Admin pages: `/admin` (overview), `/admin/rooms` (room + category), `/admin/stages`, `/admin/puzzles`, `/admin/hints`, `/admin/users`, `/admin/attempts`, `/admin/leaderboard`, `/admin/analytics`, `/admin/achievements`

### API

| Endpoint | สิทธิ์ | หน้าที่ |
| --- | --- | --- |
| `POST /api/auth/register` · `login` · `logout`, `GET /api/auth/me` | ทุกคน | สมาชิก (bcrypt cost 12, HMAC-signed httpOnly cookie) |
| `GET /api/game/state?roomId=` | ผู้เล่น | สถานะเกมของ *ตัวเอง* (session/progress/score/hints/achievements) |
| `POST /api/game/start` `{ roomId?, restart? }` | ผู้เล่น | เริ่มหรือเล่นต่อ session; `restart` = ABANDON session เดิมแล้วเริ่มใหม่ |
| `POST /api/game/submit` `{ puzzleId, flag }` | ผู้เล่น | ตรวจ Flag ฝั่ง server → `{ correct, sessionCompleted, newAchievements }` |
| `POST /api/game/hint` `{ puzzleId, level }` | ผู้เล่น | เปิด Hint (หักคะแนนครั้งเดียวต่อ session) |
| `GET /api/leaderboard?roomId=&facultyId=&yearLevel=` | ทุกคน | Leaderboard |
| `/api/admin/*` | ADMIN | CRUD rooms / categories / stages / puzzles / hints / achievements, users, attempts, sessions, stats, leaderboard |

ทุก admin API ตรวจ role ADMIN ฝั่ง server ใน `lib/admin-api.ts` (`adminRoute`) และทุกหน้า `/admin/*` เรียก `requireAdminPage()` เอง

## Challenges (ห้อง `KKU-WEB-01`)

| # | ช่องโหว่ | Endpoint เริ่มต้น |
| --- | --- | --- |
| WEB-01 | IDOR | `/target/api/article?id=101` |
| WEB-02 | Parameter Tampering | `/target/api/profile?id=student-001&role=student` |
| WEB-03 | Information Disclosure | `/target/api/search?q=campus` |
| WEB-04 | Path Traversal (simulation) | `/target/api/files?name=student-guide.txt` |
| WEB-05 | SSRF (simulation) | `/target/api/proxy?url=https://news.kku.ac.th/digital-library` |

ห้องโบนัส `KKU-WEB-BONUS` ใช้ hidden endpoint `/target/api/archive` ที่ถูกอ้างถึงใน response ของ Search

**Simulation only:** `files` ใช้ระบบไฟล์จำลองใน object ภายใน route ไม่อ่าน filesystem จริง · `proxy` ไม่ fetch URL ใด ๆ ทุก "upstream" เป็นข้อมูลใน allowlisted map และ URL อื่นถูก reject ด้วย 400

## Game rules (server-authoritative)

- Stage ปลดล็อกตามลำดับ `stage_number` — ส่งคำตอบหรือเปิด Hint ของ stage ที่ยัง LOCKED จะได้ 403
- คะแนนต่อ stage = `max_score` − Hint ที่ใช้ใน stage นั้น · คะแนนรวม = ผลรวม stage ที่ผ่าน − Hint ของ stage ที่ยังไม่ผ่าน (ไม่ต่ำกว่า 0) — เหมือนกติกาเดิม: ด่านละ 100, Hint −25
- Hint ระดับสูงต้องเปิดระดับก่อนหน้าก่อน และถูกหักคะแนนครั้งเดียวต่อ session (`uq_hint_usage_session_hint`)
- Session / progress / attempt / score เก็บใน DB → refresh หน้าแล้วเล่นต่อได้ และแก้คะแนนจาก DevTools ไม่ได้
- ผู้เล่นมี session ที่ ACTIVE ได้ทีละ 1 ต่อห้อง (partial unique index) และทุก API อ่าน session จาก cookie ของผู้ใช้เอง จึงแตะ session ของคนอื่นไม่ได้
- Achievement อัตโนมัติ: `FIRST_FLAG`, `ROOM_CLEARED`, `NO_HINTS`, `FLAWLESS`, `SPEEDRUN` (≤ 30 นาที) · Achievement อื่นที่ admin สร้าง มอบ/ถอนเองได้ที่ `/admin/achievements`

## Flags & secrets

- Flag สร้างฝั่ง server ใน `lib/flags.ts` จาก HMAC ของ `FLAG_SECRET` — ไม่มีคำตอบจริงใน source, ใน client bundle หรือใน database
- `puzzle.correct_answer_hash` = `flag:<key>$<HMAC-SHA256(FLAG_SECRET, answer)>` หรือ `custom$<…>` — เป็น keyed hash จึง brute-force offline ไม่ได้ถ้าไม่มี secret และไม่มี API ไหนส่งค่านี้ออกไป (admin เห็นแค่ source เช่น `flag:idor`)
- คำตอบที่ถูก และคำตอบผิดที่เป็น Flag ของด่านอื่น ถูกบันทึกใน `puzzle_attempt.submitted_answer` แบบ `[REDACTED …]`
- Rate limit (in-memory): submit 10 ครั้ง/นาที/ผู้ใช้, login 8 ครั้ง/15 นาที/บัญชี, register 5 ครั้ง/15 นาที/IP
- POST/PATCH/DELETE ที่มี `Origin` จากโดเมนอื่นถูกปฏิเสธ (CSRF) และ cookie เป็น `SameSite=Lax; HttpOnly`

## Database (14 tables)

`app_user`, `faculty`, `game_session`, `room`, `category`, `room_category`, `stage`, `puzzle`, `hint`, `puzzle_attempt`, `stage_progress`, `hint_usage`, `achievement`, `user_achievement` — ตาม Domain Model (ชื่อตาราง/คอลัมน์/PK/FK/UQ/IX ตาม ER) ดู `prisma/schema.prisma` และ `prisma/migrations/`

นอกเหนือจาก ER: CHECK constraints (role, status, difficulty, คะแนน ≥ 0, year 1–8), `uq_hint_usage_session_hint`, `uq_game_session_one_active` (partial) และ `ix_game_session_room_status`

## Project structure

```
app/page.tsx                    Answer Website (client, state จาก /api/game/*)
app/login, app/register         สมาชิก
app/leaderboard                 Leaderboard สาธารณะ
app/admin/**                    Admin Dashboard (server components + ResourceForm/ActionButton)
app/api/auth|game|admin/**      Route handlers
app/target/**                   Target Website + vulnerable simulation APIs
lib/game.ts                     Game engine: session, unlock, attempt, hint, score, achievements
lib/auth.ts                     bcrypt, signed cookie, requireUser/requireAdmin/requireAdminPage
lib/flags.ts                    Flag + answer hash (server-only)
lib/stats.ts, lib/admin.ts      Leaderboard / analytics / admin queries
lib/validation.ts               Input validation ทุก API
prisma/schema.prisma            14-table model · prisma/seed.ts ข้อมูลตัวอย่าง
```

## Stack

Next.js 14 App Router + TypeScript · PostgreSQL + Prisma 6 · bcryptjs
