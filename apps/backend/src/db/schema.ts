import {
  pgTable, pgEnum, text, integer, boolean, timestamp, json,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// ---------- Enums ----------
export const languageEnum = pgEnum('language', ['C', 'CPP', 'PYTHON', 'JAVA']);
export const submissionStatusEnum = pgEnum('submission_status', ['PENDING', 'JUDGING', 'DONE']);
export const verdictEnum = pgEnum('verdict', ['AC', 'WA', 'TLE', 'MLE', 'RE', 'CE']);
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
  hintStage: integer('hint_stage').notNull().default(0),

  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ---------- Contest (singleton-ish, but keep as table for history) ----------
export const contests = pgTable('contests', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  status: contestStatusEnum('status').notNull().default('NOT_STARTED'),
  startedAt: timestamp('started_at'),
  pausedAt: timestamp('paused_at'),
  totalPausedMs: integer('total_paused_ms').notNull().default(0),
  durationMs: integer('duration_ms').notNull(),
  endsAt: timestamp('ends_at'),
});

// ---------- Problem ----------
export const problems = pgTable('problems', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  title: text('title').notNull(),
  statement: text('statement').notNull(),
  order: integer('order').notNull(), // sequential unlock order
  timeLimitMs: integer('time_limit_ms').notNull().default(2000),
  memoryLimitMb: integer('memory_limit_mb').notNull().default(256),
  testCases: json('test_cases').$type<{ input: string; output: string; hidden: boolean }[]>().notNull(),
});

// ---------- Submission ----------
export const submissions = pgTable('submissions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  teamId: text('team_id').notNull().references(() => teams.id),
  problemId: text('problem_id').notNull().references(() => problems.id),
  language: languageEnum('language').notNull(),
  sourceCode: text('source_code').notNull(),
  status: submissionStatusEnum('status').notNull().default('PENDING'),
  verdict: verdictEnum('verdict'),
  runtimeMs: integer('runtime_ms'),
  memoryKb: integer('memory_kb'),
  testCaseResults: json('test_case_results').$type<{
    index: number; verdict: string; runtimeMs: number; memoryKb: number;
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

// ---------- Team Workspace (Autosave Persistence) ----------
export const teamWorkspaces = pgTable('team_workspaces', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  teamId: text('team_id').notNull().references(() => teams.id),
  problemId: text('problem_id').notNull().references(() => problems.id),
  language: languageEnum('language').notNull(),
  sourceCode: text('source_code').notNull(),
  cursorLine: integer('cursor_line').notNull().default(1),
  cursorColumn: integer('cursor_column').notNull().default(1),
  scrollPosition: integer('scroll_position').notNull().default(0),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ---------- Relations ----------
export const teamsRelations = relations(teams, ({ many }) => ({
  submissions: many(submissions),
  violations: many(violations),
  powerups: many(teamPowerups),
  workspaces: many(teamWorkspaces),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  team: one(teams, { fields: [submissions.teamId], references: [teams.id] }),
  problem: one(problems, { fields: [submissions.problemId], references: [problems.id] }),
}));

export const violationsRelations = relations(violations, ({ one }) => ({
  team: one(teams, { fields: [violations.teamId], references: [teams.id] }),
}));

export const teamPowerupsRelations = relations(teamPowerups, ({ one }) => ({
  team: one(teams, { fields: [teamPowerups.teamId], references: [teams.id] }),
}));

export const teamWorkspacesRelations = relations(teamWorkspaces, ({ one }) => ({
  team: one(teams, { fields: [teamWorkspaces.teamId], references: [teams.id] }),
  problem: one(problems, { fields: [teamWorkspaces.problemId], references: [problems.id] }),
}));
