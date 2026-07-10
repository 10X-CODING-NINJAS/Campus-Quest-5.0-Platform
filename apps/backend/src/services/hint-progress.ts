import { and, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { submissions, teams } from '../db/schema.js';

export interface HintProgressSnapshot {
  teamId: string;
  questionsSolved: number;
  hintProgress: 0 | 1 | 2 | 3;
  missionCompleted: boolean;
}

function deriveHintProgress(questionsSolved: number): 0 | 1 | 2 | 3 {
  if (questionsSolved >= 10) return 3;
  if (questionsSolved >= 6) return 2;
  if (questionsSolved >= 3) return 1;
  return 0;
}

async function countUniqueAcceptedQuestions(teamId: string): Promise<number> {
  const rows = await db.select({
    problemId: submissions.problemId,
  })
    .from(submissions)
    .where(and(eq(submissions.teamId, teamId), eq(submissions.verdict, 'AC')))
    .groupBy(submissions.problemId);

  return rows.length;
}

export async function syncHintProgressForTeam(teamId: string): Promise<HintProgressSnapshot> {
  const questionsSolved = await countUniqueAcceptedQuestions(teamId);
  const hintProgress = deriveHintProgress(questionsSolved);
  const missionCompleted = questionsSolved >= 10;

  await db.update(teams)
    .set({
      questionsSolved,
      hintProgress,
      missionCompleted,
    })
    .where(eq(teams.id, teamId));

  return {
    teamId,
    questionsSolved,
    hintProgress,
    missionCompleted,
  };
}

export async function getHintProgressSnapshot(teamId: string): Promise<HintProgressSnapshot> {
  const [team] = await db.select({
    id: teams.id,
    questionsSolved: teams.questionsSolved,
    hintProgress: teams.hintProgress,
    missionCompleted: teams.missionCompleted,
  })
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  if (!team) {
    return { teamId, questionsSolved: 0, hintProgress: 0, missionCompleted: false };
  }

  return {
    teamId,
    questionsSolved: team.questionsSolved,
    hintProgress: team.hintProgress as 0 | 1 | 2 | 3,
    missionCompleted: team.missionCompleted,
  };
}

type HintEmitter = {
  to: (room: string) => { emit: (ev: string, data: unknown) => void };
  emit: (ev: string, data: unknown) => void;
} | undefined;

export function emitHintProgress(io: HintEmitter, snapshot: HintProgressSnapshot) {
  io?.to(snapshot.teamId).emit('hint:update', snapshot);
}

export function getHintUnlockMessage(hintProgress: number): string | null {
  if (hintProgress === 1) return 'MISSION UPDATE: Hint Section 1 Unlocked';
  if (hintProgress === 2) return 'MISSION UPDATE: Hint Section 2 Unlocked';
  if (hintProgress === 3) return 'MISSION UPDATE: All Hint Sections Unlocked';
  return null;
}

export function computeHintProgress(questionsSolved: number): 0 | 1 | 2 | 3 {
  return deriveHintProgress(questionsSolved);
}
