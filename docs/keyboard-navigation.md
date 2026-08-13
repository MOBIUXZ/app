# Keyboard Navigation

FitTrack supports full keyboard navigation across pages, lists, and popups.

## Layer System

Keyboard input is handled in **layers** (topmost popup first):

1. When **no popup** is open → global shortcuts work (page tabs, lists on the page).
2. When a **popup opens** → it registers as the top layer; **global shortcuts are paused**.
3. When the popup **closes** → the layer is removed; control returns to the layer below (or global shortcuts if the stack is empty).
4. Multiple popups stack with increasing `z-index` (e.g. calendar open, then clear-history confirm on top).

The hint bar below the nav shows **"Popup active — local shortcuts only"** when any layer is open.

## Global Shortcuts

These work only when **no popup is open** and focus is **not** inside an input, textarea, or select:

| Key | Action |
|-----|--------|
| `1` – `5` | Jump to page (Dashboard, Workout, Body Comp, Calories, Progress) |
| `←` `→` | Previous / next page |
| `Enter` | Confirm focused page tab |

## List Navigation

Click a list area (or tab into it), then:

| Key | Action |
|-----|--------|
| `↑` `↓` | Move focus between items |
| `Enter` | Select / activate the focused item |
| `Escape` | Clear list focus (or close popup if in a modal) |

Hovering an item with the mouse also updates keyboard focus.

## Visual Feedback

| State | Style |
|-------|--------|
| **List focus** | Purple border + glow (`.ft-kb-focus`) |
| **Button focus (dialogs)** | Pulsing purple ring (`.ft-kb-btn-focus`) |
| **Activate (Enter)** | Green pulse (`.ft-kb-activate`) |
| **Dialog focus indicator** | Pill showing **Focused: Cancel** / **Clear History** |
| **Popup backdrop** | Subtle fade-in (`.ft-kb-modal-backdrop`) |

## Popups & Dialogs

| Popup | Keys | Notes |
|-------|------|-------|
| **Clear workout history** | `←` `→` / Tab switch buttons · Enter select focused · Esc cancel | Shows which button is focused |
| **Smart Parser** | Enter parse · Shift+Enter newline · Esc close | Textarea keeps local Enter handling |
| **Calendar → Smart Parser** | Same as Smart Parser | |
| **1RM set picker** | ↑↓ sets · Enter load · Esc close | Search input ignores arrows |
| **Calendar modal** | Esc close | |
| **Progress workout detail** | ↑↓ cards · Esc close | |

### Clear History Dialog

- Opens with focus on **Cancel** (safe default).
- **← →** or **Tab** moves between Cancel and Clear History.
- **Enter** activates the **currently focused** button (green pulse).
- A **Focused: …** pill shows the active target at all times.

## Implementation

| Hook / Component | Purpose |
|------------------|---------|
| `KeyboardLayerProvider` | Wraps app; manages layer stack + capture-phase routing |
| `useKeyboardLayer(id, open, handler)` | Register popup as a keyboard layer |
| `useKeyboardLayersBlocked()` | True when any popup is open |
| `useAppNavKeyboard()` | Global nav (respects layer block) |
| `useKeyboardListNav()` | Arrow/Enter list control |
| `useConfirmDialogKeyboard()` | Two-button confirm with focus indicator |

CSS in `index.html`: `.ft-kb-focus`, `.ft-kb-btn-focus`, `.ft-kb-activate`, `.ft-kb-focus-indicator`, `.ft-kb-modal-backdrop`.
