/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import lobbyBg from '../../Assets/Page 3.png';

interface LobbyProps {
  onProceed: () => void;
}

export default function Lobby({ onProceed }: LobbyProps) {
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes countdown
  const [teamsConnected, setTeamsConnected] = useState(12);
  const [isStarting, setIsStarting] = useState(false);

  // 1. Ticking Countdown Timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // 2. Simulating Teams Connecting (Increments from 12 to 30)
  useEffect(() => {
    if (teamsConnected >= 30) {
      // Once all teams are connected, simulate admin starting the test
      setIsStarting(true);
      const startTimeout = setTimeout(() => {
        onProceed();
      }, 3000); // 3 seconds delay for dramatic effect
      return () => clearTimeout(startTimeout);
    }

    const delay = Math.random() * 2000 + 1000; // random interval between 1-3s
    const connectionTimer = setTimeout(() => {
      setTeamsConnected(prev => Math.min(30, prev + Math.floor(Math.random() * 2) + 1));
    }, delay);

    return () => clearTimeout(connectionTimer);
  }, [teamsConnected, onProceed]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div 
      className="h-screen w-screen bg-[#05050d] flex flex-col items-center justify-between overflow-hidden select-none relative"
      style={{ backgroundImage: `url(${lobbyBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
    >
      {/* Halftone texture overlay for comic printed feel */}
      <div className="absolute inset-0 comic-halftone opacity-20 pointer-events-none z-0" />

      {/* Center Circle Content (precisely aligned inside the red spider-web circle) */}
      <div className="absolute top-[56%] left-[50.8%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center text-center z-10 w-[240px]">
        {/* Glow effect matching the orb theme */}
        <div className="absolute w-[200px] h-[200px] bg-red-600/10 rounded-full blur-2xl pointer-events-none -z-10 animate-pulse" />

        {isStarting ? (
          <div className="flex flex-col items-center gap-1">
            <span className="font-comic text-yellow-400 text-3xl tracking-widest uppercase animate-bounce">
              PREPARE!
            </span>
            <span className="font-sans text-xs text-zinc-300 tracking-wider uppercase font-bold">
              ADMIN STARTING MISSION...
            </span>
          </div>
        ) : (
          <div className="font-digital text-red-500 text-5xl font-black tracking-widest drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]">
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Bottom Area: Teams connected text out of 30 */}
      <div className="absolute bottom-[10%] left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 z-10">
        <div className="font-comic text-2xl sm:text-3xl text-white tracking-widest uppercase select-none italic text-center drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
          TEAMS CONNECTED: <span className={teamsConnected === 30 ? 'text-emerald-400 animate-pulse' : 'text-yellow-400'}>{teamsConnected}</span> / 30
        </div>
        
        {/* Connection status bar indicator */}
        <div className="w-[320px] bg-zinc-900 border-3 border-black h-5 overflow-hidden relative shadow-[3px_3px_0px_rgba(0,0,0,1)]">
          <div 
            className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-500 ease-out" 
            style={{ width: `${(teamsConnected / 30) * 100}%` }}
          />
          {/* Grid Hatch Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:6px_100%] pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
