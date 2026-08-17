# Keyboard Navigation

Orbius supports full keyboard navigation across pages, lists, and popups.

## Layer System

Keyboard input is handled in **layers** (topmost popup first):

1. When **no popup** is open → global shortcuts work (page tabs, lists on the page).
2. When a **popup opens** → it registers as the top layer; **global shortcuts are paused**.
3. When the popup **closes** → the layer is removed; control returns to the layer below (or global shortcuts if the stack is empty).
4. Multiple popups stack with increasing `z-index` (e.g. calendar open, then clear-history confirm on top).

## Global Shortcuts

These work only when **no popup is open** and focus is **not** inside an input, textarea, or select:

| Key | Action |
|-----|--------|
| `1` – `5` | Jump to page (Dashboard, Workout, Body Comp, Calories, Progress) |
| `←` `→` | Previous / next page |
| `Tab` | Native browser focus between nav tab buttons (not a custom handler) |
| `Enter` | Activate focused nav tab (when a tab button is focused) |

When the active page changes **and focus is inside the nav bar**, focus moves to the newly active tab so the green keyboard ring does not stay on the previous tab.

## Main Navigation

The top bar uses a **segmented pill track** (`App.module.css`: `.navTrack`, `.navBtn`, `.navBtnActive`):

- All five pages sit inside one bordered track; the active page is a gradient purple pill
- Inactive tabs: transparent with light hover wash
- Active tab: no extra focus outline (the pill is the indicator)
- Inactive tab + keyboard focus: green `:focus-visible` ring
- Click: smooth transition + slight press scale

Implementation: `useAppNavKeyboard()` + `selectTab()` in `App.jsx`; focus sync `useEffect` when `tab` changes.

## List Navigation

Click a list area (or tab into it), then:

| Key | Action |
|-----|--------|
| `↑` `↓` | Move focus between items |
| `Enter` | Select / activate the focused item |
| `Escape` | Clear list focus (or close popup if in a modal) |

Hovering an item with the mouse updates keyboard focus on most lists (Dashboard PRs, calorie **food log**, 1RM set picker). Exceptions — mouse hover does **not** move focus or show `.ft-kb-focus`:

- **Workout History** entry rows
- **Calories → Activity Level** list (use ↑↓ after tabbing into the list)

## Visual Feedback

| State | Style |
|-------|--------|
| **List focus** | Purple border + glow (`.ft-kb-focus`) — overridden to **green outline only** on Calories activity list |
| **Main nav (inactive tab)** | Green `:focus-visible` ring; active tab uses pill fill only |
| **Button focus (dialogs)** | Filled selected state — accent Cancel (`.ft-kb-btn-focus-cancel`), red confirm/delete (`.ft-kb-btn-focus-confirm`) |
| **Activate (Enter)** | Green pulse (`.ft-kb-activate`) — dialogs/lists; not used on main nav tab clicks |
| **Dialog focus indicator** | Pill showing **Focused: Cancel** / **Clear History** |
| **Popup backdrop** | Subtle fade-in (`.ft-kb-modal-backdrop`) |

## Popups & Dialogs

| Popup | Keys | Notes |
|-------|------|-------|
| **Clear workout / body comp history** | `←` `→` / Tab switch buttons · Enter select focused · Esc cancel | Shows which button is focused |
| **Smart Parser** | Enter parse · Shift+Enter newline · Esc close | Textarea keeps local Enter handling |
| **Calendar → Smart Parser** | Same as Smart Parser | |
| **1RM set picker** | ↑↓ sets · Enter load · Esc close | Search input ignores arrows |
| **Calendar modal** | Esc close | |
| **Calendar day panel** | Esc close | Stays mounted under Manual Log / Smart Paste and the calendar delete confirm |
| **Calendar log / Smart Paste** | Esc back to day | Same fade-in as day panel; stacks on top |
| **Calendar delete confirm** | `←` `→` / Tab · Enter select · Esc cancel | Stacks over the day panel; Cancel/Esc returns to the day, not the month grid |
| **Settings** | Esc close | Gear at top-right of the header; also closes on backdrop click or ✕ |
| **Progress workout detail** | ↑↓ cards · Esc close | |
| **Workout History list** | ↑↓ entries · Enter edit · Esc clear focus | Mouse hover does not move focus |
| **Calories activity level** | ↑↓ levels · Enter select · Esc clear focus | Mouse hover does not move focus; green keyboard outline |

### Clear History Dialog

- Opens with focus on **Cancel** (safe default).
- **← →** or **Tab** moves between Cancel and Clear History.
- The focused button fills like a selected pill (accent for Cancel, red for Clear History / Delete).
- **Enter** activates the **currently focused** button (green pulse).
- A **Focused: …** pill shows the active target at all times.

### Delete Entry Dialog

Same two-button confirm pattern as Clear History, with **Cancel** / **Delete**. Used for Body Comp History, Workout History, and Calendar day-panel trash-can deletes. Esc cancels (on the calendar, Esc returns to the day panel). The calendar confirm is portaled above the calendar stack so the opening trash click cannot close it.

## Implementation

| Hook / Component | Purpose |
|------------------|---------|
| `KeyboardLayerProvider` | Wraps app; manages layer stack + capture-phase routing |
| `useKeyboardLayer(id, open, handler)` | Register popup as a keyboard layer |
| `useKeyboardLayersBlocked()` | True when any popup is open |
| `useAppNavKeyboard()` | Global nav (`1`–`5`, `←` `→`); `selectTab(i)` for tab clicks |
| `useKeyboardListNav()` | Arrow/Enter list control |
| `useConfirmDialogKeyboard()` | Two-button confirm with focus indicator |

CSS in `src/styles/global.css`: `.ft-kb-focus`, `.ft-kb-btn-focus`, `.ft-kb-btn-focus-cancel`, `.ft-kb-btn-focus-confirm`, `.ft-kb-activate`, `.ft-kb-focus-indicator`, `.ft-kb-modal-backdrop`.
