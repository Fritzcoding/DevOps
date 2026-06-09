import React, { useState } from 'react';
import { ArrowLeft, Brain, FolderTree, Play, X } from 'lucide-react';
import type { TestSample } from '../../window';

interface Props {
  projectPath: string;
  samples?: TestSample[];
  onUseSample?: (sample: TestSample) => void;
  onResetSamples?: () => void;
  onClose: () => void;
  onBack?: () => void;
  onPlanReady: (plan: any) => void;
}

export const FileOrganizerWorkbench: React.FC<Props> = ({ projectPath, samples = [], onUseSample, onResetSamples, onClose, onBack, onPlanReady }) => {
  const [mode, setMode] = useState<'professional' | 'ai'>('professional');
  const [instruction, setInstruction] = useState('Sort this project into a professional structure while keeping source code imports safe.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const organizerSamples = samples.filter((sample) => sample.feature === 'organizer');

  const selectSample = (sample: TestSample) => {
    onUseSample?.(sample);
    if (sample.key === 'file-organizer-ai') {
      setMode('ai');
      setInstruction('Group financial spreadsheets and receipts into Financials, documents into Documents, and images into Images. Rename poorly formatted names to snake_case.');
      return;
    }
    setMode('professional');
    setInstruction('Sort this project into a professional structure while keeping source code imports safe.');
  };

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.electronAPI.organizeFolder(projectPath, undefined, mode, instruction);
      if (result?.status === 'error') {
        setError(result.error || 'Organizer failed');
        return;
      }
      onPlanReady(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" data-electron-interactive="true">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-cyan-800 px-5 py-4 text-white">
          <div>
            <h2 className="text-lg font-semibold">File Organizer</h2>
            <p className="text-xs text-cyan-100">Create a professional or AI-guided organization plan before applying changes.</p>
          </div>
          <div className="flex items-center gap-2">
            {onBack && (
              <button onClick={onBack} className="flex items-center gap-2 rounded px-3 py-2 text-sm font-semibold hover:bg-white/10" aria-label="Back to menu">
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}
            <button onClick={onClose} className="rounded p-2 hover:bg-white/10" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-600">
            {projectPath}
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Test sample</span>
              <button onClick={onResetSamples} className="rounded px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100">Reset</button>
            </div>
            {organizerSamples.length ? (
              <div className="grid gap-2">
                {organizerSamples.map((sample) => (
                  <button
                    key={sample.key}
                    onClick={() => selectSample(sample)}
                    className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left hover:bg-slate-100"
                    title={sample.path}
                  >
                    <div className="text-sm font-semibold text-slate-900">{sample.label}</div>
                    <div className="truncate text-xs text-slate-500">{sample.description}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-500">Samples not available.</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setMode('professional')} className={`rounded-md border p-4 text-left ${mode === 'professional' ? 'border-cyan-800 bg-cyan-50' : 'border-slate-200'}`}>
              <FolderTree className="mb-2 h-5 w-5 text-cyan-800" />
              <div className="font-semibold">Professional sorting</div>
              <div className="text-xs text-slate-500">Conservative rules for docs, assets, scripts, tests, and cleanup.</div>
            </button>
            <button onClick={() => setMode('ai')} className={`rounded-md border p-4 text-left ${mode === 'ai' ? 'border-cyan-800 bg-cyan-50' : 'border-slate-200'}`}>
              <Brain className="mb-2 h-5 w-5 text-cyan-800" />
              <div className="font-semibold">AI instruction</div>
              <div className="text-xs text-slate-500">Describe exactly how the selected path should be sorted.</div>
            </button>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Sorting instruction</span>
            <textarea value={instruction} onChange={(e) => setInstruction(e.target.value)} rows={5} className="w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </label>

          {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="rounded-md px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Cancel</button>
            <button onClick={run} disabled={loading} className="flex items-center gap-2 rounded-md bg-cyan-800 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-900 disabled:opacity-50">
              <Play className="h-4 w-4" /> {loading ? 'Planning...' : 'Create Plan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileOrganizerWorkbench;
