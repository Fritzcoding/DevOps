/**
 * Window API type definitions
 * Exposes Electron API to React components
 */

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
  OrganizeFileRequest,
  OrganizeFileResponse,
  CancelTaskRequest,
  CancelTaskResponse,
  HealthCheckResponse,
  CodeFixStreamChunk,
  SetupEnvStreamChunk,
} from './ipc-types';

export interface ElectronAPI {
  // Code Fixing
  fixCode(code: string, language: string, prompt: string): Promise<FixCodeResponse>;
  chatAI(message: string, context?: string): Promise<ChatResponse>;
  onCodeFixStream(callback: (chunk: CodeFixStreamChunk) => void): () => void;

  // Environment Management
  detectEnv(projectPath: string): Promise<DetectEnvResponse>;
  setupEnv(projectPath: string, envType: string): Promise<SetupEnvResponse>;
  onSetupEnvStream(callback: (chunk: SetupEnvStreamChunk) => void): () => void;

  // File Operations
  readFile(filePath: string): Promise<ReadFileResponse>;
  organizeFolder(folderPath: string, rules?: any): Promise<OrganizeFileResponse>;
  applyOrganization(folderPath: string, organization: any): Promise<OrganizeFileResponse>;

  // Task Management
  cancelTask(requestId: string): Promise<CancelTaskResponse>;
  healthCheck(): Promise<HealthCheckResponse>;

  // Streaming Events
  onChatStream(callback: (chunk: any) => void): () => void;

  // Window Management
  minimizeToTray(): Promise<void>;
  showMainWindow(): Promise<void>;
  moveWindow(x: number, y: number): Promise<void>;
  setIgnoreMouseEvents(ignore: boolean): Promise<void>;
  onShowMenu(callback: () => void): () => void;

  // Project Path Selection
  selectProjectPath(): Promise<{ success: boolean; path: string | null; error?: string; canceled?: boolean }>;

  // Legacy (backward compatibility)
  organizeFolder_legacy(path: string, rules: any): Promise<any>;
  applyOrganization_legacy(path: string, org: any): Promise<any>;
  detectEnv_legacy(projectPath: string): Promise<any>;
  setupEnv_legacy(projectPath: string, envType: string): Promise<any>;
  readFile_legacy(filePath: string): Promise<any>;
  fixCode_legacy(code: string, language: string, prompt: string): Promise<any>;
  chatAI_legacy(message: string, context: string): Promise<any>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    electron?: any; // Legacy
  }
}

export {};
