import { io } from 'socket.io-client';
import axios from 'axios';

const API_BASE = 'http://localhost:3001';

const testTeam = { teamName: 'Spider Squad', password: 'spider123' };

const STRESS_TESTS = [
  {
    name: 'Infinite Loop (Timeout Test)',
    language: 'cpp',
    code: `#include <iostream>\nusing namespace std;\nint main() { while(true) {} return 0; }`
  },
  {
    name: 'Massive Output (Buffer Test)',
    language: 'python',
    code: `while True:\n    print('A' * 100000)`
  },
  {
    name: 'Syntax Error (Compile Error Test)',
    language: 'cpp',
    code: `int main() { this is not c++ code return 0; }`
  },
  {
    name: 'Memory Abuse (OOM Test)',
    language: 'python',
    code: `a = []\nwhile True:\n    a.append(' ' * 10**6)`
  }
];

async function runStressTest() {
  console.log('--- JUDGE STRESS TEST ---');
  try {
    // 1. Login to get token
    console.log(`Logging in as ${testTeam.teamName}...`);
    const loginRes = await axios.post(`${API_BASE}/api/login`, testTeam);
    const token = loginRes.data.token;
    
    // 2. Connect socket
    const socket = io(API_BASE, { auth: { token }, transports: ['websocket'] });
    
    await new Promise((resolve) => {
      socket.on('connect', () => {
        console.log('Socket connected.');
        resolve(true);
      });
    });

    let currentTest = 0;
    
    socket.on('run:result', (result: any) => {
      console.log(`\n[Result] ${STRESS_TESTS[currentTest].name}`);
      console.log(`Verdict: ${result.verdict}`);
      console.log(`Stdout length: ${result.stdout?.length || 0}`);
      console.log(`Stderr length: ${result.stderr?.length || 0}`);
      if (result.stderr && result.stderr.length < 500) {
          console.log(`Stderr: ${result.stderr.trim()}`);
      }

      currentTest++;
      if (currentTest < STRESS_TESTS.length) {
        runNext();
      } else {
        console.log('\nAll tests completed. Verifying backend is still alive...');
        axios.get(`${API_BASE}/health`).then(res => {
           console.log(`Health endpoint: ${res.status} ${res.data.status}`);
           socket.disconnect();
           process.exit(0);
        }).catch(err => {
           console.error('Backend appears to be down!', err.message);
           process.exit(1);
        });
      }
    });

    function runNext() {
      const test = STRESS_TESTS[currentTest];
      console.log(`\nDispatching: ${test.name}`);
      socket.emit('run:code', { 
        problemId: '1-spider-sense-activation', 
        code: test.code, 
        language: test.language, 
        stdin: 'test input' 
      });
    }

    runNext();
    
  } catch (err: any) {
    console.error('Stress test failed to run:', err.message);
    if (err.response) {
      console.error(err.response.data);
    }
  }
}

runStressTest();
