# Project Demo Runbook

This runbook is for the local classroom demo. It uses the real UI and leaves game scoring, flag validation, and database schema unchanged.

## Prepare once

Start the local stack and ensure base data exists:

```powershell
docker compose up -d
docker compose exec app npm run db:seed
docker compose exec app npm run db:subjects
docker compose exec app npm run db:additional-subjects
docker compose exec app npm run db:demo
docker compose exec app npm run db:leaderboard-demo
```

`db:additional-subjects` เพิ่ม 6 ห้อง ห้องละ 5 โจทย์จาก Programming, Data Structures, Networking, Operating Systems, Discrete Mathematics และ Statistics โดยไม่ลบหรือเขียนทับข้อมูลเดิม; คะแนนเต็ม 100 ต่อด่านและ Hint หัก 25 คะแนน

`db:subjects` เพิ่มห้อง Database Quest จำนวน 5 ด่านด้วย seed แยกที่รันซ้ำได้โดยไม่ลบหรือเขียนทับข้อมูลเดิม แต่ละด่านมีโจทย์ คำตอบที่เก็บเป็น hash, คำอธิบาย และ Hint หนึ่งข้อ คะแนนเต็ม 100 และหัก 25 คะแนนเมื่อใช้ Hint

โจทย์ครอบคลุม ER cardinality, composite key, 3NF, `GROUP BY` และ Atomicity โดยไม่ต้องพิมพ์ SQL ยาว ๆ คำตอบสั้นและไม่แสดงใน UI ก่อนตอบถูก

`db:leaderboard-demo` เตรียมบัญชี `demo_player_02`–`demo_player_10` พร้อมผลการเล่น **สังเคราะห์** ให้แต่ละบัญชีอยู่คนละห้อง/คณะ/ชั้นปี เพื่อสาธิตตัวกรอง Leaderboard ได้ครบ โดยย้ายเฉพาะ session สังเคราะห์เดิมของ `demo_player_02`–`demo_player_05` ไปยังห้องที่กำหนดและเก็บคะแนน/attempt/hint เดิมไว้ ไม่แก้หรือรีเซ็ต `demo_student` คำสั่งนี้รันซ้ำได้และคงผลที่มีอยู่ รหัสผ่าน local ของบัญชีชุดนี้คือ `DemoPass2026!` ห้ามนำผลสาธิตไปอ้างว่าเป็นผู้เล่นหรือผลจริง

| บัญชี | ห้อง | คณะ | ชั้นปี | คะแนนสังเคราะห์ |
| --- | --- | --- | ---: | ---: |
| `demo_player_02` | Programming Foundations | CP | 1 | 500 |
| `demo_player_03` | Data Structures | EN | 2 | 450 |
| `demo_player_04` | Computer Networking | SC | 3 | 425 |
| `demo_player_05` | Operating Systems | AR | 4 | 400 |
| `demo_player_06` | Discrete Mathematics | BS | 5 | 375 |
| `demo_player_07` | Statistics & Data Analysis | HS | 6 | 475 |
| `demo_player_08` | Campus Portal Breach | MD | 7 | 375 |
| `demo_player_09` | Hidden Archive (Bonus) | NS | 8 | 75 |
| `demo_player_10` | Database Quest | PH | — | 375 |

Run `db:additional-subjects` before `db:leaderboard-demo`. The two seeds are separate from the original Cybersecurity seed and do not use `deleteMany`.

The dedicated account created by `db:demo` is:

| Field | Value |
| --- | --- |
| Username | `demo_student` |
| Password | `DemoPass2026!` |
| Faculty / Year | College of Computing / Year 3 |
| Role | PLAYER |

This fixture is idempotent: if the matching active demo account already exists, it makes no changes; if either unique identifier belongs to another account, it stops without changing data. It creates no session or score. These credentials are for local presentation only; do not use them on a public deployment.

## Suggested 10-minute presentation

1. **Problem and scope (45 sec):** demonstrate a single-player Web Security Awareness game with five simulated web challenges and server-persisted progress.
2. **ER focus (90 sec):** show `app_user → game_session → stage_progress`; then `puzzle_attempt` and `hint_usage`; finish with `user_achievement`. Explain one user can have multiple runs and each run tracks ordered stage progress and attempts.
3. **Schema and normalization (60 sec):** highlight PK/FK, unique username/email, unique `(session_id, stage_id)`, and unique `(session_id, hint_id)`. Example: puzzle attempts reference a puzzle and a session instead of copying player, stage, or room details into every attempt (avoids update anomalies).
4. **Before state (30 sec):** sign in as the demo player, show no run yet, then run the “before” query below.
5. **Live core flow (3 min):** press **START GAME**; submit an intentionally invalid Flag once and show the rejection; inspect the attempt row; investigate the simulated `/target`; submit the discovered Flags through the UI until all five stages are complete. Do not reveal actual Flags in slides or this runbook.
6. **After state and business-rule rejection (90 sec):** show completed session, stage progress, redacted correct attempts, score, and achievements in the database. Explain that locked stages reject submissions until the preceding stage is complete; optionally attempt to submit to a locked stage only if time allows.
7. **SQL/transaction and close (45 sec):** describe that answer validation and attempt/progress/score updates happen server-side in a transaction; explain limitations and team contributions.

For a repeat, sign in again and press **PLAY AGAIN**. The fixture does not reset history, so each run remains available in `game_session`. If the credentials were changed, use the normal password reset/account management available to the team or remove only this dedicated local demo user and rerun `db:demo`.

## Database checks

Open a PostgreSQL shell:

```powershell
docker compose exec db psql -U cyber -d cyberescape
```

Before starting a run, show the prepared user and the absence of a session (a `LEFT JOIN` keeps the user visible):

```sql
SELECT u.user_id, u.username, u.role, u.status, f.faculty_code, u.year_level,
       gs.session_id, gs.status AS session_status
FROM app_user AS u
LEFT JOIN faculty AS f ON f.faculty_id = u.faculty_id
LEFT JOIN game_session AS gs ON gs.user_id = u.user_id
WHERE u.username = 'demo_student'
ORDER BY gs.session_id DESC NULLS LAST;
```

After completion, inspect the run summary (latest session for this player):

```sql
WITH latest AS (
  SELECT gs.*
  FROM game_session AS gs
  JOIN app_user AS u ON u.user_id = gs.user_id
  WHERE u.username = 'demo_student'
  ORDER BY gs.session_id DESC
  LIMIT 1
)
SELECT session_id, status, final_score, started_at, ended_at,
       ended_at - started_at AS duration
FROM latest;
```

Inspect stage progression and per-stage points:

```sql
SELECT s.stage_number, s.stage_name, sp.status, sp.score_earned,
       sp.started_at, sp.completed_at
FROM stage_progress AS sp
JOIN stage AS s ON s.stage_id = sp.stage_id
WHERE sp.session_id = (
  SELECT gs.session_id FROM game_session AS gs
  JOIN app_user AS u ON u.user_id = gs.user_id
  WHERE u.username = 'demo_student'
  ORDER BY gs.session_id DESC LIMIT 1
)
ORDER BY s.stage_number;
```

Inspect rejected/correct attempts and verify correct answers are redacted:

```sql
SELECT p.puzzle_title, pa.is_correct, pa.submitted_answer, pa.attempted_at
FROM puzzle_attempt AS pa
JOIN puzzle AS p ON p.puzzle_id = pa.puzzle_id
WHERE pa.session_id = (
  SELECT gs.session_id FROM game_session AS gs
  JOIN app_user AS u ON u.user_id = gs.user_id
  WHERE u.username = 'demo_student'
  ORDER BY gs.session_id DESC LIMIT 1
)
ORDER BY pa.attempted_at;
```

Inspect hints and achievements for that player:

```sql
SELECT hu.hint_usage_id, h.hint_level, hu.score_deducted, hu.used_at
FROM hint_usage AS hu
JOIN hint AS h ON h.hint_id = hu.hint_id
JOIN game_session AS gs ON gs.session_id = hu.session_id
JOIN app_user AS u ON u.user_id = gs.user_id
WHERE u.username = 'demo_student'
ORDER BY hu.used_at;

SELECT a.achievement_code, a.achievement_name, ua.unlocked_at
FROM user_achievement AS ua
JOIN achievement AS a ON a.achievement_id = ua.achievement_id
JOIN app_user AS u ON u.user_id = ua.user_id
WHERE u.username = 'demo_student'
ORDER BY ua.unlocked_at;
```

Expected for a completed default-room run: one `COMPLETED` session, five completed `stage_progress` rows, score normally 500 with no hints, and five correct attempts plus any deliberately rejected attempts. Correct submitted answers appear as `[REDACTED: correct flag]`; the intentionally wrong test answer remains visible. `FLAWLESS` is not awarded if even one rejected submission was made. `SPEEDRUN` depends on completing within 30 minutes.

## Demo caveat to address before presenting

After a wrong answer, the UI shows the rejection immediately, but the ATTEMPTS counter can remain stale until the next successful answer or a page refresh. The `puzzle_attempt` row is still written to PostgreSQL. If this counter is part of the live demo, refresh before showing the updated count or fix the UI refresh behavior separately.
