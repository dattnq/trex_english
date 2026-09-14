BEGIN;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('LEARNER', 'ADMIN');

-- CreateEnum
CREATE TYPE "DeckVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "AttemptKind" AS ENUM ('QUIZ', 'TEST');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "display_name" VARCHAR(80) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'LEARNER',
    "daily_goal" INTEGER NOT NULL DEFAULT 10,
    "time_zone" VARCHAR(64) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decks" (
    "id" TEXT NOT NULL,
    "owner_id" UUID,
    "title" VARCHAR(160) NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category" VARCHAR(80) NOT NULL,
    "level" VARCHAR(8) NOT NULL DEFAULT 'A1',
    "color" VARCHAR(24) NOT NULL DEFAULT 'blue',
    "symbol" VARCHAR(16) NOT NULL DEFAULT 'Aa',
    "visibility" "DeckVisibility" NOT NULL DEFAULT 'PRIVATE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "decks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "words" (
    "deck_id" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "term" VARCHAR(200) NOT NULL,
    "phonetic" VARCHAR(200) NOT NULL DEFAULT '',
    "meaning" TEXT NOT NULL,
    "example" TEXT NOT NULL DEFAULT '',
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "words_pkey" PRIMARY KEY ("deck_id","id")
);

-- CreateTable
CREATE TABLE "saved_decks" (
    "user_id" UUID NOT NULL,
    "deck_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_decks_pkey" PRIMARY KEY ("user_id","deck_id")
);

-- CreateTable
CREATE TABLE "word_progress" (
    "user_id" UUID NOT NULL,
    "deck_id" TEXT NOT NULL,
    "word_id" TEXT NOT NULL,
    "known" BOOLEAN NOT NULL DEFAULT false,
    "last_reviewed" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "word_progress_pkey" PRIMARY KEY ("user_id","deck_id","word_id")
);

-- CreateTable
CREATE TABLE "daily_word_activity" (
    "user_id" UUID NOT NULL,
    "day" DATE NOT NULL,
    "deck_id" TEXT NOT NULL,
    "word_id" TEXT NOT NULL,
    "reviewed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_word_activity_pkey" PRIMARY KEY ("user_id","day","deck_id","word_id")
);

-- CreateTable
CREATE TABLE "tests" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "level" VARCHAR(8) NOT NULL DEFAULT 'A1',
    "category" VARCHAR(80) NOT NULL,
    "minutes" INTEGER NOT NULL DEFAULT 5,
    "color" VARCHAR(24) NOT NULL DEFAULT 'blue',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_questions" (
    "id" TEXT NOT NULL,
    "test_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "options" TEXT[],
    "answer" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "test_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempts" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "kind" "AttemptKind" NOT NULL,
    "deck_id" TEXT,
    "test_id" TEXT,
    "title" VARCHAR(160) NOT NULL,
    "questions" JSONB NOT NULL,
    "answers" INTEGER[],
    "score" INTEGER NOT NULL,
    "completed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "decks_owner_id_idx" ON "decks"("owner_id");

-- CreateIndex
CREATE INDEX "decks_visibility_level_category_idx" ON "decks"("visibility", "level", "category");

-- CreateIndex
CREATE INDEX "words_deck_id_position_idx" ON "words"("deck_id", "position");

-- CreateIndex
CREATE INDEX "saved_decks_deck_id_idx" ON "saved_decks"("deck_id");

-- CreateIndex
CREATE INDEX "word_progress_deck_id_word_id_idx" ON "word_progress"("deck_id", "word_id");

-- CreateIndex
CREATE INDEX "word_progress_user_id_known_idx" ON "word_progress"("user_id", "known");

-- CreateIndex
CREATE INDEX "daily_word_activity_deck_id_word_id_idx" ON "daily_word_activity"("deck_id", "word_id");

-- CreateIndex
CREATE INDEX "tests_published_level_idx" ON "tests"("published", "level");

-- CreateIndex
CREATE UNIQUE INDEX "test_questions_test_id_position_key" ON "test_questions"("test_id", "position");

-- CreateIndex
CREATE INDEX "attempts_user_id_completed_at_idx" ON "attempts"("user_id", "completed_at");

-- CreateIndex
CREATE INDEX "attempts_deck_id_idx" ON "attempts"("deck_id");

-- CreateIndex
CREATE INDEX "attempts_test_id_idx" ON "attempts"("test_id");

-- AddForeignKey
ALTER TABLE "decks" ADD CONSTRAINT "decks_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "words" ADD CONSTRAINT "words_deck_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_decks" ADD CONSTRAINT "saved_decks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_decks" ADD CONSTRAINT "saved_decks_deck_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_progress" ADD CONSTRAINT "word_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_progress" ADD CONSTRAINT "word_progress_deck_id_word_id_fkey" FOREIGN KEY ("deck_id", "word_id") REFERENCES "words"("deck_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_word_activity" ADD CONSTRAINT "daily_word_activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_word_activity" ADD CONSTRAINT "daily_word_activity_deck_id_word_id_fkey" FOREIGN KEY ("deck_id", "word_id") REFERENCES "words"("deck_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_questions" ADD CONSTRAINT "test_questions_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_deck_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "decks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Application invariants not expressible in Prisma's schema language.
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_daily_goal_check"
  CHECK ("daily_goal" BETWEEN 5 AND 30);
ALTER TABLE "decks" ADD CONSTRAINT "decks_private_owner_check"
  CHECK ("visibility" <> 'PRIVATE' OR "owner_id" IS NOT NULL);
ALTER TABLE "words" ADD CONSTRAINT "words_position_check"
  CHECK ("position" >= 0);
ALTER TABLE "tests" ADD CONSTRAINT "tests_minutes_check"
  CHECK ("minutes" > 0);
ALTER TABLE "test_questions" ADD CONSTRAINT "test_questions_options_check"
  CHECK ("options" IS NOT NULL AND array_ndims("options") = 1
    AND cardinality("options") >= 2 AND array_position("options", NULL) IS NULL);
ALTER TABLE "test_questions" ADD CONSTRAINT "test_questions_answer_check"
  CHECK ("answer" >= 0 AND "answer" < cardinality("options") AND "position" >= 0);
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_snapshot_check"
  CHECK (CASE WHEN jsonb_typeof("questions") = 'array' THEN
    jsonb_array_length("questions") > 0
    AND "answers" IS NOT NULL
    AND array_ndims("answers") = 1
    AND cardinality("answers") = jsonb_array_length("questions")
    AND array_position("answers", NULL) IS NULL
    AND 0 <= ALL("answers")
    AND "score" BETWEEN 0 AND jsonb_array_length("questions")
  ELSE false END);
-- Source references may become null when the source is deleted.
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_source_kind_check"
  CHECK (("kind" = 'QUIZ' AND "test_id" IS NULL)
    OR ("kind" = 'TEST' AND "deck_id" IS NULL));

-- Deny Data API access until authenticated policies/backend are implemented.
-- Prisma's privileged server connection must enforce ownership and admin roles.
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "decks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "words" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "saved_decks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "word_progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "daily_word_activity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "test_questions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attempts" ENABLE ROW LEVEL SECURITY;

COMMIT;
