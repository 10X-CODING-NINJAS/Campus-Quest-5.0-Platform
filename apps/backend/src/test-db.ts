import './config/env';
import { db } from './db';
import { problems } from './db/schema';
import { eq } from 'drizzle-orm';

async function test() {
  try {
    const res = await db.select().from(problems).where(eq(problems.id, '1-two-sum'));
    console.log('Query succeeded! Result:', res);
  } catch (err: any) {
    console.error('Query failed! Full error details:');
    console.error(err);
  }
  process.exit(0);
}

test();
