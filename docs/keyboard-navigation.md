# Keyboard Navigation

FitTrack supports full keyboard navigation across pages and lists.

## Global Shortcuts

These work when focus is **not** inside an input, textarea, or select:

| Key | Action |
|-----|--------|
| `1` – `5` | Jump to page (Dashboard, Workout, Body Comp, Calories, Progress) |
| `←` `→` | Previous / next page |
| `Enter` | Confirm focused page tab (when a tab is keyboard-focused) |

A shortcut hint bar is shown below the main navigation.

## List Navigation

Click a list area (or tab into it), then:

| Key | Action |
|-----|--------|
| `↑` `↓` | Move focus between items |
| `Enter` | Select / activate the focused item |
| `Escape` | Clear list focus |

Hovering an item with the mouse also updates keyboard focus.

## Visual Feedback

- **Focus (arrow keys):** Purple border + glow (`ft-kb-focus`)
- **Activate (Enter):** Green pulse animation (`ft-kb-activate`)

## Where It Works

| Location | Enter action |
|----------|--------------|
| **App nav tabs** | Switch page |
| **1RM set picker** | Load set into calculator |
| **Workout history** | Open edit mode for workout |
| **Calorie log** | Open edit mode for food entry |
| **Activity level list** | Select activity multiplier |
| **Dashboard PRs / recent workouts** | Go to Workout page |
| **Body comp history** | Highlight entry |
| **Progress chart detail modal** | Highlight workout card |

## Popups & Dialogs

| Popup | Enter | Escape | Other |
|-------|-------|--------|-------|
| **Clear workout history** | Confirm delete (green flash on button) | Cancel | |
| **Smart Parser** | Parse & save | Close modal | In textarea: **Ctrl+Shift+Enter** inserts newline |
| **Calendar → Smart Parser** | Parse & save for selected date | — | Same textarea shortcuts |
| **1RM set picker** | Select focused set | Close modal | ↑↓ browse sets |
| **Calendar modal** | — | Close calendar | |
| **Progress workout detail** | — | Close modal | ↑↓ browse workouts |

Confirm dialogs auto-focus when opened so Enter works immediately without clicking.

## Implementation

Shared hooks in `src/components/shared.jsx`:

- `useAppNavKeyboard(tabs, currentTab, setTab)` — global page navigation
- `useKeyboardListNav(count, onSelect, enabled)` — arrow/enter list control
- `isTypingTarget(el)` — skips shortcuts while typing in form fields

List items use `data-kb-index={i}` for scroll-into-view when navigating.

CSS animations are defined in `index.html` (`.ft-kb-focus`, `.ft-kb-activate`, `.ft-kb-nav-focus`).
