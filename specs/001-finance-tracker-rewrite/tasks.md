# Tasks: Financial Tracker Application

**Input**: Design documents from `/specs/001-finance-tracker-rewrite/`
**Prerequisites**: plan.md, spec.md, data-model.md, research.md, quickstart.md, contracts/database.md, contracts/file-io.md

**Tests**: Not included — manual testing only per project constitution.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `src/` at repository root
- **Backend**: `src-tauri/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies, configure Tauri plugins, create initial migration

- [x] T001 Install Tauri plugins via CLI (`pnpm tauri add sql`, `pnpm tauri add dialog`, `pnpm tauri add fs`, `pnpm tauri add process`) — each command adds both Rust crate and JS bindings automatically. Then enable `sqlite` feature on `tauri-plugin-sql` in src-tauri/Cargo.toml and verify all four plugins are registered in src-tauri/src/lib.rs
- [x] T002 Install frontend application dependencies via `pnpm add zustand date-fns recharts xlsx react-to-print`
- [x] T003 [P] Configure Tauri plugin permissions (sql:allow-load, sql:allow-execute, sql:allow-select, dialog:allow-save, dialog:allow-open, fs:allow-read, fs:allow-write, fs:allow-exists, fs:allow-mkdir, fs:allow-remove, fs:allow-rename, fs:allow-copy-file, fs:allow-read-dir, process:allow-relaunch) in src-tauri/capabilities/default.json
- [x] T004 [P] Configure SQL plugin preload with "sqlite:gelir-gider.db" in src-tauri/tauri.conf.json plugins section
- [x] T005 [P] Create initial migration SQL (transactions table, app_metadata table, indexes) per data-model.md schema in src-tauri/migrations/001_create_transactions.sql

**Checkpoint**: All dependencies installed, Tauri configured, migration file ready

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, utilities, database layer, store, app shell — MUST complete before any user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Define shared TypeScript types (Transaction, TransactionType, DailySummary, PeriodAnalysis, View, FilterCondition, FilterOperator, ImportError, BackupTier) in src/types/index.ts
- [ ] T007 [P] Create category constants (REVENUE_CATEGORIES, EXPENSE_CATEGORIES, isRefundCategory helper, getCategoriesForType helper) in src/lib/categories.ts
- [ ] T008 [P] Create Turkish formatting utilities (formatCurrency for kuruş→TL display, formatDateTR for Turkish locale date display, parseTurkishAmount for input→kuruş conversion) using date-fns Turkish locale in src/lib/format.ts
- [ ] T009 [P] Create financial computation helpers (calculateDailySummary from transactions, calculatePeriodAnalysis from date-range transactions, calculateCategoryBreakdown) in src/lib/calculations.ts
- [ ] T010 Create SQLite database service layer (getDb singleton, execute, select, getMetadata, setMetadata wrapping @tauri-apps/plugin-sql) in src/services/db.ts
- [ ] T011 Create migration runner service (getCurrentVersion, applyPendingMigrations reading from bundled SQL files, pre-migration backup trigger, version update) in src/services/migrations.ts
- [ ] T012 Create Zustand UI slice (activeView: daily|analysis|filter|settings, selectedDate, theme: light|dark, setView, setSelectedDate, goToToday, setTheme actions) in src/stores/slices/ui-slice.ts
- [ ] T013 [P] Create Zustand transaction slice (transactions array, isLoading flag, loadTransactionsByDate, addTransaction, updateTransaction, deleteTransaction, deleteAllForDate actions calling db service) in src/stores/slices/transaction-slice.ts
- [ ] T014 [P] Create Zustand filter slice (filterConditions array, searchText, filteredResults, addCondition, removeCondition, clearFilters, setSearchText, executeFilter actions) in src/stores/slices/filter-slice.ts
- [ ] T015 Create combined Zustand store (merge ui-slice, transaction-slice, filter-slice with typed selectors) in src/stores/app-store.ts
- [ ] T016 Create database initialization provider (connect to DB, run migrations, show loading state, render children when ready) in src/providers/db-provider.tsx
- [ ] T017 [P] Create navigation bar component (tabs for daily/analysis/filter/settings views, active tab indicator, wired to Zustand setView) using shadcn Tabs in src/components/shared/nav-bar.tsx
- [ ] T018 [P] Create confirm dialog component (single confirmation mode and double confirmation mode for destructive actions like bulk delete) using shadcn AlertDialog in src/components/shared/confirm-dialog.tsx
- [ ] T019 [P] Create date picker component (date input, previous/next day navigation, go-to-today button, Turkish locale display via date-fns) in src/components/shared/date-picker.tsx
- [ ] T020 [P] Create category select component (dropdown filtered by transaction type: revenue or expense, populated from category constants) using shadcn Select in src/components/shared/category-select.tsx
- [ ] T021 Set up App.tsx with DbProvider wrapper, NavBar, view routing via Zustand activeView (render daily-view, analysis-view, filter-view, or settings-view), and placeholder components for views not yet implemented in src/App.tsx
- [ ] T022 [P] Create global styles (base layout, side-by-side list layout, grid line styles for tables, Geist font setup) and @media print base rules (hide nav, full-width content) in src/App.css

**Checkpoint**: Foundation ready — database operational, store functional, app shell navigable. User story implementation can now begin.

---

## Phase 3: User Story 1 — Daily Transaction Capture (Priority: P1) 🎯 MVP

**Goal**: Manager can add, edit, and delete revenue/expense transactions for any date, with date navigation and refund auto-negation

**Independent Test**: Add revenue and expense entries for today, edit an amount, delete an entry, navigate to a different date, use "go to today" — all records persist correctly

- [ ] T023 [P] [US1] Create use-transactions hook (load transactions by date from store, provide add/update/delete/deleteAll functions, handle refund category auto-negation for İADE) in src/hooks/use-transactions.ts
- [ ] T024 [P] [US1] Create transaction form component (add/edit mode toggle, date field, type radio revenue/expense, amount input with Turkish format normalization, category select filtered by type, optional note field, save/cancel actions, zero-amount rejection) in src/components/daily/transaction-form.tsx
- [ ] T025 [US1] Create transaction list component (side-by-side revenue and expense columns per FR-021, each row shows amount/category/note, edit and delete action buttons, visible grid lines per FR-022, double-confirm bulk delete for clearing a day) in src/components/daily/transaction-list.tsx
- [ ] T026 [US1] Create daily view container (date picker for navigation with go-to-today, transaction form, transaction list, wire up use-transactions hook, load transactions on date change) in src/components/daily/daily-view.tsx

**Checkpoint**: Daily transaction CRUD fully functional — can add, edit, delete, navigate dates. This is the MVP.

---

## Phase 4: User Story 2 — Daily Summary & Live Totals (Priority: P1)

**Goal**: Real-time display of total revenue, total expense, net result, and profit percentage that updates instantly on any transaction change

**Depends on**: US1 (transactions must exist to summarize)

**Independent Test**: Add/edit/delete transactions and verify totals update immediately without refresh. View a day with no records — all totals show zero.

- [ ] T027 [US2] Create daily summary component (total revenue, total expense, net result with profit/loss color, profit percentage indicator, zero-state message for empty days) using shadcn Card in src/components/daily/daily-summary.tsx
- [ ] T028 [US2] Integrate daily summary into daily view (compute summary via calculateDailySummary from transactions, re-render on any transaction change via Zustand selective subscription) in src/components/daily/daily-view.tsx

**Checkpoint**: Daily view complete with live totals — P1 stories fully delivered

---

## Phase 5: User Story 3 — Period-Based Financial Analysis (Priority: P2)

**Goal**: Visual revenue vs expense comparison across a time range with summary metrics, best/worst days, and category breakdowns. Category filter support for narrowing analysis to specific transaction types.

**Independent Test**: Select March 2026, verify chart renders daily data, check all metrics (totals, averages, active days, best/worst), verify category breakdowns. Apply a category filter and confirm all metrics recalculate.

- [ ] T029 [US3] Create use-analysis hook (load transactions for date range via db service, compute PeriodAnalysis via calculatePeriodAnalysis, support optional category filter, recompute on filter change) in src/hooks/use-analysis.ts
- [ ] T030 [P] [US3] Create period chart component (Recharts ComposedChart with daily revenue bars, expense bars, and net trend line, ResponsiveContainer, Turkish formatted tooltips, grid lines) in src/components/analysis/period-chart.tsx
- [ ] T031 [P] [US3] Create period metrics component (total revenue, total expense, net result, active days count, average daily revenue, average daily expense, best turnover day, worst turnover day) in src/components/analysis/period-metrics.tsx
- [ ] T032 [P] [US3] Create category breakdown component (revenue categories list and expense categories list, each showing total amount and proportional percentage of category total) in src/components/analysis/category-breakdown.tsx
- [ ] T033 [US3] Create analysis view container (period selector: single month, multi-month range, year-to-date; category filter dropdown; period-chart, period-metrics, category-breakdown layout; loading indicator for queries >300ms) in src/components/analysis/analysis-view.tsx

**Checkpoint**: Period analysis fully functional with charts, metrics, breakdowns, and category filtering

---

## Phase 6: User Story 4 — Print-Ready Reports (Priority: P2)

**Goal**: Print-optimized output from daily and period views with report headers, formatted tables, and readable charts

**Depends on**: US1+US2 (daily print), US3 (analysis print)

**Independent Test**: Print from daily view — verify header "Günlük Rapor - {Turkish date}", formatted data, no nav chrome. Print from analysis view — verify charts, metrics, breakdowns render on paper.

- [ ] T034 [US4] Implement comprehensive print styles (@media print rules for report header visibility, nav/form hiding, table grid lines, chart sizing, page break control, paper-optimized font sizes) in src/App.css
- [ ] T035 [P] [US4] Add print trigger to daily view (useReactToPrint targeting print-ready content ref, report header "Günlük Rapor - {date in Turkish}", print date stamp) in src/components/daily/daily-view.tsx
- [ ] T036 [P] [US4] Add print trigger to analysis view (useReactToPrint targeting print-ready content ref, report header with period label, print date stamp, chart print optimization) in src/components/analysis/analysis-view.tsx

**Checkpoint**: Both daily and period views produce print-ready reports via native print dialog

---

## Phase 7: User Story 5 — Advanced Filtering & Record Exploration (Priority: P3)

**Goal**: Find and review specific records using date operators, category operators, free-text search, and combined filter conditions displayed in a structured grid

**Independent Test**: Filter by category "equals NAKİT" — only NAKİT records appear. Combine date range + category not-equals — verify correct subset. Search free text — verify matching results.

- [ ] T037 [US5] Create filter builder component (date filter operators: within last N days, more than N days ago, between dates, in range; category operators: equals, not equals with multi-select; free-text search input; add/remove conditions; clear all) in src/components/filter/filter-builder.tsx
- [ ] T038 [P] [US5] Create results grid component (columns: date, type, amount, category, note; visible grid lines per FR-022; Turkish date and amount formatting; empty-state message) using shadcn Table in src/components/filter/results-grid.tsx
- [ ] T039 [US5] Create filter view container (filter builder at top, execute filter button, results grid below, wire up filter-slice store actions, build dynamic SQL query from conditions per database contract) in src/components/filter/filter-view.tsx

**Checkpoint**: Advanced filtering fully functional with combinable conditions and structured results display

---

## Phase 8: User Story 6 — Export to Spreadsheet (Priority: P3)

**Goal**: Export transaction data to .xlsx for a single day, full month, or custom range, respecting active category filters

**Depends on**: US1 (daily export source), US3 (analysis export source)

**Independent Test**: Export a day — verify spreadsheet matches app data. Export a month — verify daily grouping and summary totals. Export with category filter active — verify only filtered data exported.

- [ ] T040 [US6] Create export service (buildDaySheet, buildMonthSheet, buildRangeSheet with SheetJS; transaction detail rows, daily subtotals, period summary with profit ratio; category filter support; file save dialog via @tauri-apps/plugin-dialog) per file-io contract in src/services/export.ts
- [ ] T041 [P] [US6] Add export day action button to daily view (export current date's transactions via export service) in src/components/daily/daily-view.tsx
- [ ] T042 [P] [US6] Add export period action button to analysis view (export current period with optional category filter via export service) in src/components/analysis/analysis-view.tsx

**Checkpoint**: Export produces valid .xlsx files from daily and analysis views, with category filter support

---

## Phase 9: User Story 7 — Import from Spreadsheet (Priority: P3)

**Goal**: Import transactions from a spreadsheet file with preview, row-level validation errors, and additive import behavior

**Independent Test**: Import a valid spreadsheet — records appended correctly. Import a file with invalid rows — each error reported with specific message. Cancel after preview — no data changed.

- [ ] T043 [US7] Create import service (parse .xlsx/.xls via SheetJS, validate each row: date format, type revenue/expense/gelir/gider, non-zero amount, category in predefined list; return valid rows and ImportError array; batch insert valid rows) per file-io contract in src/services/import.ts
- [ ] T044 [US7] Add import workflow to settings view (file selection via @tauri-apps/plugin-dialog open, parse-and-validate preview showing valid count and error rows with messages, confirm/cancel buttons, execute additive import, success feedback) in src/components/settings/settings-view.tsx

**Checkpoint**: Import workflow with full validation pipeline, error reporting, and safe additive import

---

## Phase 10: User Story 8 — Backup & Restore (Priority: P3)

**Goal**: Manual backup/restore with confirmation, plus automatic GFS tiered backups (session/daily/weekly/monthly) with retention pruning

**Independent Test**: Create backup, modify data, restore — data matches backup. Restart app — verify auto-backup files created in correct tiers. Check retention limits enforced.

- [ ] T045 [P] [US8] Create manual backup service (backup: copy DB file to user-selected path via dialog+fs plugins, restore: validate backup file schema, double-confirm dialog, replace DB, trigger app relaunch via @tauri-apps/plugin-process) per file-io contract in src/services/backup.ts
- [ ] T046 [P] [US8] Create auto-backup service (GFS tiered creation: session auto-*, daily daily-*, weekly weekly-*, monthly monthly-*; startup tier evaluation using app_metadata timestamps; per-tier pruning to retention limits; periodic session interval timer; pre-migration backup support; silent failure handling) per database contract in src/services/auto-backup.ts
- [ ] T047 [US8] Integrate auto-backup into db-provider startup sequence (after migration, before user interaction: run startup backups, start periodic timer) in src/providers/db-provider.tsx
- [ ] T048 [US8] Add backup/restore UI to settings view (manual backup button, restore button with file picker, last auto-backup timestamp display from app_metadata, confirmation dialogs) in src/components/settings/settings-view.tsx

**Checkpoint**: Full data safety — manual backup/restore operational, automatic GFS backups running at startup with tiered retention

---

## Phase 11: User Story 9 — Visual Theme Preference (Priority: P4)

**Goal**: Light/dark theme toggle that applies immediately and persists across sessions

**Independent Test**: Switch to dark theme — UI updates immediately. Close and reopen app — dark theme still active. Switch back to light — persists.

- [ ] T049 [US9] Implement theme application logic (read theme from Zustand ui-slice, apply dark/light class to document root, persist theme preference via Zustand persist middleware or app_metadata) in src/App.tsx
- [ ] T050 [US9] Add theme toggle control to settings view (light/dark toggle switch, immediate visual feedback) in src/components/settings/settings-view.tsx

**Checkpoint**: Theme preference fully functional and persistent

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Final integration validation and quality checks

- [ ] T051 Run pnpm lint and pnpm format:check, fix any issues across all source files
- [ ] T052 Validate full startup sequence (DB connect → migrate → auto-backup → app ready) and verify all views render correctly
- [ ] T053 Run quickstart.md validation — verify all setup steps, commands, and project layout descriptions are accurate

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — first story to implement
- **US2 (Phase 4)**: Depends on US1 (needs transactions to summarize)
- **US3 (Phase 5)**: Depends on Phase 2 — can run in parallel with US1/US2 but benefits from existing data
- **US4 (Phase 6)**: Depends on US1+US2 and US3 (prints content from daily and analysis views)
- **US5 (Phase 7)**: Depends on Phase 2 — can run in parallel with other P3 stories
- **US6 (Phase 8)**: Depends on US1 and US3 (exports from daily and analysis views)
- **US7 (Phase 9)**: Depends on Phase 2 — independent of other P3 stories
- **US8 (Phase 10)**: Depends on Phase 2 — independent (auto-backup is deferred from foundational)
- **US9 (Phase 11)**: Depends on Phase 2 — fully independent
- **Polish (Phase 12)**: Depends on all desired stories being complete

### User Story Independence

| Story | Can Start After | Depends On Stories | Modifies Shared Files |
|-------|----------------|-------------------|----------------------|
| US1 | Phase 2 | None | — |
| US2 | US1 | US1 | daily-view.tsx |
| US3 | Phase 2 | None | — |
| US4 | US1+US2, US3 | US1, US2, US3 | daily-view.tsx, analysis-view.tsx, App.css |
| US5 | Phase 2 | None | — |
| US6 | US1, US3 | US1, US3 | daily-view.tsx, analysis-view.tsx |
| US7 | Phase 2 | None | settings-view.tsx (creates) |
| US8 | Phase 2 | None | db-provider.tsx, settings-view.tsx |
| US9 | Phase 2 | None | App.tsx, settings-view.tsx |

### Within Each User Story

- Types/utilities before hooks
- Hooks before components
- Child components before container components
- Services before UI that calls them

### Parallel Opportunities

**Phase 1**: T003, T004, T005 can all run in parallel after T002
**Phase 2**: T007, T008, T009 in parallel (after T006) | T012, T013, T014 in parallel | T017, T018, T019, T020, T022 in parallel
**Phase 3**: T023, T024 in parallel (before T025, T026)
**Phase 5**: T030, T031, T032 in parallel (after T029, before T033)
**Phase 6**: T035, T036 in parallel (after T034)
**Phase 7**: T038 in parallel with T037
**Phase 8**: T041, T042 in parallel (after T040)
**Phase 10**: T045, T046 in parallel (before T047)

---

## Parallel Example: User Story 3

```
# After use-analysis hook (T029), launch chart components in parallel:
Task: T030 "Create period chart component in src/components/analysis/period-chart.tsx"
Task: T031 "Create period metrics component in src/components/analysis/period-metrics.tsx"
Task: T032 "Create category breakdown component in src/components/analysis/category-breakdown.tsx"

# Then create the container that wires them together:
Task: T033 "Create analysis view container in src/components/analysis/analysis-view.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 — Daily Transaction Capture
4. Complete Phase 4: User Story 2 — Daily Summary & Live Totals
5. **STOP and VALIDATE**: The manager can add/edit/delete transactions with live totals
6. Demo-ready with core daily workflow

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 + US2 → Daily workflow complete (MVP!)
3. US3 → Period analysis adds reporting value
4. US4 → Print capability for daily + period views
5. US5 → Filtering adds investigation capability
6. US6 → Export adds data archival
7. US7 → Import adds data recovery/migration
8. US8 → Backup/restore adds data safety
9. US9 → Theme adds comfort polish

### Recommended Sequential Order

For single-developer execution, follow priority order:

```
Phase 1 → Phase 2 → US1 → US2 → US3 → US4 → US5 → US6 → US7 → US8 → US9 → Polish
```

Each story checkpoint produces a shippable increment.

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Use shadcn MCP tools to discover and install UI components before building custom ones
- Use Context7 MCP tool for up-to-date API references for Tauri plugins, Recharts, SheetJS, date-fns
- All amounts in kuruş (integer). Display layer converts to Turkish format.
- All dates stored as YYYY-MM-DD. Display layer uses date-fns Turkish locale.
- Categories from `src/lib/categories.ts` constants — never hardcoded in components
- Commit after each task or logical group
- Stop at any checkpoint to validate the story independently
