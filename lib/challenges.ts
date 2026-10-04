// Public challenge metadata shared by the client and the submit API. No answers here.
export const POINTS_PER_CHALLENGE = 100;
export const HINT_PENALTY = 25;

export const challenges = [
  { id: "web-01", flagKey: "idor", tag: "WEB-01 / INSECURE DIRECT OBJECT REFERENCE", title: "The article nobody was supposed to read", text: "หน้า News แสดงบทความหนึ่งรายการ แต่ระบบดึงข้อมูลผ่าน API ลองดู Request ที่เกิดขึ้น แล้วหาวิธีเข้าถึงบทความที่ไม่แสดงบนหน้าเว็บ", target: "เป้าหมาย: ค้นหา Flag จากข้อมูล Article อื่น", hint: "ดูค่า id ใน Request แล้วลองเปลี่ยนเป็นเลขอื่น" },
  { id: "web-02", flagKey: "param", tag: "WEB-02 / PARAMETER TAMPERING", title: "A profile with more access", text: "หน้า Student Portal แสดงข้อมูลของนักศึกษาปัจจุบัน ลองวิเคราะห์ API และ parameter ที่ส่งไป เพื่อค้นหา profile ที่มีสิทธิ์สูงกว่า", target: "เป้าหมาย: ค้นหา Flag จาก profile ของ admin", hint: "ลองสังเกตค่า id และ role ใน Request" },
  { id: "web-03", flagKey: "leak", tag: "WEB-03 / INFORMATION DISCLOSURE", title: "The search result says too much", text: "ระบบ Search ส่งผลลัพธ์กลับมาเป็น JSON ลองดู Response ทั้งหมด ไม่ใช่แค่สิ่งที่หน้าเว็บแสดง", target: "เป้าหมาย: ค้นหา Flag ที่รั่วอยู่ใน API Response", hint: "เปิดดู Response body ของ Search API ให้ครบ" },
  { id: "web-04", flagKey: "traversal", tag: "WEB-04 / PATH TRAVERSAL", title: "One folder too far", text: "หน้า Documents เปิดเอกสารผ่าน API โดยส่งชื่อไฟล์ไปให้ server ลองดูว่า server นำชื่อไฟล์ไปต่อกับโฟลเดอร์ใด แล้วหาทางอ่านไฟล์ที่อยู่นอกโฟลเดอร์เอกสาร", target: "เป้าหมาย: อ่านไฟล์ secret.txt ที่ไม่ได้อยู่ในโฟลเดอร์ docs", hint: "ดูค่า path ใน Response แล้วลองใช้ ../ ในค่า name เพื่อถอยออกจากโฟลเดอร์ docs" },
  { id: "web-05", flagKey: "ssrf", tag: "WEB-05 / SERVER-SIDE REQUEST FORGERY", title: "The preview that reaches inside", text: "ฟีเจอร์ URL Preview ให้ server ไปดึงข้อมูลของ URL แทนผู้ใช้ ลองดู Response ของ proxy ว่าเผยข้อมูลอะไรเกี่ยวกับระบบภายใน แล้วใช้ proxy เข้าถึง service ที่ไม่ได้เปิดสู่ภายนอก", target: "เป้าหมาย: อ่าน admin config ของ internal service ผ่าน proxy", hint: "ดูค่าใน meta ของ Response แล้วส่ง host นั้นเป็นค่า url — เริ่มจาก path / เพื่อดูว่ามี route อะไรบ้าง" },
] as const;

export type ChallengeId = (typeof challenges)[number]["id"];
