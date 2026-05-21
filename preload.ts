import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI } from './src/window';

/**
 * Preload script - exposes safe IPC methods to the renderer process
 * Uses context isolation for security
 */

const electronAPI: ElectronAPI = {
  // Code Fixing
  fixCode: (code: string, language: string, prompt: string) =>
    ipcRenderer.invoke('devops:code-fixer:fix', { code, language, prompt }),
  
  chatAI: (message: string, context?: string) =>
    ipcRenderer.invoke('devops:chat:send', { message, context }),
  
  onCodeFixStream: (callback) => {
    const wrappedCallback = (_event: any, chunk: any) => callback(chunk);
    ipcRenderer.on('devops:code-fixer:stream', wrappedCallback);
    return () => ipcRenderer.off('devops:code-fixer:stream', wrappedCallback);
  },

  // Environment Management
  detectEnv: (projectPath: string) =>
    ipcRenderer.invoke('devops:env:detect', { projectPath }),
  
  setupEnv: (projectPath: string, envType: string) =>
    ipcRenderer.invoke('devops:env:setup', { projectPath, envType }),
  
  onSetupEnvStream: (callback) => {
    const wrappedCallback = (_event: any, chunk: any) => callback(chunk);
    ipcRenderer.on('devops:env:stream', wrappedCallback);
    return () => ipcRenderer.off('devops:env:stream', wrappedCallback);
  },

  // File Operations
  readFile: (filePath: string) =>
    ipcRenderer.invoke('devops:file:read', { filePath }),
  
  organizeFolder: (folderPath: string, rules?: any) =>
    ipcRenderer.invoke('devops:file:organize', { folderPath, rules }),
  
  applyOrganization: (folderPath: string, organization: any) =>
    ipcRenderer.invoke('devops:file:apply-org', { folderPath, organization }),

  // Task Management
  cancelTask: (requestId: string) =>
    ipcRenderer.invoke('devops:task:cancel', { requestId }),
  
  healthCheck: () =>
    ipcRenderer.invoke('devops:health-check'),

  // Streaming Events
  onChatStream: (callback) => {
    const wrappedCallback = (_event: any, chunk: any) => callback(chunk);
    ipcRenderer.on('devops:chat:stream', wrappedCallback);
    return () => ipcRenderer.off('devops:chat:stream', wrappedCallback);
  },

  // Window Management
  minimizeToTray: () =>
    ipcRenderer.invoke('devops:window:minimize-tray'),
  
  showMainWindow: () =>
    ipcRenderer.invoke('devops:window:show'),
  
  moveWindow: (x: number, y: number) =>
    ipcRenderer.invoke('devops:window:move', x, y),

  setIgnoreMouseEvents: (ignore: boolean) =>
    ipcRenderer.invoke('devops:window:set-ignore-mouse-events', ignore),
  
  onShowMenu: (callback) => {
    const wrappedCallback = () => callback();
    ipcRenderer.on('devops:show-menu', wrappedCallback);
    return () => ipcRenderer.off('devops:show-menu', wrappedCallback);
  },
  selectProjectPath: () =>
    ipcRenderer.invoke('devops:dialog:select-path'),

  // Legacy compatibility
  organizeFolder_legacy: (path: string, rules: any) =>
    ipcRenderer.invoke('devops:file:organize', { folderPath: path, rules }),
  
  applyOrganization_legacy: (path: string, org: any) =>
    ipcRenderer.invoke('devops:file:apply-org', { folderPath: path, organization: org }),
  
  detectEnv_legacy: (projectPath: string) =>
    ipcRenderer.invoke('devops:env:detect', { projectPath }),
  
  setupEnv_legacy: (projectPath: string, envType: string) =>
    ipcRenderer.invoke('devops:env:setup', { projectPath, envType }),
  
  readFile_legacy: (filePath: string) =>
    ipcRenderer.invoke('devops:file:read', { filePath }),
  
  fixCode_legacy: (code: string, language: string, prompt: string) =>
    ipcRenderer.invoke('devops:code-fixer:fix', { code, language, prompt }),
  
  chatAI_legacy: (message: string, context: string) =>
    ipcRenderer.invoke('devops:chat:send', { message, context }),
};

// Expose safe API to renderer context
contextBridge.exposeInMainWorld('electronAPI', electronAPI);
