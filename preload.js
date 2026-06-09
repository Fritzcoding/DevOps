"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
/**
 * Preload script - exposes safe IPC methods to the renderer process
 * Uses context isolation for security
 */
const electronAPI = {
    // Code Fixing
    fixCode: (code, language, mode = 'ai') => electron_1.ipcRenderer.invoke('devops:code-fixer:fix', { code, language, mode }),
    runCodeFixAgent: (request) => electron_1.ipcRenderer.invoke('devops:code-fixer:agent', request),
    readClipboard: () => electron_1.ipcRenderer.invoke('devops:clipboard:read'),
    writeClipboard: (content) => electron_1.ipcRenderer.invoke('devops:clipboard:write', { content }),
    getTestSamples: () => electron_1.ipcRenderer.invoke('devops:samples:list'),
    resetTestSamples: () => electron_1.ipcRenderer.invoke('devops:samples:reset'),
    chatAI: (message, context) => electron_1.ipcRenderer.invoke('devops:chat:send', { message, context }),
    onCodeFixStream: (callback) => {
        const wrappedCallback = (_event, chunk) => callback(chunk);
        electron_1.ipcRenderer.on('devops:code-fixer:stream', wrappedCallback);
        return () => electron_1.ipcRenderer.off('devops:code-fixer:stream', wrappedCallback);
    },
    // Environment Management
    detectEnv: (projectPath) => electron_1.ipcRenderer.invoke('devops:env:detect', { projectPath }),
    setupEnv: (projectPath, envType) => electron_1.ipcRenderer.invoke('devops:env:setup', { projectPath, envType }),
    onSetupEnvStream: (callback) => {
        const wrappedCallback = (_event, chunk) => callback(chunk);
        electron_1.ipcRenderer.on('devops:env:stream', wrappedCallback);
        return () => electron_1.ipcRenderer.off('devops:env:stream', wrappedCallback);
    },
    // File Operations
    readFile: (filePath) => electron_1.ipcRenderer.invoke('devops:file:read', { filePath }),
    writeFile: (filePath, content) => electron_1.ipcRenderer.invoke('devops:file:write', { filePath, content }),
    organizeFolder: (folderPath, rules, mode = 'professional', instruction) => electron_1.ipcRenderer.invoke('devops:file:organize', { folderPath, rules, mode, instruction }),
    applyOrganization: (folderPath, organization) => electron_1.ipcRenderer.invoke('devops:file:apply-org', { folderPath, organization }),
    chatWithCodebase: (projectPath, message, history) => electron_1.ipcRenderer.invoke('devops:chat:codebase', { projectPath, message, history }),
    // Task Management
    cancelTask: (requestId) => electron_1.ipcRenderer.invoke('devops:task:cancel', { requestId }),
    healthCheck: () => electron_1.ipcRenderer.invoke('devops:health-check'),
    // Streaming Events
    onChatStream: (callback) => {
        const wrappedCallback = (_event, chunk) => callback(chunk);
        electron_1.ipcRenderer.on('devops:chat:stream', wrappedCallback);
        return () => electron_1.ipcRenderer.off('devops:chat:stream', wrappedCallback);
    },
    // Window Management
    minimizeToTray: () => electron_1.ipcRenderer.invoke('devops:window:minimize-tray'),
    showMainWindow: () => electron_1.ipcRenderer.invoke('devops:window:show'),
    moveWindow: (x, y) => electron_1.ipcRenderer.invoke('devops:window:move', x, y),
    resizeWindow: (width, height) => electron_1.ipcRenderer.invoke('devops:window:resize', width, height),
    setIgnoreMouseEvents: (ignore) => electron_1.ipcRenderer.invoke('devops:window:set-ignore-mouse-events', ignore),
    deactivateApp: () => electron_1.ipcRenderer.invoke('devops:app:deactivate'),
    getAISettings: () => electron_1.ipcRenderer.invoke('devops:ai:get-settings'),
    saveAISettings: (settings) => electron_1.ipcRenderer.invoke('devops:ai:save-settings', settings),
    completeAISetup: () => electron_1.ipcRenderer.invoke('devops:ai:complete-setup'),
    getAIStatus: () => electron_1.ipcRenderer.invoke('devops:ai:get-status'),
    setActiveAIBackend: (backend) => electron_1.ipcRenderer.invoke('devops:ai:set-active-backend', backend),
    executeAIPrompt: (request) => electron_1.ipcRenderer.invoke('devops:ai:execute-prompt', request),
    pullOllamaModel: () => electron_1.ipcRenderer.invoke('devops:ai:pull-ollama-model'),
    cancelOllamaPull: () => electron_1.ipcRenderer.invoke('devops:ai:cancel-ollama-pull'),
    onOllamaPullProgress: (callback) => {
        const wrappedCallback = (_event, progress) => callback(progress);
        electron_1.ipcRenderer.on('devops:ai:ollama-pull-progress', wrappedCallback);
        return () => electron_1.ipcRenderer.off('devops:ai:ollama-pull-progress', wrappedCallback);
    },
    onShowMenu: (callback) => {
        const wrappedCallback = () => callback();
        electron_1.ipcRenderer.on('devops:show-menu', wrappedCallback);
        return () => electron_1.ipcRenderer.off('devops:show-menu', wrappedCallback);
    },
    selectProjectPath: () => electron_1.ipcRenderer.invoke('devops:dialog:select-path'),
    getCurrentProjectPath: () => electron_1.ipcRenderer.invoke('devops:project:get-current-path'),
    createDiscussionRoom: (projectPath, syncUrl) => electron_1.ipcRenderer.invoke('devops:discussion:create', { projectPath, syncUrl }),
    joinDiscussionRoom: (projectPath, key, syncUrl) => electron_1.ipcRenderer.invoke('devops:discussion:join', { projectPath, key, syncUrl }),
    readDiscussionRoom: (projectPath, key, syncUrl) => electron_1.ipcRenderer.invoke('devops:discussion:read', { projectPath, key, syncUrl }),
    writeDiscussionRoom: (projectPath, key, content, syncUrl) => electron_1.ipcRenderer.invoke('devops:discussion:write', { projectPath, key, content, syncUrl }),
    getDiscussionSyncInfo: () => electron_1.ipcRenderer.invoke('devops:discussion:sync-info'),
    // Legacy compatibility
    organizeFolder_legacy: (path, rules) => electron_1.ipcRenderer.invoke('devops:file:organize', { folderPath: path, rules }),
    applyOrganization_legacy: (path, org) => electron_1.ipcRenderer.invoke('devops:file:apply-org', { folderPath: path, organization: org }),
    detectEnv_legacy: (projectPath) => electron_1.ipcRenderer.invoke('devops:env:detect', { projectPath }),
    setupEnv_legacy: (projectPath, envType) => electron_1.ipcRenderer.invoke('devops:env:setup', { projectPath, envType }),
    readFile_legacy: (filePath) => electron_1.ipcRenderer.invoke('devops:file:read', { filePath }),
    fixCode_legacy: (code, language, prompt) => electron_1.ipcRenderer.invoke('devops:code-fixer:fix', { code, language, prompt }),
    chatAI_legacy: (message, context) => electron_1.ipcRenderer.invoke('devops:chat:send', { message, context }),
};
// Expose safe API to renderer context
electron_1.contextBridge.exposeInMainWorld('electronAPI', electronAPI);
