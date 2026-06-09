import React, { useState, useEffect, useRef, useCallback } from "react";
import Shimeji from "./components/Shimeji";
import FeatureMenu from "./components/FeatureMenu";
import DiffViewer from "./components/overlays/DiffViewer";
import SetupStepsOverlay from "./components/overlays/SetupStepsOverlay";
import EnvironmentBuilderWorkbench from "./components/overlays/EnvironmentBuilderWorkbench";
import OrganizationPlanOverlay from "./components/overlays/OrganizationPlanOverlay";
import PathInputModal from "./components/modals/PathInputModal";
import HelpModal from "./components/modals/HelpModal";
import AISettingsModal from "./components/modals/AISettingsModal";
import AppearanceSettingsModal from "./components/modals/AppearanceSettingsModal";
import CodeFixerAgentOverlay from "./components/overlays/CodeFixerAgentOverlay";
import FileOrganizerWorkbench from "./components/overlays/FileOrganizerWorkbench";
import CodebaseChatOverlay from "./components/overlays/CodebaseChatOverlay";
import DiscussionRoomOverlay from "./components/overlays/DiscussionRoomOverlay";
import { eventBus } from "./core/event-bus";
import type { TestSample } from "./window";
import { loadUISettings, saveUISettings, type UISettings } from "./ui-settings";

type FeatureId = "code-fixer" | "environment" | "organizer" | "chat" | "room" | "help" | "settings";
type PanelSize = { width: number; height: number };
const MASCOT_WINDOW_SIZE: PanelSize = { width: 96, height: 96 };
const CONTEXT_MENU_WINDOW_SIZE: PanelSize = { width: 260, height: 260 };
const MENU_WINDOW_SIZE: PanelSize = { width: 460, height: 640 };
const DEFAULT_CHAT_PANEL_SIZE: PanelSize = { width: 960, height: 720 };
const PATH_PANEL_SIZE: PanelSize = { width: 560, height: 520 };
const CODE_FIXER_PANEL_SIZE: PanelSize = { width: 1220, height: 780 };
const ORGANIZER_PANEL_SIZE: PanelSize = { width: 760, height: 660 };
const ENV_PANEL_SIZE: PanelSize = { width: 920, height: 720 };
const PLAN_PANEL_SIZE: PanelSize = { width: 920, height: 720 };
const ROOM_PANEL_SIZE: PanelSize = { width: 960, height: 720 };
const HELP_PANEL_SIZE: PanelSize = { width: 1060, height: 760 };
const SETTINGS_PANEL_SIZE: PanelSize = { width: 1080, height: 780 };
const APPEARANCE_PANEL_SIZE: PanelSize = { width: 900, height: 680 };
const STATUS_PANEL_SIZE: PanelSize = { width: 520, height: 420 };
const PANEL_SIZE_KEY = "devops-panel-size";
const LAST_PANEL_KEY = "devops-last-panel";

const loadPanelSize = (): PanelSize => {
  try {
    const parsed = JSON.parse(localStorage.getItem(PANEL_SIZE_KEY) || "null");
    if (typeof parsed?.width === "number" && typeof parsed?.height === "number") {
      return {
        width: Math.max(420, Math.min(1600, parsed.width)),
        height: Math.max(420, Math.min(1000, parsed.height)),
      };
    }
  } catch {
    // Ignore invalid saved panel geometry.
  }
  return DEFAULT_CHAT_PANEL_SIZE;
};

/**
 * DevOps Lite - Main Application
 * Renders the Shimeji floating character with feature menu and overlays
 */
export default function App() {
  const [projectPath, setProjectPath] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [shimejiContextOpen, setShimejiContextOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPathModal, setShowPathModal] = useState(false);

  // Code Fixer State
  const [showDiffViewer, setShowDiffViewer] = useState(false);
  const [codeFixResult, setCodeFixResult] = useState<any>(null);
  const [showCodeFixerAgent, setShowCodeFixerAgent] = useState(false);

  // Environment Builder State
  const [showSetupSteps, setShowSetupSteps] = useState(false);
  const [showEnvironmentWorkbench, setShowEnvironmentWorkbench] = useState(false);
  const [setupStepsData, setSetupStepsData] = useState<any>(null);

  // File Organizer State
  const [showOrganizationPlan, setShowOrganizationPlan] = useState(false);
  const [organizationPlan, setOrganizationPlan] = useState<any>(null);
  const [showOrganizerWorkbench, setShowOrganizerWorkbench] = useState(false);
  const [showCodebaseChat, setShowCodebaseChat] = useState(false);
  const [hasOpenedCodebaseChat, setHasOpenedCodebaseChat] = useState(false);
  const [showDiscussionRoom, setShowDiscussionRoom] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [showAppearanceSettings, setShowAppearanceSettings] = useState(false);
  const [aiStatus, setAIStatus] = useState<any>(null);
  const [testSamples, setTestSamples] = useState<TestSample[]>([]);
  const [panelSize, setPanelSize] = useState<PanelSize>(() => loadPanelSize());
  const [uiSettings, setUISettings] = useState<UISettings>(() => loadUISettings());
  const [lastPanel, setLastPanel] = useState<FeatureId | null>(() => {
    const saved = localStorage.getItem(LAST_PANEL_KEY);
    return saved === "code-fixer" || saved === "environment" || saved === "organizer" || saved === "chat" || saved === "room" || saved === "help" || saved === "settings"
      ? saved
      : null;
  });
  const restoredPanelRef = useRef(false);

  // Load saved project path on mount
  useEffect(() => {
    const saved = localStorage.getItem("devops-project-path");
    if (saved) {
      setProjectPath(saved);
      console.log("[App] Loaded project path:", saved);
      return;
    }

    window.electronAPI?.getCurrentProjectPath?.().then((result) => {
      if (result?.success && result.path) {
        saveProjectPath(result.path);
      }
    }).catch((error) => {
      console.debug("[App] Current project path auto-detect skipped:", error);
    });
  }, []);

  const refreshAIStatus = async () => {
    try {
      const result = await window.electronAPI?.getAIStatus?.();
      if (result?.success) {
        setAIStatus(result);
        if (!result.settings?.firstLaunchComplete) {
          setShowAISettings(true);
        }
      }
    } catch (error) {
      console.debug("[App] AI status check skipped:", error);
    }
  };

  useEffect(() => {
    refreshAIStatus();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.uiTheme = uiSettings.theme;
  }, [uiSettings.theme]);

  const refreshTestSamples = useCallback(async () => {
    try {
      const result = await window.electronAPI?.getTestSamples?.();
      if (result?.success && Array.isArray(result.samples)) {
        setTestSamples(result.samples);
      }
    } catch (error) {
      console.debug("[App] Test sample discovery skipped:", error);
    }
  }, []);

  useEffect(() => {
    refreshTestSamples();
  }, [refreshTestSamples]);

  useEffect(() => {
    if (restoredPanelRef.current || !lastPanel) return;
    if (!projectPath && (lastPanel === "chat" || lastPanel === "room" || lastPanel === "organizer")) return;
    restoredPanelRef.current = true;
    if (lastPanel === "chat") {
      setHasOpenedCodebaseChat(true);
      setShowCodebaseChat(true);
    } else if (lastPanel === "environment") {
      setShowEnvironmentWorkbench(true);
    } else if (lastPanel === "room") {
      setShowDiscussionRoom(true);
    } else if (lastPanel === "organizer") {
      setShowOrganizerWorkbench(true);
    } else if (lastPanel === "code-fixer") {
      setShowCodeFixerAgent(true);
    } else if (lastPanel === "help") {
      setShowHelpModal(true);
    } else if (lastPanel === "settings") {
      setShowAISettings(true);
    }
  }, [projectPath, lastPanel]);

  useEffect(() => {
    if (showAISettings) {
      setMenuOpen(false);
    }
  }, [showAISettings]);

  const anyPanelOpen =
    showCodeFixerAgent ||
    showEnvironmentWorkbench ||
    showOrganizerWorkbench ||
    showCodebaseChat ||
    showDiscussionRoom ||
    showHelpModal ||
    showAISettings ||
    showAppearanceSettings ||
    showPathModal ||
    showDiffViewer ||
    showSetupSteps ||
    showOrganizationPlan ||
    isLoading ||
    Boolean(error);

  const activeWindowSize = () => {
    if (showCodebaseChat) return panelSize;
    if (showCodeFixerAgent) return CODE_FIXER_PANEL_SIZE;
    if (showEnvironmentWorkbench) return ENV_PANEL_SIZE;
    if (showAISettings) return SETTINGS_PANEL_SIZE;
    if (showAppearanceSettings) return APPEARANCE_PANEL_SIZE;
    if (showHelpModal) return HELP_PANEL_SIZE;
    if (showDiscussionRoom) return ROOM_PANEL_SIZE;
    if (showOrganizerWorkbench) return ORGANIZER_PANEL_SIZE;
    if (showSetupSteps) return ENV_PANEL_SIZE;
    if (showOrganizationPlan || showDiffViewer) return PLAN_PANEL_SIZE;
    if (showPathModal) return PATH_PANEL_SIZE;
    if (isLoading || error) return STATUS_PANEL_SIZE;
    return MASCOT_WINDOW_SIZE;
  };

  useEffect(() => {
    const targetSize = anyPanelOpen
      ? activeWindowSize()
      : menuOpen
        ? MENU_WINDOW_SIZE
        : shimejiContextOpen
          ? CONTEXT_MENU_WINDOW_SIZE
          : MASCOT_WINDOW_SIZE;
    window.electronAPI?.resizeWindow?.(targetSize.width, targetSize.height);
  }, [
    anyPanelOpen,
    menuOpen,
    shimejiContextOpen,
    panelSize,
    showCodebaseChat,
    showCodeFixerAgent,
    showEnvironmentWorkbench,
    showAISettings,
    showAppearanceSettings,
    showHelpModal,
    showDiscussionRoom,
    showOrganizerWorkbench,
    showSetupSteps,
    showOrganizationPlan,
    showDiffViewer,
    showPathModal,
    isLoading,
    error,
  ]);

  const savePanelSize = useCallback((size: PanelSize) => {
    const next = {
      width: Math.max(420, Math.min(1600, Math.round(size.width))),
      height: Math.max(420, Math.min(1000, Math.round(size.height))),
    };
    setPanelSize(next);
    localStorage.setItem(PANEL_SIZE_KEY, JSON.stringify(next));
  }, []);

  const rememberPanel = (panel: FeatureId) => {
    setLastPanel(panel);
    localStorage.setItem(LAST_PANEL_KEY, panel);
  };

  const updateUISettings = (settings: UISettings) => {
    setUISettings(settings);
    saveUISettings(settings);
  };

  useEffect(() => {
    let lastIgnored: boolean | null = null;

    const setIgnored = (ignored: boolean) => {
      if (lastIgnored === ignored) return;
      lastIgnored = ignored;
      window.electronAPI?.setIgnoreMouseEvents?.(ignored);
    };

    const handleMouseMove = (event: MouseEvent) => {
      const target = document.elementFromPoint(event.clientX, event.clientY);
      const interactive = target instanceof Element && Boolean(target.closest("[data-electron-interactive='true']"));
      setIgnored(!interactive);
    };

    const handleMouseLeave = () => setIgnored(true);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    setIgnored(true);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.electronAPI?.setIgnoreMouseEvents?.(false);
    };
  }, []);

  // Handle project path selection
  const saveProjectPath = (path: string) => {
    setProjectPath(path);
    localStorage.setItem("devops-project-path", path);
    console.log("[App] Project path selected:", path);
  };

  const handleSelectPath = async () => {
    try {
      const result = await window.electronAPI?.selectProjectPath?.();
      if (result?.success && result?.path) {
        saveProjectPath(result.path);
      }
    } catch (error) {
      console.error("[App] Failed to select path:", error);
      setError("Failed to select project path");
    }
  };

  const handleUseCurrentProjectPath = async () => {
    try {
      const result = await window.electronAPI?.getCurrentProjectPath?.();
      if (result?.success && result.path) {
        saveProjectPath(result.path);
        return;
      }
      setError(result?.error || "Could not detect the current project path");
    } catch (error) {
      console.error("[App] Failed to detect current path:", error);
      setError("Could not detect the current project path");
    }
  };

  const handleUseSample = (sample: TestSample) => {
    saveProjectPath(sample.projectPath || sample.path);
  };

  const handleResetSamples = async () => {
    try {
      const result = await window.electronAPI?.resetTestSamples?.();
      if (result?.success) {
        setTestSamples(result.samples || []);
        const activeSample = result.samples?.find((sample: TestSample) => (sample.projectPath || sample.path) === projectPath);
        if (!activeSample && projectPath.includes("samples")) {
          setProjectPath("");
          localStorage.removeItem("devops-project-path");
        }
        return;
      }
      setError(result?.error || "Could not reset test samples");
    } catch (error) {
      console.error("[App] Failed to reset samples:", error);
      setError("Could not reset test samples");
    }
  };

  // ============================================
  // FEATURE HANDLERS
  // ============================================

  const handleCodeFixer = async () => {
    rememberPanel("code-fixer");
    setShowCodeFixerAgent(true);
    setMenuOpen(false);
  };

  const handleEnvironmentBuilder = async () => {
    rememberPanel("environment");
    setShowEnvironmentWorkbench(true);
    setMenuOpen(false);
  };

  const handleFileOrganizer = async () => {
    if (!projectPath) {
      setError("Please select a project path first");
      return;
    }
    rememberPanel("organizer");
    setShowOrganizerWorkbench(true);
    setMenuOpen(false);
  };

  const handleFeatureSelect = (feature: FeatureId) => {
    console.log("[App] Feature selected:", feature);
    
    switch (feature) {
      case 'code-fixer':
        handleCodeFixer();
        break;
      case 'environment':
        handleEnvironmentBuilder();
        break;
      case 'organizer':
        handleFileOrganizer();
        break;
      case 'chat':
        if (!projectPath) setError("Please select a project path first");
        else {
          rememberPanel("chat");
          setHasOpenedCodebaseChat(true);
          setShowCodebaseChat(true);
        }
        break;
      case 'room':
        if (!projectPath) setError("Please select a project path first");
        else {
          rememberPanel("room");
          setShowDiscussionRoom(true);
        }
        break;
      case 'help':
        rememberPanel("help");
        setShowHelpModal(true);
        break;
      case 'settings':
        rememberPanel("settings");
        setMenuOpen(false);
        setShowAISettings(true);
        break;
      default:
        console.warn("[App] Unknown feature:", feature);
    }
  };

  const handleApplyOrganization = async (): Promise<any> => {
    if (!projectPath || !organizationPlan) return false;
    
    try {
      const result = await window.electronAPI?.applyOrganization?.(
        projectPath,
        organizationPlan
      );
      if (result?.status === 'error') {
        setError(result?.error || 'Failed to apply organization');
        return result;
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return false;
    }
  };

  const closeVisiblePanels = () => {
    setMenuOpen(false);
    setShowPathModal(false);
    setShowCodeFixerAgent(false);
    setShowEnvironmentWorkbench(false);
    setShowOrganizerWorkbench(false);
    setShowCodebaseChat(false);
    setShowDiscussionRoom(false);
    setShowHelpModal(false);
    setShowAISettings(false);
    setShowAppearanceSettings(false);
    setShowDiffViewer(false);
    setShowSetupSteps(false);
    setShowOrganizationPlan(false);
    setError(null);
  };

  const handleBackToMenu = () => {
    closeVisiblePanels();
    setMenuOpen(true);
  };

  const handleShimejiClick = () => {
    if (anyPanelOpen || menuOpen) {
      closeVisiblePanels();
      return;
    }

    if (showAISettings) {
      setShowAISettings(false);
      setMenuOpen(false);
      return;
    }

    if (!aiStatus?.settings?.firstLaunchComplete) {
      setShowAISettings(true);
      setMenuOpen(false);
      return;
    }

    if (!menuOpen && !anyPanelOpen && lastPanel) {
      handleFeatureSelect(lastPanel);
      return;
    }

    setMenuOpen((open) => !open);
  };

  return (
    <div className="ui-shell">
      {/* Shimeji Widget */}
      <Shimeji
        onFeatureSelect={handleFeatureSelect}
        onMinimizeToTray={() => {
          window.electronAPI?.minimizeToTray?.();
        }}
        onShowMenu={handleShimejiClick}
        onContextMenuChange={setShimejiContextOpen}
        onOpenAppearanceSettings={() => {
          closeVisiblePanels();
          setShowAppearanceSettings(true);
        }}
        currentProjectPath={projectPath}
        uiSettings={uiSettings}
      />

      {/* Feature Menu */}
      {menuOpen && (
        <FeatureMenu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          onFeatureSelect={handleFeatureSelect}
          currentProjectPath={projectPath}
          onChangeProjectPath={() => setShowPathModal(true)}
          onUseCurrentProjectPath={handleUseCurrentProjectPath}
          onOpenAppearanceSettings={() => setShowAppearanceSettings(true)}
          onDeactivate={() => window.electronAPI?.deactivateApp?.()}
          aiStatus={aiStatus}
          onSetActiveAIBackend={async (backend) => {
            await window.electronAPI?.setActiveAIBackend?.(backend);
            await refreshAIStatus();
          }}
        />
      )}

      <PathInputModal
        isOpen={showPathModal}
        onClose={() => setShowPathModal(false)}
        onBack={handleBackToMenu}
        onSelectPath={async (path) => saveProjectPath(path)}
        title="Project Path"
        description="Choose a project folder for Environment and File Organizer"
      />

      {showCodeFixerAgent && (
        <CodeFixerAgentOverlay
          projectPath={projectPath}
          samples={testSamples}
          onUseSample={handleUseSample}
          onResetSamples={handleResetSamples}
          onClose={() => setShowCodeFixerAgent(false)}
          onBack={handleBackToMenu}
        />
      )}

      {showEnvironmentWorkbench && (
        <EnvironmentBuilderWorkbench
          projectPath={projectPath}
          samples={testSamples}
          onUseSample={handleUseSample}
          onResetSamples={handleResetSamples}
          onClose={() => setShowEnvironmentWorkbench(false)}
          onBack={handleBackToMenu}
          onDetected={(data) => {
            setSetupStepsData(data);
            setShowEnvironmentWorkbench(false);
            setShowSetupSteps(true);
          }}
        />
      )}

      {showOrganizerWorkbench && (
        <FileOrganizerWorkbench
          projectPath={projectPath}
          samples={testSamples}
          onUseSample={handleUseSample}
          onResetSamples={handleResetSamples}
          onClose={() => setShowOrganizerWorkbench(false)}
          onBack={handleBackToMenu}
          onPlanReady={(plan) => {
            setOrganizationPlan({
              redundant_files: plan?.redundant_files || [],
              moves: plan?.moves || [],
              new_dirs_to_create: plan?.new_dirs_to_create || [],
              summary: plan?.summary || "File organization plan ready",
              risk_level: plan?.risk_level || "low",
              explainability: plan?.explainability,
              semantic_graph: plan?.semantic_graph,
              refactor_plan: plan?.refactor_plan,
            });
            setShowOrganizerWorkbench(false);
            setShowOrganizationPlan(true);
          }}
        />
      )}

      {hasOpenedCodebaseChat && (
        <CodebaseChatOverlay
          projectPath={projectPath}
          visible={showCodebaseChat}
          panelSize={panelSize}
          onPanelSizeChange={savePanelSize}
          onClose={() => setShowCodebaseChat(false)}
          onBack={handleBackToMenu}
        />
      )}

      {showDiscussionRoom && (
        <DiscussionRoomOverlay
          projectPath={projectPath}
          onClose={() => setShowDiscussionRoom(false)}
          onBack={handleBackToMenu}
        />
      )}

      {showHelpModal && (
        <HelpModal onClose={() => setShowHelpModal(false)} onBack={handleBackToMenu} />
      )}

      {showAISettings && (
        <AISettingsModal
          firstRun={!aiStatus?.settings?.firstLaunchComplete}
          onClose={() => setShowAISettings(false)}
          onSaved={refreshAIStatus}
          onBack={handleBackToMenu}
        />
      )}

      {showAppearanceSettings && (
        <AppearanceSettingsModal
          settings={uiSettings}
          onSave={updateUISettings}
          onClose={() => setShowAppearanceSettings(false)}
          onBack={handleBackToMenu}
        />
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50" data-electron-interactive="true">
          <div className="bg-white rounded-lg p-6 shadow-xl flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-gray-700 font-medium">Processing...</p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-100 border border-red-300 rounded-lg p-4 max-w-sm shadow-lg" data-electron-interactive="true">
          <p className="text-red-800 font-medium">Error</p>
          <p className="text-red-700 text-sm mt-1">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-xs bg-red-200 hover:bg-red-300 px-3 py-1 rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Code Fixer Overlay */}
      {showDiffViewer && codeFixResult && (
        <div data-electron-interactive="true">
          <DiffViewer
            original={codeFixResult.original}
            fixed={codeFixResult.fixed}
            explanation={codeFixResult.explanation}
            language={codeFixResult.language}
            confidence={codeFixResult.confidence}
            onClose={() => setShowDiffViewer(false)}
          />
        </div>
      )}

      {/* Environment Setup Overlay */}
      {showSetupSteps && setupStepsData && (
        <div data-electron-interactive="true">
          <SetupStepsOverlay
            detected_type={setupStepsData.detected_type}
            missing_tools={setupStepsData.missing_tools}
            setup_steps={setupStepsData.setup_steps}
            env_vars_needed={setupStepsData.env_vars_needed}
            estimated_minutes={setupStepsData.estimated_minutes}
            onExecuteStep={async (step) => {
              const result = await window.electronAPI.setupEnv(projectPath, step.command);
              if (result?.status === 'error') {
                setError(result.error || 'Setup step failed');
                return false;
              }
              return Boolean(result?.success || result?.status === 'success');
            }}
            onClose={() => setShowSetupSteps(false)}
            onBack={handleBackToMenu}
          />
        </div>
      )}

      {/* File Organization Overlay */}
      {showOrganizationPlan && organizationPlan && (
        <div data-electron-interactive="true">
          <OrganizationPlanOverlay
            redundant_files={organizationPlan.redundant_files}
            moves={organizationPlan.moves}
            new_dirs_to_create={organizationPlan.new_dirs_to_create}
            summary={organizationPlan.summary}
            risk_level={organizationPlan.risk_level}
            explainability={organizationPlan.explainability}
            onApply={handleApplyOrganization}
            onCancel={() => setShowOrganizationPlan(false)}
            onBack={handleBackToMenu}
          />
        </div>
      )}
    </div>
  );
}
