# DevOps Lite - Current Problem Analysis

## Current Problem: Shimeji Interactivity and Jittering

### Problem Description
The Shimeji widget is now clickable, but it still behaves incorrectly. When the mouse hovers or clicks the widget, it jitters and/or the app window appears to move unexpectedly. The feature menu is still not reliably visible in a stable way.

### Observed Behavior
- Shimeji is no longer reliably interactive; clicks sometimes do not register on the widget.
- The widget still jitters visually during pointer movement.
- The feature menu can appear on the far right of the screen instead of anchored near the widget.
- Feature selection often results in configuration errors (Gemini API not configured, project path not configured), which may be separate from the interactivity bug.
- A large transparent portion of the Electron window can become effectively unclickable, creating an invisible click barrier.
- The UI still feels like the active area is not properly aligned with the actual Electron window.

### Architecture / Implementation Details
#### Renderer
- `src/components/Shimeji.tsx` renders the floating widget.
- The component uses React pointer events to track drag state.
- The widget now uses a fixed window size and native `window.electronAPI.moveWindow(x, y)` movement.
- The renderer should not drive visual positioning independently of the native window.

#### Main process
- `main.ts` creates a frameless, transparent `BrowserWindow` at 128x128 for Shimeji mode.
- IPC handlers were added for `devops:window:move` only; resize should no longer be used.
- `preload.ts` exposes `moveWindow` through `window.electronAPI`.

### Root Cause Hypothesis
1. **Window-level movement and renderer movement are conflicting**
   - The renderer updates local position state and also asks the main process to reposition the window.
   - This may create a feedback loop or unsynchronized position values.

2. **Window resizing on menu open is unstable**
   - Resizing a frameless 64x64 window on hover/click can cause visual jumping.
   - The rendered menu is still being shown inside a tiny floating window, which is not ideal.

3. **Pointer logic may be too sensitive**
   - Movement is triggered on small pointer deviations, making it feel jittery.
   - `pointerMovedRef` and `isDragging` logic can still fire unexpectedly.

4. **UI hover style changes can amplify jitter**
   - Even after removing hover/active animations, the window itself may still repaint on hover.

### Fixes Tried (and Still Failing)
- Added IPC support for `moveWindow` and `resizeWindow` in `main.ts` and `preload.ts`.
- Moved window position from `Shimeji.tsx` to Electron main process.
- Disabled the wandering animation in `src/components/Shimeji.tsx`.
- Removed hover and click animation effects from the Shimeji component.
- Set CSS transition to `none` to eliminate renderer animation jitter.
- Added explicit `moveWindow` calls during drag and when position changes.

### Why It Still Fails
- The current architecture still ties the visible Shimeji position to both React state and native window bounds.
- Resizing the window for the menu is still happening inside the same small frameless window, which is inherently unstable.
- The Shimeji widget should not rely on DOM positioning inside a tiny window if the actual window is also being moved.

### Recommended Next Step
- Stop resizing the Shimeji window for the menu.
- Keep the main Shimeji window at a fixed size (128x128) and render the menu inside that fixed window.
- Simplify the drag model: the native BrowserWindow should be the only source of truth for position.
- Apply true click-through behavior to transparent window areas by using `setIgnoreMouseEvents(true, { forward: true })` and setting page background pointer-events to none.
- Add a stable `dragging` threshold so tiny pointer movements do not trigger window repositioning.
- Make transparent window areas click-through and keep only the Shimeji widget/menu interactive.

### Current Status
- [x] Shimeji is clickable.
- [ ] Jittering remains on hover/click.
- [ ] Stable menu rendering not achieved.
- [ ] Drag behavior needs simplification.
- [ ] Window resize approach should be rethought.

---
Created: May 17, 2026
Status: INVESTIGATING - FIX INCOMPLETE
