import { runInSandbox, runBatchInSandbox } from '../src/judge/runner';
import fs from 'fs/promises';
import path from 'path';

async function main() {
  console.log('====================================================');
  console.log('🤖 STARTING JUDGE CORRECTNESS & PERFORMANCE REGRESSION');
  console.log('====================================================\n');

  let passedAll = true;

  // 1. Language & Verdict regression checks
  console.log('--- 🧪 PHASE 1: Language & Verdict Execution Regression ---');
  
  const testScenarios = [
    {
      name: 'C Correct Code (AC)',
      lang: 'c',
      code: `
#include <stdio.h>
int main() {
    int x;
    if (scanf("%d", &x) == 1) {
        printf("%d\\n", x * 2);
    }
    return 0;
}
`,
      stdin: '12',
      expectedOutput: '24',
      expectedVerdict: 'AC'
    },
    {
      name: 'C++ Wrong Answer (WA)',
      lang: 'cpp',
      code: `
#include <iostream>
using namespace std;
int main() {
    int x;
    if (cin >> x) {
        cout << (x * 3) << endl;
    }
    return 0;
}
`,
      stdin: '12',
      expectedOutput: '24',
      expectedVerdict: 'WA'
    },
    {
      name: 'Java Runtime Error (RE)',
      lang: 'java',
      code: `
public class Main {
    public static void main(String[] args) {
        int x = 12 / 0; // ArithmeticException
        System.out.println(x);
    }
}
`,
      stdin: '12',
      expectedOutput: '12',
      expectedVerdict: 'RE'
    },
    {
      name: 'C++ Compilation Error (CE)',
      lang: 'cpp',
      code: `
#include <iostream>
using namespace std;
int main() {
    this is not valid C++ code
    return 0;
}
`,
      stdin: '12',
      expectedOutput: '12',
      expectedVerdict: 'CE'
    },
    {
      name: 'Python Time Limit Exceeded (TLE)',
      lang: 'python',
      code: `
import time
time.sleep(6) # limit is 5s
print("done")
`,
      stdin: '12',
      expectedOutput: 'done',
      expectedVerdict: 'TLE'
    }
  ];

  for (const tc of testScenarios) {
    process.stdout.write(`Scenario: ${tc.name.padEnd(35)}... `);
    try {
      const res = await runInSandbox(tc.lang as any, tc.code.trim(), tc.stdin, tc.expectedOutput);
      if (res.verdict === tc.expectedVerdict) {
        console.log('✅ PASS (Got ' + res.verdict + ', time: ' + res.runtimeMs + 'ms)');
      } else {
        console.log('❌ FAIL (Expected ' + tc.expectedVerdict + ', got ' + res.verdict + ')');
        console.log('Stderr:', res.stderr);
        passedAll = false;
      }
    } catch (err: any) {
      console.log('❌ ERROR (Crashed script):', err.message);
      passedAll = false;
    }
  }

  console.log('\n--- 📚 PHASE 2: Problem Testcase Integrity Audit ---');

  const problemsDir = path.resolve(__dirname, '../../../problems');
  let entries;
  try {
    entries = await fs.readdir(problemsDir, { withFileTypes: true });
  } catch (err: any) {
    console.error('❌ Failed to read problems directory:', err.message);
    process.exit(1);
  }

  const problemFolders = entries
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort((a, b) => {
      const numA = parseInt(a.split('-')[0], 10);
      const numB = parseInt(b.split('-')[0], 10);
      return numA - numB;
    });

  for (const folder of problemFolders) {
    process.stdout.write(`Problem: ${folder.padEnd(45)}... `);
    const folderPath = path.join(problemsDir, folder);
    
    try {
      // 1. Load reference solution
      const refPath = path.join(folderPath, 'reference/solution.py');
      const refCode = await fs.readFile(refPath, 'utf8');

      // 2. Load samples
      const samplesDir = path.join(folderPath, 'samples');
      const sampleFiles = await fs.readdir(samplesDir).catch(() => [] as string[]);
      const inputs = sampleFiles.filter(f => f.endsWith('.in')).sort();

      const testcases: Array<{ input: string; output: string }> = [];

      for (const inFile of inputs) {
        const base = inFile.slice(0, -3);
        const outFile = `${base}.out`;
        const input = await fs.readFile(path.join(samplesDir, inFile), 'utf8');
        const output = await fs.readFile(path.join(samplesDir, outFile), 'utf8');
        testcases.push({ input, output });
      }

      const sampleCount = testcases.length;

      // 3. Load hidden
      const hiddenDir = path.join(folderPath, 'hidden');
      const hiddenFiles = await fs.readdir(hiddenDir).catch(() => [] as string[]);
      const hiddenInputs = hiddenFiles.filter(f => f.endsWith('.in')).sort();

      for (const inFile of hiddenInputs) {
        const base = inFile.slice(0, -3);
        const outFile = `${base}.out`;
        const input = await fs.readFile(path.join(hiddenDir, inFile), 'utf8');
        const output = await fs.readFile(path.join(hiddenDir, outFile), 'utf8');
        testcases.push({ input, output });
      }

      const totalCount = testcases.length;

      if (totalCount === 0) {
        console.log('⚠️ SKIP (No test cases found)');
        continue;
      }

      // 4. Run batch sandbox
      const start = Date.now();
      const batchResult = await runBatchInSandbox('python', refCode, testcases);
      const duration = Date.now() - start;

      if (batchResult.overallVerdict === 'AC') {
        console.log(`✅ AC (${sampleCount} sample, ${totalCount - sampleCount} hidden) in ${duration}ms`);
      } else {
        console.log(`❌ FAIL (Verdict: ${batchResult.overallVerdict})`);
        const failedCase = batchResult.results.find(r => r.verdict !== 'AC');
        if (failedCase) {
          console.log(`  Failed Case Index: ${failedCase.index}`);
          console.log(`  Verdict: ${failedCase.verdict}`);
          console.log(`  Expected:\n${testcases[failedCase.index].output}`);
          console.log(`  Got:\n${failedCase.stdout}`);
          if (failedCase.stderr) console.log(`  Stderr:\n${failedCase.stderr}`);
        }
        passedAll = false;
      }
    } catch (err: any) {
      console.log('❌ ERROR (Crashed):', err.message);
      passedAll = false;
    }
  }

  console.log('\n====================================================');
  if (passedAll) {
    console.log('🎉 REGRESSION SUCCESS: ALL scenario checks and problem tests PASSED!');
    process.exit(0);
  } else {
    console.log('🚨 REGRESSION FAILURE: Some scenario checks or problem tests FAILED.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal script error:', err);
  process.exit(1);
});
