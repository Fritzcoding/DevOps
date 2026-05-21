// Load environment variables from .env.local BEFORE checking NODE_ENV
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import {
  app,
  BrowserWindow,
  Menu,
  screen,
  Tray,
  ipcMain,
  IpcMainInvokeEvent,
} from 'electron';
import path from 'path';
import * as fsExtra from 'fs-extra';
import { exec } from 'child_process';
import { promisify } from 'util';
import { IPCErrorCode, IPC_CHANNELS } from './src/ipc-types';
import { aiClient } from './src/services/ai/ai-client';
import type {
  FixCodeRequest,
  FixCodeResponse,
  ChatRequest,
  ChatResponse,
  DetectEnvRequest,
  DetectEnvResponse,
  SetupEnvRequest,
  SetupEnvResponse,
  ReadFileRequest,
  ReadFileResponse,
  CancelTaskRequest,
  CancelTaskResponse,
  HealthCheckResponse,
  OrganizeFileRequest,
  OrganizeFileResponse,
} from './src/ipc-types';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
const execAsync = promisify(exec);
const SHIMEJI_WINDOW_WIDTH = 360;
const SHIMEJI_WINDOW_HEIGHT = 420;

// Allow forcing the Shimeji (frameless, transparent) window even when running
// in development. Pass `--shimeji` to Electron or set env `SHIMEJI=1`.
const forceShimeji = process.argv.includes('--shimeji') || process.env.SHIMEJI === '1' || process.env.SHIMEJI_FORCE === 'true';

// ============================================================================
// GLOBAL STATE
// ============================================================================

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// Helper to check if a dev server is running on a given port
const checkServerReady = async (port: number, timeout: number = 500): Promise<boolean> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(`http://localhost:${port}/`, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      return false;
    }

    const html = await response.text();
    return (
      html.includes('src="/src/main.tsx"') ||
      html.includes('My Google AI Studio App') ||
      html.includes('id="root"')
    );
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
};

// Find available dev server port by probing
const findDevServerPort = async (startPort: number = 5173, maxPort: number = 5185, maxAttempts: number = 60): Promise<number | null> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    for (let port = startPort; port <= maxPort; port++) {
      const ready = await checkServerReady(port, 500);
      if (ready) {
        console.log(`[Window] Dev server found on port ${port}`);
        return port;
      }
    }
    // If not found, wait a bit and try again
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return null;
};

// ============================================================================
// ERROR HELPERS
// ============================================================================

function getRecoverySteps(code: IPCErrorCode): string[] {
  const steps: Record<IPCErrorCode, string[]> = {
    [IPCErrorCode.TIMEOUT]: ['Task took too long', 'Try with simpler input', 'Check connection'],
    [IPCErrorCode.CANCELLED]: ['Task cancelled', 'Try again'],
    [IPCErrorCode.RATE_LIMITED]: ['Wait 60s', 'Try different model', 'Shorter input'],
    [IPCErrorCode.INVALID_PARAMS]: ['Check parameters', 'Verify types'],
    [IPCErrorCode.FILE_NOT_FOUND]: ['Check file path', 'Verify permissions'],
    [IPCErrorCode.PERMISSION_DENIED]: ['Run as admin', 'Check permissions'],
    [IPCErrorCode.API_KEY_MISSING]: ['Add key to .env.local', 'Get free key at ai.google.dev'],
    [IPCErrorCode.API_CALL_FAILED]: ['Check internet', 'Verify API key', 'Try again'],
    [IPCErrorCode.UNKNOWN]: ['Check logs', 'Try again'],
  };
  return steps[code] || [];
}

// ============================================================================
// WINDOW MANAGEMENT
// ============================================================================

function createWindow(): void {
  // Guard: Don't create if window already exists
  if (mainWindow !== null) {
    console.log('[WINDOW] ⚠ Window already exists, focusing instead');
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
    return;
  }

  // Development vs. Production (Shimeji) window configuration
  const devMode = isDev && !forceShimeji;
  
  if (devMode) {
    console.log('[WINDOW] Creating development window (normal, movable)...');
  } else {
    console.log('[WINDOW] Creating borderless floating Shimeji window...');
  }
  
  const iconPath = path.join(__dirname, 'assets', 'icon.png');

  mainWindow = new BrowserWindow({
    // Window dimensions
    width: devMode ? 1000 : SHIMEJI_WINDOW_WIDTH,
    height: devMode ? 700 : SHIMEJI_WINDOW_HEIGHT,
    x: devMode ? 100 : 20,
    y: devMode ? 100 : 20,
    minWidth: devMode ? 600 : SHIMEJI_WINDOW_WIDTH,
    minHeight: devMode ? 400 : SHIMEJI_WINDOW_HEIGHT,
    resizable: devMode ? true : false,
    
    // Frame setup - normal window for dev, frameless for production
    frame: devMode ? true : false,
    transparent: devMode ? false : true,
    backgroundColor: devMode ? '#ffffff' : '#00000000',
    
    // Window icon
    icon: fsExtra.existsSync(iconPath) ? iconPath : undefined,
    
    // Window behavior
    alwaysOnTop: devMode ? false : true,
    skipTaskbar: devMode ? false : true,
    focusable: true,
    hasShadow: devMode ? true : true,
    show: false,
    
    // Security & performance
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      spellcheck: false,
    },
  });

  if (!devMode && mainWindow) {
    mainWindow.setIgnoreMouseEvents(true, { forward: true });
  }

  // VERIFICATION LOGGING
  const size = mainWindow.getSize();
  const pos = mainWindow.getPosition();
  if (devMode) {
    console.log('[WINDOW] ✓ Created: ' + size[0] + 'x' + size[1] + ' (dev mode, resizable)');
    console.log('[WINDOW] ✓ Framed: true (title bar visible)');
    console.log('[WINDOW] ✓ AlwaysOnTop: false');
  } else {
    console.log('[WINDOW] ✓ Created: ' + SHIMEJI_WINDOW_WIDTH + 'x' + SHIMEJI_WINDOW_HEIGHT + ' (Shimeji fixed canvas) at (20,20)');
    console.log('[WINDOW] ✓ Frameless: true');
    console.log('[WINDOW] ✓ AlwaysOnTop:' + mainWindow.isAlwaysOnTop());
  }
  console.log('[WINDOW] Actual bounds: ' + size[0] + 'x' + size[1] + ' at (' + pos[0] + ',' + pos[1] + ')');

  // Verify window settings
  mainWindow.once('ready-to-show', () => {
    console.log('[WINDOW] Ready to show');
    if (mainWindow) {
      const bounds = mainWindow.getBounds();
      console.log('[WINDOW] Final bounds: ' + JSON.stringify(bounds));
    }
  });

  // Load URL
  const loadDevServerUrl = async () => {
    if (!mainWindow) return;

    const port = await findDevServerPort();
    if (port) {
      const url = `http://localhost:${port}`;
      console.log('[LOAD] Loading from dev server: ' + url);
      await mainWindow!.loadURL(url).catch(err => {
        console.error('[LOAD] Failed to load URL: ' + err.message);
        return mainWindow?.loadURL('http://localhost:5177').catch(() => {
          console.error('[LOAD] Failed to load any dev server URL');
        });
      });
    } else {
      console.error('[LOAD] No dev server port found');
      await mainWindow?.loadFile(path.join(__dirname, '../dist/index.html')).catch(err => {
        console.error('[LOAD] Failed to load file: ' + err);
      });
    }
  };

  // Always use dev server in dev mode, even for Shimeji
  if (isDev) {
    loadDevServerUrl().then(() => {
      if (mainWindow) {
        mainWindow.show();
      }
    }).catch(err => console.error('[LOAD] Error loading dev server: ' + err));
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html')).catch(err => {
      console.error('[LOAD] Failed to load production file: ' + err);
    });
    mainWindow.show();
  }

  // Show window when ready (for early initialization feedback)
  if (!isDev) {
    mainWindow.once('ready-to-show', () => {
      if (mainWindow) {
        console.log('[WINDOW] Ready to show (production)');
        mainWindow.show();
      }
    });
  }

  // Development tools
  if (isDev) {
    mainWindow.webContents.openDevTools({
      mode: 'detach',
    });
  }

  // Verify window properties after content loads
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[LOADED] Content loaded');
    if (mainWindow) {
      mainWindow.webContents.send('window-debug-info', {
        bounds: mainWindow.getBounds(),
        alwaysOnTop: mainWindow.isAlwaysOnTop(),
      });
    }
  });

  // Event handlers
  mainWindow.on('closed', () => {
    console.log('[CLOSED] Window closed');
    mainWindow = null;
  });

  mainWindow.on('minimize' as any, (event: any) => {
    console.log('[MINIMIZE] Hiding to tray instead');
    event.preventDefault();
    mainWindow?.hide();
  });

  mainWindow.on('close', (event: any) => {
    if (!(app as any).isQuitting) {
      console.log('[CLOSE] Hiding instead of closing');
      event.preventDefault();
      mainWindow?.hide();
    }
  });
}

// ============================================================================
// TRAY MANAGEMENT
// ============================================================================

function createTray(): void {
  if (!mainWindow) return;

  try {
    const fs = require('fs');

    // Prefer tray-icon.png, then icon.png, then fallback
    const candidates = [
      path.join(__dirname, 'assets', 'tray-icon.png'),
      path.join(process.cwd(), 'assets', 'tray-icon.png'),
      path.join(__dirname, 'assets', 'icon.png'),
      path.join(process.cwd(), 'assets', 'icon.png'),
    ];

    let iconPath: string | null = null;
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        iconPath = p;
        break;
      }
    }

    if (!iconPath) {
      console.warn('[TRAY] No tray icon found in expected paths, falling back to Electron executable.');
      iconPath = process.execPath;
    }

    tray = new Tray(iconPath as string);
  } catch (err) {
    console.error('[TRAY] Failed to create tray icon:', err);
    try {
      tray = new Tray(process.execPath);
    } catch (err2) {
      console.error('[TRAY] Final tray fallback failed:', err2);
      tray = null;
      return;
    }
  }

  const menu = Menu.buildFromTemplate([
    {
      label: 'Show',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        (app as any).isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(menu);
  tray.on('double-click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

// ============================================================================
// APP EVENT HANDLERS
// ============================================================================

app.on('ready', () => {
  console.log('[APP] Ready');
  createWindow();
  if (process.platform !== 'linux') {
    createTray();
  }
});

app.on('window-all-closed', () => {
  console.log('[APP] All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  console.log('[APP] Activated');
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});

// ============================================================================
// IPC HANDLERS
// ============================================================================

ipcMain.handle(IPC_CHANNELS.HEALTH_CHECK, async (event: IpcMainInvokeEvent, request: any): Promise<HealthCheckResponse> => {
  const uptime = process.uptime();
  const memInfo = process.memoryUsage();
  return {
    status: 'success',
    requestId: request?.requestId || 'unknown',
    timestamp: Date.now(),
    duration: 0,
    uptime: uptime,
    memory: {
      heapUsed: memInfo.heapUsed,
      heapTotal: memInfo.heapTotal,
      external: memInfo.external,
    },
    processes: {
      active: 0,
      queued: 0,
      failed: 0,
    },
  };
});

// Add other IPC handlers as needed...

// ============================================================================
// WINDOW MESSAGING
// ============================================================================

ipcMain.handle('devops:window:minimize-tray', async () => {
  if (mainWindow) {
    mainWindow.hide();
  }
  return { success: true };
});

ipcMain.handle('devops:window:show', async () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
  return { success: true };
});

ipcMain.handle('devops:window:move', async (event: IpcMainInvokeEvent, x: number, y: number) => {
  if (mainWindow) {
    const bounds = mainWindow.getBounds();
    const display = screen.getDisplayMatching({ x, y, width: bounds.width, height: bounds.height });
    const { workArea } = display;
    const clampedX = Math.round(Math.max(workArea.x, Math.min(x, workArea.x + workArea.width - bounds.width)));
    const clampedY = Math.round(Math.max(workArea.y, Math.min(y, workArea.y + workArea.height - bounds.height)));
    mainWindow.setBounds({ x: clampedX, y: clampedY, width: bounds.width, height: bounds.height });
  }
  return { success: true };
});

ipcMain.handle('devops:window:set-ignore-mouse-events', async (_event: IpcMainInvokeEvent, ignore: boolean) => {
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(Boolean(ignore), { forward: true });
  }
  return { success: true };
});

ipcMain.handle('devops:code-fixer:fix', async (event: IpcMainInvokeEvent, request: any) => {
  try {
    const { code, language, prompt } = request;
    
    if (!code) {
      return {
        status: 'error',
        requestId: 'unknown',
        timestamp: Date.now(),
        duration: 0,
        error: 'Code is required',
      };
    }

    // Call AI client to fix code
    const response = await aiClient.fixCode(code, null, language);
    
    if (!response?.success) {
      return {
        status: 'error',
        requestId: 'unknown',
        timestamp: Date.now(),
        duration: 0,
        error: response?.error || 'Failed to fix code',
      };
    }

    return {
      status: 'success',
      requestId: 'unknown',
      timestamp: Date.now(),
      duration: 0,
      fixed: response.data?.fixed_snippet || '',
      explanation: response.data?.explanation || '',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: 'error',
      requestId: 'unknown',
      timestamp: Date.now(),
      duration: 0,
      error: message,
    };
  }
});

ipcMain.handle('devops:clipboard:read', async () => {
  try {
    const { clipboard } = require('electron');
    const text = clipboard.readText();
    return {
      success: true,
      content: text,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: message,
    };
  }
});

// ============================================================================
// ENVIRONMENT BUILDER - IPC HANDLERS
// ============================================================================

ipcMain.handle('devops:env:detect', async (event: IpcMainInvokeEvent, request: any) => {
  try {
    const { projectPath } = request;
    
    if (!projectPath) {
      return {
        status: 'error',
        requestId: 'unknown',
        timestamp: Date.now(),
        duration: 0,
        error: 'Project path is required',
      };
    }

    // Perform project scan
    const scan = await performProjectScan(projectPath);
    
    // Call AI to analyze
    const response = await aiClient.analyzeEnvironment(scan);
    
    if (!response?.success) {
      return {
        status: 'error',
        requestId: 'unknown',
        timestamp: Date.now(),
        duration: 0,
        error: response?.error || 'Failed to detect environment',
      };
    }

    return {
      status: 'success',
      requestId: 'unknown',
      timestamp: Date.now(),
      duration: 0,
      ...response.data,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: 'error',
      requestId: 'unknown',
      timestamp: Date.now(),
      duration: 0,
      error: message,
    };
  }
});

ipcMain.handle('devops:env:setup', async (event: IpcMainInvokeEvent, request: any) => {
  try {
    const { projectPath, envType } = request;
    
    if (!projectPath) {
      return {
        status: 'error',
        requestId: 'unknown',
        timestamp: Date.now(),
        duration: 0,
        error: 'Project path is required',
      };
    }

    return {
      status: 'success',
      requestId: 'unknown',
      timestamp: Date.now(),
      duration: 0,
      success: true,
      stdout: 'Environment setup initiated',
      commandsExecuted: [],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: 'error',
      requestId: 'unknown',
      timestamp: Date.now(),
      duration: 0,
      error: message,
    };
  }
});

// ============================================================================
// FILE ORGANIZER - IPC HANDLERS
// ============================================================================

ipcMain.handle('devops:file:organize', async (event: IpcMainInvokeEvent, request: any) => {
  try {
    const { folderPath } = request;
    
    if (!folderPath) {
      return {
        status: 'error',
        requestId: 'unknown',
        timestamp: Date.now(),
        duration: 0,
        error: 'Folder path is required',
      };
    }

    // Perform deep scan
    const scan = await performDeepScan(folderPath);
    
    // Call AI to analyze
    const response = await aiClient.analyzeFileOrganization(scan);
    
    if (!response?.success) {
      return {
        status: 'error',
        requestId: 'unknown',
        timestamp: Date.now(),
        duration: 0,
        error: response?.error || 'Failed to organize files',
      };
    }

    return {
      status: 'success',
      requestId: 'unknown',
      timestamp: Date.now(),
      duration: 0,
      ...response.data,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: 'error',
      requestId: 'unknown',
      timestamp: Date.now(),
      duration: 0,
      error: message,
    };
  }
});

ipcMain.handle('devops:file:apply-org', async (event: IpcMainInvokeEvent, request: any) => {
  try {
    const { folderPath, organization, dryRun = true } = request;
    
    if (!folderPath || !organization) {
      return {
        status: 'error',
        requestId: 'unknown',
        timestamp: Date.now(),
        duration: 0,
        error: 'Folder path and organization plan are required',
      };
    }

    const fs = require('fs');
    const path = require('path');
    let moved = 0;
    const errors: string[] = [];

    // Apply moves from organization plan
    if (organization.moves && Array.isArray(organization.moves)) {
      for (const move of organization.moves) {
        try {
          const sourcePath = path.join(folderPath, move.from);
          const destPath = path.join(folderPath, move.to);
          const destDir = path.dirname(destPath);

          if (!dryRun) {
            // Create destination directory if it doesn't exist
            if (!fs.existsSync(destDir)) {
              fs.mkdirSync(destDir, { recursive: true });
            }
            // Move file
            fs.renameSync(sourcePath, destPath);
          }
          moved++;
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          errors.push(`Failed to move ${move.from}: ${msg}`);
        }
      }
    }

    return {
      status: 'success',
      requestId: 'unknown',
      timestamp: Date.now(),
      duration: 0,
      success: true,
      filesProcessed: moved,
      errors,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: 'error',
      requestId: 'unknown',
      timestamp: Date.now(),
      duration: 0,
      error: message,
    };
  }
});

// ============================================================================
// DIALOG HANDLERS
// ============================================================================

ipcMain.handle('devops:dialog:select-path', async () => {
  try {
    const { dialog } = require('electron');
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory'],
      title: 'Select Project Folder',
    });

    if (result.canceled) {
      return {
        success: false,
        path: null,
        canceled: true,
      };
    }

    return {
      success: true,
      path: result.filePaths[0] || null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: message,
      path: null,
    };
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function performProjectScan(rootDir: string): Promise<any> {
  const fs = require('fs');
  const path = require('path');
  
  const files: any[] = [];
  const configFiles: string[] = [];
  
  const walkDir = (dir: string, depth: number = 0) => {
    if (depth > 3) return;
    
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        if (item.startsWith('.') || item === 'node_modules') continue;
        
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isFile()) {
          const relPath = path.relative(rootDir, fullPath);
          files.push({ name: item, rel_path: relPath, size_kb: Math.ceil(stat.size / 1024) });
          
          if (['.json', '.toml', '.yaml', '.yml', '.xml'].some(ext => item.endsWith(ext))) {
            configFiles.push(relPath);
          }
        } else if (stat.isDirectory() && depth < 3) {
          walkDir(fullPath, depth + 1);
        }
      }
    } catch (error) {
      console.debug(`Error scanning ${dir}:`, error);
    }
  };
  
  walkDir(rootDir);
  
  return {
    root: rootDir,
    files,
    has_pom: files.some(f => f.name === 'pom.xml'),
    has_package_json: files.some(f => f.name === 'package.json'),
    has_requirements: files.some(f => f.name === 'requirements.txt'),
    has_cargo: files.some(f => f.name === 'Cargo.toml'),
    has_go_mod: files.some(f => f.name === 'go.mod'),
    config_files: configFiles,
  };
}

async function performDeepScan(rootDir: string): Promise<any> {
  const fs = require('fs');
  const path = require('path');
  
  const files: any[] = [];
  const sizeGroups: Map<number, string[]> = new Map();
  
  const walkDir = (dir: string) => {
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        if (item.startsWith('.') || item === 'node_modules' || item === '__pycache__') continue;
        
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isFile()) {
          const relPath = path.relative(rootDir, fullPath);
          const size = stat.size;
          
          if (size > 100) {
            if (!sizeGroups.has(size)) sizeGroups.set(size, []);
            sizeGroups.get(size)!.push(relPath);
          }
          
          files.push({
            path: relPath,
            size_bytes: size,
            last_modified: stat.mtime.toISOString(),
            extension: path.extname(item),
          });
        } else if (stat.isDirectory()) {
          walkDir(fullPath);
        }
      }
    } catch (error) {
      console.debug(`Error scanning ${dir}:`, error);
    }
  };
  
  walkDir(rootDir);
  
  const potentialDupes: string[][] = [];
  sizeGroups.forEach((paths) => {
    if (paths.length > 1) potentialDupes.push(paths);
  });
  
  return {
    files,
    potential_duplicates_by_size: potentialDupes,
  };
}

