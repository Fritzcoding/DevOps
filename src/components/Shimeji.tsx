import React, { useEffect, useRef, useState } from "react";
import { Zap, Settings, X } from "lucide-react";

interface ShimejiProps {
  onFeatureSelect: (feature: "code-fixer" | "environment" | "organizer" | "help" | "settings") => void;
  onMinimizeToTray: () => void;
  onShowMenu: () => void;
  currentProjectPath?: string;
}

const Shimeji: React.FC<ShimejiProps> = ({
  onFeatureSelect,
  onMinimizeToTray,
  onShowMenu,
  currentProjectPath,
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
      className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg flex items-center justify-center"
      title="DevOps Lite - Click to open menu | Right-click for options"
    >
      <Zap className="w-8 h-8 text-white" />

      {showContextMenu && (
        <div
          ref={contextMenuRef}
          data-electron-interactive="true"
          className="absolute top-16 left-0 bg-white rounded-lg shadow-xl border border-gray-200 py-2 w-48 z-50"
        >
          <button
            onClick={() => {
              onMinimizeToTray();
              setShowContextMenu(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium text-gray-700 flex items-center gap-2"
          >
            <X className="w-4 h-4" /> Minimize to Tray
          </button>
          <button
            onClick={() => {
              onFeatureSelect("settings");
              setShowContextMenu(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium text-gray-700 flex items-center gap-2"
          >
            <Settings className="w-4 h-4" /> Settings
          </button>
          <div className="border-t border-gray-200 my-1" />
          <div className="px-4 py-2 text-xs text-gray-500">
            {currentProjectPath && <div className="truncate">📁 {currentProjectPath}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Shimeji;
