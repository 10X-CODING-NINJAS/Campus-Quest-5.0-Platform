ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "questions_solved" integer DEFAULT 0 NOT NULL;
ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "hint_progress" integer DEFAULT 0 NOT NULL;
ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "mission_completed" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
UPDATE "teams"
SET
  "questions_solved" = COALESCE("questions_solved", 0),
  "hint_progress" = COALESCE("hint_progress", 0),
  "mission_completed" = COALESCE("mission_completed", false);
