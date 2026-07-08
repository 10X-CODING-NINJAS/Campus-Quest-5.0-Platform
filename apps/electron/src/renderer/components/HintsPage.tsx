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

      // Remove any existing building, road, and label/symbol layers from the basemap so they are not visible
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
            } catch (e) {
              // Ignored
            }
          }
        });
      }

      // Add 3D building extrusions layer (opaque, solid colors)
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
            'fill-extrusion-opacity': 1.0 // Fully opaque solid buildings
          }
        }
      );

      // Add glowing roads casing layer using vector tiles (follows actual curved street geometries)
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

      // Add glowing roads overlay layer
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

      // Animate road opacity to create pulsating red glow
      const animateRoads = () => {
        const time = Date.now() / 1000;
        const opacity = 0.35 + Math.abs(Math.sin(time * 2.5)) * 0.6;

        try {
          map.setPaintProperty('glowing-roads-casing', 'line-opacity', opacity * 0.8);
          map.setPaintProperty('glowing-roads-overlay', 'line-opacity', opacity * 0.95);
        } catch (e) {
          // Ignored
        }

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
  }, []);

  return (
    <div className="w-full h-full relative bg-[#05050d]" id="hints-page-root">
      {/* Mapbox container filling the viewport */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" id="map-libre-container" />

      {/* HUD Info Card overlay */}
      <div className="absolute top-6 left-6 z-10 bg-black/80 border-4 border-black p-4 max-w-sm shadow-[4px_4px_0px_#000] text-white comic-halftone pointer-events-none">
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
    </div>
  );
}
