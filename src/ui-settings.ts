import devosLogoUrl from "../assets/Devos_logo.png";

export type ThemePreset = "light" | "dark";
export type MascotMotion = "still" | "float" | "bob" | "orbit";

export interface UISettings {
  theme: ThemePreset;
  mascotImage: string;
  mascotMotion: MascotMotion;
}

export const DEFAULT_MASCOT_IMAGE = devosLogoUrl;
const LEGACY_DEFAULT_MASCOT_IMAGES = new Set([
  "assets/Devos_logo.png",
  "/assets/Devos_logo.png",
  "assets/icon.png",
  "/assets/icon.png",
  "assets/tray-icon.png",
  "/assets/tray-icon.png",
]);

export const DEFAULT_UI_SETTINGS: UISettings = {
  theme: "light",
  mascotImage: DEFAULT_MASCOT_IMAGE,
  mascotMotion: "float",
};

export const UI_SETTINGS_KEY = "devops-ui-settings";

export const loadUISettings = (): UISettings => {
  try {
    const parsed = JSON.parse(localStorage.getItem(UI_SETTINGS_KEY) || "null");
    const savedMascotImage = typeof parsed?.mascotImage === "string" ? parsed.mascotImage : "";
    const mascotImage =
      savedMascotImage && !LEGACY_DEFAULT_MASCOT_IMAGES.has(savedMascotImage)
        ? savedMascotImage
        : DEFAULT_MASCOT_IMAGE;

    return {
      theme: parsed?.theme === "dark" ? "dark" : "light",
      mascotImage,
      mascotMotion:
        parsed?.mascotMotion === "still" ||
        parsed?.mascotMotion === "bob" ||
        parsed?.mascotMotion === "orbit" ||
        parsed?.mascotMotion === "float"
          ? parsed.mascotMotion
          : DEFAULT_UI_SETTINGS.mascotMotion,
    };
  } catch {
    return DEFAULT_UI_SETTINGS;
  }
};

export const saveUISettings = (settings: UISettings) => {
  localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(settings));
};
