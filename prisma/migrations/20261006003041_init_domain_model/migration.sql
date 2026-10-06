-- CreateTable
CREATE TABLE "faculty" (
    "faculty_id" SERIAL NOT NULL,
    "faculty_code" VARCHAR(20) NOT NULL,
    "faculty_name_th" VARCHAR(100) NOT NULL,
    "faculty_name_en" VARCHAR(100) NOT NULL,

    CONSTRAINT "pk_faculty" PRIMARY KEY ("faculty_id")
);

-- CreateTable
CREATE TABLE "app_user" (
    "user_id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(50) NOT NULL,
    "last_name" VARCHAR(50) NOT NULL,
    "student_id" VARCHAR(20),
    "year_level" SMALLINT,
    "role" VARCHAR(20) NOT NULL DEFAULT 'PLAYER',
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "faculty_id" INTEGER,

    CONSTRAINT "pk_app_user" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "room" (
    "room_id" SERIAL NOT NULL,
    "room_code" VARCHAR(20) NOT NULL,
    "room_name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(1000),
    "difficulty_level" VARCHAR(20) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,

    CONSTRAINT "pk_room" PRIMARY KEY ("room_id")
);

-- CreateTable
CREATE TABLE "category" (
    "category_id" SERIAL NOT NULL,
    "category_name" VARCHAR(50) NOT NULL,
    "category_description" VARCHAR(255),

    CONSTRAINT "pk_category" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "room_category" (
    "room_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_room_category" PRIMARY KEY ("room_id","category_id")
);

-- CreateTable
CREATE TABLE "stage" (
    "stage_id" SERIAL NOT NULL,
    "room_id" INTEGER NOT NULL,
    "stage_number" INTEGER NOT NULL,
    "stage_name" VARCHAR(100) NOT NULL,
    "storyline_text" VARCHAR(2000),
    "max_score" INTEGER NOT NULL,

    CONSTRAINT "pk_stage" PRIMARY KEY ("stage_id")
);

-- CreateTable
CREATE TABLE "puzzle" (
    "puzzle_id" SERIAL NOT NULL,
    "stage_id" INTEGER NOT NULL,
    "puzzle_title" VARCHAR(100) NOT NULL,
    "question_text" VARCHAR(2000) NOT NULL,
    "puzzle_type" VARCHAR(30) NOT NULL,
    "correct_answer_hash" VARCHAR(255) NOT NULL,
    "explanation_text" VARCHAR(1000),

    CONSTRAINT "pk_puzzle" PRIMARY KEY ("puzzle_id")
);

-- CreateTable
CREATE TABLE "hint" (
    "hint_id" SERIAL NOT NULL,
    "puzzle_id" INTEGER NOT NULL,
    "hint_level" SMALLINT NOT NULL,
    "hint_text" VARCHAR(1000) NOT NULL,
    "deduction_score" SMALLINT NOT NULL,

    CONSTRAINT "pk_hint" PRIMARY KEY ("hint_id")
);

-- CreateTable
CREATE TABLE "game_session" (
    "session_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "room_id" INTEGER NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "final_score" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pk_game_session" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "stage_progress" (
    "progress_id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "stage_id" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'LOCKED',
    "score_earned" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "pk_stage_progress" PRIMARY KEY ("progress_id")
);

-- CreateTable
CREATE TABLE "puzzle_attempt" (
    "attempt_id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "puzzle_id" INTEGER NOT NULL,
    "submitted_answer" VARCHAR(1000) NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_puzzle_attempt" PRIMARY KEY ("attempt_id")
);

-- CreateTable
CREATE TABLE "hint_usage" (
    "hint_usage_id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "hint_id" INTEGER NOT NULL,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score_deducted" SMALLINT NOT NULL,

    CONSTRAINT "pk_hint_usage" PRIMARY KEY ("hint_usage_id")
);

-- CreateTable
CREATE TABLE "achievement" (
    "achievement_id" SERIAL NOT NULL,
    "achievement_code" VARCHAR(30) NOT NULL,
    "achievement_name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "badge_icon_url" VARCHAR(255),
    "criteria_condition" VARCHAR(500),

    CONSTRAINT "pk_achievement" PRIMARY KEY ("achievement_id")
);

-- CreateTable
CREATE TABLE "user_achievement" (
    "user_id" INTEGER NOT NULL,
    "achievement_id" INTEGER NOT NULL,
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_user_achievement" PRIMARY KEY ("user_id","achievement_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_faculty_code" ON "faculty"("faculty_code");

-- CreateIndex
CREATE UNIQUE INDEX "uq_app_user_username" ON "app_user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "uq_app_user_email" ON "app_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "uq_app_user_student_id" ON "app_user"("student_id");

-- CreateIndex
CREATE INDEX "ix_app_user_faculty" ON "app_user"("faculty_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_room_code" ON "room"("room_code");

-- CreateIndex
CREATE INDEX "ix_room_created_by" ON "room"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "uq_category_name" ON "category"("category_name");

-- CreateIndex
CREATE UNIQUE INDEX "uq_stage_room_number" ON "stage"("room_id", "stage_number");

-- CreateIndex
CREATE INDEX "ix_puzzle_stage" ON "puzzle"("stage_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_hint_puzzle_level" ON "hint"("puzzle_id", "hint_level");

-- CreateIndex
CREATE INDEX "ix_game_session_user_room" ON "game_session"("user_id", "room_id");

-- CreateIndex
CREATE INDEX "ix_game_session_room_status" ON "game_session"("room_id", "status");

-- CreateIndex
CREATE INDEX "ix_stage_progress_stage" ON "stage_progress"("stage_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_progress_session_stage" ON "stage_progress"("session_id", "stage_id");

-- CreateIndex
CREATE INDEX "ix_puzzle_attempt_session" ON "puzzle_attempt"("session_id");

-- CreateIndex
CREATE INDEX "ix_puzzle_attempt_puzzle" ON "puzzle_attempt"("puzzle_id");

-- CreateIndex
CREATE INDEX "ix_hint_usage_session" ON "hint_usage"("session_id");

-- CreateIndex
CREATE INDEX "ix_hint_usage_hint" ON "hint_usage"("hint_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_hint_usage_session_hint" ON "hint_usage"("session_id", "hint_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_achievement_code" ON "achievement"("achievement_code");

-- CreateIndex
CREATE INDEX "ix_user_achievement_achievement" ON "user_achievement"("achievement_id");

-- AddForeignKey
ALTER TABLE "app_user" ADD CONSTRAINT "fk_app_user_faculty" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("faculty_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room" ADD CONSTRAINT "fk_room_created_by" FOREIGN KEY ("created_by") REFERENCES "app_user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_category" ADD CONSTRAINT "fk_room_category_room" FOREIGN KEY ("room_id") REFERENCES "room"("room_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_category" ADD CONSTRAINT "fk_room_category_category" FOREIGN KEY ("category_id") REFERENCES "category"("category_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage" ADD CONSTRAINT "fk_stage_room" FOREIGN KEY ("room_id") REFERENCES "room"("room_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puzzle" ADD CONSTRAINT "fk_puzzle_stage" FOREIGN KEY ("stage_id") REFERENCES "stage"("stage_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hint" ADD CONSTRAINT "fk_hint_puzzle" FOREIGN KEY ("puzzle_id") REFERENCES "puzzle"("puzzle_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_session" ADD CONSTRAINT "fk_game_session_user" FOREIGN KEY ("user_id") REFERENCES "app_user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_session" ADD CONSTRAINT "fk_game_session_room" FOREIGN KEY ("room_id") REFERENCES "room"("room_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_progress" ADD CONSTRAINT "fk_stage_progress_session" FOREIGN KEY ("session_id") REFERENCES "game_session"("session_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_progress" ADD CONSTRAINT "fk_stage_progress_stage" FOREIGN KEY ("stage_id") REFERENCES "stage"("stage_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puzzle_attempt" ADD CONSTRAINT "fk_puzzle_attempt_session" FOREIGN KEY ("session_id") REFERENCES "game_session"("session_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puzzle_attempt" ADD CONSTRAINT "fk_puzzle_attempt_puzzle" FOREIGN KEY ("puzzle_id") REFERENCES "puzzle"("puzzle_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hint_usage" ADD CONSTRAINT "fk_hint_usage_session" FOREIGN KEY ("session_id") REFERENCES "game_session"("session_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hint_usage" ADD CONSTRAINT "fk_hint_usage_hint" FOREIGN KEY ("hint_id") REFERENCES "hint"("hint_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievement" ADD CONSTRAINT "fk_user_achievement_user" FOREIGN KEY ("user_id") REFERENCES "app_user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievement" ADD CONSTRAINT "fk_user_achievement_achievement" FOREIGN KEY ("achievement_id") REFERENCES "achievement"("achievement_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CHECK constraints (business rules Prisma cannot express in the schema)
ALTER TABLE "app_user" ADD CONSTRAINT "ck_app_user_role" CHECK ("role" IN ('PLAYER', 'ADMIN'));
ALTER TABLE "app_user" ADD CONSTRAINT "ck_app_user_status" CHECK ("status" IN ('ACTIVE', 'SUSPENDED'));
ALTER TABLE "app_user" ADD CONSTRAINT "ck_app_user_year_level" CHECK ("year_level" IS NULL OR "year_level" BETWEEN 1 AND 8);
ALTER TABLE "room" ADD CONSTRAINT "ck_room_difficulty" CHECK ("difficulty_level" IN ('EASY', 'MEDIUM', 'HARD'));
ALTER TABLE "stage" ADD CONSTRAINT "ck_stage_number" CHECK ("stage_number" >= 1);
ALTER TABLE "stage" ADD CONSTRAINT "ck_stage_max_score" CHECK ("max_score" >= 0);
ALTER TABLE "hint" ADD CONSTRAINT "ck_hint_level" CHECK ("hint_level" >= 1);
ALTER TABLE "hint" ADD CONSTRAINT "ck_hint_deduction" CHECK ("deduction_score" >= 0);
ALTER TABLE "game_session" ADD CONSTRAINT "ck_game_session_status" CHECK ("status" IN ('ACTIVE', 'COMPLETED', 'ABANDONED'));
ALTER TABLE "game_session" ADD CONSTRAINT "ck_game_session_score" CHECK ("final_score" >= 0);
ALTER TABLE "game_session" ADD CONSTRAINT "ck_game_session_dates" CHECK ("ended_at" IS NULL OR "ended_at" >= "started_at");
ALTER TABLE "stage_progress" ADD CONSTRAINT "ck_stage_progress_status" CHECK ("status" IN ('LOCKED', 'IN_PROGRESS', 'COMPLETED'));
ALTER TABLE "stage_progress" ADD CONSTRAINT "ck_stage_progress_score" CHECK ("score_earned" >= 0);
ALTER TABLE "hint_usage" ADD CONSTRAINT "ck_hint_usage_score" CHECK ("score_deducted" >= 0);

-- At most one running session per player per room (stops double-click duplicates).
CREATE UNIQUE INDEX "uq_game_session_one_active" ON "game_session" ("user_id", "room_id") WHERE "status" = 'ACTIVE';
