/**
 * Electron.js Main Entry Script for Adam CRM Desktop Control Center.
 * Packages the React front-end and web dashboard into a standalone desktop application
 * for administrators and operations centers.
 */

const { app, BrowserWindow, Menu, ipcMain, screen, Tray } = require('electron');
const path = require('path');

let mainWindow = null;
let systemTray = null;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  // Create highly optimized browser window with slate color theme matching CRM
  mainWindow = new BrowserWindow({
    width: Math.min(width * 0.9, 1440),
    height: Math.min(height * 0.9, 900),
    backgroundColor: '#060814',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron-preload.js'),
    },
    title: 'لوحة التحكم الموحدة — تاكسي وقوافل آدم الأردن',
    icon: path.join(__dirname, 'assets', 'icon.png') // Fallback icon path
  });

  // Load the production build index.html or local development server
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Prevent flickers when loading
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Setup Elegant Desk Menu in Arabic language matching Adam System UI
  const menuTemplate = [
    {
      label: 'الملف',
      submenu: [
        { label: 'إعادة التحميل', role: 'reload' },
        { label: 'كامل الشاشة', role: 'togglefullscreen' },
        { type: 'separator' },
        { label: 'خروج', click: () => { app.quit(); } }
      ]
    },
    {
      label: 'العمليات والمحاكاة',
      submenu: [
        {
          label: 'تصفير الرحلات الفورية',
          click: () => {
            mainWindow.webContents.send('clear-simulated-rides');
          }
        },
        {
          label: 'تأكيد تراخيص جميع الكباتن المعلقين',
          click: () => {
            mainWindow.webContents.send('approve-all-pending');
          }
        }
      ]
    },
    {
      label: 'مساعدة',
      submenu: [
        {
          label: 'الدعم الفني المباشر لآدم',
          click: async () => {
            const { shell } = require('electron');
            await shell.openExternal('https://adamride.com/support');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

// Ensure single instance lock to prevent multi-windows
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();

    // Create System Tray to allow background operations
    try {
      systemTray = new Tray(path.join(__dirname, 'assets', 'icon.png'));
      systemTray.setToolTip('نظام آدم للمشاوير والتوصيل التشاركي');
      systemTray.on('click', () => {
        if (mainWindow) {
          mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
        }
      });
    } catch (e) {
      console.warn('System tray load bypassed - Icon file asset missing.');
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
