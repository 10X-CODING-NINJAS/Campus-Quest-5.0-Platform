import './config/env';
import { db } from './db';
import { problems } from './db/schema';

async function test() {
  const allProblems = await db.select().from(problems);
  for (const p of allProblems) {
    console.log(`Problem: ${p.id}, Title: ${p.title}`);
    console.log('Testcases count:', p.testCases?.length);
    console.log('Testcases raw:', JSON.stringify(p.testCases, null, 2));
  }
  process.exit(0);
}

test();
