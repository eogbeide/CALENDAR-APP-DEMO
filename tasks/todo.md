# Calendar App — Todo Checklist

## Tasks

- [x] **1. Project scaffolding** — create `tasks/todo.md`, `css/`, `js/` directories
  - Acceptance: directory structure matches plan; `todo.md` exists with this checklist

- [x] **2. `index.html`** — shell markup with header, calendar container, and modal
  - Acceptance: all required IDs present (`app-header`, `month-title`, `btn-prev`, `btn-next`, `btn-today`, `btn-add-event`, `calendar-grid`, `event-modal`, `event-form`, `input-title`, `input-date`, `input-start`, `input-end`, `input-notes`, `btn-modal-close`, `btn-cancel`, `btn-delete-event`, `btn-save`, `err-title`, `err-date`, `err-time`)
  - Acceptance: modal has `aria-hidden="true"` by default; form has `novalidate`
  - Acceptance: `<script src="js/app.js">` at bottom of body

- [x] **3. `css/style.css`** — full stylesheet
  - Acceptance: CSS custom properties defined on `:root`
  - Acceptance: `#calendar-grid` uses `grid-template-columns: repeat(7, 1fr)`
  - Acceptance: `.modal-overlay[aria-hidden="true"]` has `display: none`
  - Acceptance: today's day number shows circular blue badge (`.day-cell--today .day-number`)
  - Acceptance: event pills truncate with `text-overflow: ellipsis`
  - Acceptance: `@media (max-width: 640px)` hides `.event-pill`, stacks time fields

- [x] **4. `js/app.js` — state, localStorage, calendar rendering**
  - Acceptance: `loadEvents()` reads `localStorage.calendarEvents`, falls back to `[]` on error
  - Acceptance: `saveEvents()` writes full events array as JSON
  - Acceptance: `renderCalendar()` updates `#month-title` and rebuilds the grid
  - Acceptance: grid shows exactly 7 weekday header cells
  - Acceptance: correct leading filler cells (days from prior month)
  - Acceptance: correct trailing filler cells (days from next month, multiple of 7 total)
  - Acceptance: today's cell has class `day-cell--today`

- [x] **5. Navigation**
  - Acceptance: `btn-prev` from January → December of prior year
  - Acceptance: `btn-next` from December → January of next year
  - Acceptance: `btn-today` restores current real date

- [x] **6. Modal open/close**
  - Acceptance: clicking a non-filler day cell opens modal with that date pre-filled
  - Acceptance: `btn-add-event` opens modal (today's date if viewing current month)
  - Acceptance: clicking overlay backdrop closes modal
  - Acceptance: pressing Escape closes modal
  - Acceptance: X button and Cancel button close modal

- [x] **7. Add event**
  - Acceptance: submitting valid form creates a new event with a unique `id`
  - Acceptance: event pill appears in the correct day cell immediately after save
  - Acceptance: event persists after page reload (localStorage round-trip)

- [x] **8. Edit event**
  - Acceptance: clicking an event pill opens modal in edit mode (`modal-title` = "Edit Event")
  - Acceptance: all fields pre-populated from stored event
  - Acceptance: saving updates the event in place (same `id`, `createdAt` preserved)

- [x] **9. Delete event**
  - Acceptance: `btn-delete-event` is hidden in add mode, visible in edit mode
  - Acceptance: clicking delete shows `confirm()` dialog
  - Acceptance: confirming removes event from grid and localStorage

- [x] **10. Validation**
  - Acceptance: empty title → `#err-title` shows "Title is required."
  - Acceptance: empty date → `#err-date` shows "Date is required."
  - Acceptance: end time ≤ start time (both set) → `#err-time` shows "End time must be after start time."
  - Acceptance: only one time field filled → no error
  - Acceptance: all error spans cleared when modal reopens

- [x] **11. Responsive UI**
  - Acceptance: on ≥641px viewport event pills are visible
  - Acceptance: on ≤640px viewport `.event-pill` hidden, colored dots shown
  - Acceptance: modal never wider than 480px; fits within viewport with 16px padding
  - Acceptance: header wraps gracefully on narrow screens

---

## Review

All 11 tasks completed in one pass.

**Files created:**
- `index.html` — semantic shell with header, CSS-Grid calendar container, and accessible modal form
- `css/style.css` — CSS custom properties theme, 7-column grid, modal, event pills, responsive breakpoint at 640px
- `js/app.js` — IIFE (no modules, works with `file://`); full CRUD, localStorage persistence, inline validation, keyboard/click close handlers

**Key decisions:**
- IIFE instead of ES modules so the app opens directly from the filesystem without a server
- `novalidate` on the form for custom, consistently styled error messages
- Full array re-written to localStorage on every save — simple and safe for this data scale
- Entire grid rebuilt on each `renderCalendar()` call via `innerHTML = ''` — instant at this scale, no DOM diffing needed
- `confirm()` for delete — minimal markup, acceptable for a simple app
