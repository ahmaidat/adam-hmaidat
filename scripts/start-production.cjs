const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
  const integrityScript = path.join(__dirname, 'ensure-integrity.cjs');
  if (fs.existsSync(integrityScript)) {
    require(integrityScript);
  }
} catch (e) {
  console.warn('Integrity check note:', e.message);
}

const distDir = path.join(__dirname, '..', 'dist');
const serverPath = path.join(distDir, 'server.cjs');

// Auto-build if dist/server.cjs is missing (handles platforms where build command was omitted)
if (!fs.existsSync(serverPath)) {
  console.log('⚡ [Adam Server] dist/server.cjs not found. Executing automatic production build...');
  try {
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }
    execSync('npm run build', { stdio: 'inherit' });
  } catch (err) {
    console.warn('⚠️ [Adam Server] Full build warning, executing direct server bundle...', err.message);
    try {
      execSync('npx esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs', { stdio: 'inherit' });
    } catch (e2) {
      console.error('❌ [Adam Server] Failed to bundle server:', e2.message);
    }
  }
}

console.log('🚀 [Adam Server] Starting production server on port', process.env.PORT || 3000);
require(serverPath);
