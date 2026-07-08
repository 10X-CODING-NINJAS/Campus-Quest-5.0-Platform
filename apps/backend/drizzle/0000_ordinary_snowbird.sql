CREATE TYPE "public"."contest_status" AS ENUM('NOT_STARTED', 'RUNNING', 'PAUSED', 'ENDED');--> statement-breakpoint
CREATE TYPE "public"."language" AS ENUM('C', 'CPP', 'PYTHON', 'JAVA');--> statement-breakpoint
CREATE TYPE "public"."powerup_type" AS ENUM('EXTRA_TIME', 'HINT_REVEAL', 'SKIP_QUESTION');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('PENDING', 'JUDGING', 'DONE');--> statement-breakpoint
CREATE TYPE "public"."verdict" AS ENUM('AC', 'WA', 'TLE', 'MLE', 'RE', 'CE');--> statement-breakpoint
CREATE TYPE "public"."violation_type" AS ENUM('TAB_SWITCH', 'BLUR', 'FULLSCREEN_EXIT', 'DEVTOOLS_ATTEMPT', 'COPY_PASTE');--> statement-breakpoint
CREATE TABLE "contests" (
	"id" text PRIMARY KEY NOT NULL,
	"status" "contest_status" DEFAULT 'NOT_STARTED' NOT NULL,
	"started_at" timestamp,
	"paused_at" timestamp,
	"total_paused_ms" integer DEFAULT 0 NOT NULL,
	"duration_ms" integer NOT NULL,
	"ends_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "problems" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"statement" text NOT NULL,
	"order" integer NOT NULL,
	"time_limit_ms" integer DEFAULT 2000 NOT NULL,
	"memory_limit_mb" integer DEFAULT 256 NOT NULL,
	"test_cases" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"problem_id" text NOT NULL,
	"language" "language" NOT NULL,
	"source_code" text NOT NULL,
	"status" "submission_status" DEFAULT 'PENDING' NOT NULL,
	"verdict" "verdict",
	"runtime_ms" integer,
	"memory_kb" integer,
	"test_case_results" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"judged_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "team_powerups" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"type" "powerup_type" NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"violation_count" integer DEFAULT 0 NOT NULL,
	"is_disqualified" boolean DEFAULT false NOT NULL,
	"spider_sense_charges" integer DEFAULT 3 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "teams_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "violations" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"type" "violation_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_powerups" ADD CONSTRAINT "team_powerups_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "violations" ADD CONSTRAINT "violations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;