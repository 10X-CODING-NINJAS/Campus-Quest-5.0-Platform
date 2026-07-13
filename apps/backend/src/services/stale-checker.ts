import fs from 'fs';
import path from 'path';

function scanDirForExtensions(dir: string, extensions: string[], found: string[]) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== 'dist-electron' && file !== 'release') {
        scanDirForExtensions(fullPath, extensions, found);
      }
    } else {
      const ext = path.extname(file);
      if (extensions.includes(ext)) {
        found.push(fullPath);
      }
    }
  }
}

export function checkForStaleArtifacts() {
  const rootDir = path.resolve(process.cwd(), '../..');
  const srcDirs = [
    path.join(rootDir, 'apps/admin/src'),
    path.join(rootDir, 'apps/electron/src/renderer'),
    path.join(rootDir, 'apps/electron/src/main'),
    path.join(rootDir, 'apps/electron/src/preload'),
  ];

  const extensions = ['.js', '.js.map', '.d.ts', '.d.ts.map'];
  const found: string[] = [];

  for (const dir of srcDirs) {
    if (fs.existsSync(dir)) {
      scanDirForExtensions(dir, extensions, found);
    }
  }

  if (found.length > 0) {
    console.warn('\n⚠️  STALE BUILD ARTIFACTS DETECTED IN SOURCE DIRECTORIES:');
    found.forEach(file => {
      console.warn(`   - ${path.relative(rootDir, file)}`);
    });
    console.warn('Please clean these files to prevent Vite from loading stale code! Run "git clean -fdx" or delete them manually.\n');
  }
}
