/**
 * Diff Viewer Component
 * Shows before/after code comparison for Code Fixer
 */

import React from 'react';
import { Check, Copy, X } from 'lucide-react';

interface DiffViewerProps {
  original: string;
  fixed: string;
  explanation: string;
  language: string;
  confidence: number;
  onApply?: () => void;
  onCopy?: (text: string) => void;
  onClose?: () => void;
}

const DiffViewer: React.FC<DiffViewerProps> = ({
  original,
  fixed,
  explanation,
  language,
  confidence,
  onApply,
  onCopy,
  onClose,
}) => {
  const getHighlightedCode = (code: string, lang: string) => {
    // Simple syntax highlighting (expand as needed)
    let highlighted = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Basic keyword highlighting
    highlighted = highlighted
      .replace(/\b(const|let|var|function|class|import|export|return|if|else|for|while)\b/g, '<span style="color:#0066cc"><b>$1</b></span>');

    return highlighted;
  };

  const confidenceColor = confidence > 0.8 ? 'bg-green-100' : confidence > 0.5 ? 'bg-yellow-100' : 'bg-red-100';
  const confidenceLabel = confidence > 0.8 ? 'High' : confidence > 0.5 ? 'Medium' : 'Low';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 text-white p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Code Fix Suggestion</h2>
            <p className="text-sm opacity-90 mt-1">{explanation}</p>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white hover:bg-opacity-20 p-2 rounded transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* Metadata */}
          <div className="flex gap-4 mb-4 pb-4 border-b">
            <div className="text-sm">
              <span className="font-medium">Language:</span> <code className="bg-gray-100 px-2 py-1 rounded">{language}</code>
            </div>
            <div className={`text-sm px-3 py-1 rounded font-medium ${confidenceColor}`}>
              Confidence: {Math.round(confidence * 100)}% ({confidenceLabel})
            </div>
          </div>

          {/* Diff */}
          <div className="grid grid-cols-2 gap-4">
            {/* Original */}
            <div>
              <h3 className="font-semibold text-red-600 mb-2">Before</h3>
              <pre className="bg-red-50 border border-red-200 rounded p-3 overflow-x-auto text-xs leading-relaxed">
                <code dangerouslySetInnerHTML={{ __html: getHighlightedCode(original, language) }} />
              </pre>
              <button
                onClick={() => onCopy?.(original)}
                className="mt-2 text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
            </div>

            {/* Fixed */}
            <div>
              <h3 className="font-semibold text-green-600 mb-2">After</h3>
              <pre className="bg-green-50 border border-green-200 rounded p-3 overflow-x-auto text-xs leading-relaxed">
                <code dangerouslySetInnerHTML={{ __html: getHighlightedCode(fixed, language) }} />
              </pre>
              <button
                onClick={() => onCopy?.(fixed)}
                className="mt-2 text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 py-3 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded transition font-medium"
          >
            Close
          </button>
          {confidence > 0.5 && (
            <button
              onClick={onApply}
              className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded transition font-medium flex items-center gap-2"
            >
              <Check className="w-4 h-4" /> Apply Fix
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiffViewer;
