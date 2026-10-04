# CyberEscape KKU

เกม Web Security CTF ขนาดเล็กเพื่อการศึกษา ผู้เล่นใช้ Chrome DevTools ตรวจ Request/Response ของเว็บไซต์จำลอง หา Flag จากช่องโหว่ใน API แล้วนำกลับมาตอบ

> ทุกช่องโหว่เป็น simulation ภายในโปรเจกต์นี้เท่านั้น ไม่มีการเรียกหรือโจมตีระบบภายนอกจริง

## Run locally

```bash
npm install
cp .env.example .env.local   # แล้วตั้งค่า FLAG_SECRET
npm run dev
```

เปิด `http://localhost:3000`

## Two websites, one project

| Route | หน้าที่ |
| --- | --- |
| `/` | **Answer Website** — อ่านโจทย์, ส่ง Flag, ดูคะแนน, Hint, How to Play และหน้าสรุปเมื่อจบเกม |
| `/target` | **Target Website** — เว็บไซต์มหาวิทยาลัยจำลองที่ดูเหมือนเว็บทั่วไป แต่มีช่องโหว่ซ่อนอยู่ใน API |
| `POST /api/submit` | ตรวจ Flag ฝั่ง server รับ `{ challengeId, flag }` (challengeId เป็น `1`–`5` หรือ `"web-01"`–`"web-05"`) ตอบกลับเพียง `{ correct: boolean }` |

## How to play

1. กด **START GAME** ที่หน้า `/` (มี How to Play อธิบายก่อนเริ่ม)
2. เปิด `/target` แล้วเปิด DevTools → Network
3. ดู Request/Response ทดลองแก้ parameter หรือส่ง API request เอง
4. นำ Flag กลับมาส่งที่ `/` — ด่านถัดไปจะปลดล็อกเมื่อผ่านด่านก่อนหน้า

## Challenges

| # | ช่องโหว่ | Endpoint เริ่มต้น |
| --- | --- | --- |
| WEB-01 | IDOR | `/target/api/article?id=101` |
| WEB-02 | Parameter Tampering | `/target/api/profile?id=student-001&role=student` |
| WEB-03 | Information Disclosure | `/target/api/search?q=campus` |
| WEB-04 | Path Traversal (simulation) | `/target/api/files?name=student-guide.txt` |
| WEB-05 | SSRF (simulation) | `/target/api/proxy?url=https://news.kku.ac.th/digital-library` |

**Simulation only:**
- `files` ใช้ระบบไฟล์จำลองใน object ภายใน route ไม่มีการอ่านไฟล์จริงจาก filesystem
- `proxy` ไม่มีการ fetch URL ใดๆ ทุก "upstream" (รวมถึง internal host จำลอง `cache.portal.internal`) เป็นข้อมูลใน allowlisted map และ URL อื่นทั้งหมดจะถูก reject ด้วย 400

`/target/api/archive` เป็น hidden endpoint ที่ถูกอ้างถึงใน response ของ Search (ยังไม่ได้เป็นด่านที่ส่งคำตอบได้)

## Flags & scoring

- Flag สร้างฝั่ง server ใน `lib/flags.ts` จาก HMAC ของ `FLAG_SECRET` จึงไม่มีคำตอบจริงอยู่ใน source code หรือใน Client bundle
- ถ้าไม่ได้ตั้ง `FLAG_SECRET` ระบบจะใช้ dev secret ที่อยู่ใน source (สำหรับทดสอบในเครื่องเท่านั้น) — **ต้องตั้งค่าเสมอเมื่อ deploy**
- ด่านละ 100 คะแนน, ใช้ Hint หัก 25 คะแนน
- ความคืบหน้า (ด่านที่ผ่าน, เวลาเริ่ม/จบ, Hint ที่ใช้) เก็บใน `localStorage` ของเบราว์เซอร์ — กด **RESET GAME** เพื่อเริ่มใหม่

## Project structure

```
app/page.tsx                 Answer Website (client)
app/api/submit/route.ts      ตรวจ Flag ฝั่ง server
app/target/page.tsx          Target Website (client)
app/target/api/*/route.ts    API ที่มีช่องโหว่จำลอง (article, profile, search, archive, files, proxy)
lib/challenges.ts            ข้อมูลโจทย์ที่เปิดเผยได้ (ไม่มีคำตอบ)
lib/flags.ts                 สร้าง/ตรวจ Flag (server-only)
```

## Stack

Next.js 14 App Router + TypeScript ไม่มีฐานข้อมูลหรือระบบ Login ในเวอร์ชันนี้ (`prisma/schema.prisma` เป็น draft สำหรับอนาคตและยังไม่ได้ใช้งาน)
