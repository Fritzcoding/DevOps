/**
 * Organization Plan Overlay Component
 * Preview and apply file organization changes
 */

import React, { useState } from 'react';
import { AlertTriangle, ArrowLeft, Check, ChevronDown, ChevronUp, X } from 'lucide-react';

interface RedundantFile {
  path: string;
  reason: string;
  action: 'DELETE' | 'ARCHIVE';
}

interface FileMove {
  from: string;
  to: string;
  reason: string;
}

interface OrganizationPlanProps {
  redundant_files: RedundantFile[];
  moves: FileMove[];
  new_dirs_to_create: string[];
  summary: string;
  risk_level: 'low' | 'medium' | 'high';
  explainability?: {
    architecture_summary?: string;
    detected_domains?: string[];
    coupling_hotspots?: string[];
    violations?: Array<{ rule: string; from: string; to: string; severity: 'low' | 'medium' | 'high'; reason: string }>;
    confidence_overview?: string;
  };
  onApply?: () => Promise<boolean | { success?: boolean; status?: string; [key: string]: any }>;
  onCancel?: () => void;
  onBack?: () => void;
}

const OrganizationPlanOverlay: React.FC<OrganizationPlanProps> = ({
  redundant_files,
  moves,
  new_dirs_to_create,
  summary,
  risk_level,
  explainability,
  onApply,
  onCancel,
  onBack,
}) => {
  const [expandedSections, setExpandedSections] = useState({
    layout: true,
    redundant: true,
    moves: true,
    dirs: false,
  });
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [applyDetails, setApplyDetails] = useState<any>(null);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      const success = await onApply?.();
      const normalizedSuccess = typeof success === 'boolean'
        ? success
        : Boolean(success?.success || success?.status === 'success');
      if (typeof success === 'object') {
        setApplyDetails(success);
      }
      setResult(normalizedSuccess ? 'success' : 'error');
    } catch (error) {
      setResult('error');
    } finally {
      setApplying(false);
    }
  };

  const riskColors = {
    low: 'bg-green-100 border-green-300 text-green-700',
    medium: 'bg-yellow-100 border-yellow-300 text-yellow-700',
    high: 'bg-red-100 border-red-300 text-red-700',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-cyan-800 text-white p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Organization Plan</h2>
            <p className="text-sm opacity-90 mt-1">{summary}</p>
          </div>
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 rounded px-3 py-2 text-sm font-semibold hover:bg-white hover:bg-opacity-20 transition"
                title="Back to menu"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
            <button
              onClick={onCancel}
              className="hover:bg-white hover:bg-opacity-20 p-2 rounded transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* Risk Warning */}
          <div className={`border rounded-lg p-4 mb-4 flex items-start gap-3 ${riskColors[risk_level]}`}>
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold capitalize">{risk_level} Risk Level</div>
              <div className="text-sm opacity-90">
                {risk_level === 'high'
                  ? 'Review carefully. This plan will make significant changes to your project.'
                  : risk_level === 'medium'
                    ? 'Review the changes. Some files will be modified or deleted.'
                    : 'Safe to apply. Only minor cleanup will be performed.'}
              </div>
            </div>
          </div>

          {/* Before / After Layout */}
          <div className="mb-3">
            <button
              onClick={() => toggleSection('layout')}
              className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition font-medium text-slate-800"
            >
              <div>{result === 'success' ? 'Applied Before / After' : 'Planned Before / After'}</div>
              {expandedSections.layout ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {expandedSections.layout && (
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-rose-200 bg-rose-50">
                  <div className="border-b border-rose-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-rose-700">Before</div>
                  <div className="max-h-56 space-y-2 overflow-auto p-3">
                    {moves.length === 0 ? (
                      <div className="text-sm text-rose-700">No moved files.</div>
                    ) : (
                      moves.map((move, idx) => (
                        <div key={`${move.from}-${idx}`} className="rounded border border-rose-100 bg-white px-2 py-2">
                          <div className="font-mono text-xs text-rose-700 break-all">{move.from}</div>
                          <div className="mt-1 text-[11px] text-rose-600">{result === 'success' ? 'Moved from this location' : 'Original location'}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50">
                  <div className="border-b border-emerald-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">After</div>
                  <div className="max-h-56 space-y-2 overflow-auto p-3">
                    {moves.length === 0 ? (
                      <div className="text-sm text-emerald-700">No destination changes.</div>
                    ) : (
                      moves.map((move, idx) => (
                        <div key={`${move.to}-${idx}`} className="rounded border border-emerald-100 bg-white px-2 py-2">
                          <div className="font-mono text-xs text-emerald-700 break-all">{move.to}</div>
                          <div className="mt-1 text-[11px] text-emerald-600">{result === 'success' ? 'Now located here' : 'Planned location'}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {result === 'success' && (
            <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                <Check className="h-4 w-4" />
                Applied filesystem result
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-emerald-800">
                <div className="rounded border border-emerald-100 bg-white p-2">
                  <div className="font-semibold">{applyDetails?.filesProcessed ?? moves.length}</div>
                  <div>Files moved</div>
                </div>
                <div className="rounded border border-emerald-100 bg-white p-2">
                  <div className="font-semibold">{applyDetails?.directoriesProcessed ?? new_dirs_to_create.length}</div>
                  <div>Directories created</div>
                </div>
                <div className="rounded border border-emerald-100 bg-white p-2">
                  <div className="font-semibold">{applyDetails?.operationsProcessed ?? moves.length + new_dirs_to_create.length}</div>
                  <div>Operations applied</div>
                </div>
              </div>
              {applyDetails?.rollbackLogPath && (
                <div className="mt-2 break-all rounded border border-emerald-100 bg-white p-2 font-mono text-[11px] text-emerald-700">
                  Rollback log: {applyDetails.rollbackLogPath}
                </div>
              )}
              <div className="mt-2 max-h-44 overflow-auto rounded border border-emerald-100 bg-white">
                {moves.length === 0 ? (
                  <div className="p-2 text-xs text-emerald-700">No file moves were applied.</div>
                ) : (
                  moves.map((move, idx) => (
                    <div key={`${move.from}-${move.to}-${idx}`} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2 border-b border-emerald-50 p-2 text-xs last:border-b-0">
                      <div className="min-w-0">
                        <div className="font-semibold text-rose-700">Before</div>
                        <div className="break-all font-mono text-slate-700">{move.from}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-emerald-700">After</div>
                        <div className="break-all font-mono text-slate-700">{move.to}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Redundant Files */}
          <div className="mb-3">
            <button
              onClick={() => toggleSection('redundant')}
              className="w-full flex items-center justify-between p-3 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition font-medium text-red-700"
            >
              <div>🗑️ Redundant Files ({redundant_files.length})</div>
              {expandedSections.redundant ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
            {expandedSections.redundant && (
              <div className="mt-2 space-y-2 ml-3">
                {redundant_files.length === 0 ? (
                  <div className="text-sm text-gray-500">No redundant files detected</div>
                ) : (
                  redundant_files.map((file, idx) => (
                    <div key={idx} className="text-sm bg-white border border-red-100 rounded p-2">
                      <div className="font-mono text-red-600 break-all">{file.path}</div>
                      <div className="text-gray-600 text-xs mt-1">{file.reason}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Moves */}
          <div className="mb-3">
            <button
              onClick={() => toggleSection('moves')}
              className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition font-medium text-blue-700"
            >
              <div>🔄 Files to Move ({moves.length})</div>
              {expandedSections.moves ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {expandedSections.moves && (
              <div className="mt-2 space-y-2 ml-3">
                {moves.length === 0 ? (
                  <div className="text-sm text-gray-500">No files to move</div>
                ) : (
                  moves.map((move, idx) => (
                    <div key={idx} className="text-sm bg-white border border-blue-100 rounded p-2">
                      <div className="font-mono text-gray-700 text-xs">
                        <div className="text-blue-600 break-all">{move.from}</div>
                        <div className="text-gray-500">↓</div>
                        <div className="text-green-600 break-all">{move.to}</div>
                      </div>
                      <div className="text-gray-600 text-xs mt-1">{move.reason}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Directories */}
          <div className="mb-3">
            <button
              onClick={() => toggleSection('dirs')}
              className="w-full flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition font-medium text-green-700"
            >
              <div>📁 New Directories ({new_dirs_to_create.length})</div>
              {expandedSections.dirs ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {expandedSections.dirs && (
              <div className="mt-2 space-y-2 ml-3">
                {new_dirs_to_create.length === 0 ? (
                  <div className="text-sm text-gray-500">No new directories needed</div>
                ) : (
                  new_dirs_to_create.map((dir, idx) => (
                    <div key={idx} className="text-sm bg-white border border-green-100 rounded p-2 font-mono text-green-600 break-all">
                      {dir}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {explainability && (
            <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-sm font-semibold text-slate-700">Architecture Explainability</div>
              <div className="mt-1 text-xs text-slate-600">{explainability.architecture_summary}</div>
              {explainability.confidence_overview && (
                <div className="mt-2 text-xs text-slate-700">{explainability.confidence_overview}</div>
              )}
              {!!explainability.detected_domains?.length && (
                <div className="mt-2 text-xs text-slate-700">Domains: {explainability.detected_domains.join(', ')}</div>
              )}
              {!!explainability.coupling_hotspots?.length && (
                <div className="mt-1 text-xs text-slate-700">Hotspots: {explainability.coupling_hotspots.slice(0, 5).join(', ')}</div>
              )}
              {!!explainability.violations?.length && (
                <div className="mt-2 space-y-1">
                  {explainability.violations.slice(0, 8).map((violation, idx) => (
                    <div key={idx} className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                      {violation.rule}: {violation.from} {'->'} {violation.to}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Result Message */}
          {result === 'success' && (
            <div className="bg-green-50 border border-green-300 text-green-700 p-3 rounded-lg flex items-center gap-2">
              <Check className="w-5 h-5" />
              <div>Organization completed successfully. Review the Applied Before / After section above for the final destinations.</div>
            </div>
          )}
          {result === 'error' && (
            <div className="bg-red-50 border border-red-300 text-red-700 p-3 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <div>✗ Organization failed. Check the console for details.</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 py-3 border-t flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={applying}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded transition font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          {!result && (
            <button
              onClick={handleApply}
              disabled={applying}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded transition font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {applying ? '⏳ Applying...' : 'Apply Changes'}
            </button>
          )}
          {result && (
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-600 text-white hover:bg-gray-700 rounded transition font-medium"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizationPlanOverlay;
