const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  try {
    const data = fs.readFileSync(filePath);
    const zlibIndex = data.indexOf(Buffer.from([0x78, 0x9c]));
    if (zlibIndex !== -1) {
      console.log(`[AutoRepair] Found compressed stream in ${filePath} at offset ${zlibIndex}`);
      const prefix = data.slice(0, zlibIndex);
      const compressed = data.slice(zlibIndex);
      try {
        const decompressed = zlib.inflateSync(compressed);
        const restored = Buffer.concat([prefix, decompressed]);
        fs.writeFileSync(filePath, restored);
        console.log(`[AutoRepair] Successfully restored ${filePath} (${restored.length} bytes)`);
      } catch (err) {
        console.error(`[AutoRepair] Failed to decompress ${filePath}:`, err.message);
      }
    }
  } catch (e) {
    console.error(`[AutoRepair] Error inspecting ${filePath}:`, e.message);
  }
}

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist') {
        scanDir(fullPath);
      }
    } else if (entry.isFile() && /\.(tsx?|jsx?|json|html)$/i.test(entry.name)) {
      fixFile(fullPath);
    }
  }
}

scanDir(path.resolve(__dirname, '..', 'src'));
scanDir(path.resolve(__dirname, '..', 'exported-packages'));
fixFile(path.resolve(__dirname, '..', 'server.ts'));

module.exports = { fixFile, scanDir };
