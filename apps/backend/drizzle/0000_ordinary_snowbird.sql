CREATE TYPE "public"."contest_status" AS ENUM('NOT_STARTED', 'LOBBY', 'RUNNING', 'PAUSED', 'ENDED');--> statement-breakpoint
CREATE TYPE "public"."language" AS ENUM('C', 'CPP', 'PYTHON', 'JAVA');--> statement-breakpoint
CREATE TYPE "public"."powerup_type" AS ENUM('SPIDER_SENSE', 'WEB_FLUID', 'SUIT_TECH');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('PENDING', 'JUDGING', 'DONE');--> statement-breakpoint
CREATE TYPE "public"."verdict" AS ENUM('AC', 'WA', 'TLE', 'MLE', 'RE', 'CE', 'BYPASSED');--> statement-breakpoint
CREATE TYPE "public"."violation_type" AS ENUM('TAB_SWITCH', 'BLUR', 'FULLSCREEN_EXIT', 'DEVTOOLS_ATTEMPT', 'COPY_PASTE');--> statement-breakpoint
CREATE TABLE "contests" (
	"id" text PRIMARY KEY NOT NULL,
	"status" "contest_status" DEFAULT 'NOT_STARTED' NOT NULL,
	"started_at" timestamp,
	"paused_at" timestamp,
	"total_paused_ms" integer DEFAULT 0 NOT NULL,
	"duration_ms" integer NOT NULL,
	"ends_at" timestamp,
	"lobby_started_at" timestamp,
	"lobby_duration_ms" integer DEFAULT 900000
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
	"is_paused" boolean DEFAULT false NOT NULL,
	"spider_sense_charges" integer DEFAULT 1 NOT NULL,
	"hint_stage" integer DEFAULT 0 NOT NULL,
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
CREATE TABLE "team_workspaces" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"problem_id" text NOT NULL,
	"language" "language" NOT NULL,
	"source_code" text NOT NULL,
	"cursor_line" integer DEFAULT 1 NOT NULL,
	"cursor_column" integer DEFAULT 1 NOT NULL,
	"scroll_position" integer DEFAULT 0 NOT NULL,
	"last_client_update" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_powerups" ADD CONSTRAINT "team_powerups_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "violations" ADD CONSTRAINT "violations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_workspaces" ADD CONSTRAINT "team_workspaces_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_workspaces" ADD CONSTRAINT "team_workspaces_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "problems_order_idx" ON "problems" ("order");--> statement-breakpoint
CREATE INDEX "submissions_team_id_idx" ON "submissions" ("team_id");--> statement-breakpoint
CREATE INDEX "submissions_problem_id_idx" ON "submissions" ("problem_id");--> statement-breakpoint
CREATE INDEX "submissions_verdict_idx" ON "submissions" ("verdict");--> statement-breakpoint
CREATE INDEX "submissions_created_at_idx" ON "submissions" ("created_at");--> statement-breakpoint
CREATE INDEX "violations_team_id_idx" ON "violations" ("team_id");--> statement-breakpoint
CREATE INDEX "team_powerups_team_id_idx" ON "team_powerups" ("team_id");--> statement-breakpoint
CREATE INDEX "team_workspaces_team_id_problem_id_idx" ON "team_workspaces" ("team_id", "problem_id");