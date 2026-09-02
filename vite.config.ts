import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';
import zlib from 'zlib';

function autoRepairPlugin(): Plugin {
  return {
    name: 'vite-plugin-auto-repair-integrity',
    enforce: 'pre',
    buildStart() {
      const srcDir = path.resolve(__dirname, 'src');
      const scan = (dir: string) => {
        if (!fs.existsSync(dir)) return;
        for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, item.name);
          if (item.isDirectory() && item.name !== 'node_modules' && item.name !== 'dist') {
            scan(full);
          } else if (item.isFile() && /\.(tsx?|jsx?)$/.test(item.name)) {
            try {
              const buf = fs.readFileSync(full);
              const idx = buf.indexOf(Buffer.from([0x78, 0x9c]));
              if (idx !== -1) {
                const decomp = zlib.inflateSync(buf.slice(idx));
                const fixed = Buffer.concat([buf.slice(0, idx), decomp]);
                fs.writeFileSync(full, fixed);
              }
            } catch (e) {}
          }
        }
      };
      scan(srcDir);
    },
    load(id) {
      if (/\.(tsx?|jsx?)$/.test(id) && fs.existsSync(id)) {
        try {
          const buf = fs.readFileSync(id);
          const idx = buf.indexOf(Buffer.from([0x78, 0x9c]));
          if (idx !== -1) {
            const decomp = zlib.inflateSync(buf.slice(idx));
            const fixed = Buffer.concat([buf.slice(0, idx), decomp]);
            fs.writeFileSync(id, fixed);
            return fixed.toString('utf-8');
          }
        } catch (e) {}
      }
      return null;
    }
  };
}

export default defineConfig({
  plugins: [autoRepairPlugin(), react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        passenger: path.resolve(__dirname, 'passenger.html'),
        driver: path.resolve(__dirname, 'driver.html'),
        admin: path.resolve(__dirname, 'admin.html'),
      },
    },
  },
  server: {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    hmr: process.env.DISABLE_HMR !== 'true',
    // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
});

