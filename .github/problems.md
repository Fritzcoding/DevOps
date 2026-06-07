# DevOps Lite - Known Problems & Solutions

## Overall Status
- **Application State**: Launches on this machine after repairing Electron's missing binary.
- **Open Issues**: 4
- **Resolved Issues**: 9
- **Last Updated**: 2026-06-07

---

## Open Problems, Highest Priority First

### Problem 1: Fresh Clone Can Fail Because Electron Binary Install Is Incomplete

**Status**: OPEN
**Severity**: Critical
**Impact**: App launch / clean laptop setup

#### Conclusion
The problem on this laptop was not that Node was too new and not that `vite.config.ts`
needed to be renamed to `vite.config.mts`. Node `v24.16.0` satisfies the repo's
declared `>=20.19.0` requirement, and Vite starts correctly with the current
`vite.config.ts`.

The actual blocker was an incomplete Electron package install:

```text
Electron failed to install correctly, please delete node_modules/electron and try installing again
```

`node_modules/electron/dist` existed, but `electron.exe` and `path.txt` were
missing. Vite could run, but Electron exited before the Shimeji window could
stay open.

#### Evidence
- `npm run preflight` passed with Node `v24.16.0` and npm `11.13.0`.
- `npm run type-check` passed.
- `npm run compile:main` passed.
- `npm run dev:vite` started Vite on `http://localhost:5173`.
- `npx electron . --shimeji` failed because Electron's binary was missing.

#### Workaround Used
1. Forced a fresh Electron artifact download.
2. Verified the cached zip contained `electron.exe`.
3. Manually extracted it into `node_modules/electron/dist`.
4. Wrote `node_modules/electron/path.txt` with `electron.exe`.
5. Re-ran `npm run dev`; the Shimeji window loaded.

#### Better Fix
Add a repair script or setup check that verifies:

```text
node_modules/electron/dist/electron.exe
node_modules/electron/path.txt
```

If either is missing, delete/reinstall only `node_modules/electron` or force a
fresh Electron download.

---

### Problem 2: Local AI Model Choice Needs Clear High-Parameter Options

**Status**: OPEN
**Severity**: High
**Impact**: AI quality / local model usability

#### Problem
AI Settings supported manually typing any Ollama model and detected installed
models, but the suggested list was too small. Users could miss stronger local
models such as 14B, 32B, 34B, or 70B options.

#### Current Improvement
AI Settings now shows one-click suggested Ollama models, including higher
parameter options:

- `qwen2.5-coder:14b`
- `qwen2.5-coder:32b`
- `deepseek-coder-v2:16b`
- `codellama:13b`
- `codellama:34b`
- `llama3.1:70b`
- `llama3.3:70b`
- `mixtral:8x7b`

The free-form model input remains, so users can still type any Ollama model
tag.

#### Remaining Risk
Large local models need substantially more RAM or VRAM. The UI warns users to
choose a smaller model if Ollama reports memory pressure.

---

### Problem 3: Features Still Need Manual Smoke Testing With Real AI Backends

**Status**: OPEN
**Severity**: High
**Impact**: Feature correctness / user trust

#### Problem
The automated samples and core feature tests pass, but real-world AI behavior
depends on configured cloud/local models, API keys, Ollama availability, and
machine memory.

#### Needed Verification
- Cloud AI: save a real OpenAI-compatible, Gemini, or Anthropic API key and run
  Code Fixer / Codebase Chat.
- Local AI: run Ollama with a selected model and test Code Fixer / Chat.
- Download path: verify large model download, progress, cancel, and retry.
- Error path: verify clear messages for missing key, missing model, and out of
  memory.

---

### Problem 4: Shimeji Shape and Window Bounds Need Visual QA

**Status**: OPEN
**Severity**: Medium
**Impact**: UI polish

#### Problem
The Shimeji content is styled as a circular icon, but the native Electron
window is still rectangular. On Windows, transparent rectangular bounds can
make the widget feel less like a true floating desktop companion.

#### Current State
The app now launches as a small transparent, frameless, always-on-top Shimeji
window and interaction is functional. Remaining work is visual polish and
cross-DPI verification.

---

## Resolved Issues

### Resolved 1: Manual Code Fixer Was Not CRLF-Safe on Windows

**Status**: RESOLVED (2026-06-07)
**Severity**: High
**Impact**: Tests / Windows behavior

#### Problem
The manual code fixer inserted semicolons correctly on LF files, but CRLF files
could produce malformed output such as:

```text
return left * right\r;\n
```

#### Fix
Updated the semicolon rules to treat `\r?\n` as the newline and exclude `\r`
from line content matches.

#### Verification
- `npm run test`
- `npm run type-check`

---

### Resolved 2: File Organizer Sample Expected `trace.log`, but Fixture Omitted It

**Status**: RESOLVED (2026-06-07)
**Severity**: Medium
**Impact**: Tests / sample reliability

#### Problem
The sample test expected `trace.log` to move to `logs/trace.log`, but
`samples/pristine/file-organizer-logic` did not contain `trace.log`. Because
`*.log` is globally ignored, the fixture could be missing from a clean clone.

#### Fix
- Added `samples/pristine/file-organizer-logic/trace.log`.
- Added a `.gitignore` exception for that fixture.

#### Verification
- `npm run test`

---

### Resolved 3: Duplicate Shimeji Windows

**Status**: RESOLVED
**Severity**: High
**Impact**: Resource usage / usability

#### Fix
`createWindow()` now guards against creating a second window when `mainWindow`
already exists.

---

### Resolved 4: Shimeji Click and Drag Reliability

**Status**: RESOLVED
**Severity**: High
**Impact**: Core interaction

#### Fix
Pointer events and refs are used to separate click from drag behavior reliably,
and native window movement is handled through Electron IPC.

---

### Resolved 5: Shimeji Jitter and Invisible Click Barrier

**Status**: RESOLVED (2026-05-21)
**Severity**: High
**Impact**: UX / desktop interaction

#### Fix
The native Electron window is the source of truth for position, transparent
regions can forward mouse events, and interactive elements opt in to pointer
capture.

---

### Resolved 6: Ollama Server Running but `ollama pull` Fails on Windows

**Status**: RESOLVED (2026-05-23)
**Severity**: Medium
**Impact**: Local AI setup

#### Fix
The app still tries the Ollama CLI first, but falls back to Ollama's local HTTP
`/api/pull` endpoint when the CLI is missing from PATH.

---

### Resolved 7: Ollama Download Needed Progress, Cancel, and Model Detection

**Status**: RESOLVED (2026-05-24)
**Severity**: Medium
**Impact**: Local AI setup

#### Fix
AI Settings detects installed Ollama models, reports download progress, and can
cancel active downloads.

---

### Resolved 8: Shared Panel Size Caused Unexpected Window Growth

**Status**: RESOLVED (2026-05-26)
**Severity**: High
**Impact**: Window sizing / UX

#### Fix
Feature panels use stable per-feature window sizes. Manual resize is kept only
for Codebase Chat.

---

### Resolved 9: AI File Organizer Count Mismatch and Missing User Categories

**Status**: RESOLVED (2026-05-27)
**Severity**: High
**Impact**: File Organizer correctness

#### Fix
Apply reporting now counts file operations separately from directory operations,
the adapter no longer emits redundant `mkdir` operations, and organizer planning
supports user-named categories and snake_case renames.

---

## Summary Table

| Priority | Issue | Severity | Status | Next Step |
|---|---|---|---|---|
| 1 | Fresh clone can fail from incomplete Electron binary install | Critical | OPEN | Add setup repair check |
| 2 | Local AI needed clearer high-parameter model choices | High | OPEN | Smoke test with Ollama downloads |
| 3 | Real AI backend workflows need manual verification | High | OPEN | Test cloud and local routes |
| 4 | Shimeji visual bounds need polish | Medium | OPEN | Visual QA on Windows DPI settings |
