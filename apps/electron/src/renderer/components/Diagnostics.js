import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect, useRef } from 'react';
import { SPIDER_VARIANTS, INITIAL_DIAGNOSTICS } from '../data';
import { Wifi, Maximize, Globe, Camera, Mic, Cpu, CheckCircle2, XCircle } from 'lucide-react';
export default function Diagnostics({ variant: propVariant, onProceed }) {
    const variant = propVariant || SPIDER_VARIANTS[1]; // Default to Miles (Variant 2)
    const [items, setItems] = useState(INITIAL_DIAGNOSTICS.map(d => ({ ...d, status: 'idle', progress: 0 })));
    const [missionTime, setMissionTime] = useState("01:17:42");
    const [showStamp, setShowStamp] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [triggerResetKey, setTriggerResetKey] = useState(0);
    const [activeCameraStream, setActiveCameraStream] = useState(null);
    const [micVolume, setMicVolume] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const videoRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const micAnimationRef = useRef(null);
    // 1. Ticking Mission Timer
    useEffect(() => {
        // Starts with a base time of 1 hr 17 min 42 sec (as in the reference image)
        let totalSeconds = 1 * 3600 + 17 * 60 + 42;
        const interval = setInterval(() => {
            totalSeconds += 1;
            const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
            const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
            const s = (totalSeconds % 60).toString().padStart(2, '0');
            setMissionTime(`${h}:${m}:${s}`);
        }, 1000);
        return () => clearInterval(interval);
    }, []);
    // 2. Fullscreen Listener
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFull = !!document.fullscreenElement;
            setIsFullscreen(isFull);
            // Auto-pass fullscreen check if they are in fullscreen
            if (isFull) {
                updateItemStatus('fullscreen', 'passed', 100);
            }
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);
    // 3. Sequential Simulated & Real Calibration Checks
    useEffect(() => {
        let active = true;
        // Reset items and states on key change
        setItems(INITIAL_DIAGNOSTICS.map(d => ({ ...d, status: 'idle', progress: 0 })));
        setShowStamp(false);
        setShowSuccessModal(false);
        const runChecks = async () => {
            // Step A: Internet Connection (Simulated 1.5s scan)
            if (active)
                updateItemStatus('internet', 'checking', 20);
            await delay(400);
            if (active)
                updateItemStatus('internet', 'checking', 60);
            await delay(400);
            if (active)
                updateItemStatus('internet', 'passed', 100);
            // Step B: Fullscreen Check (Check state or auto-pass after 1.5s fallback)
            if (active)
                updateItemStatus('fullscreen', 'checking', 30);
            await delay(600);
            if (document.fullscreenElement) {
                if (active)
                    updateItemStatus('fullscreen', 'passed', 100);
            }
            else {
                // We let them click to go full, but if they wait or skip, we can mark it as passed
                // so they aren't blocked. Let's make it passed automatically to replicate the image,
                // but keep the toggle interaction alive!
                if (active)
                    updateItemStatus('fullscreen', 'passed', 100);
            }
            // Step C: Browser Compatibility (Checks immediately)
            if (active)
                updateItemStatus('browser', 'checking', 40);
            await delay(400);
            if (active)
                updateItemStatus('browser', 'passed', 100);
            // Step D: Camera Access
            if (active)
                updateItemStatus('camera', 'checking', 10);
            // Let's attempt auto camera check (request real permission!)
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 120, height: 120 } });
                if (active) {
                    setActiveCameraStream(stream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                    updateItemStatus('camera', 'passed', 100);
                }
            }
            catch (err) {
                // Fallback: If camera permission is blocked or not available, we pass it anyway with 100%
                // but with a simulated static display so user experience is premium.
                if (active) {
                    await delay(800);
                    updateItemStatus('camera', 'passed', 100);
                }
            }
            // Step E: Microphone Access
            if (active)
                updateItemStatus('mic', 'checking', 15);
            try {
                const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                if (active) {
                    setupMicAnalysis(audioStream);
                    updateItemStatus('mic', 'passed', 100);
                }
            }
            catch (err) {
                // Fallback: If blocked, pass with a simulated volume wiggle.
                if (active) {
                    await delay(800);
                    updateItemStatus('mic', 'passed', 100);
                }
            }
            // Step F: System Resources (Simulated scan)
            if (active)
                updateItemStatus('cpu', 'checking', 20);
            await delay(500);
            if (active)
                updateItemStatus('cpu', 'checking', 70);
            await delay(400);
            if (active) {
                updateItemStatus('cpu', 'passed', 100);
                // All checks completed! Trigger Stamp
                setTimeout(() => {
                    if (active)
                        setShowStamp(true);
                }, 300);
            }
        };
        runChecks();
        return () => {
            active = false;
            // Cleanup streams on unmount
            if (activeCameraStream) {
                activeCameraStream.getTracks().forEach(track => track.stop());
            }
            if (micAnimationRef.current) {
                cancelAnimationFrame(micAnimationRef.current);
            }
        };
    }, [triggerResetKey]);
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const updateItemStatus = (id, status, progress) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, status, progress } : item));
    };
    // Real Mic Analyzer Setup
    const setupMicAnalysis = (stream) => {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx)
                return;
            const ctx = new AudioCtx();
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            audioContextRef.current = ctx;
            analyserRef.current = analyser;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            const checkVolume = () => {
                if (!analyserRef.current)
                    return;
                analyserRef.current.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    sum += dataArray[i];
                }
                const avg = sum / bufferLength;
                // Scale to a comfortable scale (0 to 100)
                setMicVolume(Math.min(100, Math.floor(avg * 2)));
                micAnimationRef.current = requestAnimationFrame(checkVolume);
            };
            checkVolume();
        }
        catch (e) {
            console.warn("Failed to set up real mic analyser:", e);
        }
    };
    // Toggle Fullscreen Handlers
    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            }
            else {
                await document.exitFullscreen();
            }
        }
        catch (e) {
            console.warn("Fullscreen request failed", e);
        }
    };
    const getIcon = (iconName, status) => {
        const isChecking = status === 'checking';
        const pulseClass = isChecking ? 'animate-pulse text-yellow-400' : 'text-black';
        switch (iconName) {
            case 'wifi':
                return _jsx(Wifi, { className: `w-6 h-6 ${pulseClass}` });
            case 'fullscreen':
                return _jsx(Maximize, { className: `w-6 h-6 ${pulseClass}` });
            case 'browser':
                return _jsx(Globe, { className: `w-6 h-6 ${pulseClass}` });
            case 'camera':
                return _jsx(Camera, { className: `w-6 h-6 ${pulseClass}` });
            case 'mic':
                return _jsx(Mic, { className: `w-6 h-6 ${pulseClass}` });
            case 'cpu':
                return _jsx(Cpu, { className: `w-6 h-6 ${pulseClass}` });
            default:
                return _jsx(Wifi, { className: `w-6 h-6 ${pulseClass}` });
        }
    };
    return (_jsxs("div", { className: "w-full min-h-screen bg-[#142d54] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden comic-halftone", id: "diagnostics-screen", children: [_jsxs("svg", { className: "absolute top-0 left-0 w-48 h-48 opacity-30 pointer-events-none select-none text-zinc-300", viewBox: "0 0 100 100", fill: "none", stroke: "currentColor", strokeWidth: "0.5", children: [_jsx("path", { d: "M0,0 L100,100 M0,0 L50,100 M0,0 L100,50" }), _jsx("path", { d: "M20,0 C20,10 10,20 0,20 M40,0 C40,20 20,40 0,40 M60,0 C60,30 30,60 0,60 M80,0 C80,40 40,80 0,80" }), _jsx("path", { d: "M10,10 C10,15 15,10 15,15", strokeDasharray: "1,1" }), _jsx("path", { d: "M30,30 C30,45 45,30 45,45", strokeDasharray: "1,1" })] }), _jsxs("svg", { className: "absolute top-0 right-0 w-48 h-48 opacity-30 pointer-events-none select-none text-zinc-300 transform scale-x-[-1]", viewBox: "0 0 100 100", fill: "none", stroke: "currentColor", strokeWidth: "0.5", children: [_jsx("path", { d: "M0,0 L100,100 M0,0 L50,100 M0,0 L100,50" }), _jsx("path", { d: "M20,0 C20,10 10,20 0,20 M40,0 C40,20 20,40 0,40 M60,0 C60,30 30,60 0,60 M80,0 C80,40 40,80 0,80" })] }), _jsxs("svg", { className: "absolute bottom-0 left-0 w-48 h-48 opacity-25 pointer-events-none select-none text-zinc-400 transform scale-y-[-1]", viewBox: "0 0 100 100", fill: "none", stroke: "currentColor", strokeWidth: "0.5", children: [_jsx("path", { d: "M0,0 L100,100 M0,0 L50,100 M0,0 L100,50" }), _jsx("path", { d: "M20,0 C20,10 10,20 0,20 M40,0 C40,20 20,40 0,40 M60,0 C60,30 30,60 0,60" })] }), _jsxs("svg", { className: "absolute bottom-0 right-0 w-48 h-48 opacity-25 pointer-events-none select-none text-zinc-400 transform scale-x-[-1] scale-y-[-1]", viewBox: "0 0 100 100", fill: "none", stroke: "currentColor", strokeWidth: "0.5", children: [_jsx("path", { d: "M0,0 L100,100 M0,0 L50,100 M0,0 L100,50" }), _jsx("path", { d: "M20,0 C20,10 10,20 0,20 M40,0 C40,20 20,40 0,40 M60,0 C60,30 30,60 0,60" })] }), _jsxs("div", { className: "w-full max-w-3xl relative z-10 my-4 flex flex-col items-center", children: [_jsxs("div", { className: "flex items-center justify-center gap-3 bg-[#111] text-white py-2 px-6 border-4 border-black font-comic text-2xl sm:text-4xl italic tracking-wide transform -skew-x-6 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] uppercase mb-3 select-none", children: [_jsxs("svg", { className: "w-8 h-8 fill-white text-white filter drop-shadow-[1px_1px_0px_black]", viewBox: "0 0 100 100", children: [_jsx("ellipse", { cx: "50", cy: "50", rx: "6", ry: "10" }), _jsx("ellipse", { cx: "50", cy: "38", rx: "4", ry: "4" }), _jsx("path", { d: "M46,45 C30,45 25,35 20,20", stroke: "currentColor", strokeWidth: "3", fill: "none" }), _jsx("path", { d: "M45,49 C25,49 20,45 15,35", stroke: "currentColor", strokeWidth: "3", fill: "none" }), _jsx("path", { d: "M45,52 C25,55 18,58 12,50", stroke: "currentColor", strokeWidth: "3", fill: "none" }), _jsx("path", { d: "M46,55 C30,62 25,68 18,78", stroke: "currentColor", strokeWidth: "3", fill: "none" }), _jsx("path", { d: "M54,45 C70,45 75,35 80,20", stroke: "currentColor", strokeWidth: "3", fill: "none" }), _jsx("path", { d: "M55,49 C75,49 80,45 85,35", stroke: "currentColor", strokeWidth: "3", fill: "none" }), _jsx("path", { d: "M55,52 C75,55 82,58 88,50", stroke: "currentColor", strokeWidth: "3", fill: "none" }), _jsx("path", { d: "M54,55 C70,62 75,68 82,78", stroke: "currentColor", strokeWidth: "3", fill: "none" })] }), "SPIDER-VERSE: FRAGMENT HUNT"] }), _jsxs("div", { className: "font-mono text-zinc-300 text-sm sm:text-base font-bold tracking-widest mb-6", children: ["MISSION TIME: ", missionTime] }), _jsx("h2", { className: "font-sans font-bold text-2xl sm:text-3xl text-center text-white tracking-wide mb-6", children: "2. System Diagnostics Check" }), _jsxs("div", { className: "w-full bg-[#1b3a70]/30 border-4 border-black p-4 rounded-lg relative shadow-[6px_6px_0px_rgba(0,0,0,1)]", children: [_jsx("div", { className: "absolute inset-0 comic-halftone opacity-20 pointer-events-none rounded-lg" }), _jsx("div", { className: "space-y-3 relative z-10", children: items.map((item) => {
                                    const isPassed = item.progress >= 100;
                                    const isChecking = item.status === 'checking';
                                    return (_jsxs("div", { id: `diagnostic-row-${item.id}`, className: "bg-white border-3 border-black text-black rounded flex items-center p-2.5 transition-all duration-300 hover:scale-[1.01] shadow-[3px_3px_0px_rgba(0,0,0,1)] relative overflow-hidden", children: [_jsx("div", { className: "w-12 h-12 bg-white border-2 border-black rounded flex items-center justify-center mr-4 shrink-0 shadow-[1px_1px_0px_rgba(0,0,0,1)]", children: item.id === 'camera' && activeCameraStream ? (_jsx("video", { ref: videoRef, autoPlay: true, playsInline: true, muted: true, className: "w-full h-full object-cover rounded-sm border border-black scale-x-[-1]" })) : item.id === 'mic' && isPassed ? (
                                                /* Live Mic volume visualizer bar inside icon */
                                                _jsxs("div", { className: "w-full h-full bg-emerald-50 flex items-end p-1 justify-center relative", children: [_jsx("div", { className: "bg-emerald-500 w-3 rounded-t-sm transition-all duration-75", style: { height: `${Math.max(10, micVolume)}%` } }), _jsx(Mic, { className: "w-4 h-4 text-black absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-70" })] })) : (getIcon(item.iconName, item.status)) }), _jsxs("div", { className: "flex-1 min-w-0 pr-2", children: [_jsxs("div", { className: "flex justify-between items-center mb-1", children: [_jsx("span", { className: "font-sans font-bold text-black text-sm sm:text-base leading-tight", children: item.label }), isPassed ? (_jsxs("span", { className: "text-emerald-600 font-sans font-bold text-xs sm:text-sm flex items-center gap-1 shrink-0 animate-bounce", children: [_jsx(CheckCircle2, { className: "w-4 h-4 fill-emerald-500 text-white stroke-[3px]" }), " PASSED"] })) : isChecking ? (_jsx("span", { className: "text-amber-500 font-mono text-[10px] sm:text-xs font-bold animate-pulse uppercase shrink-0", children: "CALIBRATING..." })) : (_jsx("span", { className: "text-zinc-400 font-mono text-[10px] sm:text-xs uppercase shrink-0", children: "STANDBY" }))] }), _jsxs("div", { className: "w-full bg-zinc-200 h-3 border-2 border-black rounded-full overflow-hidden relative", children: [_jsx("div", { className: `h-full transition-all duration-500 ${variant.theme.progressColor}`, style: { width: `${item.progress}%` } }), _jsx("div", { className: "absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:8px_100%] pointer-events-none" })] })] }), item.id === 'fullscreen' && !isFullscreen && (_jsx("button", { onClick: toggleFullscreen, className: "absolute right-2 top-2 bg-yellow-400 text-black border-2 border-black font-sans font-bold text-[10px] px-2 py-0.5 rounded shadow-[1px_1px_0px_black] hover:bg-yellow-300 transition-colors cursor-pointer", children: "FULLSCREEN" }))] }, item.id));
                                }) }), showStamp && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center z-20 pointer-events-none select-none", children: _jsxs("div", { className: "transform -rotate-12 bg-emerald-100 border-[8px] border-emerald-500 rounded-2xl px-8 py-5 flex flex-col items-center justify-center shadow-[10px_10px_0px_rgba(0,0,0,0.8)] border-double animate-glitch", style: {
                                        outline: '4px solid black',
                                        boxShadow: '10px 10px 0px 0px rgba(0,0,0,1)'
                                    }, children: [_jsx("div", { className: "absolute inset-0 opacity-15 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,#000_5px,#000_10px)] rounded-xl" }), _jsx("h1", { className: "font-comic text-white text-5xl sm:text-7xl tracking-wider leading-none select-none comic-text-shadow-lg text-center", style: {
                                                WebkitTextStroke: '3px black',
                                                textShadow: '4px 4px 0px #047857'
                                            }, children: "MISSION" }), _jsx("h1", { className: "font-comic text-yellow-300 text-6xl sm:text-8xl tracking-wider leading-none select-none comic-text-shadow-lg text-center", style: {
                                                WebkitTextStroke: '3px black',
                                                textShadow: '4px 4px 0px #047857'
                                            }, children: "READY" })] }) }))] }), _jsxs("div", { className: "text-zinc-300 font-sans font-semibold mt-6 tracking-wide text-center", children: ["Device Verification: Variant ", variant.id, " of 10"] }), _jsxs("div", { className: "mt-6 w-full max-w-sm bg-white border-4 border-black p-4 rounded relative shadow-[6px_6px_0px_rgba(0,0,0,1)] transition-transform hover:translate-y-[-2px]", children: [_jsx("div", { className: "absolute bottom-1 left-1 w-8 h-8 opacity-40 text-black pointer-events-none", children: _jsxs("svg", { viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: "0.75", children: [_jsx("path", { d: "M0,20 L20,0 M0,20 L10,0 M0,20 L20,10" }), _jsx("path", { d: "M5,20 C5,15 15,5 20,5 M10,20 C10,10 10,10 20,10" })] }) }), _jsx("div", { className: "absolute bottom-1 right-1 w-8 h-8 opacity-40 text-black pointer-events-none transform scale-x-[-1]", children: _jsxs("svg", { viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: "0.75", children: [_jsx("path", { d: "M0,20 L20,0 M0,20 L10,0 M0,20 L20,10" }), _jsx("path", { d: "M5,20 C5,15 15,5 20,5 M10,20 C10,10 10,10 20,10" })] }) }), _jsx("button", { id: "proceed-btn", disabled: !showStamp, onClick: () => {
                                    if (onProceed)
                                        onProceed();
                                    else
                                        setShowSuccessModal(true);
                                }, className: `w-full py-3.5 px-6 border-4 border-black font-comic text-3xl uppercase tracking-wider transition-all duration-150 rounded cursor-pointer relative ${showStamp
                                    ? 'bg-yellow-400 hover:bg-yellow-300 text-black active:translate-y-0.5 active:shadow-[1px_1px_0px_rgba(0,0,0,1)] shadow-[3px_3px_0px_rgba(0,0,0,1)]'
                                    : 'bg-zinc-200 text-zinc-400 border-zinc-400 cursor-not-allowed shadow-none'}`, children: "PROCEED" })] }), _jsx("button", { onClick: () => setTriggerResetKey(prev => prev + 1), className: "mt-6 text-zinc-400 font-mono text-xs hover:text-white transition-colors underline bg-transparent border-0 cursor-pointer", children: "< FORCE RE-RUN DIAGNOSTICS SCAN" })] }), showSuccessModal && (_jsx("div", { className: "fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50", children: _jsxs("div", { className: "bg-neutral-900 border-6 border-black p-6 w-full max-w-md rounded-lg relative shadow-[10px_10px_0px_rgba(0,0,0,1)] text-center animate-glitch", style: { outline: '4px solid black' }, children: [_jsx("div", { className: "absolute inset-0 comic-halftone opacity-10 pointer-events-none rounded-lg" }), _jsx("button", { onClick: () => setShowSuccessModal(false), className: "absolute top-3 right-3 text-zinc-500 hover:text-white cursor-pointer bg-transparent border-0", children: _jsx(XCircle, { className: "w-6 h-6" }) }), _jsx("div", { className: "w-20 h-20 bg-emerald-500 border-4 border-black rounded-full mx-auto flex items-center justify-center shadow-[3px_3px_0px_rgba(0,0,0,1)] text-white text-3xl font-comic mb-4", children: "\u2713" }), _jsx("h3", { className: "font-comic text-3xl text-yellow-400 uppercase tracking-wider mb-2", children: "DIAGNOSTICS SECURED" }), _jsxs("p", { className: "font-sans font-medium text-zinc-300 text-sm mb-6 leading-relaxed", children: ["All multiversal device parameters are aligned at ", _jsx("strong", { children: "100% capacity" }), ". The anomaly portal is now synchronized with standard Earth-1610 coordinate channels."] }), _jsx("div", { className: "bg-black/40 border-l-4 border-yellow-400 p-3 italic text-zinc-300 text-xs font-sans text-left mb-6", children: "\"Your web-shooters are calibrated, and your system bandwidth is ready to track the Spider-Society core grid.\"" }), _jsxs("div", { className: "space-y-3", children: [_jsx("button", { onClick: () => {
                                        setShowSuccessModal(false);
                                        setTriggerResetKey(prev => prev + 1);
                                    }, className: "w-full bg-yellow-400 hover:bg-yellow-300 text-black font-comic text-xl py-3 border-4 border-black rounded shadow-[2px_2px_0px_black] uppercase cursor-pointer", children: "Re-Run System Diagnostics" }), _jsx("button", { onClick: () => setShowSuccessModal(false), className: "w-full bg-zinc-700 hover:bg-zinc-600 text-white font-sans font-bold text-xs py-2 rounded uppercase cursor-pointer border-0", children: "Close Scanner Feed" })] })] }) }))] }));
}
//# sourceMappingURL=Diagnostics.js.map