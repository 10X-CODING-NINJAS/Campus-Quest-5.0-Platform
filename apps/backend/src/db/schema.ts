import {
  pgTable, pgEnum, text, integer, boolean, timestamp, json, pgView,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// ---------- Enums ----------
export const languageEnum = pgEnum('language', ['c', 'cpp', 'python', 'java']);
export const submissionStatusEnum = pgEnum('submission_status', ['PENDING', 'JUDGING', 'DONE']);
export const verdictEnum = pgEnum('verdict', [
  'AC',   // Accepted
  'WA',   // Wrong Answer
  'TLE',  // Time Limit Exceeded
  'MLE',  // Memory Limit Exceeded
  'RE',   // Runtime Error
  'CE',   // Compile Error
  'OLE',  // Output Limit Exceeded
  'PE',   // Presentation Error
  'IJE',  // Internal Judge Error
]);
export const contestStatusEnum = pgEnum('contest_status', ['NOT_STARTED', 'RUNNING', 'PAUSED', 'ENDED']);
export const violationTypeEnum = pgEnum('violation_type', [
  'TAB_SWITCH', 'BLUR', 'FULLSCREEN_EXIT', 'DEVTOOLS_ATTEMPT', 'COPY_PASTE',
]);
export const powerupTypeEnum = pgEnum('powerup_type', [
  'SPIDER_SENSE', 'WEB_FLUID', 'SUIT_TECH',
]);

// ---------- Team ----------
export const teams = pgTable('teams', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),

  violationCount: integer('violation_count').notNull().default(0),
  isDisqualified: boolean('is_disqualified').notNull().default(false),
  isPaused: boolean('is_paused').notNull().default(false),
  spiderSenseCharges: integer('spider_sense_charges').notNull().default(3),

  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ---------- Contest (singleton row for active competition) ----------
export const contests = pgTable('contests', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  status: contestStatusEnum('status').notNull().default('NOT_STARTED'),
  startedAt: timestamp('started_at'),
  pausedAt: timestamp('paused_at'),
  totalPausedMs: integer('total_paused_ms').notNull().default(0),
  durationMs: integer('duration_ms').notNull().default(2 * 60 * 60 * 1000), // 2 hours default
  endsAt: timestamp('ends_at'),
});

// ---------- Submission ----------
// NOTE: Test cases are NO LONGER stored in the DB for security.
// They live on the filesystem under problems/<id>/hidden/ and are never exposed via any API.
export const submissions = pgTable('submissions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  teamId: text('team_id').notNull().references(() => teams.id),
  problemId: text('problem_id').notNull(), // filesystem problem ID, no FK needed
  language: languageEnum('language').notNull(),
  sourceCode: text('source_code').notNull(),
  status: submissionStatusEnum('status').notNull().default('PENDING'),
  verdict: verdictEnum('verdict'),
  runtimeMs: integer('runtime_ms'),
  memoryKb: integer('memory_kb'),
  passedTests: integer('passed_tests'),
  totalTests: integer('total_tests'),
  compileLog: text('compile_log'),
  judgeLog: text('judge_log'),
  testCaseResults: json('test_case_results').$type<{
    index: number;
    verdict: string;
    runtimeMs: number;
    memoryKb: number;
  }[]>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  judgedAt: timestamp('judged_at'),
});

// ---------- Violation ----------
export const violations = pgTable('violations', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  teamId: text('team_id').notNull().references(() => teams.id),
  type: violationTypeEnum('type').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ---------- Powerup ----------
export const teamPowerups = pgTable('team_powerups', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  teamId: text('team_id').notNull().references(() => teams.id),
  type: powerupTypeEnum('type').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ---------- Relations ----------
export const teamsRelations = relations(teams, ({ many }) => ({
  submissions: many(submissions),
  violations: many(violations),
  powerups: many(teamPowerups),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  team: one(teams, { fields: [submissions.teamId], references: [teams.id] }),
}));

export const violationsRelations = relations(violations, ({ one }) => ({
  team: one(teams, { fields: [violations.teamId], references: [teams.id] }),
}));

export const teamPowerupsRelations = relations(teamPowerups, ({ one }) => ({
  team: one(teams, { fields: [teamPowerups.teamId], references: [teams.id] }),
}));

// ---------- Leaderboard View ----------
// Computed columns:
//   solved         = count of distinct problem IDs with an AC verdict
//   penalty        = sum of (wrong_attempts * 20min) for each solved problem, plus elapsed_time for each AC
//   best_runtime   = sum of fastest AC runtime per solved problem (tiebreak)
export const leaderboard = pgView('leaderboard').as((qb) =>
  qb
    .select({
      teamId: submissions.teamId,
      solved: sql<number>`count(distinct case when ${submissions.verdict} = 'AC' then ${submissions.problemId} end)`.as('solved'),
      penalty: sql<number>`
        coalesce(sum(
          case
            when ${submissions.verdict} = 'AC' then
              extract(epoch from (${submissions.createdAt} - (select started_at from contests limit 1))) / 60
              + 20 * (
                select count(*) from submissions s2
                where s2.team_id = ${submissions.teamId}
                  and s2.problem_id = ${submissions.problemId}
                  and s2.verdict != 'AC'
                  and s2.created_at < ${submissions.createdAt}
              )
            else 0
          end
        ), 0)
      `.as('penalty'),
      bestRuntime: sql<number>`coalesce(sum(case when ${submissions.verdict} = 'AC' then ${submissions.runtimeMs} else 0 end), 0)`.as('best_runtime'),
    })
    .from(submissions)
    .groupBy(submissions.teamId),
);
