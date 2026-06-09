import React, { useState } from 'react';
import { AlertCircle, ArrowLeft, Bot, ChevronRight, Code2, FolderTree, KeyRound, MessageSquare, Users, X } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
  onBack?: () => void;
}

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'shortcuts', label: 'Shortcuts' },
  { id: 'tools', label: 'Tools' },
  { id: 'faq', label: 'FAQ' },
] as const;

const shortcuts = [
  { key: 'Ctrl+Alt+C', action: 'Open Code Fixer' },
  { key: 'Ctrl+Alt+E', action: 'Open Environment Builder' },
  { key: 'Ctrl+Alt+O', action: 'Open File Organizer' },
  { key: 'Ctrl+Shift+D', action: 'Toggle Debug Panel' },
];

const tools = [
  {
    icon: Code2,
    title: 'Code Fixer',
    text: 'Project-aware AI repair with preview and auto-apply.',
  },
  {
    icon: FolderTree,
    title: 'File Organizer',
    text: 'Professional sorting or AI-guided restructuring for the selected project.',
  },
  {
    icon: MessageSquare,
    title: 'Codebase Chat',
    text: 'Ask questions against the active codebase context.',
  },
  {
    icon: Users,
    title: 'Development Room',
    text: 'Create or join a shared project note room by key.',
  },
];

const faqs = [
  {
    question: 'How do I make Code Fixer use the whole codebase?',
    answer: 'Open Code Fixer and choose the Codebase scope. The agent scans relevant files before suggesting a patch.',
  },
  {
    question: 'How do I auto-apply a fix?',
    answer: 'Open Code Fixer and use the Auto apply fix button. It generates the patch and writes it to disk.',
  },
  {
    question: 'How do I switch project folders?',
    answer: 'Use Browse or Current in the feature menu. The selected path is saved locally.',
  },
  {
    question: 'How do rooms work?',
    answer: 'Create a room key, share it with teammates using the same project folder, and edit the shared note file together.',
  },
];

export const HelpModal: React.FC<HelpModalProps> = ({ onClose, onBack }) => {
  const [tab, setTab] = useState<(typeof tabs)[number]['id']>('overview');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" data-electron-interactive="true">
      <div className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_120px_rgba(2,6,23,0.4)]">
        <div className="flex items-start justify-between border-b border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-6 py-5 text-white">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-slate-100">
              <AlertCircle className="h-3.5 w-3.5" />
              Help and shortcuts
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Use the workspace like a tool, not a tour.</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              The app is built around a project path. Once a path is selected, the code fixer, organizer, chat, and room all work from that context.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onBack && (
              <button onClick={onBack} className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white" aria-label="Back to menu">
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}
            <button onClick={onClose} className="rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white" aria-label="Close help">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex border-b border-slate-200 bg-slate-50 px-4">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`px-4 py-3 text-sm font-semibold transition ${
                tab === item.id ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-6">
          {tab === 'overview' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-lg font-semibold text-slate-900">Current workflow</h3>
                <ul className="mt-3 space-y-3 text-sm text-slate-700">
                  <li className="flex gap-3"><span className="font-semibold text-slate-500">1.</span> Select or detect a project path.</li>
                  <li className="flex gap-3"><span className="font-semibold text-slate-500">2.</span> Open a tool from the feature menu.</li>
                  <li className="flex gap-3"><span className="font-semibold text-slate-500">3.</span> Review the output, then auto-apply when you trust it.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">Useful actions</h3>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <div className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-slate-500" /> Create or join a development room by key.</div>
                  <div className="flex items-center gap-2"><Bot className="h-4 w-4 text-slate-500" /> Use Code Fixer in codebase scope for broader context.</div>
                  <div className="flex items-center gap-2"><ChevronRight className="h-4 w-4 text-slate-500" /> Use Current in the menu to re-read the current path.</div>
                </div>
              </div>
            </div>
          )}

          {tab === 'shortcuts' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">Global shortcuts</h3>
                <div className="mt-3 space-y-2">
                  {shortcuts.map((shortcut) => (
                    <div key={shortcut.key} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                      <span className="text-slate-700">{shortcut.action}</span>
                      <kbd className="rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-white">{shortcut.key}</kbd>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-lg font-semibold text-slate-900">Code Fixer actions</h3>
                <div className="mt-3 space-y-3 text-sm text-slate-700">
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="font-semibold text-slate-900">Preview fix</div>
                    <div className="mt-1">Runs the agent and shows proposed changes before writing anything.</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="font-semibold text-slate-900">Auto apply fix</div>
                    <div className="mt-1">Generates the patch and writes it to disk in one action. Use <kbd className="rounded bg-slate-900 px-1.5 py-0.5 text-[11px] text-white">Ctrl+Enter</kbd> or <kbd className="rounded bg-slate-900 px-1.5 py-0.5 text-[11px] text-white">Cmd+Enter</kbd>.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'tools' && (
            <div className="grid gap-4 md:grid-cols-2">
              {tools.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="font-semibold text-slate-900">{title}</div>
                      <div className="text-sm text-slate-500">{text}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'faq' && (
            <div className="space-y-3">
              {faqs.map((item) => (
                <details key={item.question} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">{item.question}</summary>
                  <p className="mt-2 text-sm text-slate-600">{item.answer}</p>
                </details>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
