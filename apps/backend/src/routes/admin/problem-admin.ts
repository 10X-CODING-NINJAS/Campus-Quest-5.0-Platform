import { FastifyInstance } from 'fastify';
import { readFile, writeFile, readdir, mkdir, rm, cp, rename, stat } from 'fs/promises';
import path from 'path';
import { verifyAdminAuth } from '../../middleware/auth.js';
import {
  discoverProblems,
  loadProblemMeta,
  loadProblemStatement,
  loadSampleTestcases,
  loadHiddenTestcases,
} from '../../judge/problem-loader.js';

const PROBLEMS_ROOT = process.env.PROBLEMS_DIR
  ? path.resolve(process.env.PROBLEMS_DIR)
  : path.resolve(process.cwd(), 'problems');

// ── Helpers ─────────────────────────────────────────────────────────────────

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

async function dirExists(p: string): Promise<boolean> {
  try {
    const s = await stat(p);
    return s.isDirectory();
  } catch {
    return false;
  }
}

/** Write problem.json while preserving any extra fields */
async function writeProblemJson(dir: string, data: Record<string, unknown>): Promise<void> {
  await writeFile(path.join(dir, 'problem.json'), JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

/** Broadcast that problems have changed so Electron & admin auto-refresh */
function broadcastProblemsUpdated(fastify: FastifyInstance): void {
  const io = (fastify as any).io;
  if (io) {
    io.emit('problems:updated', { timestamp: new Date().toISOString() });
  }
}

/** Count testcases in a directory */
async function countTestcases(dir: string): Promise<number> {
  try {
    const entries = await readdir(dir);
    return entries.filter(f => f.endsWith('.in')).length;
  } catch {
    return 0;
  }
}

/** Re-number testcase files sequentially (1.in, 1.out, 2.in, ...) */
async function renumberTestcases(dir: string): Promise<void> {
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return;
  }

  const inFiles = entries
    .filter(f => f.endsWith('.in'))
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

  // Rename to temp names first to avoid collisions
  const tempPairs: Array<{ oldIn: string; oldOut: string; tempIn: string; tempOut: string }> = [];
  for (let i = 0; i < inFiles.length; i++) {
    const baseName = inFiles[i].slice(0, -3);
    const oldIn = path.join(dir, `${baseName}.in`);
    const oldOut = path.join(dir, `${baseName}.out`);
    const tempIn = path.join(dir, `__temp_${i + 1}.in`);
    const tempOut = path.join(dir, `__temp_${i + 1}.out`);
    tempPairs.push({ oldIn, oldOut, tempIn, tempOut });
  }

  // Pass 1: rename to temp
  for (const pair of tempPairs) {
    await rename(pair.oldIn, pair.tempIn).catch(() => {});
    await rename(pair.oldOut, pair.tempOut).catch(() => {});
  }

  // Pass 2: rename to final sequential numbers
  for (let i = 0; i < tempPairs.length; i++) {
    const pair = tempPairs[i];
    const finalIn = path.join(dir, `${i + 1}.in`);
    const finalOut = path.join(dir, `${i + 1}.out`);
    await rename(pair.tempIn, finalIn).catch(() => {});
    await rename(pair.tempOut, finalOut).catch(() => {});
  }
}

// ── Routes ──────────────────────────────────────────────────────────────────

export default async function problemAdminRoutes(fastify: FastifyInstance) {

  // ── LIST ALL PROBLEMS (admin view — includes enabled, testcase counts) ────
  fastify.get('/admin/problems', async (request, reply) => {
    if (!await verifyAdminAuth(request, reply)) return;

    const problems = await discoverProblems();

    const enriched = await Promise.all(
      problems.map(async (p) => {
        const sampleCount = await countTestcases(path.join(PROBLEMS_ROOT, p.id, 'samples'));
        const hiddenCount = await countTestcases(path.join(PROBLEMS_ROOT, p.id, 'hidden'));
        return {
          id: p.id,
          title: p.title,
          difficulty: p.difficulty,
          timeLimit: p.timeLimit,
          memoryLimit: p.memoryLimit,
          supportedLanguages: p.supportedLanguages,
          checkerType: p.checkerType,
          order: p.order ?? null,
          enabled: p.enabled !== false,
          sampleCount,
          hiddenCount,
          // Placeholders for future phases
          verificationStatus: 'not_verified' as const,
          publishedStatus: 'draft' as const,
        };
      }),
    );

    // Sort by order (nulls last), then by id
    enriched.sort((a, b) => {
      if (a.order !== null && b.order !== null) return a.order - b.order;
      if (a.order !== null) return -1;
      if (b.order !== null) return 1;
      return a.id.localeCompare(b.id);
    });

    return reply.send(enriched);
  });

  // ── GET SINGLE PROBLEM (full detail for editor) ──────────────────────────
  fastify.get<{ Params: { id: string } }>('/admin/problems/:id', async (request, reply) => {
    if (!await verifyAdminAuth(request, reply)) return;

    const { id } = request.params;
    try {
      const meta = await loadProblemMeta(id);
      const statement = await loadProblemStatement(id);
      const samples = await loadSampleTestcases(id);
      const hidden = await loadHiddenTestcases(id);

      return reply.send({
        ...meta,
        enabled: meta.enabled !== false,
        statement,
        samples: samples.map((tc, i) => ({
          num: i + 1,
          type: 'sample' as const,
          input: tc.input,
          output: tc.output,
        })),
        hidden: hidden.map((tc, i) => ({
          num: i + 1,
          type: 'hidden' as const,
          input: tc.input,
          output: tc.output,
        })),
      });
    } catch (err: any) {
      if (err?.code === 'ENOENT') {
        return reply.code(404).send({ error: `Problem "${id}" not found` });
      }
      fastify.log.error(err, 'Failed to load problem for admin');
      return reply.code(500).send({ error: 'Failed to load problem' });
    }
  });

  // ── CREATE PROBLEM ───────────────────────────────────────────────────────
  fastify.post<{
    Body: {
      title: string;
      difficulty?: string;
      timeLimit?: number;
      memoryLimit?: number;
      order?: number;
      statement?: string;
    };
  }>('/admin/problems', async (request, reply) => {
    if (!await verifyAdminAuth(request, reply)) return;

    const { title, difficulty, timeLimit, memoryLimit, order, statement } = request.body ?? {};

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return reply.code(400).send({ error: 'title is required' });
    }

    // Generate unique slug
    let slug = slugify(title);
    if (!slug) slug = 'problem';
    let finalSlug = slug;
    let counter = 1;
    while (await dirExists(path.join(PROBLEMS_ROOT, finalSlug))) {
      finalSlug = `${slug}-${counter++}`;
    }

    const problemDir = path.join(PROBLEMS_ROOT, finalSlug);

    // Create directory structure
    await mkdir(path.join(problemDir, 'samples'), { recursive: true });
    await mkdir(path.join(problemDir, 'hidden'), { recursive: true });
    await mkdir(path.join(problemDir, 'starter'), { recursive: true });

    // Write problem.json
    const problemData: Record<string, unknown> = {
      id: finalSlug,
      title: title.trim(),
      difficulty: difficulty ?? 'Easy',
      timeLimit: timeLimit ?? 2000,
      memoryLimit: memoryLimit ?? 256,
      supportedLanguages: ['c', 'cpp', 'java', 'python'],
      checkerType: 'default',
      order: order ?? null,
      enabled: true,
    };
    await writeProblemJson(problemDir, problemData);

    // Write statement.md
    const statementContent = statement ?? `# ${title.trim()}\n\nProblem statement goes here.\n\n## Input Format\n\n## Output Format\n\n## Constraints\n\n## Sample Input 1\n\n\`\`\`\n\n\`\`\`\n\n## Sample Output 1\n\n\`\`\`\n\n\`\`\`\n`;
    await writeFile(path.join(problemDir, 'statement.md'), statementContent, 'utf-8');

    // Write empty starter code files
    const starters: Record<string, string> = {
      'c.c': '// Write your C solution here\n#include <stdio.h>\n\nint main() {\n    // TODO\n    return 0;\n}\n',
      'cpp.cpp': '// Write your C++ solution here\n#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // TODO\n    return 0;\n}\n',
      'java.java': '// Write your Java solution here\nimport java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // TODO\n    }\n}\n',
      'python.py': '# Write your Python solution here\nimport sys\ninput = sys.stdin.readline\n\ndef solve():\n    # TODO\n    pass\n\nsolve()\n',
    };
    for (const [filename, content] of Object.entries(starters)) {
      await writeFile(path.join(problemDir, 'starter', filename), content, 'utf-8');
    }

    broadcastProblemsUpdated(fastify);

    return reply.code(201).send({
      success: true,
      id: finalSlug,
      message: `Problem "${title}" created`,
    });
  });

  // ── UPDATE PROBLEM ───────────────────────────────────────────────────────
  fastify.put<{
    Params: { id: string };
    Body: {
      title?: string;
      difficulty?: string;
      timeLimit?: number;
      memoryLimit?: number;
      order?: number;
      enabled?: boolean;
      checkerType?: string;
      supportedLanguages?: string[];
      statement?: string;
      starterCode?: Record<string, string>;
    };
  }>('/admin/problems/:id', async (request, reply) => {
    if (!await verifyAdminAuth(request, reply)) return;

    const { id } = request.params;
    const problemDir = path.join(PROBLEMS_ROOT, id);

    if (!await dirExists(problemDir)) {
      return reply.code(404).send({ error: `Problem "${id}" not found` });
    }

    const body = request.body ?? {};

    // Read existing problem.json
    const raw = await readFile(path.join(problemDir, 'problem.json'), 'utf-8');
    const existing = JSON.parse(raw);

    // Merge updates
    if (body.title !== undefined) existing.title = body.title.trim();
    if (body.difficulty !== undefined) existing.difficulty = body.difficulty;
    if (body.timeLimit !== undefined) existing.timeLimit = body.timeLimit;
    if (body.memoryLimit !== undefined) existing.memoryLimit = body.memoryLimit;
    if (body.order !== undefined) existing.order = body.order;
    if (body.enabled !== undefined) existing.enabled = body.enabled;
    if (body.checkerType !== undefined) existing.checkerType = body.checkerType;
    if (body.supportedLanguages !== undefined) existing.supportedLanguages = body.supportedLanguages;

    await writeProblemJson(problemDir, existing);

    // Update statement if provided
    if (body.statement !== undefined) {
      await writeFile(path.join(problemDir, 'statement.md'), body.statement, 'utf-8');
    }

    // Update starter code if provided
    if (body.starterCode) {
      const extMap: Record<string, string> = {
        c: 'c.c',
        cpp: 'cpp.cpp',
        java: 'java.java',
        python: 'python.py',
      };
      const starterDir = path.join(problemDir, 'starter');
      await mkdir(starterDir, { recursive: true });
      for (const [lang, code] of Object.entries(body.starterCode)) {
        const filename = extMap[lang];
        if (filename) {
          await writeFile(path.join(starterDir, filename), code, 'utf-8');
        }
      }
    }

    broadcastProblemsUpdated(fastify);

    return reply.send({ success: true, message: `Problem "${id}" updated` });
  });

  // ── DELETE PROBLEM ───────────────────────────────────────────────────────
  fastify.delete<{ Params: { id: string } }>('/admin/problems/:id', async (request, reply) => {
    if (!await verifyAdminAuth(request, reply)) return;

    const { id } = request.params;
    const problemDir = path.join(PROBLEMS_ROOT, id);

    if (!await dirExists(problemDir)) {
      return reply.code(404).send({ error: `Problem "${id}" not found` });
    }

    await rm(problemDir, { recursive: true, force: true });
    broadcastProblemsUpdated(fastify);

    return reply.send({ success: true, message: `Problem "${id}" deleted` });
  });

  // ── DUPLICATE PROBLEM ────────────────────────────────────────────────────
  fastify.post<{ Params: { id: string } }>('/admin/problems/:id/duplicate', async (request, reply) => {
    if (!await verifyAdminAuth(request, reply)) return;

    const { id } = request.params;
    const sourceDir = path.join(PROBLEMS_ROOT, id);

    if (!await dirExists(sourceDir)) {
      return reply.code(404).send({ error: `Problem "${id}" not found` });
    }

    // Find unique slug
    let newSlug = `${id}-copy`;
    let counter = 1;
    while (await dirExists(path.join(PROBLEMS_ROOT, newSlug))) {
      newSlug = `${id}-copy-${counter++}`;
    }

    const destDir = path.join(PROBLEMS_ROOT, newSlug);
    await cp(sourceDir, destDir, { recursive: true });

    // Update the duplicated problem.json with new id and title
    const raw = await readFile(path.join(destDir, 'problem.json'), 'utf-8');
    const data = JSON.parse(raw);
    data.id = newSlug;
    data.title = `${data.title} (Copy)`;
    data.order = null; // Remove ordering — admin can reassign
    await writeProblemJson(destDir, data);

    broadcastProblemsUpdated(fastify);

    return reply.code(201).send({
      success: true,
      id: newSlug,
      message: `Problem "${id}" duplicated as "${newSlug}"`,
    });
  });

  // ── TOGGLE ENABLED ───────────────────────────────────────────────────────
  fastify.put<{
    Params: { id: string };
    Body: { enabled: boolean };
  }>('/admin/problems/:id/enabled', async (request, reply) => {
    if (!await verifyAdminAuth(request, reply)) return;

    const { id } = request.params;
    const { enabled } = request.body ?? {};
    const problemDir = path.join(PROBLEMS_ROOT, id);

    if (!await dirExists(problemDir)) {
      return reply.code(404).send({ error: `Problem "${id}" not found` });
    }
    if (typeof enabled !== 'boolean') {
      return reply.code(400).send({ error: 'enabled must be a boolean' });
    }

    const raw = await readFile(path.join(problemDir, 'problem.json'), 'utf-8');
    const data = JSON.parse(raw);
    data.enabled = enabled;
    await writeProblemJson(problemDir, data);

    broadcastProblemsUpdated(fastify);

    return reply.send({ success: true, enabled, message: `Problem "${id}" ${enabled ? 'enabled' : 'disabled'}` });
  });

  // ── REORDER PROBLEMS ─────────────────────────────────────────────────────
  fastify.put<{
    Body: { order: Array<{ id: string; order: number }> };
  }>('/admin/problems/reorder', async (request, reply) => {
    if (!await verifyAdminAuth(request, reply)) return;

    const { order } = request.body ?? {};
    if (!Array.isArray(order)) {
      return reply.code(400).send({ error: 'order must be an array of { id, order }' });
    }

    const errors: string[] = [];
    for (const item of order) {
      const problemDir = path.join(PROBLEMS_ROOT, item.id);
      try {
        const raw = await readFile(path.join(problemDir, 'problem.json'), 'utf-8');
        const data = JSON.parse(raw);
        data.order = item.order;
        await writeProblemJson(problemDir, data);
      } catch (err: any) {
        errors.push(`Failed to update order for "${item.id}": ${err.message}`);
      }
    }

    broadcastProblemsUpdated(fastify);

    if (errors.length > 0) {
      return reply.code(207).send({ success: false, errors, message: 'Some updates failed' });
    }
    return reply.send({ success: true, message: 'Problem order updated' });
  });

  // ── LIST TESTCASES ───────────────────────────────────────────────────────
  fastify.get<{ Params: { id: string } }>('/admin/problems/:id/testcases', async (request, reply) => {
    if (!await verifyAdminAuth(request, reply)) return;

    const { id } = request.params;
    const problemDir = path.join(PROBLEMS_ROOT, id);

    if (!await dirExists(problemDir)) {
      return reply.code(404).send({ error: `Problem "${id}" not found` });
    }

    const samples = await loadSampleTestcases(id);
    const hidden = await loadHiddenTestcases(id);

    const testcases = [
      ...samples.map((tc, i) => ({
        num: i + 1,
        type: 'sample' as const,
        input: tc.input,
        output: tc.output,
      })),
      ...hidden.map((tc, i) => ({
        num: i + 1,
        type: 'hidden' as const,
        input: tc.input,
        output: tc.output,
      })),
    ];

    return reply.send(testcases);
  });

  // ── ADD TESTCASE ─────────────────────────────────────────────────────────
  fastify.post<{
    Params: { id: string };
    Body: { type: 'sample' | 'hidden'; input: string; output: string };
  }>('/admin/problems/:id/testcases', async (request, reply) => {
    if (!await verifyAdminAuth(request, reply)) return;

    const { id } = request.params;
    const { type, input, output } = request.body ?? {};
    const problemDir = path.join(PROBLEMS_ROOT, id);

    if (!await dirExists(problemDir)) {
      return reply.code(404).send({ error: `Problem "${id}" not found` });
    }
    if (!type || !['sample', 'hidden'].includes(type)) {
      return reply.code(400).send({ error: 'type must be "sample" or "hidden"' });
    }

    const dir = path.join(problemDir, type === 'sample' ? 'samples' : 'hidden');
    await mkdir(dir, { recursive: true });

    // Find next number
    let entries: string[];
    try {
      entries = await readdir(dir);
    } catch {
      entries = [];
    }
    const existingNums = entries
      .filter(f => f.endsWith('.in'))
      .map(f => parseInt(f, 10))
      .filter(n => !isNaN(n));
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;

    await writeFile(path.join(dir, `${nextNum}.in`), input ?? '', 'utf-8');
    await writeFile(path.join(dir, `${nextNum}.out`), output ?? '', 'utf-8');

    broadcastProblemsUpdated(fastify);

    return reply.code(201).send({
      success: true,
      num: nextNum,
      type,
      message: `Testcase ${nextNum} added to ${type}`,
    });
  });

  // ── UPDATE TESTCASE ──────────────────────────────────────────────────────
  fastify.put<{
    Params: { id: string; num: string };
    Body: { type: 'sample' | 'hidden'; input?: string; output?: string };
  }>('/admin/problems/:id/testcases/:num', async (request, reply) => {
    if (!await verifyAdminAuth(request, reply)) return;

    const { id, num } = request.params;
    const { type, input, output } = request.body ?? {};

    if (!type || !['sample', 'hidden'].includes(type)) {
      return reply.code(400).send({ error: 'type must be "sample" or "hidden"' });
    }

    const dir = path.join(PROBLEMS_ROOT, id, type === 'sample' ? 'samples' : 'hidden');
    const inPath = path.join(dir, `${num}.in`);
    const outPath = path.join(dir, `${num}.out`);

    try {
      await stat(inPath);
    } catch {
      return reply.code(404).send({ error: `Testcase ${num} not found in ${type}` });
    }

    if (input !== undefined) {
      await writeFile(inPath, input, 'utf-8');
    }
    if (output !== undefined) {
      await writeFile(outPath, output, 'utf-8');
    }

    broadcastProblemsUpdated(fastify);

    return reply.send({ success: true, message: `Testcase ${num} updated` });
  });

  // ── DELETE TESTCASE ──────────────────────────────────────────────────────
  fastify.delete<{
    Params: { id: string; num: string };
    Body: { type: 'sample' | 'hidden' };
  }>('/admin/problems/:id/testcases/:num', async (request, reply) => {
    if (!await verifyAdminAuth(request, reply)) return;

    const { id, num } = request.params;
    const { type } = request.body ?? {};

    if (!type || !['sample', 'hidden'].includes(type)) {
      return reply.code(400).send({ error: 'type must be "sample" or "hidden"' });
    }

    const dir = path.join(PROBLEMS_ROOT, id, type === 'sample' ? 'samples' : 'hidden');
    const inPath = path.join(dir, `${num}.in`);
    const outPath = path.join(dir, `${num}.out`);

    await rm(inPath, { force: true });
    await rm(outPath, { force: true });

    // Re-number remaining testcases
    await renumberTestcases(dir);

    broadcastProblemsUpdated(fastify);

    return reply.send({ success: true, message: `Testcase ${num} deleted and remaining re-numbered` });
  });

  // ── CHANGE TESTCASE TYPE (sample ↔ hidden) ──────────────────────────────
  fastify.put<{
    Params: { id: string; num: string };
    Body: { from: 'sample' | 'hidden'; to: 'sample' | 'hidden' };
  }>('/admin/problems/:id/testcases/:num/type', async (request, reply) => {
    if (!await verifyAdminAuth(request, reply)) return;

    const { id, num } = request.params;
    const { from, to } = request.body ?? {};

    if (!from || !to || from === to) {
      return reply.code(400).send({ error: 'from and to must be different ("sample" or "hidden")' });
    }

    const fromDir = path.join(PROBLEMS_ROOT, id, from === 'sample' ? 'samples' : 'hidden');
    const toDir = path.join(PROBLEMS_ROOT, id, to === 'sample' ? 'samples' : 'hidden');

    const srcIn = path.join(fromDir, `${num}.in`);
    const srcOut = path.join(fromDir, `${num}.out`);

    try {
      await stat(srcIn);
    } catch {
      return reply.code(404).send({ error: `Testcase ${num} not found in ${from}` });
    }

    await mkdir(toDir, { recursive: true });

    // Find next number in target dir
    let entries: string[];
    try {
      entries = await readdir(toDir);
    } catch {
      entries = [];
    }
    const existingNums = entries
      .filter(f => f.endsWith('.in'))
      .map(f => parseInt(f, 10))
      .filter(n => !isNaN(n));
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;

    // Move files
    await rename(srcIn, path.join(toDir, `${nextNum}.in`)).catch(() => {});
    await rename(srcOut, path.join(toDir, `${nextNum}.out`)).catch(() => {});

    // Re-number source directory
    await renumberTestcases(fromDir);

    broadcastProblemsUpdated(fastify);

    return reply.send({
      success: true,
      message: `Testcase moved from ${from} to ${to}`,
      newNum: nextNum,
    });
  });
}
