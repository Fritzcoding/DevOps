import React, { useState, useRef, useEffect } from 'react';
import { X, Zap, Package, FolderOpen, HelpCircle, ChevronRight } from 'lucide-react';

interface FeatureMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onFeatureSelect: (feature: 'code-fixer' | 'environment' | 'organizer' | 'help') => void;
  currentProjectPath: string | null;
  onChangeProjectPath: () => void;
  onRefreshProjectPath: () => void;
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
  onRefreshProjectPath,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isLoadingPath, setIsLoadingPath] = useState(false);

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
      icon: Zap,
      label: 'Code Fixer',
      description: 'Auto-fix bugs & optimize',
      color: 'from-blue-600 to-blue-500',
    },
    {
      key: 'environment' as const,
      icon: Package,
      label: 'Environment',
      description: 'Setup & detect environments',
      color: 'from-orange-600 to-orange-500',
    },
    {
      key: 'organizer' as const,
      icon: FolderOpen,
      label: 'File Organizer',
      description: 'Reorganize project files',
      color: 'from-purple-600 to-purple-500',
    },
  ];

  return (
    <div className="fixed left-16 top-20 z-50 pointer-events-none" data-electron-interactive="true">
      <div
        ref={menuRef}
        className="pointer-events-auto relative min-w-[18rem] rounded-lg border border-white/70 bg-white/95 shadow-2xl backdrop-blur-xl p-4 animate-popIn"
      >
        <div className="absolute -top-2 left-8 h-4 w-4 rotate-45 rounded-sm bg-white/95 border-t border-l border-white/80" />

        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">DevOps Lite</p>
            <p className="text-xs text-slate-500">Quick actions bubble</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid gap-3">
          {features.map(({ key, icon: Icon, label, description, color }) => (
            <button
              key={key}
              onClick={() => {
                onFeatureSelect(key);
                onClose();
              }}
              className={`group flex items-center gap-3 rounded-lg px-4 py-3 bg-gradient-to-r ${color} text-white shadow-lg shadow-slate-200/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-white/15 text-white transition-colors duration-300 group-hover:bg-white/25">
                <Icon className="w-5 h-5" />
              </span>
              <div className="text-left">
                <div className="font-semibold text-sm">{label}</div>
                <div className="text-xs opacity-90">{description}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-lg bg-slate-950/5 p-3 border border-slate-200/80">
          <button
            onClick={() => {
              onFeatureSelect('help');
              onClose();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <HelpCircle className="w-4 h-4" />
            Help & shortcuts
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeatureMenu;
