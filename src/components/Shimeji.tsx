import React, { useEffect, useRef, useState } from "react";
import { Palette, Settings, X } from "lucide-react";
import { DEFAULT_MASCOT_IMAGE, type UISettings } from "../ui-settings";

interface ShimejiProps {
  onFeatureSelect: (feature: "code-fixer" | "environment" | "organizer" | "chat" | "room" | "help" | "settings") => void;
  onMinimizeToTray: () => void;
  onShowMenu: () => void;
  onContextMenuChange?: (open: boolean) => void;
  onOpenAppearanceSettings?: () => void;
  currentProjectPath?: string;
  uiSettings: UISettings;
}

const Shimeji: React.FC<ShimejiProps> = ({
  onFeatureSelect,
  onMinimizeToTray,
  onShowMenu,
  onContextMenuChange,
  onOpenAppearanceSettings,
  currentProjectPath,
  uiSettings,
}) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const shimejiRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dragStartScreenRef = useRef({ x: 0, y: 0 });
  const isPointerDownRef = useRef(false);
  const pointerMovedRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const DRAG_THRESHOLD = 6;

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current || e.pointerId !== activePointerIdRef.current) return;

    const deltaX = e.screenX - dragStartScreenRef.current.x;
    const deltaY = e.screenY - dragStartScreenRef.current.y;
    if (!pointerMovedRef.current && (Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD)) {
      pointerMovedRef.current = true;
      setIsDragging(true);
    }
    if (pointerMovedRef.current) {
      const newX = dragOffsetRef.current.x + deltaX;
      const newY = dragOffsetRef.current.y + deltaY;
      window.electronAPI?.moveWindow?.(newX, newY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current || e.pointerId !== activePointerIdRef.current) return;

    isPointerDownRef.current = false;
    setIsDragging(false);
    activePointerIdRef.current = null;

    if (!pointerMovedRef.current) {
      setShowContextMenu(false);
      onShowMenu();
    }
    pointerMovedRef.current = false;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button === 2) {
      e.preventDefault();
      setShowContextMenu(!showContextMenu);
      return;
    }
    if (e.button !== 0) return;
    activePointerIdRef.current = e.pointerId;
    isPointerDownRef.current = true;
    pointerMovedRef.current = false;
    setIsDragging(false);
    dragOffsetRef.current = { x: window.screenX, y: window.screenY };
    dragStartScreenRef.current = { x: e.screenX, y: e.screenY };
    shimejiRef.current?.setPointerCapture(e.pointerId);
  };

  useEffect(() => {
    onContextMenuChange?.(showContextMenu);
  }, [showContextMenu, onContextMenuChange]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setShowContextMenu(false);
      }
    };
    if (showContextMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showContextMenu]);

  return (
    <div
      ref={shimejiRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={(e) => {
        e.preventDefault();
        setShowContextMenu(!showContextMenu);
      }}
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 9999,
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
        transition: "none",
        touchAction: "none",
        width: 64,
        height: 64,
      }}
      data-electron-interactive="true"
      className="h-16 w-16 rounded-full"
      title="DevOps Lite - Click to open or close menu | Right-click for options"
    >
      <div
        className={`h-16 w-16 overflow-hidden rounded-full border border-white/70 bg-white shadow-[0_12px_34px_rgba(8,74,92,0.28)] ${
          isDragging ? "" : `mascot-motion-${uiSettings.mascotMotion}`
        }`}
      >
        <img
          src={uiSettings.mascotImage || DEFAULT_MASCOT_IMAGE}
          alt="DevOps Lite shimeji"
          className="h-full w-full object-cover"
          draggable={false}
          onError={(event) => {
            if (event.currentTarget.src !== DEFAULT_MASCOT_IMAGE) {
              event.currentTarget.src = DEFAULT_MASCOT_IMAGE;
            }
          }}
        />
      </div>

      {showContextMenu && (
        <div
          ref={contextMenuRef}
          data-electron-interactive="true"
          className="absolute left-0 top-16 z-50 w-52 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-panel)] py-2 text-[var(--ui-text)] shadow-xl"
        >
          <button
            onClick={() => {
              onMinimizeToTray();
              setShowContextMenu(false);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-medium text-[var(--ui-text)] transition hover:bg-[var(--ui-hover)]"
          >
            <X className="h-4 w-4" />
            Minimize to Tray
          </button>
          <button
            onClick={() => {
              onOpenAppearanceSettings?.();
              setShowContextMenu(false);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-medium text-[var(--ui-text)] transition hover:bg-[var(--ui-hover)]"
          >
            <Palette className="h-4 w-4" />
            Appearance
          </button>
          <button
            onClick={() => {
              onFeatureSelect("settings");
              setShowContextMenu(false);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-medium text-[var(--ui-text)] transition hover:bg-[var(--ui-hover)]"
          >
            <Settings className="h-4 w-4" />
            AI Settings
          </button>
          {currentProjectPath && (
            <>
              <div className="my-1 border-t border-[var(--ui-border)]" />
              <div className="truncate px-4 py-2 text-xs text-[var(--ui-muted)]" title={currentProjectPath}>
                {currentProjectPath}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Shimeji;
