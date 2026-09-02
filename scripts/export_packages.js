/**
 * Adam Platform - Autonomous Package & Repository Exporter
 * Generates 3 standalone, decoupled projects ready for GitHub:
 *  1. adam-passenger-app (Independent Android/iOS/Web app for Passengers)
 *  2. adam-driver-app (Independent Android/iOS/Web app for Captains)
 *  3. adam-admin-portal (Cloud Web Portal + Shared REST/WebSocket Backend API)
 */

import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const exportBaseDir = path.join(rootDir, 'exported-packages');

console.log('🚀 Starting Adam Platform 3-Package GitHub Separation...');

// Ensure export directories
if (!fs.existsSync(exportBaseDir)) {
  fs.mkdirSync(exportBaseDir, { recursive: true });
}

const packages = [
  {
    id: 'passenger',
    name: 'adam-passenger-app',
    title: 'تطبيق آدم الراكب (Adam Passenger App)',
    description: 'Standalone Passenger Mobile Application for Google Play and App Store with direct REST & Real-Time API integration.',
    htmlEntry: 'passenger.html',
    mainEntry: 'src/mainPassenger.tsx',
    capConfig: 'capacitor.config.passenger.json',
    appId: 'com.adamride.passenger',
    appName: 'Adam Passenger',
    themeColor: '#020617',
    iconColor: '#f43f5e',
  },
  {
    id: 'driver',
    name: 'adam-driver-app',
    title: 'تطبيق آدم الكابتن (Adam Captain App)',
    description: 'Standalone Driver & Captain Application for Google Play and App Store with GPS tracking, wallet ledger, and smart dispatcher.',
    htmlEntry: 'driver.html',
    mainEntry: 'src/mainDriver.tsx',
    capConfig: 'capacitor.config.driver.json',
    appId: 'com.adamride.driver',
    appName: 'Adam Captain',
    themeColor: '#020617',
    iconColor: '#10b981',
  },
  {
    id: 'admin',
    name: 'adam-admin-backend-portal',
    title: 'لوحة تحكم وعمليات آدم المركزية + السيرفر السحابي (Adam Admin Portal & Cloud Backend)',
    description: 'Central Cloud Run & Node.js Express server, Real-Time WebSockets, RBAC Admin CRM, and AI Dispatcher API.',
    htmlEntry: 'admin.html',
    mainEntry: 'src/mainAdmin.tsx',
    isBackendAndAdmin: true,
  }
];

// Helper recursive copy
function copyDirSync(src, dest, ignoreList = []) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (ignoreList.some(ig => entry.name.includes(ig))) {
      continue;
    }

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath, ignoreList);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Generate for each package
for (const pkg of packages) {
  const pkgDir = path.join(exportBaseDir, pkg.name);
  console.log(`📦 Packaging ${pkg.name}...`);

  if (fs.existsSync(pkgDir)) {
    fs.rmSync(pkgDir, { recursive: true, force: true });
  }
  fs.mkdirSync(pkgDir, { recursive: true });

  // 1. Copy src code
  copyDirSync(path.join(rootDir, 'src'), path.join(pkgDir, 'src'), ['node_modules', '.git', 'dist']);

  // 2. Copy public directory
  if (fs.existsSync(path.join(rootDir, 'public'))) {
    copyDirSync(path.join(rootDir, 'public'), path.join(pkgDir, 'public'));
  }

  // 3. Create index.html configured specifically for this standalone package
  const sourceHtml = fs.readFileSync(path.join(rootDir, pkg.htmlEntry), 'utf-8');
  fs.writeFileSync(path.join(pkgDir, 'index.html'), sourceHtml);

  // 4. Create specialized vite.config.ts
  const viteConfigContent = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
  },
});
`;
  fs.writeFileSync(path.join(pkgDir, 'vite.config.ts'), viteConfigContent);

  // 5. Create tsconfig.json
  const tsconfigContent = fs.readFileSync(path.join(rootDir, 'tsconfig.json'), 'utf-8');
  fs.writeFileSync(path.join(pkgDir, 'tsconfig.json'), tsconfigContent);

  // 6. Create custom package.json
  const basePkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
  const customPkg = {
    name: pkg.name,
    version: "1.0.0",
    private: true,
    description: pkg.description,
    type: "module",
    scripts: pkg.isBackendAndAdmin ? {
      "dev": "tsx server.ts",
      "build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs",
      "start": "node scripts/start-production.cjs",
      "postinstall": "npm run build || true",
      "lint": "tsc --noEmit"
    } : {
      "dev": "vite",
      "build": "vite build",
      "preview": "vite preview",
      "lint": "tsc --noEmit",
      "cap:sync": "npx cap sync",
      "cap:android": "npx cap open android",
      "cap:ios": "npx cap open ios"
    },
    dependencies: basePkg.dependencies,
    devDependencies: basePkg.devDependencies
  };

  fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify(customPkg, null, 2));

  // 7. Copy backend server if it's admin & backend
  if (pkg.isBackendAndAdmin) {
    fs.copyFileSync(path.join(rootDir, 'server.ts'), path.join(pkgDir, 'server.ts'));
    if (fs.existsSync(path.join(rootDir, 'firebase.ts'))) {
      fs.copyFileSync(path.join(rootDir, 'firebase.ts'), path.join(pkgDir, 'firebase.ts'));
    }
    if (fs.existsSync(path.join(rootDir, 'render.yaml'))) {
      fs.copyFileSync(path.join(rootDir, 'render.yaml'), path.join(pkgDir, 'render.yaml'));
    }
    const pkgScriptsDir = path.join(pkgDir, 'scripts');
    if (!fs.existsSync(pkgScriptsDir)) {
      fs.mkdirSync(pkgScriptsDir, { recursive: true });
    }
    if (fs.existsSync(path.join(rootDir, 'scripts', 'start-production.cjs'))) {
      fs.copyFileSync(path.join(rootDir, 'scripts', 'start-production.cjs'), path.join(pkgScriptsDir, 'start-production.cjs'));
    }
    if (fs.existsSync(path.join(rootDir, 'scripts', 'ensure-integrity.cjs'))) {
      fs.copyFileSync(path.join(rootDir, 'scripts', 'ensure-integrity.cjs'), path.join(pkgScriptsDir, 'ensure-integrity.cjs'));
    }
  }

  // 8. Copy Capacitor configuration for mobile packages
  if (pkg.capConfig && fs.existsSync(path.join(rootDir, pkg.capConfig))) {
    const capContent = fs.readFileSync(path.join(rootDir, pkg.capConfig), 'utf-8');
    fs.writeFileSync(path.join(pkgDir, 'capacitor.config.json'), capContent);
  }

  // 9. Generate GitHub README for the standalone package
  const readmeContent = `# ${pkg.title}
> ${pkg.description}

## 🚀 التشغيل المباشر (Quick Start)
\`\`\`bash
# تثبيت التبعيات
npm install

# التشغيل في وضع التطوير المحلي
npm run dev

# بناء حزمة الإنتاج
npm run build
\`\`\`

${!pkg.isBackendAndAdmin ? `
## 📱 تحويل ونشر التطبيق على Google Play و App Store
\`\`\`bash
# مزامنة ملفات الويب مع بيئة الأندرويد والآيفون
npm run build
npx cap sync

# فتح المشروع في Android Studio لتوليد حزمة AAB
npx cap open android

# فتح المشروع في Xcode لتوليد حزمة IPA
npx cap open ios
\`\`\`
` : ''}

## 🔗 الربط والتزامن مع السيرفر والـ API
يتصل التطبيق مباشرة بنقاط النهاية المركزية وقنوات الـ Real-Time WebSocket عبر الباكيند الموحد:
- \`/api/v1/app-state\`: مزامنة البيانات وحالة النظام.
- \`/ws/realtime\`: البث المباشر للإحداثيات وتتبع المركبات والرحلات التشاركية.
`;

  fs.writeFileSync(path.join(pkgDir, 'README.md'), readmeContent);
  fs.writeFileSync(path.join(pkgDir, '.gitignore'), `node_modules\ndist\n.env\n*.apk\n*.aab\n*.ipa\n`);
}

console.log('✅ 3 Standalone GitHub Packages successfully exported into ./exported-packages/');
