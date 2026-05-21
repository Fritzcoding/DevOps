import React, { useState, useEffect } from "react";
import Shimeji from "./components/Shimeji";
import FeatureMenu from "./components/FeatureMenu";
import DiffViewer from "./components/overlays/DiffViewer";
import SetupStepsOverlay from "./components/overlays/SetupStepsOverlay";
import OrganizationPlanOverlay from "./components/overlays/OrganizationPlanOverlay";
import { eventBus } from "./core/event-bus";

/**
 * DevOps Lite - Main Application
 * Renders the Shimeji floating character with feature menu and overlays
 */
export default function App() {
  const [projectPath, setProjectPath] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Code Fixer State
  const [showDiffViewer, setShowDiffViewer] = useState(false);
  const [codeFixResult, setCodeFixResult] = useState<any>(null);

  // Environment Builder State
  const [showSetupSteps, setShowSetupSteps] = useState(false);
  const [setupStepsData, setSetupStepsData] = useState<any>(null);

  // File Organizer State
  const [showOrganizationPlan, setShowOrganizationPlan] = useState(false);
  const [organizationPlan, setOrganizationPlan] = useState<any>(null);

  // Load saved project path on mount
  useEffect(() => {
    const saved = localStorage.getItem("devops-project-path");
    if (saved) {
      setProjectPath(saved);
      console.log("[App] Loaded project path:", saved);
    }
  }, []);

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
  const handleSelectPath = async () => {
    try {
      const result = await window.electronAPI?.selectProjectPath?.();
      if (result?.success && result?.path) {
        setProjectPath(result.path);
        localStorage.setItem("devops-project-path", result.path);
        console.log("[App] Project path selected:", result.path);
      }
    } catch (error) {
      console.error("[App] Failed to select path:", error);
      setError("Failed to select project path");
    }
  };

  // ============================================
  // FEATURE HANDLERS
  // ============================================

  const handleCodeFixer = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // For now, we'll assume clipboard content and use a sample
      // In a real app, we'd need to read from system clipboard
      const code = `
function add(a, b) {
  return a + b
}  // Missing semicolon and brace
const result = add(5 3);
`;
      
      // Fix the code
      const result = await window.electronAPI?.fixCode?.(code, 'javascript', '');
      if (!result || result?.status === 'error') {
        setError(result?.error || 'Failed to fix code');
        setIsLoading(false);
        return;
      }

      setCodeFixResult({
        original: code,
        fixed: result?.fixed || code,
        explanation: result?.explanation || 'Code fixed',
        language: 'javascript',
        confidence: 0.8,
      });
      setShowDiffViewer(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error("[App] Code fixer error:", err);
    } finally {
      setIsLoading(false);
      setMenuOpen(false);
    }
  };

  const handleEnvironmentBuilder = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!projectPath) {
        setError("Please select a project path first");
        setIsLoading(false);
        return;
      }

      // Detect environment
      const result = await window.electronAPI?.detectEnv?.(projectPath);
      if (result?.status === 'error') {
        setError(result?.error || 'Failed to detect environment');
        setIsLoading(false);
        return;
      }

      setSetupStepsData({
        detected_type: result?.detected_type || 'unknown',
        missing_tools: result?.missing_tools || [],
        setup_steps: result?.setup_steps || [],
        env_vars_needed: result?.env_vars_needed || [],
        estimated_minutes: result?.estimated_minutes || 0,
      });
      setShowSetupSteps(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error("[App] Environment builder error:", err);
    } finally {
      setIsLoading(false);
      setMenuOpen(false);
    }
  };

  const handleFileOrganizer = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!projectPath) {
        setError("Please select a project path first");
        setIsLoading(false);
        return;
      }

      // Organize folder
      const result = await window.electronAPI?.organizeFolder?.(projectPath);
      if (result?.status === 'error') {
        setError(result?.error || 'Failed to organize files');
        setIsLoading(false);
        return;
      }

      setOrganizationPlan({
        redundant_files: result?.redundant_files || [],
        moves: result?.moves || [],
        new_dirs_to_create: result?.new_dirs_to_create || [],
        summary: result?.summary || 'File organization plan ready',
        risk_level: result?.risk_level || 'low',
      });
      setShowOrganizationPlan(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error("[App] File organizer error:", err);
    } finally {
      setIsLoading(false);
      setMenuOpen(false);
    }
  };

  const handleFeatureSelect = (feature: string) => {
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
      case 'help':
        console.log("[App] Help requested");
        break;
      case 'settings':
        console.log("[App] Settings requested - not implemented yet");
        setError("Settings are not implemented yet.");
        break;
      default:
        console.warn("[App] Unknown feature:", feature);
    }
  };

  const handleApplyOrganization = async (): Promise<boolean> => {
    if (!projectPath || !organizationPlan) return false;
    
    try {
      const result = await window.electronAPI?.applyOrganization?.(
        projectPath,
        organizationPlan
      );
      if (result?.status === 'error') {
        setError(result?.error || 'Failed to apply organization');
        return false;
      }
      alert(`Successfully organized! Moved ${result?.filesProcessed || 0} files.`);
      setShowOrganizationPlan(false);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return false;
    }
  };

  return (
    <div>
      {/* Shimeji Widget */}
      <Shimeji
        onFeatureSelect={() => setMenuOpen(true)}
        onMinimizeToTray={() => {
          window.electronAPI?.minimizeToTray?.();
        }}
        onShowMenu={() => setMenuOpen(true)}
        currentProjectPath={projectPath}
      />

      {/* Feature Menu */}
      {menuOpen && (
        <FeatureMenu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          onFeatureSelect={handleFeatureSelect}
          currentProjectPath={projectPath}
          onChangeProjectPath={handleSelectPath}
          onRefreshProjectPath={handleSelectPath}
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
            onClose={() => setShowSetupSteps(false)}
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
            onApply={handleApplyOrganization}
            onCancel={() => setShowOrganizationPlan(false)}
          />
        </div>
      )}
    </div>
  );
}
