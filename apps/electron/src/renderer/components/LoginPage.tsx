import React, { useState } from 'react';
import loginBg from '../../Assets/LoginPage.png';

interface LoginPageProps {
  onLogin: (teamName: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [teamName, setTeamName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !password.trim()) {
      setError('ALL FIELDS REQUIRED, HERO!');
      return;
    }
    onLogin(teamName);
  };

  return (
    <div className="h-screen w-screen bg-[#05050d] flex items-center justify-center overflow-hidden select-none">
      {/* Halftone texture overlay for comic printed feel */}
      <div className="absolute inset-0 comic-halftone opacity-30 pointer-events-none z-0" />

      {/* Aspect-ratio locked container to map coordinates perfectly to the image */}
      <div 
        className="relative w-full h-full max-w-[1448px] max-h-[1086px] aspect-[1448/1086] bg-contain bg-center bg-no-repeat flex items-center justify-center z-10"
        style={{ backgroundImage: `url(${loginBg})` }}
      >
        
        {/* Error Message - styled like a floating comic sound effect */}
        {error && (
          <div 
            className="absolute left-1/2 -translate-x-1/2 top-[24%] z-30 bg-red-600 border-4 border-black text-white px-6 py-2 font-display text-xl tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-1 animate-bounce"
          >
            {error}
          </div>
        )}

        {/* Inputs container - placed directly in the center black region */}
        <div className="absolute left-1/2 top-[51%] -translate-x-1/2 -translate-y-1/2 w-[32%] min-w-[280px] flex flex-col gap-6 z-20">
          
          {/* Team Name Input */}
          <div className="flex flex-col gap-1 relative">
            <label className="absolute -top-3 left-4 font-display text-sm md:text-base text-black tracking-wide bg-yellow-400 border-2 border-black px-2 py-0.5 transform -rotate-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10">
              TEAM NAME
            </label>
            <input 
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full bg-white border-4 border-black p-3 pt-4 text-black font-sans font-bold text-base md:text-lg focus:outline-none focus:bg-yellow-50 placeholder-black/30 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors"
              placeholder="e.g. WEB_SLINGERS"
            />
          </div>

          {/* Password Input */}
          <div className="flex flex-col gap-1 relative mt-2">
            <label className="absolute -top-3 left-4 font-display text-sm md:text-base text-black tracking-wide bg-blue-400 border-2 border-black px-2 py-0.5 transform rotate-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10">
              PASSWORD
            </label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border-4 border-black p-3 pt-4 text-black font-sans font-bold text-base md:text-lg focus:outline-none focus:bg-blue-50 placeholder-black/30 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors"
              placeholder="••••••••"
            />
          </div>

        </div>

        {/* Circular Login Button - aligned exactly over the background's red "LOGIN" circle */}
        <button
          onClick={handleSubmit}
          type="button"
          className="absolute left-[49.7%] top-[77.4%] -translate-x-1/2 -translate-y-1/2 w-[10.5%] aspect-square rounded-full cursor-pointer z-20 outline-none group bg-transparent"
          title="TRANSMIT CREDENTIALS"
        >
          {/* Subtle outer glowing circle on hover */}
          <div className="absolute inset-0 rounded-full bg-transparent group-hover:bg-red-600/10 group-hover:scale-105 group-active:scale-95 group-hover:shadow-[0_0_25px_rgba(239,68,68,0.7)] border-4 border-transparent group-hover:border-red-500/40 transition-all duration-200" />
        </button>

      </div>
    </div>
  );
}
