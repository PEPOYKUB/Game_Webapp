# CyberEscape KKU — Claude Handoff

เอกสารนี้ใช้ส่งให้ Claude เพื่อทำงานต่อจากโปรเจกต์ปัจจุบัน

## Project information

- Project: CyberEscape KKU
- Repository: https://github.com/PEPOYKUB/Game_Webapp
- Player Answer Website: `/`
- Target Website: `/target`
- Planned Admin Dashboard: `/admin`
- Stack target: Next.js + PostgreSQL + Prisma
- ผู้ใช้สมัครด้วยอีเมลทั่วไปได้ ไม่จำกัดเฉพาะอีเมล มข.

## Current game concept

ผู้เล่นใช้ Answer Website เพื่ออ่านโจทย์และส่ง Flag ส่วน Target Website เป็นเว็บไซต์มหาวิทยาลัยจำลองที่ผู้เล่นต้องใช้ DevTools > Network วิเคราะห์ API และค้นหา Flag จากช่องโหว่จำลอง

ต้องรักษา Challenge เดิม 5 ด่าน:

1. IDOR
2. Parameter Tampering
3. Information Disclosure
4. Path Traversal Simulation
5. SSRF Simulation

## Required direction

- เพิ่ม Admin Dashboard ที่ `/admin`
- ใช้ PostgreSQL + Prisma
- ใช้ Domain Model ครบ 14 ตาราง:
  - `app_user`
  - `faculty`
  - `game_session`
  - `room`
  - `category`
  - `room_category`
  - `stage`
  - `puzzle`
  - `hint`
  - `puzzle_attempt`
  - `stage_progress`
  - `hint_usage`
  - `achievement`
  - `user_achievement`
- เก็บ Session, Progress, Score, Attempts และ Hint Usage ใน Database
- ทำ Leaderboard และ Analytics
- ทำระบบ Player/Admin Role
- ใช้อีเมลทั่วไปได้

## Security requirements

- ห้ามเปิดเผย Flag หรือ Secret ฝั่ง Client
- Flag ต้องตรวจสอบฝั่ง Server
- ห้าม commit `.env`, `.env.local`, Secret หรือไฟล์เฉลย
- Path Traversal ต้องเป็น Simulation และห้ามอ่านไฟล์จริง
- SSRF ต้องเป็น Simulation และห้าม Fetch URL จริง
- ใช้ Mock Data และ Allowlist เท่านั้น
- Admin API ต้องตรวจ Role ฝั่ง Server
- ผู้เล่นทั่วไปต้องเข้า `/admin` ไม่ได้
- ห้ามให้ Client เป็นแหล่งข้อมูลคะแนนหลัก

## Files to provide to Claude

แนบหรือให้ Claude อ่านไฟล์เหล่านี้:

- `README.md`
- `PROJECT_STATUS.md`
- `CODE_REVIEW.md`
- `prisma/schema.prisma`
- Domain Model PDF: `อันใหม่ (1).pdf`

ห้ามแนบหรือ Commit ไฟล์เหล่านี้:

- `.env`
- `.env.local`
- `SOLUTIONS.private.md`
- `FLAG_SECRET` จริง
- `DATABASE_URL` จริง
- `NEXTAUTH_SECRET` จริง

## Claude instructions

1. ตรวจสอบ Repository และ Branch ปัจจุบันก่อนแก้ไข
2. อ่านเอกสารและ Domain Model ให้ครบ
3. ตรวจสอบระบบเดิมก่อนเปลี่ยนแปลง
4. ปรับ Prisma Schema ให้ครบ 14 ตาราง
5. สร้าง Migration และ Seed Data
6. เพิ่มระบบ Register, Login, Logout และ Role
7. เชื่อม Player Website กับ Database
8. สร้าง Admin Dashboard
9. เพิ่ม Leaderboard, Analytics และ Achievement
10. ทดสอบ Player และ Admin แยกกัน
11. รัน `npm run build`
12. ตรวจว่าไม่มี Secret, Flag, `.env`, `node_modules`, `.next` หรือไฟล์เฉลยใน Git

อย่าเพียงอธิบายแผนงาน ให้แก้ไขไฟล์จริงใน Repository
อย่าลบระบบเดิมจนกว่าจะมีระบบใหม่ทดแทน
อย่า Commit หรือ Push โดยไม่สรุปการเปลี่ยนแปลงก่อน

## Environment variable names

```env
DATABASE_URL=
DIRECT_URL=
FLAG_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
ADMIN_EMAIL=
```

ห้ามใส่ค่าจริงของตัวแปรเหล่านี้ลงในไฟล์นี้หรือ GitHub
