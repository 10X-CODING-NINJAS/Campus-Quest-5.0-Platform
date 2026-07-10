CREATE TABLE IF NOT EXISTS "team_workspaces" (
  "id" text PRIMARY KEY NOT NULL,
  "team_id" text NOT NULL,
  "problem_id" text NOT NULL,
  "source_code" text DEFAULT '' NOT NULL,
  "selected_language" "public"."language" DEFAULT 'cpp' NOT NULL,
  "cursor_line" integer DEFAULT 1 NOT NULL,
  "cursor_column" integer DEFAULT 1 NOT NULL,
  "scroll_top" integer DEFAULT 0 NOT NULL,
  "latest_verdict" "public"."verdict",
  "latest_runtime_ms" integer,
  "latest_memory_kb" integer,
  "last_saved_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "team_workspaces_team_problem_idx" ON "team_workspaces" ("team_id", "problem_id");
--> statement-breakpoint
ALTER TABLE "team_workspaces" ADD CONSTRAINT "team_workspaces_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
