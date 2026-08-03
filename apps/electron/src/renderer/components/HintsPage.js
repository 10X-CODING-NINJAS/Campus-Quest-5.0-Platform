import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import FinalMissionScreen from './FinalMissionScreen';
// ── Landmark definitions ──────────────────────────────────────────────────────
// Each landmark has a precise building footprint polygon and the stage at which it activates.
const LANDMARKS = [
    {
        id: 'landmark-esb',
        label: 'Empire State Building',
        activeAtStage: 1,
        // ESB: 350 Fifth Ave (stepped chamfered footprint matching the building base)
        coords: [
            [-73.98595, 40.74815],
            [-73.98535, 40.74815],
            [-73.98528, 40.74822],
            [-73.98528, 40.74865],
            [-73.98535, 40.74872],
            [-73.98595, 40.74872],
            [-73.98602, 40.74865],
            [-73.98602, 40.74822],
            [-73.98595, 40.74815],
        ],
        height: 443, // architectural height (m), used for extrusion
        base: 0,
        flyTo: { center: [-73.98565, 40.74844], zoom: 16.5, pitch: 60, bearing: -20 },
    },
    {
        id: 'landmark-1wtc',
        label: 'One World Trade Center',
        activeAtStage: 2,
        // 1 WTC: octagonal chamfered tower footprint
        coords: [
            [-74.01348, 40.71274],
            [-74.01302, 40.71274],
            [-74.01289, 40.71287],
            [-74.01289, 40.71317],
            [-74.01302, 40.71330],
            [-74.01348, 40.71330],
            [-74.01361, 40.71317],
            [-74.01361, 40.71287],
            [-74.01348, 40.71274],
        ],
        height: 541,
        base: 0,
        flyTo: { center: [-74.01325, 40.71302], zoom: 16.5, pitch: 60, bearing: 10 },
    },
    {
        id: 'landmark-chrysler',
        label: 'Chrysler Building',
        activeAtStage: 3,
        // Chrysler: 405 Lexington Ave footprint
        coords: [
            [-73.97560, 40.75135],
            [-73.97502, 40.75135],
            [-73.97497, 40.75140],
            [-73.97497, 40.75185],
            [-73.97502, 40.75190],
            [-73.97560, 40.75190],
            [-73.97565, 40.75185],
            [-73.97565, 40.75140],
            [-73.97560, 40.75135],
        ],
        height: 318,
        base: 0,
        flyTo: { center: [-73.97531, 40.75162], zoom: 16.5, pitch: 60, bearing: -10 },
    },
];
// ── Stage progress info ───────────────────────────────────────────────────────
const STAGE_INFO = [
    { fraction: '0 / 3', label: 'SENSOR GRID OFFLINE', color: 'text-zinc-500' },
    { fraction: '1 / 3', label: 'EMPIRE STATE — LOCKED', color: 'text-emerald-400' },
    { fraction: '2 / 3', label: 'ONE WORLD TRADE — LOCKED', color: 'text-emerald-400' },
    { fraction: '3 / 3', label: 'CHRYSLER — ALL ANCHORS', color: 'text-emerald-300' },
];
export default function HintsPage({ hintStage }) {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const animIdRef = useRef(0);
    const prevStageRef = useRef(0);
    const [showFinalMission, setShowFinalMission] = useState(false);
    const [missionUpdate, setMissionUpdate] = useState(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    // ── Auto-show final mission when stage reaches 3 ──────────────────────────
    useEffect(() => {
        if (hintStage >= 3) {
            setShowFinalMission(true);
        }
    }, [hintStage]);
    // ── Animate landmark layers whenever hintStage changes ───────────────────
    const animateLandmarks = useCallback(() => {
        const map = mapRef.current;
        if (!map || !map.isStyleLoaded())
            return;
        const time = Date.now() / 1000;
        LANDMARKS.forEach(lm => {
            const layerId = `${lm.id}-glow`;
            const casingId = `${lm.id}-casing`;
            try {
                if (!map.getLayer(layerId))
                    return;
                const isActive = hintStage >= lm.activeAtStage;
                const isNewest = hintStage === lm.activeAtStage; // just unlocked this stage
                if (!isActive) {
                    // Hidden — keep opacity 0
                    map.setPaintProperty(layerId, 'fill-extrusion-opacity', 0);
                    if (map.getLayer(casingId))
                        map.setPaintProperty(casingId, 'fill-extrusion-opacity', 0);
                    return;
                }
                // Pulse: sinusoidal breathing between 0.75 and 1.0 opacity
                const pulse = 0.80 + Math.sin(time * (isNewest ? 3.5 : 2.0)) * 0.15;
                map.setPaintProperty(layerId, 'fill-extrusion-opacity', pulse);
                // Outer casing pulse (slightly out of phase)
                if (map.getLayer(casingId)) {
                    const casingPulse = 0.25 + Math.sin(time * (isNewest ? 3.5 : 2.0) + 0.8) * 0.15;
                    map.setPaintProperty(casingId, 'fill-extrusion-opacity', casingPulse);
                }
            }
            catch (_) {
                // layer not yet added
            }
        });
        animIdRef.current = requestAnimationFrame(animateLandmarks);
    }, [hintStage]);
    // ── Trigger "Mission Update" flash + camera fly on stage advance ──────────
    useEffect(() => {
        const prev = prevStageRef.current;
        const map = mapRef.current;
        if (hintStage > prev && hintStage >= 1) {
            const activated = LANDMARKS.find(lm => lm.activeAtStage === hintStage);
            // Show mission update banner
            setIsTransitioning(true);
            setMissionUpdate(activated ? activated.label : 'SIGNAL ACQUIRED');
            const t1 = setTimeout(() => setMissionUpdate(null), 3500);
            const t2 = setTimeout(() => setIsTransitioning(false), 1200);
            // Fly camera to the newly activated building
            if (map && activated) {
                setTimeout(() => {
                    try {
                        map.flyTo({
                            center: activated.flyTo.center,
                            zoom: activated.flyTo.zoom,
                            pitch: activated.flyTo.pitch,
                            bearing: activated.flyTo.bearing,
                            duration: 2200,
                            essential: true,
                        });
                    }
                    catch (_) { }
                }, 400);
            }
            return () => { clearTimeout(t1); clearTimeout(t2); };
        }
        prevStageRef.current = hintStage;
        return undefined;
    }, [hintStage]);
    // ── Initialize map ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (hintStage === 0 || !mapContainerRef.current)
            return;
        if (mapRef.current)
            return; // already initialized
        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: 'https://tiles.openfreemap.org/styles/dark',
            center: [-74.006, 40.7128],
            zoom: 13.5,
            pitch: 55,
            bearing: -17.6,
        });
        mapRef.current = map;
        map.addControl(new maplibregl.NavigationControl(), 'top-right');
        map.on('load', () => {
            // ── 1. Add OpenFreeMap planet source ─────────────────────────────────
            if (!map.getSource('openfreemap')) {
                map.addSource('openfreemap', {
                    type: 'vector',
                    url: 'https://tiles.openfreemap.org/planet',
                });
            }
            // ── 2. Remove default building/road/label layers ──────────────────────
            const styleLayers = map.getStyle().layers ?? [];
            styleLayers.forEach(layer => {
                const isBuilding = layer.id.includes('building');
                const isRoad = layer.type === 'line' &&
                    (layer['source-layer'] === 'transportation' ||
                        layer.id.includes('road') || layer.id.includes('highway') ||
                        layer.id.includes('path') || layer.id.includes('rail'));
                const isLabel = layer.type === 'symbol';
                const isOurLayer = layer.id.startsWith('glowing-') || layer.id.startsWith('landmark-');
                if (!isOurLayer && (isBuilding || isRoad || isLabel)) {
                    try {
                        map.removeLayer(layer.id);
                    }
                    catch (_) { }
                }
            });
            // ── 3. Base 3D buildings (dark purple/slate cybernetic style) ─────────
            map.addLayer({
                id: '3d-buildings',
                source: 'openfreemap',
                'source-layer': 'building',
                type: 'fill-extrusion',
                minzoom: 13,
                paint: {
                    'fill-extrusion-color': [
                        'interpolate', ['linear'], ['get', 'render_height'],
                        0, '#0f172a',
                        50, '#1e1b4b',
                        100, '#2e1065',
                        150, '#3b0764',
                        200, '#4c1d95',
                    ],
                    'fill-extrusion-height': [
                        'interpolate', ['linear'], ['zoom'],
                        14, 0,
                        14.5, ['*', ['get', 'render_height'], 2.5],
                    ],
                    'fill-extrusion-base': [
                        'interpolate', ['linear'], ['zoom'],
                        14, 0,
                        14.5, ['*', ['get', 'render_min_height'], 2.5],
                    ],
                    'fill-extrusion-opacity': 1.0,
                },
            });
            // ── 4. Glowing roads ──────────────────────────────────────────────────
            map.addLayer({
                id: 'glowing-roads-casing',
                source: 'openfreemap',
                'source-layer': 'transportation',
                type: 'line',
                filter: [
                    'in', ['get', 'name'],
                    ['literal', ['Broadway', 'Canal Street', 'Chambers Street', 'Wall Street', 'Grand Street', 'Lafayette Street', 'Centre Street']],
                ],
                paint: {
                    'line-color': '#ff003b',
                    'line-width': 10,
                    'line-blur': 6,
                    'line-opacity': 0.8,
                },
            });
            map.addLayer({
                id: 'glowing-roads-overlay',
                source: 'openfreemap',
                'source-layer': 'transportation',
                type: 'line',
                filter: [
                    'in', ['get', 'name'],
                    ['literal', ['Broadway', 'Canal Street', 'Chambers Street', 'Wall Street', 'Grand Street', 'Lafayette Street', 'Centre Street']],
                ],
                paint: {
                    'line-color': '#ffffff',
                    'line-width': 3,
                    'line-opacity': 0.95,
                },
            });
            // ── 5. Landmark GeoJSON sources + layers ──────────────────────────────
            LANDMARKS.forEach(lm => {
                // GeoJSON source for this landmark's footprint
                map.addSource(lm.id, {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        properties: { name: lm.label },
                        geometry: {
                            type: 'Polygon',
                            coordinates: [lm.coords],
                        },
                    },
                });
                // Subtle outer glow casing
                map.addLayer({
                    id: `${lm.id}-casing`,
                    source: lm.id,
                    type: 'fill-extrusion',
                    paint: {
                        'fill-extrusion-color': '#34d399', // emerald accent
                        'fill-extrusion-height': lm.height * 2.52,
                        'fill-extrusion-base': lm.base,
                        'fill-extrusion-opacity': 0, // starts hidden
                        'fill-extrusion-vertical-gradient': true,
                    },
                });
                // Core landmark green building
                map.addLayer({
                    id: `${lm.id}-glow`,
                    source: lm.id,
                    type: 'fill-extrusion',
                    paint: {
                        'fill-extrusion-color': '#10b981', // emerald-500
                        'fill-extrusion-height': lm.height * 2.5,
                        'fill-extrusion-base': lm.base,
                        'fill-extrusion-opacity': 0, // starts hidden
                        'fill-extrusion-vertical-gradient': true,
                    },
                });
            });
            // ── 6. Road animation loop ─────────────────────────────────────────────
            let roadAnimId;
            const animateRoads = () => {
                const t = Date.now() / 1000;
                const opacity = 0.35 + Math.abs(Math.sin(t * 2.5)) * 0.6;
                try {
                    map.setPaintProperty('glowing-roads-casing', 'line-opacity', opacity * 0.8);
                    map.setPaintProperty('glowing-roads-overlay', 'line-opacity', opacity * 0.95);
                }
                catch (_) { }
                roadAnimId = requestAnimationFrame(animateRoads);
            };
            animateRoads();
            // Store road anim ID so cleanup can cancel it
            map._roadAnimId = roadAnimId;
            // Start landmark animation loop
            animIdRef.current = requestAnimationFrame(animateLandmarks);
        });
        return () => {
            cancelAnimationFrame(animIdRef.current);
            if (map._roadAnimId)
                cancelAnimationFrame(map._roadAnimId);
            map.remove();
            mapRef.current = null;
        };
        // We intentionally only init once — stage changes are handled separately
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hintStage === 0 ? 0 : 1]);
    // ── Restart landmark animation loop when hintStage changes (map already up) ─
    useEffect(() => {
        const map = mapRef.current;
        if (!map)
            return;
        cancelAnimationFrame(animIdRef.current);
        // Wait a tick for map to be ready
        const tick = () => {
            if (map.isStyleLoaded()) {
                animIdRef.current = requestAnimationFrame(animateLandmarks);
            }
            else {
                setTimeout(tick, 100);
            }
        };
        tick();
        return () => cancelAnimationFrame(animIdRef.current);
    }, [animateLandmarks, hintStage]);
    // ── UI helpers ─────────────────────────────────────────────────────────────
    const stageInfo = STAGE_INFO[Math.min(hintStage, 3)];
    const progressPct = (Math.min(hintStage, 3) / 3) * 100;
    const getHudTitle = () => {
        if (hintStage === 1)
            return '🟢 STAGE 1 — EMPIRE STATE LOCKED';
        if (hintStage === 2)
            return '🟢 STAGE 2 — ONE WORLD TRADE LOCKED';
        if (hintStage >= 3)
            return '⚡ STAGE 3 — ALL ANCHORS SECURED';
        return 'NYC 3D ANOMALY SENSOR GRID';
    };
    const getHudDescription = () => {
        if (hintStage === 1) {
            return 'Empire State Building is glowing emerald. The first dimensional anchor is secured at 34th St & 5th Ave.';
        }
        if (hintStage === 2) {
            return 'One World Trade Center lit. Two anchors confirmed. The convergence point is narrowing — Downtown Manhattan.';
        }
        if (hintStage >= 3) {
            return 'Chrysler Building locked. All three NYC landmarks are synchronized. The Final Mission coordinates are now decrypted.';
        }
        return 'Calibrating dimensional anchors. Solve 3 problems to establish the first sync point.';
    };
    return (_jsxs("div", { className: "w-full h-full relative bg-[#05050d]", id: "hints-page-root", children: [showFinalMission && (_jsx(FinalMissionScreen, { onClose: () => setShowFinalMission(false) })), _jsx("div", { ref: mapContainerRef, className: "absolute inset-0 w-full h-full", id: "map-libre-container" }), hintStage === 0 && (_jsx("div", { className: "absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/92 backdrop-blur-md p-6 text-center select-none", children: _jsxs("div", { className: "bg-[#1a0f2b] border-4 border-purple-600 p-8 max-w-md text-white", style: { boxShadow: '8px 8px 0px 0px rgba(147,51,234,1)' }, children: [_jsx("div", { className: "text-5xl mb-4", children: "\uD83D\uDD12" }), _jsx("h3", { className: "text-3xl font-black text-purple-400 mb-4 tracking-widest font-mono uppercase", children: "SENSOR GRID OFFLINE" }), _jsxs("p", { className: "text-sm text-zinc-300 leading-relaxed mb-6 font-sans", children: ["The NYC Anomaly Sensor Grid is locked. Solve ", _jsx("strong", { className: "text-purple-300", children: "3 problems" }), " to establish the first sync and illuminate the Empire State Building."] }), _jsx("div", { className: "flex flex-col gap-3 text-left", children: LANDMARKS.map(lm => (_jsxs("div", { className: "flex items-center gap-3 text-xs font-mono text-zinc-500", children: [_jsx("span", { className: "text-zinc-700", children: "\u2B1C" }), _jsx("span", { className: "uppercase tracking-widest", children: lm.label }), _jsxs("span", { className: "ml-auto text-zinc-600", children: ["Stage ", lm.activeAtStage] })] }, lm.id))) }), _jsx("div", { className: "mt-6 inline-block px-4 py-2 border-2 border-dashed border-purple-500 text-purple-400 font-mono text-xs uppercase tracking-widest animate-pulse", children: "Solve 3 problems to unlock" })] }) })), missionUpdate && (_jsx("div", { className: "absolute inset-x-0 top-0 z-30 flex items-center justify-center pointer-events-none", style: {
                    animation: 'missionFlash 3.5s ease forwards',
                }, children: _jsxs("div", { style: {
                        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #064e3b 100%)',
                        border: '3px solid #10b981',
                        boxShadow: '0 0 40px rgba(16,185,129,0.6), 0 0 80px rgba(16,185,129,0.25)',
                        padding: '1rem 2.5rem',
                        fontFamily: 'monospace',
                    }, children: [_jsx("div", { className: "text-emerald-400 text-[10px] tracking-[0.4em] uppercase mb-1 text-center", children: "\u25B6 MISSION UPDATE" }), _jsx("div", { className: "text-white font-black text-xl tracking-widest uppercase text-center", children: missionUpdate }), _jsx("div", { className: "text-emerald-300 text-[10px] tracking-widest uppercase mt-1 text-center", children: "DIMENSIONAL ANCHOR SECURED" })] }) })), isTransitioning && (_jsx("div", { className: "absolute inset-0 z-25 pointer-events-none", style: {
                    background: 'radial-gradient(ellipse at center, transparent 60%, rgba(16,185,129,0.18) 100%)',
                    animation: 'transitionFlash 1.2s ease forwards',
                } })), hintStage > 0 && (_jsxs("div", { className: "absolute top-6 left-6 z-10 p-4 max-w-xs text-white pointer-events-none", style: {
                    background: 'rgba(5,5,13,0.88)',
                    border: '3px solid #000',
                    boxShadow: '4px 4px 0px #000',
                }, children: [_jsx("div", { className: "inline-block px-2.5 py-0.5 text-sm font-bold mb-3 -rotate-1 select-none", style: {
                            background: hintStage >= 3 ? '#10b981' : '#facc15',
                            color: '#000',
                            border: '2px solid #000',
                            boxShadow: '2px 2px 0px #000',
                            fontFamily: 'monospace',
                        }, children: getHudTitle() }), _jsx("h2", { className: "font-mono text-base text-emerald-400 mb-2 leading-tight tracking-wider uppercase", children: hintStage >= 3 ? 'ALL ANCHORS LOCKED' : 'NYC LANDMARK SYNC' }), _jsx("p", { className: "font-sans text-xs text-zinc-300 leading-relaxed mb-4", children: getHudDescription() }), _jsx("div", { className: "flex flex-col gap-1.5 mb-4", children: LANDMARKS.map(lm => {
                            const active = hintStage >= lm.activeAtStage;
                            return (_jsxs("div", { className: "flex items-center gap-2 text-[10px] font-mono", children: [_jsx("span", { style: {
                                            display: 'inline-block',
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            background: active ? '#10b981' : '#3f3f46',
                                            boxShadow: active ? '0 0 6px #10b981' : 'none',
                                            flexShrink: 0,
                                        } }), _jsx("span", { className: active ? 'text-emerald-400 font-bold' : 'text-zinc-600', children: lm.label }), active && _jsx("span", { className: "ml-auto text-emerald-600 text-[8px]", children: "LOCKED" })] }, lm.id));
                        }) }), _jsxs("div", { className: "mb-1", children: [_jsxs("div", { className: "flex justify-between text-[9px] font-mono text-zinc-500 mb-1", children: [_jsx("span", { className: "uppercase tracking-widest", children: "Anchor Progress" }), _jsx("span", { className: stageInfo.color, children: stageInfo.fraction })] }), _jsx("div", { className: "w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full rounded-full transition-all duration-1000", style: {
                                        width: `${progressPct}%`,
                                        background: 'linear-gradient(90deg, #059669, #10b981, #34d399)',
                                        boxShadow: '0 0 8px rgba(16,185,129,0.7)',
                                    } }) })] }), hintStage >= 3 && (_jsx("button", { onClick: () => setShowFinalMission(true), className: "pointer-events-auto w-full mt-3 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all", style: {
                            background: '#064e3b',
                            border: '2px solid #10b981',
                            color: '#6ee7b7',
                            boxShadow: '2px 2px 0px #000',
                            fontFamily: 'monospace',
                        }, onMouseEnter: e => (e.currentTarget.style.background = '#065f46'), onMouseLeave: e => (e.currentTarget.style.background = '#064e3b'), id: "reopen-final-mission-btn", children: "\uD83D\uDCC4 VIEW FINAL DOSSIER \u2192" }))] })), _jsx("style", { children: `
        @keyframes missionFlash {
          0%   { opacity: 0; transform: translateY(-100%); }
          10%  { opacity: 1; transform: translateY(0); }
          75%  { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-30px); }
        }
        @keyframes transitionFlash {
          0%   { opacity: 0; }
          20%  { opacity: 1; }
          100% { opacity: 0; }
        }
      ` })] }));
}
//# sourceMappingURL=HintsPage.js.map