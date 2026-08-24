import './config/env';
import { startJudgeWorker } from './workers/judge.worker';

async function bootstrap() {
  const worker = startJudgeWorker();

  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];
  for (const signal of signals) {
    process.on(signal, async () => {
      console.log(`\n[Shutdown] ${signal} received, shutting down worker gracefully…`);
      await worker.close();
      console.log('[Shutdown] Worker closed. Goodbye.');
      process.exit(0);
    });
  }
}

bootstrap().catch(err => {
  console.error('[Fatal] Worker failed to start:', err);
  process.exit(1);
});
