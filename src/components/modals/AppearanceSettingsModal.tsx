import React, { useRef, useState } from "react";
import { ArrowLeft, Check, ImagePlus, Moon, RotateCcw, Sparkles, Sun, X } from "lucide-react";
import type { MascotMotion, ThemePreset, UISettings } from "../../ui-settings";
import { DEFAULT_MASCOT_IMAGE, DEFAULT_UI_SETTINGS } from "../../ui-settings";

interface AppearanceSettingsModalProps {
  settings: UISettings;
  onSave: (settings: UISettings) => void;
  onClose: () => void;
  onBack?: () => void;
}

const themeOptions: Array<{ value: ThemePreset; label: string; description: string; icon: typeof Sun }> = [
  { value: "light", label: "Light", description: "Clean panels with soft cyan accents", icon: Sun },
  { value: "dark", label: "Dark", description: "Low-glare controls for late sessions", icon: Moon },
];

const motionOptions: Array<{ value: MascotMotion; label: string; description: string }> = [
  { value: "still", label: "Still", description: "No idle movement" },
  { value: "float", label: "Float", description: "Slow vertical drift" },
  { value: "bob", label: "Bob", description: "Small responsive bounce" },
  { value: "orbit", label: "Orbit", description: "Subtle circular idle path" },
];

const readImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
};

export const AppearanceSettingsModal: React.FC<AppearanceSettingsModalProps> = ({
  settings,
  onSave,
  onClose,
  onBack,
}) => {
  const [draft, setDraft] = useState<UISettings>(settings);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chooseImage = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    try {
      setError(null);
      const dataUrl = await readImageFile(file);
      setDraft((current) => ({ ...current, mascotImage: dataUrl }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load image");
    }
  };

  const save = () => {
    onSave(draft);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[var(--ui-scrim)] p-4 backdrop-blur-sm" data-electron-interactive="true">
      <div className="max-h-[94vh] w-full max-w-4xl overflow-hidden rounded-lg border border-[var(--ui-border)] bg-[var(--ui-panel)] text-[var(--ui-text)] shadow-[0_28px_90px_rgba(2,6,23,0.28)]">
        <div className="flex items-start justify-between border-b border-[var(--ui-border)] bg-[var(--ui-panel)] px-6 py-5">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ui-muted)]">
              <Sparkles className="h-4 w-4" />
              Appearance
            </div>
            <h2 className="mt-2 text-xl font-semibold text-[var(--ui-text)]">UI Design Settings</h2>
          </div>
          <div className="flex items-center gap-2">
            {onBack && (
              <button onClick={onBack} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-[var(--ui-muted)] transition hover:bg-[var(--ui-hover)] active:scale-[0.97]" aria-label="Back to menu">
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}
            <button onClick={onClose} className="rounded-md p-2 text-[var(--ui-muted)] transition hover:bg-[var(--ui-hover)] active:scale-[0.97]" aria-label="Close appearance settings">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid max-h-[calc(94vh-9rem)] gap-5 overflow-auto p-5 md:grid-cols-[18rem_minmax(0,1fr)]">
          <div className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-soft)] p-4">
            <div className="mx-auto h-36 w-36 overflow-hidden rounded-full border border-[var(--ui-border)] bg-[var(--ui-panel)] shadow-sm">
              <img
                src={draft.mascotImage || DEFAULT_MASCOT_IMAGE}
                alt="Shimeji preview"
                className="h-full w-full object-cover"
                onError={(event) => {
                  if (event.currentTarget.src !== DEFAULT_MASCOT_IMAGE) {
                    event.currentTarget.src = DEFAULT_MASCOT_IMAGE;
                  }
                }}
              />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                chooseImage(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
            <div className="mt-4 grid gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 rounded-md bg-[var(--ui-primary)] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[var(--ui-primary-hover)] active:scale-[0.97]"
              >
                <ImagePlus className="h-4 w-4" />
                Choose Image
              </button>
              <button
                onClick={() => setDraft((current) => ({ ...current, mascotImage: DEFAULT_UI_SETTINGS.mascotImage }))}
                className="flex items-center justify-center gap-2 rounded-md border border-[var(--ui-border)] bg-[var(--ui-panel)] px-3 py-2 text-sm font-semibold text-[var(--ui-text)] transition hover:bg-[var(--ui-hover)] active:scale-[0.97]"
              >
                <RotateCcw className="h-4 w-4" />
                Restore Logo
              </button>
            </div>
            <p className="mt-3 text-xs leading-5 text-[var(--ui-muted)]">
              Images are shown with circular cropping automatically.
            </p>
          </div>

          <div className="space-y-5">
            {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <section>
              <div className="mb-2 text-sm font-semibold text-[var(--ui-text)]">Theme preset</div>
              <div className="grid gap-2 sm:grid-cols-2">
                {themeOptions.map(({ value, label, description, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setDraft((current) => ({ ...current, theme: value }))}
                    className={`rounded-lg border p-4 text-left transition active:scale-[0.98] ${
                      draft.theme === value
                        ? "border-[var(--ui-primary)] bg-[var(--ui-selected)]"
                        : "border-[var(--ui-border)] bg-[var(--ui-panel)] hover:bg-[var(--ui-hover)]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--ui-primary)] text-white">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-[var(--ui-text)]">{label}</span>
                        <span className="block text-xs text-[var(--ui-muted)]">{description}</span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-2 text-sm font-semibold text-[var(--ui-text)]">Shimeji movement</div>
              <div className="grid gap-2 sm:grid-cols-2">
                {motionOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDraft((current) => ({ ...current, mascotMotion: option.value }))}
                    className={`rounded-lg border px-4 py-3 text-left transition active:scale-[0.98] ${
                      draft.mascotMotion === option.value
                        ? "border-[var(--ui-primary)] bg-[var(--ui-selected)]"
                        : "border-[var(--ui-border)] bg-[var(--ui-panel)] hover:bg-[var(--ui-hover)]"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-[var(--ui-text)]">{option.label}</span>
                    <span className="mt-0.5 block text-xs text-[var(--ui-muted)]">{option.description}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--ui-border)] bg-[var(--ui-panel)] px-6 py-4">
          <button
            onClick={() => setDraft(DEFAULT_UI_SETTINGS)}
            className="rounded-md border border-[var(--ui-border)] bg-[var(--ui-panel)] px-4 py-2 text-sm font-semibold text-[var(--ui-text)] transition hover:bg-[var(--ui-hover)] active:scale-[0.97]"
          >
            Reset Design
          </button>
          <button
            onClick={save}
            className="flex items-center gap-2 rounded-md bg-[var(--ui-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--ui-primary-hover)] active:scale-[0.97]"
          >
            <Check className="h-4 w-4" />
            Save Design
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettingsModal;
