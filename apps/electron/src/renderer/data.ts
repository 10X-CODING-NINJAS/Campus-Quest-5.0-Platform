import { SpiderVariant, DiagnosticItem } from './types';

export const SPIDER_VARIANTS: SpiderVariant[] = [
  { id: 1, name: 'Peter Parker', theme: { progressColor: 'bg-red-500' } },
  { id: 2, name: 'Miles Morales', theme: { progressColor: 'bg-red-600' } },
  { id: 3, name: 'Gwen Stacy', theme: { progressColor: 'bg-pink-500' } },
  { id: 4, name: 'Spider-Man Noir', theme: { progressColor: 'bg-neutral-800' } },
  { id: 5, name: 'Peni Parker', theme: { progressColor: 'bg-red-400' } },
  { id: 6, name: 'Spider-Ham', theme: { progressColor: 'bg-pink-400' } },
  { id: 7, name: 'Miguel O\'Hara', theme: { progressColor: 'bg-blue-600' } },
  { id: 8, name: 'Jessica Drew', theme: { progressColor: 'bg-red-700' } },
  { id: 9, name: 'Spider-Punk', theme: { progressColor: 'bg-red-600' } },
  { id: 10, name: 'Ben Reilly', theme: { progressColor: 'bg-blue-500' } },
];

export const INITIAL_DIAGNOSTICS: Omit<DiagnosticItem, 'status' | 'progress'>[] = [
  { id: 'internet', label: 'Internet Connection', iconName: 'wifi' },
  { id: 'fullscreen', label: 'Fullscreen Calibration', iconName: 'fullscreen' },
  { id: 'browser', label: 'Browser Compatibility', iconName: 'browser' },
  { id: 'camera', label: 'Camera Sensor Feed', iconName: 'camera' },
  { id: 'mic', label: 'Microphone Audio Input', iconName: 'mic' },
  { id: 'cpu', label: 'System Resource Allocation', iconName: 'cpu' },
];
