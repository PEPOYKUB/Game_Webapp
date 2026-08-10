# CyberEscape KKU

MVP เว็บ Escape Room สำหรับฝึก Security Awareness ตามแนวคิด CP422021

## Run locally

```bash
npm install
npm run dev
```

เปิด `http://localhost:3000` แล้วทดลองเล่นได้ทันที ระบบเกมใน MVP นี้ใช้ client state เพื่อให้ทดสอบ flow ได้โดยไม่ต้องมีฐานข้อมูล

## Stack plan

- Next.js App Router + TypeScript
- PostgreSQL / Prisma (มี schema เริ่มต้นใน `prisma/schema.prisma`)
- NextAuth.js สำหรับจำกัดอีเมล มข. ใน integration phase
- Vercel สำหรับ web deployment และ Supabase สำหรับ PostgreSQL

## Two-web flow

- `/` — Main Player Mission: เว็บหลักสำหรับดูด่าน ตอบคำถาม รับ Hint และนำข้อมูลจาก Lab มาใช้
- `/hack` — Cyber Field Lab: เว็บจำลองสำหรับเปิด Mailbox, Log Stream และ Decoder เพื่อเก็บหลักฐาน แล้ว export package กลับเว็บหลัก

ทั้งสองเว็บใช้ visual language คนละชุดอย่างตั้งใจ และ Cyber Lab เป็น sandbox จำลอง ไม่มีการเชื่อมต่อหรือโจมตีระบบจริง

## MVP flow

ด่าน Caesar cipher → Phishing email analysis → Server log analysis → Base64 decode → Final case รวม clue

ระบบที่ทำไว้แล้ว: ตรวจคำตอบ, progress, score, Hint 3 ระดับ (-25 คะแนนต่อครั้ง), clue board และ responsive layout
