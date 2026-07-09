import { FastifyInstance } from 'fastify';
import {
  discoverProblems,
  loadProblemMeta,
  loadProblemStatement,
  loadSampleTestcases,
} from '../judge/problem-loader.js';

export default async function problemRoutes(fastify: FastifyInstance) {
  // GET /api/problems — list all problems (no testcases, no statement)
  fastify.get('/api/problems', async (_request, reply) => {
    try {
      const problems = await discoverProblems();

      // Filter to only include active themed problems with an 'order' field, sorted
      const filteredSorted = problems
        .filter(p => typeof p.order === 'number')
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      const safeProblems = filteredSorted.map(p => ({
        id: p.id,
        title: p.title,
        difficulty: p.difficulty,
        timeLimit: p.timeLimit,
        memoryLimit: p.memoryLimit,
        supportedLanguages: p.supportedLanguages,
        order: p.order,
      }));

      return reply.send(safeProblems);
    } catch (err) {
      fastify.log.error(err, 'Failed to discover problems');
      return reply.code(500).send({ error: 'Failed to load problems' });
    }
  });

  // GET /api/problems/:id — single problem with statement + sample inputs (NOT expected outputs)
  fastify.get<{ Params: { id: string } }>('/api/problems/:id', async (request, reply) => {
    const { id } = request.params;

    try {
      const [meta, statement, samples] = await Promise.all([
        loadProblemMeta(id),
        loadProblemStatement(id),
        loadSampleTestcases(id),
      ]);

      return reply.send({
        id: meta.id,
        title: meta.title,
        difficulty: meta.difficulty,
        timeLimit: meta.timeLimit,
        memoryLimit: meta.memoryLimit,
        supportedLanguages: meta.supportedLanguages,
        starterCode: meta.starterCode ?? {},
        checkerType: meta.checkerType,
        order: meta.order,
        statement,
        // SECURITY: only expose sample inputs. Never expose expected outputs.
        sampleInputs: samples.map(tc => tc.input),
        sampleCount: samples.length,
      });
    } catch (err: any) {
      if (err?.code === 'ENOENT') {
        return reply.code(404).send({ error: `Problem "${id}" not found` });
      }
      fastify.log.error(err, 'Failed to load problem');
      return reply.code(500).send({ error: 'Failed to load problem' });
    }
  });
}
