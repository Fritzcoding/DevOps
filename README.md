# DevOS Lite

DevOS Lite is an Electron desktop assistant for developer workflows. It provides Code Fixer, Environment Builder, File Organizer, Codebase Chat, and Discussion Room features through a floating Shimeji-style UI.

## Clean Laptop Setup

### Prerequisites

- Node.js `20.19.0` or newer
- npm `10` or newer
- Git
- Windows 10/11, macOS, or Linux
- Optional local AI: Ollama from https://ollama.com/download

The dependency tree currently includes packages that require Node 20+. Do not use Node 18 for this repo. Check your machine first:

```bash
node --version
npm --version
```

### Install

```bash
git clone <repo-url>
cd DevOS-lite
npm run setup
```

`npm run setup` runs a preflight check, installs locked dependencies from `package-lock.json`, and compiles the Electron main/preload files.

### Configure AI

Cloud AI can be configured in the app's AI Settings screen. For local env-file setup:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and set only the keys you need. `.env.local` and other `.env*` files are ignored by git. Never commit real API keys.

Local AI does not require an env file. Install Ollama, start it, then use AI Settings to select or download a model. The default local model is `qwen2.5-coder:7b`.

### Run

```bash
npm run dev
```

This compiles `main.ts` and `preload.ts`, starts Vite, then launches Electron. Generated files such as `main.js`, `preload.js`, and `dist/` are ignored.

## Common Commands

```bash
npm run preflight            # Check Node/npm/env readiness
npm run setup                # Clean-laptop install path
npm run dev                  # Vite + Electron
npm run build                # Compile, build renderer, type-check
npm run type-check           # TypeScript validation
npm run test                 # Reset fixtures and run feature tests
npm run verify               # Preflight + tests + type-check
npm run reset:test-fixtures  # Recreate mutable fixture workdir
npm run clean                # Remove generated build artifacts
```

## Feature Testing

Resettable fixtures live under `tests/fixtures/pristine`. Tests copy them to `tests/fixtures/workdir`, mutate only the workdir, and can be reset at any time:

```bash
npm run reset:test-fixtures
npm run test
```

Covered feature smoke tests:

- Env Builder scans a Node/Python fixture, detects config files, and ignores `node_modules`.
- File Organizer generates preview moves from an instruction.
- File Organizer dry-run does not mutate files.
- File Organizer apply writes rollback metadata and rollback restores the original file.

## Environment Builder

Environment Builder scans a selected project and returns setup guidance for the detected stack. It is preview/guidance first; it should explain what to install, configure, and run before any command execution is considered.

Current integration:

- Renderer calls `window.electronAPI.detectEnv(projectPath)`.
- Preload forwards to `DevOS:env:detect`.
- Main process scans the selected project and asks the configured AI route for setup steps.
- `SetupStepsOverlay` displays detected type, missing tools, commands, environment variables, and estimated setup time.

Expected output shape:

```json
{
  "detected_type": "node|python|java-maven|rust|go|unknown",
  "missing_tools": ["node"],
  "setup_steps": [
    {
      "step": 1,
      "description": "Install dependencies",
      "command": "npm install",
      "platform": "universal",
      "required": true
    }
  ],
  "env_vars_needed": ["GEMINI_API_KEY"],
  "estimated_minutes": 5,
  "summary": "Short setup summary"
}
```

## File Organizer

File Organizer is preview-first and rollback-safe. It scans files, produces a proposed plan, and applies moves only after user confirmation.

Current integration:

- Renderer calls `window.electronAPI.organizeFiles(folderPath, mode, instruction)`.
- Main process calls `generateOrganizerPlan`.
- Apply calls `SafeFileOperationExecutor`.
- Rollback metadata is saved under `.DevOS-lite-organizer/rollback-<batch>.jsonl` inside the selected project.

Protected paths include `.git`, `node_modules`, build outputs, lockfiles, `.env*`, `.DevOS-lite-organizer`, and trash/rollback internals.

## Architecture

Important entrypoints:

- `main.ts`: Electron main process and IPC handlers
- `preload.ts`: safe renderer-to-main IPC bridge
- `src/main.tsx`: React renderer entry
- `src/App.tsx`: main UI state
- `src/services/ai-routing`: cloud/local AI routing
- `src/features/environment-builder`: Env Builder feature logic
- `src/features/file-organizer`: organizer planning, safety, apply, rollback

Renderer code must not import Node or Electron APIs directly. File and shell access belongs in the main process behind IPC.

## Troubleshooting

- `preflight` fails on Node version: install Node.js 20.19+ and rerun `npm run setup`.
- `electron` or `vite` is not recognized: run `npm run setup` from the repo root.
- Cloud AI says key missing: add a key in AI Settings or set `GEMINI_API_KEY` in `.env.local`.
- Ollama model missing: open AI Settings and download the selected model, or run `ollama pull qwen2.5-coder:7b`.
- `ollama` command not found but Ollama is running: reinstall/update Ollama, restart your terminal and DevOS Lite, then verify `ollama --version`.
- Blank or stale app after pulling changes: run `npm run clean && npm run setup && npm run dev`.

## Security Notes

- Real `.env*` files are ignored. Keep API keys in `.env.local` or in the app's local settings.
- Do not commit `dist/`, `node_modules/`, generated Electron JS, rollback folders, or test workdirs.
- File Organizer must remain preview-first unless an explicit, separate autonomous mode is implemented with confidence thresholds and rollback.
