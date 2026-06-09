import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI } from './src/window';

/**
 * Preload script - exposes safe IPC methods to the renderer process
 * Uses context isolation for security
 */

const electronAPI: ElectronAPI = {
  // Code Fixing
  fixCode: (code: string, language: string, mode: 'manual' | 'ai' = 'ai') =>
    ipcRenderer.invoke('devops:code-fixer:fix', { code, language, mode }),

  runCodeFixAgent: (request) =>
    ipcRenderer.invoke('devops:code-fixer:agent', request),

  readClipboard: () =>
    ipcRenderer.invoke('devops:clipboard:read'),

  writeClipboard: (content: string) =>
    ipcRenderer.invoke('devops:clipboard:write', { content }),

  getTestSamples: () =>
    ipcRenderer.invoke('devops:samples:list'),

  resetTestSamples: () =>
    ipcRenderer.invoke('devops:samples:reset'),
  
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

  writeFile: (filePath: string, content: string) =>
    ipcRenderer.invoke('devops:file:write', { filePath, content }),
  
  organizeFolder: (folderPath: string, rules?: any, mode: 'professional' | 'ai' = 'professional', instruction?: string) =>
    ipcRenderer.invoke('devops:file:organize', { folderPath, rules, mode, instruction }),
  
  applyOrganization: (folderPath: string, organization: any) =>
    ipcRenderer.invoke('devops:file:apply-org', { folderPath, organization }),

  chatWithCodebase: (projectPath: string, message: string, history?: Array<{ role: 'user' | 'assistant'; content: string }>) =>
    ipcRenderer.invoke('devops:chat:codebase', { projectPath, message, history }),

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

  resizeWindow: (width: number, height: number) =>
    ipcRenderer.invoke('devops:window:resize', width, height),

  setIgnoreMouseEvents: (ignore: boolean) =>
    ipcRenderer.invoke('devops:window:set-ignore-mouse-events', ignore),

  deactivateApp: () =>
    ipcRenderer.invoke('devops:app:deactivate'),

  getAISettings: () =>
    ipcRenderer.invoke('devops:ai:get-settings'),

  saveAISettings: (settings) =>
    ipcRenderer.invoke('devops:ai:save-settings', settings),

  completeAISetup: () =>
    ipcRenderer.invoke('devops:ai:complete-setup'),

  getAIStatus: () =>
    ipcRenderer.invoke('devops:ai:get-status'),

  setActiveAIBackend: (backend) =>
    ipcRenderer.invoke('devops:ai:set-active-backend', backend),

  executeAIPrompt: (request) =>
    ipcRenderer.invoke('devops:ai:execute-prompt', request),

  pullOllamaModel: () =>
    ipcRenderer.invoke('devops:ai:pull-ollama-model'),

  cancelOllamaPull: () =>
    ipcRenderer.invoke('devops:ai:cancel-ollama-pull'),

  onOllamaPullProgress: (callback) => {
    const wrappedCallback = (_event: any, progress: any) => callback(progress);
    ipcRenderer.on('devops:ai:ollama-pull-progress', wrappedCallback);
    return () => ipcRenderer.off('devops:ai:ollama-pull-progress', wrappedCallback);
  },
  
  onShowMenu: (callback) => {
    const wrappedCallback = () => callback();
    ipcRenderer.on('devops:show-menu', wrappedCallback);
    return () => ipcRenderer.off('devops:show-menu', wrappedCallback);
  },
  selectProjectPath: () =>
    ipcRenderer.invoke('devops:dialog:select-path'),

  getCurrentProjectPath: () =>
    ipcRenderer.invoke('devops:project:get-current-path'),

  createDiscussionRoom: (projectPath: string, syncUrl?: string) =>
    ipcRenderer.invoke('devops:discussion:create', { projectPath, syncUrl }),

  joinDiscussionRoom: (projectPath: string, key: string, syncUrl?: string) =>
    ipcRenderer.invoke('devops:discussion:join', { projectPath, key, syncUrl }),

  readDiscussionRoom: (projectPath: string, key: string, syncUrl?: string) =>
    ipcRenderer.invoke('devops:discussion:read', { projectPath, key, syncUrl }),

  writeDiscussionRoom: (projectPath: string, key: string, content: string, syncUrl?: string) =>
    ipcRenderer.invoke('devops:discussion:write', { projectPath, key, content, syncUrl }),

  getDiscussionSyncInfo: () =>
    ipcRenderer.invoke('devops:discussion:sync-info'),

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
