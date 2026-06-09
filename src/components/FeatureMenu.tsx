import React, { useState, useRef, useEffect } from 'react';
import { Bot, Cloud, Crosshair, FolderOpen, HelpCircle, Laptop, MessageSquare, Package, Palette, Power, Settings, Users, X } from 'lucide-react';

interface FeatureMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onFeatureSelect: (feature: 'code-fixer' | 'environment' | 'organizer' | 'chat' | 'room' | 'help' | 'settings') => void;
  currentProjectPath: string | null;
  onChangeProjectPath: () => void;
  onUseCurrentProjectPath: () => void;
  onOpenAppearanceSettings: () => void;
  onDeactivate: () => void;
  aiStatus?: any;
  onSetActiveAIBackend?: (backend: 'cloud' | 'local') => void;
}

/**
 * Feature Menu Popup - Minimal window showing features & project path
 * Appears on Shimeji click
 */
export const FeatureMenu: React.FC<FeatureMenuProps> = ({
  isOpen,
  onClose,
  onFeatureSelect,
  currentProjectPath,
  onChangeProjectPath,
  onUseCurrentProjectPath,
  onOpenAppearanceSettings,
  onDeactivate,
  aiStatus,
  onSetActiveAIBackend,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const features = [
    {
      key: 'code-fixer' as const,
      icon: Bot,
      label: 'Code Fixer',
      description: 'Project-aware AI repair',
      color: 'bg-slate-950',
    },
    {
      key: 'environment' as const,
      icon: Package,
      label: 'Environment',
      description: 'Setup & detect environments',
      color: 'bg-cyan-800',
    },
    {
      key: 'organizer' as const,
      icon: FolderOpen,
      label: 'File Organizer',
      description: 'Reorganize project files',
      color: 'bg-teal-700',
    },
    {
      key: 'chat' as const,
      icon: MessageSquare,
      label: 'Codebase Chat',
      description: 'Ask with repo context',
      color: 'bg-sky-700',
    },
    {
      key: 'room' as const,
      icon: Users,
      label: 'Dev Room',
      description: 'Shared notes by key',
      color: 'bg-slate-700',
    },
  ];

  return (
    <div className="fixed left-16 top-16 z-50 pointer-events-none" data-electron-interactive="true">
      <div
        ref={menuRef}
        className="animate-popIn pointer-events-auto relative max-h-[32rem] w-[22rem] overflow-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-panel)] p-4 text-[var(--ui-text)] shadow-[var(--ui-shadow)] backdrop-blur-xl"
      >
        <div className="absolute -top-2 left-8 h-4 w-4 rotate-45 rounded-sm border-l border-t border-[var(--ui-border)] bg-[var(--ui-panel)]" />

        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold tracking-tight text-[var(--ui-text)]">DevOps Lite</p>
            <p className="text-xs text-[var(--ui-muted)]">Code workbench and project tools</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[var(--ui-muted)] transition-colors hover:bg-[var(--ui-hover)] active:scale-[0.97]"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid gap-2">
          {features.map(({ key, icon: Icon, label, description, color }) => (
            <button
              key={key}
              onClick={() => {
                onFeatureSelect(key);
                onClose();
              }}
              className={`group flex items-center gap-3 rounded-lg px-4 py-3 ${color} text-white shadow-sm transition-[transform,box-shadow,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]`}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-white/15 text-white transition-colors duration-300 group-hover:bg-white/20">
                <Icon className="w-5 h-5" />
              </span>
              <div className="text-left">
                <div className="font-semibold text-sm">{label}</div>
                <div className="text-xs opacity-90">{description}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-soft)] p-3">
          <div className="mb-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">Project path</div>
            <div className="mt-1 truncate text-xs text-[var(--ui-text)]" title={currentProjectPath || undefined}>
              {currentProjectPath || 'No project path selected'}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onChangeProjectPath}
              className="flex items-center justify-center gap-1 rounded-md border border-[var(--ui-border)] bg-[var(--ui-panel)] px-2 py-2 text-xs font-semibold text-[var(--ui-text)] transition hover:bg-[var(--ui-hover)] active:scale-[0.97]"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Browse
            </button>
            <button
              onClick={onUseCurrentProjectPath}
              className="flex items-center justify-center gap-1 rounded-md border border-[var(--ui-border)] bg-[var(--ui-panel)] px-2 py-2 text-xs font-semibold text-[var(--ui-text)] transition hover:bg-[var(--ui-hover)] active:scale-[0.97]"
            >
              <Crosshair className="w-3.5 h-3.5" />
              Current
            </button>
            <button
              onClick={onDeactivate}
              className="flex items-center justify-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 active:scale-[0.97]"
            >
              <Power className="w-3.5 h-3.5" />
              Deactivate
            </button>
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-panel)] p-3">
          {aiStatus?.canToggle && (
            <div className="mb-3 rounded-md border border-[var(--ui-border)] bg-[var(--ui-soft)] p-2">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">AI route</span>
                <button
                  onClick={() => onFeatureSelect('settings')}
                  className="rounded p-1 text-[var(--ui-muted)] transition hover:bg-[var(--ui-hover)] active:scale-[0.97]"
                  aria-label="Open AI settings"
                >
                  <Settings className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {[
                  ['cloud', Cloud, 'Cloud'],
                  ['local', Laptop, 'Local'],
                ].map(([value, Icon, label]) => (
                  <button
                    key={value as string}
                    onClick={() => onSetActiveAIBackend?.(value as 'cloud' | 'local')}
                    className={`flex items-center justify-center gap-1.5 rounded px-2 py-1.5 text-xs font-semibold transition active:scale-[0.97] ${
                      aiStatus.settings?.activeBackend === value
                        ? 'bg-[var(--ui-primary)] text-white'
                        : 'bg-[var(--ui-panel)] text-[var(--ui-muted)] hover:bg-[var(--ui-hover)]'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label as string}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                onOpenAppearanceSettings();
                onClose();
              }}
              className="flex items-center justify-center gap-2 rounded-md border border-[var(--ui-border)] bg-[var(--ui-panel)] px-3 py-2 text-sm font-semibold text-[var(--ui-text)] transition hover:bg-[var(--ui-hover)] active:scale-[0.97]"
            >
              <Palette className="w-4 h-4" />
              Design
            </button>
            <button
              onClick={() => {
                onFeatureSelect('settings');
                onClose();
              }}
              className="flex items-center justify-center gap-2 rounded-md border border-[var(--ui-border)] bg-[var(--ui-panel)] px-3 py-2 text-sm font-semibold text-[var(--ui-text)] transition hover:bg-[var(--ui-hover)] active:scale-[0.97]"
            >
              <Settings className="w-4 h-4" />
              AI
            </button>
            <button
              onClick={() => {
                onFeatureSelect('help');
                onClose();
              }}
              className="flex items-center justify-center gap-2 rounded-md border border-[var(--ui-primary)] bg-[var(--ui-primary)] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[var(--ui-primary-hover)] active:scale-[0.97]"
            >
              <HelpCircle className="w-4 h-4" />
              Help
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureMenu;
