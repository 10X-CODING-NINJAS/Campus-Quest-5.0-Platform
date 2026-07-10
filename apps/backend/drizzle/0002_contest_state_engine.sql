ALTER TYPE "public"."contest_status" ADD VALUE IF NOT EXISTS 'WAITING';
ALTER TYPE "public"."contest_status" ADD VALUE IF NOT EXISTS 'DIAGNOSTICS';
ALTER TYPE "public"."contest_status" ADD VALUE IF NOT EXISTS 'LOBBY';
ALTER TYPE "public"."contest_status" ADD VALUE IF NOT EXISTS 'LIVE';
ALTER TYPE "public"."contest_status" ADD VALUE IF NOT EXISTS 'MISSION_MODE';
--> statement-breakpoint
ALTER TABLE "contests" ADD COLUMN IF NOT EXISTS "previous_status" "public"."contest_status";
ALTER TABLE "contests" ADD COLUMN IF NOT EXISTS "state_updated_at" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint
UPDATE "contests"
SET "status" = CASE "status"
  WHEN 'NOT_STARTED' THEN 'WAITING'::"public"."contest_status"
  WHEN 'RUNNING' THEN 'LIVE'::"public"."contest_status"
  ELSE "status"
END;
