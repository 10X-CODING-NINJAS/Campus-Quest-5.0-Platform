import React, { useState, useEffect } from 'react';
import loginBg from '../../Assets/LoginPage.png';

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [teamName, setTeamName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // State for dynamic circle button coordinates
  const [circleCoords, setCircleCoords] = useState({ x: 0, y: 0, r: 75 });

  useEffect(() => {
    const calculatePosition = () => {
      // Dimensions of the original LoginPage.png image
      const imgW = 1448;
      const imgH = 1086;
      
      // Center coordinates of the "LOGIN" circle in the original image
      const circleX = 719.83; 
      const circleY = 840.76;
      const originalRadius = 75; // Approx radius of the red circle

      const vpW = window.innerWidth;
      const vpH = window.innerHeight;

      const imgAspect = imgW / imgH;
      const vpAspect = vpW / vpH;

      let scale = 1;
      let offsetX = 0;
      let offsetY = 0;

      if (vpAspect > imgAspect) {
        // Image is scaled to match viewport width
        scale = vpW / imgW;
        offsetY = (vpH - (imgH * scale)) / 2;
      } else {
        // Image is scaled to match viewport height
        scale = vpH / imgH;
        offsetX = (vpW - (imgW * scale)) / 2;
      }

      setCircleCoords({
        x: circleX * scale + offsetX,
        y: circleY * scale + offsetY,
        r: originalRadius * scale
      });
    };

    calculatePosition();
    window.addEventListener('resize', calculatePosition);
    return () => window.removeEventListener('resize', calculatePosition);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !password.trim()) {
      setError('ALL FIELDS REQUIRED, HERO!');
      return;
    }
    // Simulate successful login
    onLogin();
  };

  return (
    <div 
      className="h-screen w-screen relative overflow-hidden bg-black flex flex-col items-center justify-start pt-[8vh] select-none"
      style={{ 
        backgroundImage: `url(${loginBg})`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center', 
        backgroundRepeat: 'no-repeat' 
      }}
    >
      {/* Halftone texture overlay to give it a comic printed look */}
      <div className="absolute inset-0 comic-halftone opacity-40 pointer-events-none" />

      {/* Main Form container styled in a comic-strip frame */}
      <form 
        onSubmit={handleSubmit}
        className="relative z-10 w-[440px] bg-yellow-300 border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1 flex flex-col gap-6"
      >
        {/* Caption Badge */}
        <div className="absolute -top-6 -left-4 bg-red-600 border-4 border-black px-4 py-2 text-white font-display text-2xl tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-2">
          CAMPUS QUEST v5.0
        </div>

        <div className="mt-2 text-center">
          <h1 className="font-display text-4xl text-black tracking-wide uppercase">
            TEAM LOGIN
          </h1>
          <p className="font-sans font-black text-black/80 text-xs mt-1 tracking-wider">
            ENTER CREDENTIALS AND INITIATE SCAN!
          </p>
        </div>

        {error && (
          <div className="bg-red-600 border-4 border-black p-2 text-center text-white font-display tracking-wider text-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] animate-bounce">
            {error}
          </div>
        )}

        {/* Team Name Input */}
        <div className="flex flex-col gap-1 relative">
          <label className="font-display text-xl text-black tracking-wide self-start bg-blue-400 border-2 border-black px-2 py-0.5 transform -rotate-1 -mb-2 z-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            TEAM NAME:
          </label>
          <input 
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="w-full bg-white border-4 border-black p-3 text-black font-sans font-bold text-lg focus:outline-none focus:bg-blue-50 placeholder-black/40 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            placeholder="e.g. WEB_SLINGERS"
          />
        </div>

        {/* Password Input */}
        <div className="flex flex-col gap-1 relative mt-2">
          <label className="font-display text-xl text-black tracking-wide self-start bg-red-500 border-2 border-black px-2 py-0.5 transform rotate-1 -mb-2 z-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-white">
            PASSWORD:
          </label>
          <input 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white border-4 border-black p-3 text-black font-sans font-bold text-lg focus:outline-none focus:bg-red-50 placeholder-black/40 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            placeholder="••••••••"
          />
        </div>

        {/* Comic Helper Text pointing to the login button */}
        <div className="mt-2 text-center flex flex-col items-center">
          <div className="text-black font-display text-lg tracking-wider bg-yellow-400 border-2 border-black px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-pulse">
            PRESS BUTTON BELOW TO TRANSMIT!
          </div>
          <svg className="w-6 h-6 text-black mt-2 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 13l-7 7-7-7m14-6l-7 7-7-7" />
          </svg>
        </div>
      </form>

      {/* Floating Login Button (Overlaid precisely on the LOGIN circle in the background image) */}
      <button
        onClick={handleSubmit}
        type="button"
        className="absolute rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group outline-none select-none z-20"
        style={{
          left: `${circleCoords.x - circleCoords.r}px`,
          top: `${circleCoords.y - circleCoords.r}px`,
          width: `${circleCoords.r * 2}px`,
          height: `${circleCoords.r * 2}px`,
        }}
        title="TRANSMIT CREDENTIALS"
      >
        {/* Glow effect matching the red/blue theme */}
        <div className="absolute inset-0 rounded-full bg-red-600/30 group-hover:bg-red-600/50 group-hover:scale-105 group-active:scale-95 group-hover:shadow-[0_0_30px_rgba(239,68,68,0.8)] transition-all duration-200 border-4 border-dashed border-red-500/40 group-hover:border-red-500" />
        
        {/* Comic sound text overlay */}
        <span className="relative z-10 font-display text-2xl md:text-3xl text-white tracking-widest transform -rotate-6 scale-90 group-hover:scale-110 group-hover:rotate-6 group-hover:text-yellow-300 transition-all duration-200 filter drop-shadow-[2px_2px_0px_#000]">
          LOGIN!
        </span>
      </button>
    </div>
  );
}
