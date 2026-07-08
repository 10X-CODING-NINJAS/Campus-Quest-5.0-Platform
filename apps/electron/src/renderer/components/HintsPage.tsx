/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function HintsPage() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

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

      // Find the first label layer ID to insert 3D buildings beneath it
      const layers = map.getStyle().layers;
      let labelLayerId = '';
      if (layers) {
        for (let i = 0; i < layers.length; i++) {
          if (layers[i].type === 'symbol' && layers[i].layout && (layers[i].layout as any)['text-field']) {
            labelLayerId = layers[i].id;
            break;
          }
        }
      }

      // Add 3D building extrusions layer
      map.addLayer(
        {
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
              ['get', 'render_height']
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'render_min_height']
            ],
            'fill-extrusion-opacity': 0.85
          }
        },
        labelLayerId
      );
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-full relative flex flex-col bg-[#05050d]">
      {/* HUD Info Card overlay */}
      <div className="absolute top-6 left-6 z-10 bg-black/80 border-4 border-black p-4 max-w-sm shadow-[4px_4px_0px_#000] text-white comic-halftone">
        <div className="bg-yellow-400 text-black border-2 border-black font-comic text-sm px-2.5 py-0.5 transform -rotate-1 shadow-[2px_2px_0px_#000] inline-block mb-3 select-none">
          NYC 3D ANOMALY SENSOR GRID
        </div>
        <h2 className="font-comic text-xl text-red-500 mb-1 leading-tight tracking-wider uppercase">
          NYC Web Extrusions
        </h2>
        <p className="font-sans text-xs text-zinc-300 leading-relaxed">
          Calibrating dimensional anchors across Manhattan. Standard Earth-1610 buildings heights mapped to extrusions. Drag to pan, use right-click/Ctrl to rotate pitch.
        </p>
      </div>

      {/* Mapbox container filling the viewport */}
      <div ref={mapContainerRef} className="flex-1 w-full h-full" id="map-libre-container" />
    </div>
  );
}
