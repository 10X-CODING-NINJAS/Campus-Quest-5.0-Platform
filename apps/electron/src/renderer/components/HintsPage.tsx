/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import { Lock } from 'lucide-react';

interface HintsPageProps {
  solvedCount: number;
}

const RIDDLE_FRAGMENTS = [
  "Fragment 1: Where the first spider bit the hand of fate...",
  "Fragment 2: ...beneath the shadow of the gargoyle's gate...",
  "Fragment 3: ...look for the web spun in red and blue...",
  "Fragment 4: ...and find the USB drive waiting for you!"
];

export default function HintsPage({ solvedCount }: HintsPageProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const isMapUnlocked = solvedCount >= 6;

  useEffect(() => {
    if (!isMapUnlocked || !mapContainerRef.current) return;

    // Initialize MapLibre GL map
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://tiles.openfreemap.org/styles/dark',
      center: [-74.006, 40.7128], // NYC (Manhattan)
      zoom: 16,
      pitch: 60,
      bearing: -17.6
    });

    mapRef.current = map;

    // Add navigation controls
    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', () => {
      // Add OpenFreeMap planet source if not present
      if (!map.getSource('openfreemap')) {
        map.addSource('openfreemap', {
          type: 'vector',
          url: 'https://tiles.openfreemap.org/planet'
        });
      }

      // Remove any existing layers from basemap
      const styleLayers = map.getStyle().layers;
      if (styleLayers) {
        styleLayers.forEach(layer => {
          const isBuilding = layer.id.includes('building');
          const isRoad = layer.type === 'line' && 
            ((layer as any)['source-layer'] === 'transportation' || 
             layer.id.includes('road') || 
             layer.id.includes('highway') || 
             layer.id.includes('path') || 
             layer.id.includes('rail'));
          const isLabel = layer.type === 'symbol';

          if ((isBuilding || isRoad || isLabel) && layer.id !== 'glowing-roads-casing' && layer.id !== 'glowing-roads-overlay') {
            try {
              map.removeLayer(layer.id);
            } catch (e) {}
          }
        });
      }

      // Add 3D building extrusions layer
      map.addLayer({
        id: '3d-buildings',
        source: 'openfreemap',
        'source-layer': 'building',
        type: 'fill-extrusion',
        minzoom: 15,
        paint: {
          'fill-extrusion-color': [
            'interpolate',
            ['linear'],
            ['get', 'render_height'],
            0, '#1e1b4b',
            50, '#311042',
            100, '#6b21a8',
            150, '#b91c1c',
            200, '#ef4444'
          ],
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            0,
            15.05,
            ['*', ['get', 'render_height'], 2.5]
          ],
          'fill-extrusion-base': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            0,
            15.05,
            ['*', ['get', 'render_min_height'], 2.5]
          ],
          'fill-extrusion-opacity': 1.0
        }
      });

      // Add glowing roads casing
      map.addLayer({
        id: 'glowing-roads-casing',
        source: 'openfreemap',
        'source-layer': 'transportation',
        type: 'line',
        filter: [
          'in',
          ['get', 'name'],
          ['literal', ['Broadway', 'Canal Street', 'Chambers Street', 'Wall Street', 'Grand Street', 'Lafayette Street', 'Centre Street']]
        ],
        paint: {
          'line-color': '#ff003b',
          'line-width': 10,
          'line-blur': 6,
          'line-opacity': 0.8
        }
      });

      // Add glowing roads overlay
      map.addLayer({
        id: 'glowing-roads-overlay',
        source: 'openfreemap',
        'source-layer': 'transportation',
        type: 'line',
        filter: [
          'in',
          ['get', 'name'],
          ['literal', ['Broadway', 'Canal Street', 'Chambers Street', 'Wall Street', 'Grand Street', 'Lafayette Street', 'Centre Street']]
        ],
        paint: {
          'line-color': '#ffffff',
          'line-width': 3,
          'line-opacity': 0.95
        }
      });

      // Add custom pulsed target building marker (Oscorp Reactor)
      const el = document.createElement('div');
      el.className = 'custom-spider-marker';
      el.style.width = '32px';
      el.style.height = '32px';
      el.innerHTML = `
        <div style="position: absolute; width: 32px; height: 32px; background-color: rgba(239, 68, 68, 0.4); border: 2px solid #ef4444; border-radius: 50%; animation: ping 1.5s infinite;"></div>
        <div style="position: relative; width: 32px; height: 32px; background-color: #ef4444; border: 3px solid #000; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">🕷️</div>
      `;
      new maplibregl.Marker({ element: el })
        .setLngLat([-74.006, 40.7128])
        .addTo(map);

      // Animate road opacity to create pulsating red glow
      const animateRoads = () => {
        const time = Date.now() / 1000;
        const opacity = 0.35 + Math.abs(Math.sin(time * 2.5)) * 0.6;
        try {
          map.setPaintProperty('glowing-roads-casing', 'line-opacity', opacity * 0.8);
          map.setPaintProperty('glowing-roads-overlay', 'line-opacity', opacity * 0.95);
        } catch (e) {}
        animId = requestAnimationFrame(animateRoads);
      };
      animateRoads();
    });

    let animId: number;

    return () => {
      if (animId) {
        cancelAnimationFrame(animId);
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isMapUnlocked]);

  if (!isMapUnlocked) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#070714] text-white p-6 relative">
        <div className="absolute inset-0 comic-halftone opacity-10 pointer-events-none" />
        
        {/* Explosion Starburst Shape */}
        <div className="relative w-48 h-48 flex items-center justify-center mb-6">
          <svg className="absolute w-64 h-64 text-zinc-900 drop-shadow-[6px_6px_0_rgba(0,0,0,1)]" viewBox="0 0 100 100">
            <polygon points="50,0 60,35 95,20 70,50 100,70 65,70 75,100 50,80 25,100 35,70 0,70 30,50 5,20 40,35" fill="currentColor" stroke="#ff3d71" strokeWidth="2.5" />
          </svg>
          <div className="relative z-10 flex flex-col items-center justify-center">
            <Lock className="w-16 h-16 text-[#ff3d71] filter drop-shadow-[0_4px_8px_rgba(255,61,113,0.4)] animate-pulse" />
          </div>
        </div>

        <div className="max-w-xl text-center bg-black/80 border-4 border-[#ff3d71] p-8 rounded-none shadow-[10px_10px_0px_#000] z-10 relative">
          <h2 className="font-comic text-4xl text-[#ff3d71] mb-4 tracking-wider uppercase stroke-black italic">
            MISSION MAP LOCKED
          </h2>
          <p className="font-mono text-sm text-zinc-300 leading-relaxed mb-6">
            TRANS-DIMENSIONAL MAP INTERFACE IS OFFLINE.<br />
            SOLVE AT LEAST <span className="text-yellow-400 font-bold">6 QUESTIONS</span> TO RECOVER ALL LONGITUDE FRAGMENTS AND OVERRIDE THE SECURITY DECRYPTION GRID.
          </p>
          <div className="w-full bg-zinc-900 h-6 border-3 border-black overflow-hidden relative shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            <div 
              className="h-full bg-gradient-to-r from-red-600 to-[#ff3d71] transition-all duration-500 ease-out" 
              style={{ width: `${(solvedCount / 6) * 100}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-black text-white">
              DECRYPTION POWER: {solvedCount} / 6 MODULES
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Map is unlocked! Render map and decryptions
  return (
    <div className="w-full h-full relative bg-[#05050d]" id="hints-page-root">
      {/* Mapbox container filling the viewport */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" id="map-libre-container" />

      {/* HUD Info Card overlay */}
      <div className="absolute top-6 left-6 z-10 bg-black/85 border-4 border-black p-5 max-w-sm shadow-[6px_6px_0px_#000] text-white comic-halftone">
        <div className="bg-yellow-400 text-black border-2 border-black font-comic text-xs px-2.5 py-0.5 transform -rotate-1 shadow-[2px_2px_0px_#000] inline-block mb-3 font-bold select-none">
          NYC 3D ANOMALY SENSOR GRID
        </div>
        <h2 className="font-comic text-2xl text-red-500 mb-1 leading-tight tracking-wider uppercase">
          OSCORP REACTOR UNLOCKED
        </h2>
        <div className="font-mono text-[10px] text-zinc-400 mb-2 space-y-0.5">
          <div>LATITUDE: <span className="text-emerald-400 font-bold">40.7128° N</span></div>
          <div>LONGITUDE: <span className="text-emerald-400 font-bold">74.0060° W</span></div>
          <div>TARGET: <span className="text-yellow-400 font-bold">OSCORP MANHATTAN REACTOR</span></div>
        </div>
        <p className="font-sans text-xs text-zinc-300 leading-relaxed">
          The collider coordinates are locked! Drag to pan, use right-click/Ctrl to rotate the 3D grid. The final target building has been located and highlighted on the map.
        </p>
      </div>

      {/* Decrypted Riddles Card overlay (Right Side) */}
      <div className="absolute top-6 right-6 z-10 bg-black/85 border-4 border-black p-5 w-80 shadow-[6px_6px_0px_#000] text-white comic-halftone">
        <div className="bg-sky-500 text-white border-2 border-black font-comic text-xs px-2.5 py-0.5 transform rotate-1 shadow-[2px_2px_0px_#000] inline-block mb-3 font-bold select-none">
          DECRYPTED RIDDLES
        </div>
        <div className="space-y-4">
          {solvedCount < 7 ? (
            <div className="text-zinc-500 font-mono text-[11px] italic py-4 text-center border border-dashed border-zinc-800">
              🔒 Solve Question 7 to begin decrypting the final CTF riddle.
            </div>
          ) : (
            <div className="space-y-3">
              {RIDDLE_FRAGMENTS.map((frag, idx) => {
                const isUnlocked = solvedCount >= (7 + idx);
                return (
                  <div 
                    key={idx} 
                    className={`p-2 border-2 transition-all ${
                      isUnlocked 
                        ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300' 
                        : 'border-zinc-800 bg-zinc-950/40 text-zinc-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${isUnlocked ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-700'}`} />
                      <span className="font-mono text-[9px] font-bold uppercase tracking-wider">
                        {isUnlocked ? 'DECRYPTED ✓' : `LOCKED (Q${7 + idx})`}
                      </span>
                    </div>
                    <p className={`font-comic text-[11px] leading-relaxed ${isUnlocked ? '' : 'blur-[1.5px] select-none'}`}>
                      {frag}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {solvedCount >= 10 && (
            <div className="bg-red-950/40 border-2 border-red-500/50 p-3 text-center rounded-none shadow-[2px_2px_0px_rgba(239,68,68,0.2)] animate-pulse">
              <div className="font-display font-black text-xs text-red-500 tracking-wider mb-1">FINAL OVERRIDE COMPLETED!</div>
              <p className="font-sans text-[10px] text-zinc-300 leading-snug">
                Proceed to the physical location to retrieve the flag!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
