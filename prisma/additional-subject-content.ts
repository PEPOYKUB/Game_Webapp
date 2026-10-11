/** New subject rooms for the local presentation demo. Answers stay private to the seed runner. */
export const ADDITIONAL_SUBJECTS = [
  {
    code: "KKU-PROG-01", name: "Programming Foundations", difficulty: "EASY",
    description: "ภารกิจทบทวนแนวคิดพื้นฐานการเขียนโปรแกรม 5 ด่าน",
    category: "Programming Foundations", categoryDescription: "แนวคิดพื้นฐานของการเขียนโปรแกรม",
    stages: [
      { name: "ลำดับการทำงาน", title: "IPO Model", type: "PROGRAMMING", question: "Input → Process → Output เป็นรูปแบบย่อของแนวคิดพื้นฐานใด? ตอบภาษาอังกฤษคั่นด้วยขีดกลาง", answer: "INPUT-PROCESS-OUTPUT", explanation: "IPO แบ่งการทำงานเป็นรับข้อมูล ประมวลผล และแสดงผล เป็นโครงคิดพื้นฐานของโปรแกรม", hint: "ชื่อย่อมีสามส่วน: รับเข้า, ประมวลผล, ส่งออก" },
      { name: "เงื่อนไข", title: "Boolean Check", type: "PROGRAMMING", question: "นิพจน์ 7 > 3 ให้ค่าความจริงเป็น TRUE หรือ FALSE?", answer: "TRUE", explanation: "7 มากกว่า 3 ดังนั้นผลเปรียบเทียบเป็น TRUE", hint: "เปรียบเทียบจำนวนสองค่านี้โดยตรง" },
      { name: "ตัวแปร", title: "Update the Value", type: "PROGRAMMING", question: "กำหนด x = 2 แล้วทำ x = x + 1; ค่า x สุดท้ายเป็นเท่าใด?", answer: "3", explanation: "นำค่าเดิม 2 บวก 1 แล้วกำหนดกลับให้ x จึงได้ 3", hint: "เริ่มจาก 2 แล้วบวกเพิ่มหนึ่ง" },
      { name: "การวนซ้ำ", title: "Count the Iterations", type: "PROGRAMMING", question: "ลูป for (i = 0; i < 2; i++) ทำงานทั้งหมดกี่รอบ?", answer: "2", explanation: "ค่า i คือ 0 และ 1 จึงทำงานสองรอบ ก่อนหยุดเมื่อ i เป็น 2", hint: "ค่าที่เข้าเงื่อนไขคือ 0 และ 1" },
      { name: "การเรียกฟังก์ชัน", title: "Return Value", type: "PROGRAMMING", question: "ฟังก์ชัน add(a,b) คืนค่า a+b เมื่อเรียก add(19,23) จะได้ผลลัพธ์ใด?", answer: "42", explanation: "ฟังก์ชันบวกอาร์กิวเมนต์ทั้งสอง ได้ 19 + 23 = 42", hint: "บวก 19 กับ 23" },
    ],
  },
  {
    code: "KKU-DS-01", name: "Data Structures", difficulty: "MEDIUM",
    description: "ภารกิจโครงสร้างข้อมูลและประสิทธิภาพอัลกอริทึม 5 ด่าน",
    category: "Data Structures", categoryDescription: "โครงสร้างข้อมูลและการวิเคราะห์อัลกอริทึม",
    stages: [
      { name: "Stack", title: "Last In First Out", type: "DATA_STRUCTURE", question: "โครงสร้างข้อมูลที่นำสมาชิกตัวล่าสุดออกก่อน เรียกหลักการว่าอะไร? ตอบคำภาษาอังกฤษคั่นด้วยช่องว่างหรือขีดกลาง", answer: "LIFO", explanation: "Stack ทำงานแบบ Last In, First Out: สมาชิกที่ใส่ล่าสุดจะถูกนำออกก่อน", hint: "ย่อจาก Last In, First Out" },
      { name: "Queue", title: "First In First Out", type: "DATA_STRUCTURE", question: "คิวที่นำสมาชิกเข้าก่อนออกก่อนใช้หลักการย่อว่าอะไร?", answer: "FIFO", explanation: "Queue ปกติทำงานแบบ First In, First Out", hint: "ย่อจาก First In, First Out" },
      { name: "ค้นหา", title: "Binary Search Cost", type: "ALGORITHM", question: "Binary search บนข้อมูลเรียงลำดับ n รายการมีเวลาเติบโตระดับใด? ตอบ BIG-O แบบ O(LOG N)", answer: "O(LOG N)", explanation: "แต่ละขั้นลดช่วงค้นหาครึ่งหนึ่ง จึงใช้เวลา O(log n)", hint: "จำนวนขั้นเพิ่มตามลอการิทึมฐานสองของ n" },
      { name: "กราฟ", title: "Visit Every Vertex", type: "ALGORITHM", question: "DFS แบบ adjacency list ในกราฟที่มี V จุดยอดและ E เส้นเชื่อม ใช้เวลา O(V + E) หรือ O(V * E)? ตอบรูปแบบ O(V + E)", answer: "O(V + E)", explanation: "DFS เยี่ยมจุดยอดและพิจารณาเส้นเชื่อม จึงเป็น O(V + E)", hint: "รวมจำนวนจุดยอดกับจำนวนเส้นเชื่อม" },
      { name: "Hash Table", title: "Resolve a Collision", type: "DATA_STRUCTURE", question: "เมื่อ hash table พบ key สองตัวได้ index เดียวกัน เหตุการณ์นี้เรียกว่าอะไร?", answer: "COLLISION", explanation: "Collision คือ key ต่างกันถูก hash ไปยังตำแหน่งเดียวกัน", hint: "เป็นคำอังกฤษที่หมายถึงการชนกัน" },
    ],
  },
  {
    code: "KKU-NET-01", name: "Computer Networking", difficulty: "EASY",
    description: "ภารกิจพื้นฐานเครือข่ายคอมพิวเตอร์ 5 ด่าน",
    category: "Computer Networking", categoryDescription: "โปรโตคอลและพื้นฐานการสื่อสารบนเครือข่าย",
    stages: [
      { name: "ชื่อโดเมน", title: "Resolve the Name", type: "NETWORKING", question: "บริการใดแปลงชื่อโดเมน เช่น example.com ให้เป็น IP address? ตอบตัวย่อ", answer: "DNS", explanation: "DNS ใช้ค้นหา/แปลงชื่อโดเมนเป็นข้อมูล address ที่ใช้เชื่อมต่อ", hint: "ย่อจาก Domain Name System" },
      { name: "การขนส่ง", title: "Reliable Transport", type: "NETWORKING", question: "โปรโตคอล transport แบบ connection-oriented และรับประกันลำดับข้อมูลคือ TCP หรือ UDP?", answer: "TCP", explanation: "TCP สร้างการเชื่อมต่อและดูแลการส่งข้อมูลอย่างเชื่อถือได้ตามลำดับ", hint: "สามตัวอักษร ขึ้นต้นด้วย T" },
      { name: "Subnet", title: "Usable Hosts", type: "NETWORKING", question: "เครือข่าย IPv4 /24 มี usable host address ตามสูตรทั่วไป (2^จำนวนบิต host − 2) กี่ address?", answer: "254", explanation: "/24 เหลือ host 8 บิต: 2^8 − 2 = 254", hint: "มีทั้งหมด 256 ค่า แต่หัก network และ broadcast อย่างละหนึ่ง" },
      { name: "HTTP", title: "Not Found", type: "NETWORKING", question: "รหัสสถานะ HTTP มาตรฐานสำหรับ resource not found คือเลขใด?", answer: "404", explanation: "HTTP 404 หมายถึงไม่พบ resource ที่ร้องขอ", hint: "เป็นรหัส not found ที่คุ้นเคย" },
      { name: "ความปลอดภัย", title: "Encrypted Web", type: "NETWORKING", question: "โปรโตคอลที่ช่วยเข้ารหัสการเชื่อมต่อ HTTPS คือ TLS หรือ FTP?", answer: "TLS", explanation: "HTTPS ใช้ TLS เพื่อปกป้องข้อมูลระหว่าง client กับ server", hint: "ย่อจาก Transport Layer Security" },
    ],
  },
  {
    code: "KKU-OS-01", name: "Operating Systems", difficulty: "MEDIUM",
    description: "ภารกิจระบบปฏิบัติการและการจัดการทรัพยากร 5 ด่าน",
    category: "Operating Systems", categoryDescription: "แนวคิดระบบปฏิบัติการและการจัดการทรัพยากร",
    stages: [
      { name: "Process", title: "Program in Execution", type: "OPERATING_SYSTEMS", question: "โปรแกรมที่กำลังทำงานอยู่เรียกว่าอะไร? ตอบคำเดียวภาษาอังกฤษ", answer: "PROCESS", explanation: "Process คือ instance ของโปรแกรมที่กำลังทำงาน พร้อมสถานะและทรัพยากร", hint: "ต่างจาก program ที่เป็นเพียงไฟล์คำสั่ง" },
      { name: "Scheduling", title: "Take Turns", type: "OPERATING_SYSTEMS", question: "วิธี scheduling ที่ให้แต่ละ process ใช้ CPU ตามช่วงเวลาสั้น ๆ เรียกว่าอะไร? ตอบ ROUND-ROBIN", answer: "ROUND-ROBIN", explanation: "Round Robin ให้เวลา CPU (time quantum) แก่แต่ละ process วนตามคิว", hint: "ชื่อเหมือนการหมุนเวียนเป็นรอบ" },
      { name: "Deadlock", title: "Waiting Forever", type: "OPERATING_SYSTEMS", question: "ภาวะที่ process ต่างรอกันถือครอง resource จนไปต่อไม่ได้ เรียกว่าอะไร?", answer: "DEADLOCK", explanation: "Deadlock เกิดเมื่อชุด process รอ resource ซึ่งกันและกันจนไม่มีใครเดินหน้าต่อ", hint: "คำประกอบจาก dead + lock" },
      { name: "Memory", title: "Fixed-Size Pages", type: "OPERATING_SYSTEMS", question: "เทคนิคจัดการหน่วยความจำที่แบ่ง memory เป็น page และ frame ขนาดเท่ากันเรียกว่าอะไร?", answer: "PAGING", explanation: "Paging แบ่ง logical memory เป็น pages และ physical memory เป็น frames", hint: "คำกริยาที่มาจาก page" },
      { name: "File Permissions", title: "Unix Mode 644", type: "OPERATING_SYSTEMS", question: "สิทธิ์ Unix 644 ให้ owner มี rw-, group มี r-- และ others มี r-- เขียนเป็นสัญลักษณ์ 9 ตัวว่าอะไร?", answer: "RW-R--R--", explanation: "เลข 6 คือ rw-, เลข 4 คือ r-- ดังนั้น 644 คือ rw-r--r--", hint: "รวมสิทธิ์ 6 (rw-) กับ 4 (r--) สองชุด" },
    ],
  },
  {
    code: "KKU-MATH-01", name: "Discrete Mathematics", difficulty: "MEDIUM",
    description: "ภารกิจตรรกศาสตร์และคณิตศาสตร์ไม่ต่อเนื่อง 5 ด่าน",
    category: "Discrete Mathematics", categoryDescription: "ตรรกศาสตร์ เซต และคณิตศาสตร์ไม่ต่อเนื่อง",
    stages: [
      { name: "ตรรกศาสตร์", title: "Logical Disjunction", type: "DISCRETE_MATH", question: "ตัวดำเนินการตรรกะที่เป็นจริงเมื่ออย่างน้อยหนึ่งข้อความเป็นจริง เรียกว่าอะไร? ตอบ OR หรือ AND", answer: "OR", explanation: "OR (disjunction) เป็นจริงเมื่อ operand อย่างน้อยหนึ่งตัวเป็นจริง", hint: "เลือกตัวดำเนินการที่ไม่ต้องให้ทั้งสองข้างจริง" },
      { name: "เลขฐานสอง", title: "Decimal to Binary", type: "DISCRETE_MATH", question: "เลขฐานสิบ 10 เขียนเป็นเลขฐานสอง 4 บิตอย่างไร?", answer: "1010", explanation: "10 = 8 + 2 จึงมีบิต 1 ที่ตำแหน่ง 8 และ 2: 1010", hint: "แยก 10 เป็น 8 + 2" },
      { name: "เซต", title: "Count the Subsets", type: "DISCRETE_MATH", question: "เซตที่มีสมาชิก 2 ตัว มี subset ทั้งหมดกี่เซต (รวมเซตว่างและเซตเดิม)?", answer: "4", explanation: "จำนวน subset เท่ากับ 2^n ดังนั้น 2^2 = 4", hint: "ใช้สูตร 2 ยกกำลังจำนวนสมาชิก" },
      { name: "กราฟ", title: "Tree Edges", type: "DISCRETE_MATH", question: "ต้นไม้ (tree) ที่มี 3 vertices มี edges กี่เส้น?", answer: "2", explanation: "ต้นไม้ที่เชื่อมต่อและไม่มี cycle มี edges เท่ากับ vertices − 1", hint: "จำนวนเส้นเชื่อมเท่ากับจำนวนจุดยอดลบหนึ่ง" },
      { name: "ความเท่าเทียม", title: "Contrapositive Check", type: "DISCRETE_MATH", question: "ข้อความ p → q สมมูลกับ contrapositive ¬q → ¬p หรือไม่? ตอบ TRUE หรือ FALSE", answer: "TRUE", explanation: "นัย p → q สมมูลเชิงตรรกะกับ contrapositive ¬q → ¬p", hint: "การกลับนิเสธทั้งเงื่อนไขและผลให้ประพจน์สมมูล" },
    ],
  },
  {
    code: "KKU-STAT-01", name: "Statistics & Data Analysis", difficulty: "EASY",
    description: "ภารกิจสถิติเบื้องต้นและการอ่านข้อมูล 5 ด่าน",
    category: "Statistics & Data Analysis", categoryDescription: "ค่ากลาง การกระจาย และความน่าจะเป็นเบื้องต้น",
    stages: [
      { name: "ค่าเฉลี่ย", title: "Calculate the Mean", type: "STATISTICS", question: "ค่าเฉลี่ยเลขคณิตของ 2, 4, 6 คือเท่าใด?", answer: "4", explanation: "(2 + 4 + 6) / 3 = 4", hint: "บวกข้อมูลแล้วหารด้วยจำนวนข้อมูล" },
      { name: "มัธยฐาน", title: "Find the Median", type: "STATISTICS", question: "มัธยฐานของข้อมูลเรียง 1, 3, 5 คือเท่าใด?", answer: "3", explanation: "ค่ากลางเมื่อเรียงข้อมูลคือ 3", hint: "เลือกค่าที่อยู่ตรงกลาง" },
      { name: "ความน่าจะเป็น", title: "Fair Coin", type: "STATISTICS", question: "โยนเหรียญเที่ยงตรงหนึ่งครั้ง ความน่าจะเป็นที่จะออกหัวเขียนเป็นเศษส่วนอย่างต่ำเท่าใด?", answer: "1/2", explanation: "ผลลัพธ์มีโอกาสเท่ากัน 2 แบบ และหัวมี 1 แบบ จึงเป็น 1/2", hint: "มีผลลัพธ์ที่ต้องการ 1 จากทั้งหมด 2" },
      { name: "พิสัย", title: "Measure the Range", type: "STATISTICS", question: "พิสัยของข้อมูล 2, 5, 8 เท่ากับเท่าใด? (ค่าสูงสุด − ค่าต่ำสุด)", answer: "6", explanation: "พิสัย = 8 − 2 = 6", hint: "นำค่าสูงสุดลบค่าต่ำสุด" },
      { name: "ฐานนิยม", title: "Most Frequent Value", type: "STATISTICS", question: "ฐานนิยมของข้อมูล 1, 2, 2, 3 คือเท่าใด?", answer: "2", explanation: "2 ปรากฏบ่อยที่สุดในชุดข้อมูล", hint: "เลือกค่าที่เกิดซ้ำมากที่สุด" },
    ],
  },
] as const;
