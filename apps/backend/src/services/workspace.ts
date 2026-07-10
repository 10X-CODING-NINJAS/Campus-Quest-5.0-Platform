import { and, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { teamWorkspaces } from '../db/schema.js';

export type WorkspaceLanguage = 'c' | 'cpp' | 'python' | 'java';

export interface WorkspaceSnapshot {
  problemId: string;
  sourceCode: string;
  selectedLanguage: WorkspaceLanguage;
  cursorLine: number;
  cursorColumn: number;
  scrollTop: number;
  latestVerdict: string | null;
  latestRuntimeMs: number | null;
  latestMemoryKb: number | null;
  lastSavedAt: string;
}

export async function listWorkspaces(teamId: string): Promise<WorkspaceSnapshot[]> {
  const rows = await db.select().from(teamWorkspaces).where(eq(teamWorkspaces.teamId, teamId));
  return rows.map(row => ({
    problemId: row.problemId,
    sourceCode: row.sourceCode,
    selectedLanguage: row.selectedLanguage as WorkspaceLanguage,
    cursorLine: row.cursorLine,
    cursorColumn: row.cursorColumn,
    scrollTop: row.scrollTop,
    latestVerdict: row.latestVerdict ?? null,
    latestRuntimeMs: row.latestRuntimeMs ?? null,
    latestMemoryKb: row.latestMemoryKb ?? null,
    lastSavedAt: row.lastSavedAt.toISOString(),
  }));
}

export async function upsertWorkspace(teamId: string, workspace: WorkspaceSnapshot): Promise<WorkspaceSnapshot> {
  const now = new Date();
  const [saved] = await db.insert(teamWorkspaces).values({
    teamId,
    problemId: workspace.problemId,
    sourceCode: workspace.sourceCode,
    selectedLanguage: workspace.selectedLanguage,
    cursorLine: workspace.cursorLine,
    cursorColumn: workspace.cursorColumn,
    scrollTop: workspace.scrollTop,
    latestVerdict: workspace.latestVerdict as any,
    latestRuntimeMs: workspace.latestRuntimeMs,
    latestMemoryKb: workspace.latestMemoryKb,
    lastSavedAt: now,
    updatedAt: now,
  })
    .onConflictDoUpdate({
      target: [teamWorkspaces.teamId, teamWorkspaces.problemId],
      set: {
        sourceCode: workspace.sourceCode,
        selectedLanguage: workspace.selectedLanguage,
        cursorLine: workspace.cursorLine,
        cursorColumn: workspace.cursorColumn,
        scrollTop: workspace.scrollTop,
        latestVerdict: workspace.latestVerdict as any,
        latestRuntimeMs: workspace.latestRuntimeMs,
        latestMemoryKb: workspace.latestMemoryKb,
        lastSavedAt: now,
        updatedAt: now,
      },
    })
    .returning();

  return {
    problemId: saved.problemId,
    sourceCode: saved.sourceCode,
    selectedLanguage: saved.selectedLanguage as WorkspaceLanguage,
    cursorLine: saved.cursorLine,
    cursorColumn: saved.cursorColumn,
    scrollTop: saved.scrollTop,
    latestVerdict: saved.latestVerdict ?? null,
    latestRuntimeMs: saved.latestRuntimeMs ?? null,
    latestMemoryKb: saved.latestMemoryKb ?? null,
    lastSavedAt: saved.lastSavedAt.toISOString(),
  };
}

export async function updateWorkspaceResult(teamId: string, problemId: string, result: { latestVerdict: string; latestRuntimeMs: number; latestMemoryKb: number }) {
  await db.update(teamWorkspaces)
    .set({
      latestVerdict: result.latestVerdict as any,
      latestRuntimeMs: result.latestRuntimeMs,
      latestMemoryKb: result.latestMemoryKb,
      lastSavedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(teamWorkspaces.teamId, teamId), eq(teamWorkspaces.problemId, problemId)));
}
