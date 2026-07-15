import './config/env';
import { runInSandbox } from './judge/runner';

async function test() {
  const pythonCode = `
n = int(input())
if n == 0:
    print(0)
elif n == 1:
    print(1)
else:
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    print(b)
`;

  console.log('Sending test execution to Piston API...');
  const result = await runInSandbox('python', pythonCode, '10');
  console.log('Result from Piston:');
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

test();
