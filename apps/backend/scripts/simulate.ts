import { io } from 'socket.io-client';
import axios from 'axios';

const API_BASE = 'http://localhost:3001';
const ADMIN_SECRET = 'spidey_admin_2024';

const SIMULATED_TEAMS = 20;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function startSimulation() {
  console.log(`Starting multi-team simulation with ${SIMULATED_TEAMS} teams...`);

  // 1. Admin login to ensure contest is running
  try {
    await axios.get(`${API_BASE}/admin/contest-status`, { headers: { Authorization: `Bearer ${ADMIN_SECRET}` } });
    console.log('Admin connected.');
    // In a real scenario, the admin would click 'Start Contest'. We assume it's running.
  } catch (err: any) {
    console.error('Failed to connect as admin. Is backend running?', err.message);
    process.exit(1);
  }

  // 2. We use the test teams available in the DB
  const testTeams = [
    { teamName: 'Spider Squad', password: 'spider123' },
    { teamName: 'Iron Coders', password: 'iron456' },
    { teamName: 'Web Slingers', password: 'web789' },
    { teamName: 'Quantum Devs', password: 'quantum000' }
  ];

  const sockets: any[] = [];

  for (let i = 0; i < testTeams.length; i++) {
    const team = testTeams[i];
    try {
      const res = await axios.post(`${API_BASE}/api/login`, team);
      const token = res.data.token;
      
      const socket = io(API_BASE, { auth: { token }, transports: ['websocket'] });
      sockets.push({ team: team.teamName, socket });
      
      socket.on('connect', () => {
        console.log(`${team.teamName} connected to Socket.IO`);
        socket.emit('contest:sync');
      });

      socket.on('submit:result', (res: any) => {
        console.log(`[${team.teamName}] Submit Result: ${res.verdict || res.status}`);
      });
    } catch (err: any) {
      console.log(`Failed to login ${team.teamName}`);
    }
  }

  await sleep(2000);

  console.log('--- Simulating Random Actions ---');
  // Dispatch a random action every 2 seconds
  const interval = setInterval(() => {
    const randomTeam = sockets[Math.floor(Math.random() * sockets.length)];
    if (!randomTeam) return;

    const action = Math.random();
    if (action < 0.6) {
      // Simulate submission
      console.log(`[${randomTeam.team}] Submitting random code...`);
      randomTeam.socket.emit('submit:code', {
        problemId: '1-spider-sense-activation',
        language: 'python',
        code: `print('simulated')`
      });
    } else if (action < 0.8) {
      // Simulate Spider-Sense
      console.log(`[${randomTeam.team}] Using Spider-Sense!`);
      randomTeam.socket.emit('powerup:use', { type: 'SPIDER_SENSE', problemId: '1-spider-sense-activation' });
    } else {
      // Simulate reconnect
      console.log(`[${randomTeam.team}] Disconnecting and reconnecting...`);
      randomTeam.socket.disconnect();
      setTimeout(() => randomTeam.socket.connect(), 1000);
    }
  }, 2000);

  // Run for 30 seconds then stop
  setTimeout(() => {
    clearInterval(interval);
    console.log('Simulation complete. Shutting down clients.');
    sockets.forEach(s => s.socket.disconnect());
    process.exit(0);
  }, 30000);
}

startSimulation();
