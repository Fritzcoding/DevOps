import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Cloud,
  Download,
  KeyRound,
  Laptop,
  Loader2,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';

type Backend = 'cloud' | 'local';

interface Props {
  onClose: () => void;
  onBack?: () => void;
  firstRun?: boolean;
  onSaved?: () => void;
}

const apiPresets = [
  { label: 'OpenAI', url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini' },
  { label: 'Gemini', url: 'https://generativelanguage.googleapis.com/v1beta', model: 'gemini-2.5-flash' },
  { label: 'DeepSeek', url: 'https://api.deepseek.com/chat/completions', model: 'deepseek-chat' },
  { label: 'Anthropic', url: 'https://api.anthropic.com/v1/messages', model: 'claude-3-5-haiku-latest' },
];

const suggestedLocalModelOptions = [
  { name: 'qwen2.5-coder:7b', label: 'Qwen Coder 7B', tier: 'Balanced coding' },
  { name: 'qwen2.5-coder:14b', label: 'Qwen Coder 14B', tier: 'Stronger coding' },
  { name: 'qwen2.5-coder:32b', label: 'Qwen Coder 32B', tier: 'High-parameter coding' },
  { name: 'deepseek-coder-v2:16b', label: 'DeepSeek Coder 16B', tier: 'Code reasoning' },
  { name: 'llama3.1:8b', label: 'Llama 3.1 8B', tier: 'General local' },
  { name: 'llama3.1:70b', label: 'Llama 3.1 70B', tier: 'High-parameter general' },
  { name: 'llama3.3:70b', label: 'Llama 3.3 70B', tier: 'High-parameter general' },
  { name: 'mistral:7b', label: 'Mistral 7B', tier: 'Lightweight' },
  { name: 'mixtral:8x7b', label: 'Mixtral 8x7B', tier: 'MoE larger local' },
  { name: 'codellama:7b', label: 'Code Llama 7B', tier: 'Legacy coding' },
  { name: 'codellama:13b', label: 'Code Llama 13B', tier: 'Legacy larger coding' },
  { name: 'codellama:34b', label: 'Code Llama 34B', tier: 'Legacy high-parameter coding' },
];

const suggestedLocalModels = suggestedLocalModelOptions.map((model) => model.name);

const clampPercent = (value: unknown) => {
  return Math.max(0, Math.min(100, Math.round(Number(value || 0))));
};

const formatBytes = (value?: number) => {
  if (!value || value <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = value;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size >= 10 ? size.toFixed(0) : size.toFixed(1)} ${units[unit]}`;
};

export const AISettingsModal: React.FC<Props> = ({ onClose, onBack, firstRun = false, onSaved }) => {
  const [backend, setBackend] = useState<Backend>('cloud');
  const [activeBackend, setActiveBackend] = useState<Backend>('cloud');
  const [apiKey, setApiKey] = useState('');
  const [apiUrl, setApiUrl] = useState(apiPresets[0].url);
  const [cloudModel, setCloudModel] = useState(apiPresets[0].model);
  const [localBaseUrl, setLocalBaseUrl] = useState('http://localhost:11434');
  const [localModel, setLocalModel] = useState('qwen2.5-coder:7b');
  const [status, setStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedPreset = useMemo(() => {
    return apiPresets.find((preset) => preset.url === apiUrl) || null;
  }, [apiUrl]);

  const installedModels = useMemo(() => {
    return Array.isArray(status?.local?.models) ? status.local.models as string[] : [];
  }, [status]);

  const modelOptions = useMemo(() => {
    return Array.from(new Set([localModel, ...installedModels, ...suggestedLocalModels].filter(Boolean)));
  }, [installedModels, localModel]);

  const isSelectedModelInstalled = installedModels.includes(localModel);
  const pullPercent = clampPercent(pullProgress?.progress);
  const pullSize = pullProgress?.completed && pullProgress?.total
    ? `${formatBytes(pullProgress.completed)} / ${formatBytes(pullProgress.total)}`
    : '';

  const refreshStatus = async () => {
    setLoadingStatus(true);
    setError(null);
    try {
      const result = await window.electronAPI.getAIStatus();
      if (!result?.success) {
        setError(result?.error || 'Unable to read AI status');
        return;
      }
      setStatus(result);
      const settings = result.settings;
      setBackend(settings.backendSelection || 'cloud');
      setActiveBackend(settings.activeBackend || settings.backendSelection || 'cloud');
      setApiUrl(settings.cloud.apiUrl);
      setCloudModel(settings.cloud.model);
      setLocalBaseUrl(settings.local.baseUrl);
      setLocalModel(settings.local.model);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    refreshStatus();
    return window.electronAPI.onOllamaPullProgress((progress) => {
      setPullProgress(progress);
      if (progress?.done) {
        setPulling(false);
        refreshStatus();
      }
    });
  }, []);

  const persistSettings = async () => {
    setSaving(true);
    setError(null);
    try {
      const result = await window.electronAPI.saveAISettings({
        backendSelection: backend,
        activeBackend,
        cloud: {
          apiKey: apiKey.trim() || undefined,
          apiUrl,
          model: cloudModel,
        },
        local: {
          baseUrl: localBaseUrl,
          model: localModel,
        },
      });
      if (!result?.success) {
        setError(result?.error || 'Unable to save AI settings');
        return null;
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const save = async (complete = false) => {
    const result = await persistSettings();
    if (!result) return;
    if (complete) await window.electronAPI.completeAISetup();
    onSaved?.();
    if (complete || !firstRun) onClose();
  };

  const downloadEngine = async () => {
    const saved = await persistSettings();
    if (!saved) return;
    setPulling(true);
    setPullProgress({ status: `Starting ${localModel} download`, progress: 0 });
    const result = await window.electronAPI.pullOllamaModel();
    if (!result?.success) {
      const message = result?.error || 'Ollama download failed';
      if (!String(message).toLowerCase().includes('cancelled')) {
        setError(message);
      }
      setPulling(false);
    }
  };

  const cancelDownload = async () => {
    await window.electronAPI.cancelOllamaPull();
    setPulling(false);
    setPullProgress((current: any) => ({
      ...(current || {}),
      status: 'Download cancelled',
      done: true,
    }));
  };

  const choosePreset = (url: string) => {
    const preset = apiPresets.find((item) => item.url === url);
    if (!preset) return;
    setApiUrl(preset.url);
    setCloudModel(preset.model);
  };

  const canFinishCloud = backend === 'cloud' && (apiKey.trim() || status?.settings?.cloud?.apiKeyConfigured) && cloudModel.trim();
  const canFinishLocal = backend === 'local' && status?.local?.running && isSelectedModelInstalled;
  const canFinish = backend === 'cloud' ? canFinishCloud : canFinishLocal;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" data-electron-interactive="true">
      <div className="max-h-[94vh] w-full max-w-5xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_28px_90px_rgba(2,6,23,0.32)]">
        <div className="flex items-start justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <ShieldCheck className="h-4 w-4" />
              AI configuration
            </div>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">
              {firstRun ? 'Choose how DevOps Lite should run AI' : 'AI Settings'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {onBack && !firstRun && (
              <button onClick={onBack} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 active:scale-[0.97]" aria-label="Back to menu">
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}
            {!firstRun && (
              <button onClick={onClose} className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 active:scale-[0.97]" aria-label="Close settings">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <div className="grid max-h-[calc(94vh-9rem)] grid-cols-[15.5rem_minmax(0,1fr)] overflow-hidden">
          <div className="space-y-3 overflow-auto border-r border-slate-200 bg-slate-50 p-4">
            <button
              onClick={() => {
                setBackend('cloud');
                setActiveBackend('cloud');
              }}
              className={`w-full rounded-lg border p-4 text-left transition active:scale-[0.98] ${backend === 'cloud' ? 'border-slate-900 bg-white shadow-sm' : 'border-slate-200 bg-white/70 hover:border-slate-300'}`}
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-900 text-white">
                  <Cloud className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-950">Cloud AI</span>
                  <span className="block text-xs text-slate-500">Fast setup with an API key</span>
                </span>
              </span>
            </button>

            <button
              onClick={() => {
                setBackend('local');
                setActiveBackend('local');
              }}
              className={`w-full rounded-lg border p-4 text-left transition active:scale-[0.98] ${backend === 'local' ? 'border-slate-900 bg-white shadow-sm' : 'border-slate-200 bg-white/70 hover:border-slate-300'}`}
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-700 text-white">
                  <Laptop className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-950">Local AI</span>
                  <span className="block text-xs text-slate-500">Private Ollama model</span>
                </span>
              </span>
            </button>

            {status?.canToggle && (
              <label className="block rounded-lg border border-slate-200 bg-white p-3 text-sm">
                <span className="mb-2 block text-xs font-semibold uppercase text-slate-500">Active route</span>
                <select
                  value={activeBackend}
                  onChange={(event) => setActiveBackend(event.target.value as Backend)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
                >
                  <option value="cloud">Cloud AI</option>
                  <option value="local">Local AI</option>
                </select>
              </label>
            )}
          </div>

          <div className="overflow-auto p-5 sm:p-6">
            {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            {backend === 'cloud' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                  {apiPresets.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => choosePreset(preset.url)}
                      className={`rounded-md border px-3 py-2 text-sm font-semibold transition active:scale-[0.97] ${selectedPreset?.label === preset.label ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <label className="block">
                  <span className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-800">
                    <KeyRound className="h-4 w-4" />
                    API key
                  </span>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    placeholder={status?.settings?.cloud?.apiKeyConfigured ? `Saved: ${status.settings.cloud.apiKeyPreview}` : 'Paste your API key'}
                    className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-900"
                  />
                </label>

                <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-3">
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-800">API URL</span>
                    <input value={apiUrl} onChange={(event) => setApiUrl(event.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-900" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-800">Model</span>
                    <input value={cloudModel} onChange={(event) => setCloudModel(event.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-900" />
                  </label>
                </div>
              </div>
            )}

            {backend === 'local' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Ollama status</div>
                    <div className="text-xs text-slate-500">
                      {loadingStatus ? 'Checking localhost...' : status?.local?.running ? 'Ollama is running' : 'Ollama is not reachable'}
                    </div>
                  </div>
                  <button onClick={refreshStatus} className="rounded-md border border-slate-200 bg-white p-2 text-slate-700 transition hover:bg-slate-100 active:scale-[0.97]" aria-label="Refresh Ollama status">
                    {loadingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  </button>
                </div>

                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.9fr)]">
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-800">Ollama URL</span>
                    <input value={localBaseUrl} onChange={(event) => setLocalBaseUrl(event.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-900" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-800">Local model</span>
                    <input
                      value={localModel}
                      list="local-ai-models"
                      onChange={(event) => setLocalModel(event.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-900"
                    />
                    <datalist id="local-ai-models">
                      {modelOptions.map((model) => (
                        <option key={model} value={model} />
                      ))}
                    </datalist>
                  </label>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <div className="mb-2 text-sm font-semibold text-slate-900">Suggested local models</div>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {suggestedLocalModelOptions.map((model) => (
                      <button
                        key={model.name}
                        onClick={() => setLocalModel(model.name)}
                        className={`rounded-md border px-3 py-2 text-left transition active:scale-[0.97] ${
                          localModel === model.name
                            ? 'border-emerald-700 bg-emerald-700 text-white'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="block text-xs font-semibold">{model.label}</span>
                        <span className={`mt-0.5 block text-[11px] ${localModel === model.name ? 'text-emerald-50' : 'text-slate-500'}`}>
                          {model.name} - {model.tier}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 text-xs leading-5 text-slate-500">
                    Larger parameter models need more RAM or VRAM; if Ollama reports memory pressure, choose a smaller model.
                  </div>
                </div>

                {status?.local?.running && (
                  <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                    <div className="mb-2 text-sm font-semibold text-slate-900">Detected local models</div>
                    {installedModels.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {installedModels.map((model) => (
                          <button
                            key={model}
                            onClick={() => setLocalModel(model)}
                            className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold transition active:scale-[0.97] ${
                              localModel === model
                                ? 'border-emerald-700 bg-emerald-700 text-white'
                                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {model}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500">No local Ollama models were found on this device yet.</div>
                    )}
                  </div>
                )}

                <div className={`rounded-lg border px-4 py-4 ${isSelectedModelInstalled ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0 text-sm">
                      <div className="font-semibold text-slate-950">
                        {isSelectedModelInstalled ? `${localModel} is ready` : `${localModel} is not installed`}
                      </div>
                      <div className="mt-1 max-w-xl text-xs leading-5 text-slate-600">
                        {status?.local?.running
                          ? 'Download once. If the Ollama CLI is missing from PATH, DevOps Lite falls back to the local HTTP API.'
                          : 'Start Ollama first, then refresh this panel.'}
                      </div>
                    </div>
                    {!isSelectedModelInstalled && (
                      <button
                        onClick={downloadEngine}
                        disabled={!status?.local?.running || pulling}
                        className="flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {pulling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        Download Engine
                      </button>
                    )}
                  </div>

                  {(pulling || pullProgress) && (
                    <div className="mt-4 rounded-md border border-white/70 bg-white/80 p-3">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900">Downloading {localModel}</div>
                          <div className="mt-0.5 truncate text-xs text-slate-600">
                            {pullProgress?.status || 'Waiting for Ollama...'}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">{pullPercent}%</span>
                          {pulling && (
                            <button
                              onClick={cancelDownload}
                              className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-[0.97]"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full bg-slate-900 transition-[width] duration-200 ease-out" style={{ width: `${pullPercent}%` }} />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        <span>{pullSize || 'Progress is reported by Ollama as each layer downloads.'}</span>
                        {pulling && (
                          <span>Keep this window open while the engine downloads.</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
          <div className="text-xs text-slate-500">
            {status?.canToggle ? 'Both backends are ready. Use Active route to switch per session.' : 'Settings are saved locally in your home directory.'}
          </div>
          <div className="flex gap-2">
            {!firstRun && (
              <button onClick={onClose} className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.97]">
                Cancel
              </button>
            )}
            <button
              onClick={() => save(firstRun)}
              disabled={saving || (firstRun && !canFinish)}
              className="flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {firstRun ? 'Finish setup' : 'Save settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISettingsModal;
