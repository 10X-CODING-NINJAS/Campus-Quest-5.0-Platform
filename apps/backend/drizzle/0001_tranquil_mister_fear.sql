ALTER TYPE "public"."verdict" ADD VALUE 'OLE';--> statement-breakpoint
ALTER TYPE "public"."verdict" ADD VALUE 'PE';--> statement-breakpoint
ALTER TYPE "public"."verdict" ADD VALUE 'IJE';--> statement-breakpoint
ALTER TABLE "problems" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "problems" CASCADE;--> statement-breakpoint
ALTER TABLE "submissions" DROP CONSTRAINT "submissions_problem_id_problems_id_fk";
--> statement-breakpoint
ALTER TABLE "submissions" ALTER COLUMN "language" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."language";--> statement-breakpoint
CREATE TYPE "public"."language" AS ENUM('c', 'cpp', 'python', 'java');--> statement-breakpoint
ALTER TABLE "submissions" ALTER COLUMN "language" SET DATA TYPE "public"."language" USING "language"::"public"."language";--> statement-breakpoint
ALTER TABLE "team_powerups" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."powerup_type";--> statement-breakpoint
CREATE TYPE "public"."powerup_type" AS ENUM('SPIDER_SENSE', 'WEB_FLUID', 'SUIT_TECH');--> statement-breakpoint
ALTER TABLE "team_powerups" ALTER COLUMN "type" SET DATA TYPE "public"."powerup_type" USING "type"::"public"."powerup_type";--> statement-breakpoint
ALTER TABLE "contests" ALTER COLUMN "duration_ms" SET DEFAULT 7200000;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "passed_tests" integer;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "total_tests" integer;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "compile_log" text;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "judge_log" text;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "is_paused" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE VIEW "public"."leaderboard" AS (select "team_id", count(distinct case when "verdict" = 'AC' then "problem_id" end) as "solved", 
        coalesce(sum(
          case
            when "verdict" = 'AC' then
              extract(epoch from ("created_at" - (select started_at from contests limit 1))) / 60
              + 20 * (
                select count(*) from submissions s2
                where s2.team_id = "team_id"
                  and s2.problem_id = "problem_id"
                  and s2.verdict != 'AC'
                  and s2.created_at < "created_at"
              )
            else 0
          end
        ), 0)
       as "penalty", coalesce(sum(case when "verdict" = 'AC' then "runtime_ms" else 0 end), 0) as "best_runtime" from "submissions" group by "submissions"."team_id");