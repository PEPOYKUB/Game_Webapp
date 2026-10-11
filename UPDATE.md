# Update สรุปงาน BREACH / RESPONSE

> สรุปความคืบหน้าของโปรเจกต์ตั้งแต่ปรับ UI, เตรียมโจทย์และข้อมูลสำหรับ Demo จนถึงการแก้พฤติกรรม Reset Game (อัปเดตล่าสุด 11 ต.ค. 2026)

## งานที่ดำเนินการ

- ปรับแนวทาง UI จาก Hacker Terminal มาเป็น Modern Dark Glow / Glassmorphism โทนเขียว-ดำ: พื้นหลังมืดพร้อมแสงเรือง, การ์ด glass, ปุ่มทรงแคปซูล, navbar และองค์ประกอบที่ใช้ร่วมกัน โดยคงหน้า `/target` และ `target-*` ไว้ตามเดิม
- ปรับองค์ประกอบหน้าเกม/บัญชี/Leaderboard ให้เข้าธีม รวมถึงฟอร์มและตัวกรอง Leaderboard, ตารางผล, สถานะ focus/hover และสีข้อความใน dropdown ของตัวเลือก เพื่อให้อ่านได้บนพื้นหลังมืด
- ปรับหน้าเกมให้ข้อความเปลี่ยนตามห้องที่เลือก โดย Database Quest แสดงคำแนะนำฐานข้อมูล ใช้ข้อความ `SUBMIT ANSWER` และไม่แสดงลิงก์ไป `/target`; ห้อง Cybersecurity ยังคงคำแนะนำและลิงก์ Target Website ตามเดิม
- เพิ่มห้อง **Database Quest** แยกจาก Cybersecurity จำนวน 5 ด่าน:
  1. ER cardinality
  2. Composite Key
  3. 3NF
  4. SQL `GROUP BY`
  5. Transaction Atomicity
- ทุกด่านมีคำตอบสั้น คำอธิบาย และ Hint อย่างน้อยหนึ่งข้อ คะแนนเต็ม 100 ต่อด่าน และหัก 25 คะแนนต่อ Hint ตามค่าคงที่เดิม
- เพิ่ม seed แยกที่ไม่ลบหรือเขียนทับข้อมูลเดิม และเพิ่มคำสั่ง `npm run db:subjects`
- เพิ่มห้องวิชาเพิ่มเติมอีก 6 ห้อง ห้องละ 5 ด่าน รวมข้อมูลที่เตรียมไว้สำหรับ Demo เป็น 9 ห้อง (ห้อง Cybersecurity หลัก, Bonus, Database Quest และวิชาเพิ่มเติม 6 ห้อง) โดย seed เพิ่มเติมแยกจาก seed หลัก
- เพิ่มบัญชีสาธิต Leaderboard `demo_player_02` ถึง `demo_player_10` พร้อมผลคะแนนสังเคราะห์ โดยกำหนดให้แต่ละบัญชีอยู่คนละห้อง/คณะ/ชั้นปี; เพิ่มบัญชีเล่นสด `demo_student` แยกต่างหาก โดย seed บัญชีนี้ไม่สร้าง session หรือคะแนนให้ล่วงหน้า
- เพิ่มคำแนะนำการเตรียมห้องใน `README.md` และ `docs/DEMO.md`
- แก้ **RESET GAME**: เมื่อยืนยัน ระบบทำเครื่องหมาย session ที่กำลังเล่นว่า abandoned แล้วกลับไปหน้า Briefing ของห้องเดิม โดยไม่สร้าง session ใหม่ทันที; ผู้เล่นกด **START GAME** จากหน้า Briefing เมื่อต้องการเริ่มรอบใหม่
- ปุ่ม Reset แสดงสถานะกำลังทำงานและปิดการกดซ้ำระหว่าง request; Reset ไม่ลบประวัติรอบที่เสร็จแล้ว

## ไฟล์ที่เกี่ยวข้อง

- `app/page.tsx` — ข้อความและส่วนควบคุมหน้าเกมเปลี่ยนตามห้องที่เลือก
- `app/page.tsx` — เชื่อมการกด Reset กับการกลับหน้า briefing ของห้องเดิม
- `app/api/game/start/route.ts` — รองรับ action abandon ผ่าน route เดิม โดยคงการตรวจสอบ session/auth เดิม
- `lib/game.ts` — เพิ่มการ abandon active session และให้หน้าเกมแสดง briefing เมื่อ session ล่าสุดถูก abandon
- `prisma/subject-content.ts` — เนื้อหา Database Quest 5 ด่าน
- `prisma/seed-subjects.ts` — seed แยกที่รันซ้ำได้ โดยไม่เรียกหรือแก้ seed หลัก
- `prisma/additional-subject-content.ts` และ `prisma/seed-additional-subjects.ts` — เนื้อหาและ seed ห้องวิชาเพิ่มเติม 6 ห้อง
- `prisma/leaderboard-demo-seed.ts` — บัญชีและผลการเล่นสังเคราะห์สำหรับ Leaderboard
- `prisma/demo-seed.ts` — บัญชีสำหรับเล่น Demo สดโดยไม่สร้างประวัติล่วงหน้า
- `package.json` — เพิ่มคำสั่ง `db:subjects`
- `README.md` — วิธีเพิ่มห้อง Database Quest
- `docs/DEMO.md` — ข้อมูลห้องและแนวทาง Demo
- `docs/PLAN-OTHER-SUBJECT-CHALLENGES.md` — แผนขยายห้องวิชาอื่น

## ผลตรวจสอบ

- รัน seed สองรอบ: รอบแรกเพิ่มห้องและข้อมูล 5 ด่าน; รอบที่สองไม่เพิ่มข้อมูลซ้ำ
- ผลนับหลังรัน seed ห้องเดิมและ Database Quest (ก่อนเพิ่มห้องวิชาอีก 6 ห้อง): Room 3, Stage 11, Puzzle 11, Hint 12
- Database Quest มี 5 Stage, 5 Puzzle และ 5 Hint
- มี seed แยกสำหรับเพิ่ม 6 ห้องวิชา และ seed leaderboard ซึ่งจัดผู้เล่น 9 บัญชีไว้คนละห้อง/คณะ/ชั้นปีตามตารางด้านล่าง; บัญชีและผลเหล่านี้เป็นข้อมูลสังเคราะห์สำหรับนำเสนอ ไม่ใช่ผลผู้เล่นจริง
- ทดสอบสลับห้องในหน้าเว็บสองรอบ: Database Quest แสดง `Query it.` และเนื้อหาฐานข้อมูล; Campus Portal Breach แสดง `Find it.` และลิงก์ `/target`
- TypeScript check ผ่าน
- ทดสอบ Reset ในระดับฟังก์ชันกับบัญชีทดสอบ: เริ่ม session แล้ว abandon; สถานะมุมมองกลับเป็น Briefing (`session === null`) และ session ที่ completed ก่อนหน้ายังอยู่ 2 รายการ
- ตรวจ API abandon แบบไม่เข้าสู่ระบบ: ได้ HTTP 401 ตามข้อกำหนดการยืนยันตัวตน และไม่เปลี่ยนข้อมูล
- `npx tsc --noEmit` ผ่านหลังแก้ Reset
- หลัง dev server ใช้ cache เก่าและแสดง `Cannot find module './8948.js'` ได้ restart เฉพาะ app container; หน้าเว็บกลับมาตอบ HTTP 200 โดยไม่รีสตาร์ตฐานข้อมูล

## ข้อมูลห้องและบัญชี Demo

| รหัสห้อง | ชื่อห้อง | ระดับ | จำนวนด่าน |
| --- | --- | --- | ---: |
| `KKU-WEB-01` | Campus Portal Breach | EASY | 5 |
| `KKU-WEB-BONUS` | Hidden Archive (Bonus) | MEDIUM | 1 |
| `KKU-DB-QUEST-01` | Database Quest | MEDIUM | 5 |
| `KKU-PROG-01` | Programming Foundations | EASY | 5 |
| `KKU-DS-01` | Data Structures | MEDIUM | 5 |
| `KKU-NET-01` | Computer Networking | EASY | 5 |
| `KKU-OS-01` | Operating Systems | MEDIUM | 5 |
| `KKU-MATH-01` | Discrete Mathematics | MEDIUM | 5 |
| `KKU-STAT-01` | Statistics & Data Analysis | EASY | 5 |

บัญชี `demo_student` ใช้เล่น flow สด: คณะ College of Computing (CP), ชั้นปี 3, role PLAYER; เริ่มต้นไม่มี session/คะแนนที่ seed สร้างให้ ส่วนบัญชีต่อไปนี้ใช้แสดงตัวกรองและผลใน Leaderboard:

| Username | ห้อง | คณะ | ชั้นปี | คะแนนสังเคราะห์ |
| --- | --- | --- | ---: | ---: |
| `demo_player_02` | Programming Foundations | CP | 1 | 500 |
| `demo_player_03` | Data Structures | EN | 2 | 450 |
| `demo_player_04` | Computer Networking | SC | 3 | 425 |
| `demo_player_05` | Operating Systems | AR | 4 | 400 |
| `demo_player_06` | Discrete Mathematics | BS | 5 | 375 |
| `demo_player_07` | Statistics & Data Analysis | HS | 6 | 475 |
| `demo_player_08` | Campus Portal Breach | MD | 7 | 375 |
| `demo_player_09` | Hidden Archive (Bonus) | NS | 8 | 75 |
| `demo_player_10` | Database Quest | PH | ไม่ระบุ | 375 |

รหัสผ่าน local สำหรับบัญชี Demo คือ `DemoPass2026!` ใช้เฉพาะเครื่องนำเสนอภายในเท่านั้น ห้ามใช้บนระบบสาธารณะ คำสั่งเตรียมข้อมูลเรียงตามลำดับ: `db:seed` → `db:subjects` → `db:additional-subjects` → `db:demo` → `db:leaderboard-demo`; ดูขั้นตอนและ SQL ตรวจข้อมูลฉบับเต็มใน `docs/DEMO.md`

## ข้อจำกัดและงานที่ควรทำต่อ

- ยังไม่ได้ทดสอบเล่น Database Quest จนครบหนึ่ง session ผ่าน UI เพราะการทำเช่นนั้นจะบันทึก session, attempts, progress และคะแนนลงฐานข้อมูล
- ยังไม่ได้ทดสอบกด Reset ผ่าน UI ด้วยบัญชีเดโมที่ผู้ใช้เปิดอยู่ เพื่อหลีกเลี่ยงการเปลี่ยน session จริงของบัญชีนั้น; ทดสอบ flow ฝั่งฟังก์ชันด้วยบัญชีทดสอบแทน
- รอบตรวจ Reset ล่าสุดไม่ได้รัน `npm run lint` หรือ production build; lint เดิมยังติดข้อจำกัดเรื่องไม่มี ESLint configuration ตามที่ระบุด้านล่าง
- `npm run lint` ยังไม่พร้อมใช้งานแบบตรวจจริง เพราะโปรเจกต์ยังไม่มี ESLint configuration และคำสั่ง Next.js เสนอให้ติดตั้งแพ็กเกจเพิ่มเติม
- Production build เคยล้มระหว่าง prerender ใน Docker; การ build ในเครื่องมีข้อจำกัดการดาวน์โหลด Google Fonts และสิทธิ์เขียน `.next` ควรตรวจ build ในสภาพแวดล้อมแยกจาก dev server
- ในโฟลเดอร์โปรเจกต์ที่ตรวจไม่พบไฟล์สไลด์หรือ ER Diagram สำหรับนำเสนอโดยเฉพาะ
- ก่อนนำเสนอควรทำ ER Diagram และสไลด์ 8–10 หน้า อธิบาย normalization/SQL ซ้อม Demo ให้เห็นสถานะก่อน-หลังในฐานข้อมูล และกรอก GitHub/Drive/Demo/Website URL พร้อมเลือกเวลานำเสนอ
- Admin Dashboard มีหน้าจัดการข้อมูลและรายงาน แต่ควรเตรียมข้อมูลก่อน Demo และไม่ใช้เวลาส่วนใหญ่ของการนำเสนอไปกับ CRUD

## ข้อกำหนดที่คงไว้

- ไม่แก้ Prisma schema หรือ authentication/middleware; API เดิมถูกใช้รองรับ action abandon สำหรับ Reset โดยไม่เปลี่ยนการตรวจคำตอบ/คิดคะแนนหรือกติกาเกม
- ไม่แก้ seed หลักของห้อง Cybersecurity
- คงหน้า `/target` และ `target-*` ไว้ตามเดิม
- คำตอบของโจทย์ถูกเก็บเป็น hash ตามกลไกเดิม ไม่เก็บเป็นข้อความคำตอบจริงในฐานข้อมูล
- Reset เปลี่ยนเฉพาะสถานะ active session เป็น abandoned; ไม่ลบข้อมูลย้อนหลัง และเริ่ม session ใหม่เมื่อผู้ใช้กด START GAME เท่านั้น
