import { runInSandbox } from '../src/judge/runner';

async function testLanguage(lang: 'c' | 'cpp' | 'python' | 'java', code: string, stdin: string, expectedOut: string, description: string) {
  console.log(`\n[TEST] ${lang.toUpperCase()} - ${description}`);
  const start = Date.now();
  try {
    const res = await runInSandbox(lang, code, stdin, expectedOut);
    console.log(`-> Verdict: ${res.verdict} | Time: ${res.runtimeMs}ms | Exec Time: ${Date.now() - start}ms`);
    if (res.stderr) console.log(`   Stderr: ${res.stderr.slice(0, 100)}`);
  } catch (err: any) {
    console.error(`-> Error: ${err.message}`);
  }
}

async function runTests() {
  const cCode = `
#include <stdio.h>
int main() {
  int a, b;
  if (scanf("%d %d", &a, &b) == 2) {
    printf("%d\\n", a + b);
  }
  return 0;
}`;

  const cppCode = `
#include <iostream>
using namespace std;
int main() {
  int a, b;
  if (cin >> a >> b) {
    cout << a + b << "\\n";
  }
  return 0;
}`;

  const pyCode = `
import sys
for line in sys.stdin:
  a, b = map(int, line.split())
  print(a + b)
`;

  const javaCode = `
import java.util.Scanner;
public class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    if (sc.hasNextInt()) {
      int a = sc.nextInt();
      int b = sc.nextInt();
      System.out.println(a + b);
    }
  }
}`;

  const tleCodeC = `
#include <stdio.h>
int main() {
  while(1) {}
  return 0;
}`;

  const memLimitCodePy = `
# Allocate lots of memory to test OOM or high output
a = []
for i in range(100000000):
  a.append(i)
print("Done")
`;

  console.log("=== BASIC EXECUTION TESTS ===");
  await testLanguage('c', cCode, '5 7\n', '12', 'Basic Addition');
  await testLanguage('cpp', cppCode, '10 20\n', '30', 'Basic Addition');
  await testLanguage('python', pyCode, '2 3\n', '5', 'Basic Addition');
  await testLanguage('java', javaCode, '100 200\n', '300', 'Basic Addition');

  console.log("\n=== TIMEOUT / EDGE CASE TESTS ===");
  await testLanguage('c', tleCodeC, '', '', 'Infinite Loop (TLE)');
  await testLanguage('python', memLimitCodePy, '', 'Done', 'Memory Limit / High Usage (Expected TLE or RE)');

  console.log("\n=== CONCURRENCY LOAD TEST ===");
  const promises = [];
  console.log("Launching 10 parallel Python + C++ executions...");
  for (let i = 0; i < 5; i++) {
    promises.push(testLanguage('python', pyCode, `${i} ${i*2}\n`, `${i * 3}`, `Parallel Python #${i}`));
    promises.push(testLanguage('cpp', cppCode, `${i} ${i*2}\n`, `${i * 3}`, `Parallel CPP #${i}`));
  }
  await Promise.all(promises);
  console.log("Concurrency test complete.");
}

runTests().catch(console.error);
