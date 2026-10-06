// Seed source for the default room (prisma/seed.ts). Public text only — no answers here.
// At runtime the game reads stages/puzzles/hints from the database, not from this file.
export const POINTS_PER_CHALLENGE = 100;
export const HINT_PENALTY = 25;

export const DEFAULT_ROOM = {
  code: "KKU-WEB-01",
  name: "Campus Portal Breach",
  description: "ห้องฝึก Web Security 5 ด่านบนเว็บไซต์มหาวิทยาลัยจำลอง ใช้ DevTools วิเคราะห์ API แล้วหา Flag",
  difficulty: "EASY",
  categories: ["Web Security", "Access Control", "Information Disclosure", "Server-Side"],
};

// A second, optional room built on the hidden /target/api/archive endpoint (referenced by WEB-03).
export const BONUS_ROOM = {
  code: "KKU-WEB-BONUS",
  name: "Hidden Archive (Bonus)",
  description: "ด่านโบนัส: ตาม internal note ที่รั่วออกมาจาก Search API ไปหา endpoint ที่ซ่อนอยู่",
  difficulty: "MEDIUM",
  categories: ["Web Security", "Information Disclosure"],
  stages: [
    { flagKey: "archive", type: "HIDDEN_ENDPOINT", tag: "BONUS-01 / HIDDEN ENDPOINT", title: "The backup nobody removed", text: "Response ของ Search API มีโน้ตภายในที่ชี้ไปยัง API สำรองตัวเก่า ลองเรียก endpoint นั้นให้ถูกต้อง", target: "เป้าหมาย: ค้นหา Flag จาก archive endpoint ที่ไม่ได้ลิงก์ไว้บนหน้าเว็บ", hints: ["ดู meta.internalNote ใน Response ของ /target/api/search", "endpoint ต้องการ query parameter ชื่อ key — ค่าอยู่ใน note เดียวกัน"], explanation: "Endpoint ที่ไม่ได้ลิงก์ไว้ไม่ได้แปลว่าปลอดภัย (security through obscurity) ต้องลบ API ที่เลิกใช้ และใช้ authentication จริงแทน key ที่เดาได้" },
  ],
} as const;

export const challenges = [
  { id: "web-01", flagKey: "idor", type: "IDOR", categories: ["Web Security", "Access Control"], tag: "WEB-01 / INSECURE DIRECT OBJECT REFERENCE", title: "The article nobody was supposed to read", text: "หน้า News แสดงบทความหนึ่งรายการ แต่ระบบดึงข้อมูลผ่าน API ลองดู Request ที่เกิดขึ้น แล้วหาวิธีเข้าถึงบทความที่ไม่แสดงบนหน้าเว็บ", target: "เป้าหมาย: ค้นหา Flag จากข้อมูล Article อื่น", hint: "ดูค่า id ใน Request แล้วลองเปลี่ยนเป็นเลขอื่น", explanation: "API คืนข้อมูลตาม id ที่ผู้ใช้ส่งมาโดยไม่ตรวจสิทธิ์ (IDOR) วิธีแก้คือตรวจ authorization ของ object ทุกครั้งฝั่ง server และไม่พึ่งการซ่อนลิงก์บนหน้าเว็บ" },
  { id: "web-02", flagKey: "param", type: "PARAMETER_TAMPERING", categories: ["Web Security", "Access Control"], tag: "WEB-02 / PARAMETER TAMPERING", title: "A profile with more access", text: "หน้า Student Portal แสดงข้อมูลของนักศึกษาปัจจุบัน ลองวิเคราะห์ API และ parameter ที่ส่งไป เพื่อค้นหา profile ที่มีสิทธิ์สูงกว่า", target: "เป้าหมาย: ค้นหา Flag จาก profile ของ admin", hint: "ลองสังเกตค่า id และ role ใน Request", explanation: "Server เชื่อค่า id/role ที่มาจาก client วิธีแก้คืออ่านตัวตนและสิทธิ์จาก session ฝั่ง server เท่านั้น ห้ามรับ role จาก query string" },
  { id: "web-03", flagKey: "leak", type: "INFO_DISCLOSURE", categories: ["Web Security", "Information Disclosure"], tag: "WEB-03 / INFORMATION DISCLOSURE", title: "The search result says too much", text: "ระบบ Search ส่งผลลัพธ์กลับมาเป็น JSON ลองดู Response ทั้งหมด ไม่ใช่แค่สิ่งที่หน้าเว็บแสดง", target: "เป้าหมาย: ค้นหา Flag ที่รั่วอยู่ใน API Response", hint: "เปิดดู Response body ของ Search API ให้ครบ", explanation: "API ส่ง field ภายใน (debug note, secret) กลับไปทั้งที่หน้าเว็บไม่ได้แสดง วิธีแก้คือกำหนด response schema แบบ allowlist และตัดข้อมูลภายในออกก่อนส่ง" },
  { id: "web-04", flagKey: "traversal", type: "PATH_TRAVERSAL", categories: ["Web Security", "Server-Side"], tag: "WEB-04 / PATH TRAVERSAL", title: "One folder too far", text: "หน้า Documents เปิดเอกสารผ่าน API โดยส่งชื่อไฟล์ไปให้ server ลองดูว่า server นำชื่อไฟล์ไปต่อกับโฟลเดอร์ใด แล้วหาทางอ่านไฟล์ที่อยู่นอกโฟลเดอร์เอกสาร", target: "เป้าหมาย: อ่านไฟล์ secret.txt ที่ไม่ได้อยู่ในโฟลเดอร์ docs", hint: "ดูค่า path ใน Response แล้วลองใช้ ../ ในค่า name เพื่อถอยออกจากโฟลเดอร์ docs", explanation: "ชื่อไฟล์จากผู้ใช้ถูกนำไปต่อ path โดยไม่ตรวจว่ายังอยู่ในโฟลเดอร์ที่อนุญาต วิธีแก้คือ resolve path แล้วตรวจ prefix หรือใช้ ID แทนชื่อไฟล์ (ด่านนี้เป็น simulation ไม่อ่านไฟล์จริง)" },
  { id: "web-05", flagKey: "ssrf", type: "SSRF", categories: ["Web Security", "Server-Side"], tag: "WEB-05 / SERVER-SIDE REQUEST FORGERY", title: "The preview that reaches inside", text: "ฟีเจอร์ URL Preview ให้ server ไปดึงข้อมูลของ URL แทนผู้ใช้ ลองดู Response ของ proxy ว่าเผยข้อมูลอะไรเกี่ยวกับระบบภายใน แล้วใช้ proxy เข้าถึง service ที่ไม่ได้เปิดสู่ภายนอก", target: "เป้าหมาย: อ่าน admin config ของ internal service ผ่าน proxy", hint: "ดูค่าใน meta ของ Response แล้วส่ง host นั้นเป็นค่า url — เริ่มจาก path / เพื่อดูว่ามี route อะไรบ้าง", explanation: "Proxy ยอมเรียก host ภายในตาม URL ที่ผู้ใช้ส่งมา วิธีแก้คือ allowlist ปลายทาง บล็อก private/internal address และไม่ส่ง response ดิบกลับ (ด่านนี้เป็น simulation ไม่มีการ fetch จริง)" },
] as const;

export type ChallengeId = (typeof challenges)[number]["id"];
