# Implementation Plan: Financial Tracker Application

**Branch**: `001-finance-tracker-rewrite` | **Date**: 2026-03-21 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-finance-tracker-rewrite/spec.md`

## Summary

Full rewrite of a single-user financial operations desktop application for a Finance and Administration Manager. The application tracks daily revenue and expense transactions, provides period-based analysis with visual charts, supports import/export via Excel spreadsheets and backup/restore workflows, and produces print-ready reports. Built as a Tauri 2 desktop app with a React 19 frontend, SQLite storage, and Turkish locale throughout.

## Technical Context

**Language/Version**: TypeScript 5.8+ (`strict: true`) for frontend, Rust (edition 2021) for Tauri backend
**Primary Dependencies**: React 19, Tauri 2, shadcn/ui, Tailwind CSS 4, Zustand 5, date-fns 4, Recharts, SheetJS (xlsx), react-to-print
**Storage**: SQLite via `tauri-plugin-sql` — single `.db` file, supports ~50K records efficiently with indexed queries
**Testing**: Manual testing only (per constitution). No tests/ directory. No automated test infrastructure.
**Target Platform**: Desktop (Windows, macOS, Linux) via Tauri 2 webview
**Project Type**: Desktop application
**Performance Goals**: Daily list render <100ms (200 records), date navigation <200ms, period analysis <3s (loading indicator at 300ms), export <10s per month, filter results <2s
**Constraints**: Offline-capable (desktop app, no network required), single-user (no auth), Turkish locale only
**Scale/Scope**: Single user, ~50,000 records (3 years of daily data), 4 top-level views, ~15 components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0 Check

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Tool-First Development | ✅ PASS | Context7 used for library research. shadcn MCP tools will be used during implementation for component discovery. |
| II. Type Safety & Code Quality | ✅ PASS | `strict: true` already in tsconfig.json. ESLint + Prettier configured. Plan uses typed Zustand stores, TypeScript constants for categories. |
| III. Component-Driven UI | ✅ PASS | shadcn/ui as primary component library. Button already installed. All UI will query shadcn tools before building. |
| IV. Testing Standards | ✅ PASS | Manual testing only. No tests/ directory. No automated test infrastructure. |
| V. User Experience Consistency | ✅ PASS | date-fns Turkish locale for dates, kuruş integer storage with Turkish number display, categories from `src/lib/categories.ts`, double confirmation for destructive actions, side-by-side layout, grid lines, print-optimized stylesheets. |
| VI. Performance & Responsiveness | ✅ PASS | SQLite with indexes for fast queries, Zustand selective subscriptions for minimal re-renders, loading indicators for long operations. |

### Technology Standards Check

| Technology | Required | Planned | Status |
|-----------|----------|---------|--------|
| Tauri 2 | `@tauri-apps/api ^2` | ✅ Already installed | PASS |
| React 19 | `react ^19.1.0` | ✅ Already installed | PASS |
| TypeScript 5.8+ | `strict: true` | ✅ Already configured | PASS |
| Tailwind CSS 4 | `@tailwindcss/vite` | ✅ Already installed | PASS |
| shadcn/ui | `shadcn ^4.1.0` | ✅ Already installed (dev) | PASS |
| Base UI React | `@base-ui/react ^1.3.0` | ✅ Already installed | PASS |
| CVA | `class-variance-authority` | ✅ Already installed | PASS |
| Lucide React | `lucide-react` | ✅ Already installed | PASS |
| Vite 7 | ESM only | ✅ Already configured | PASS |
| pnpm 10 | `packageManager` enforced | ✅ Already configured | PASS |
| Geist Font | `@fontsource-variable/geist` | ✅ Already installed | PASS |

### New Dependencies (Require User Approval)

These are **additions**, not substitutions. All are required by the feature spec and have no existing alternatives in the stack.

| Package | Purpose | Justification |
|---------|---------|---------------|
| `tauri-plugin-sql` (Rust) + `@tauri-apps/plugin-sql` | SQLite storage | Persistent structured data with indexed queries for ~50K records |
| `tauri-plugin-dialog` (Rust) + `@tauri-apps/plugin-dialog` | File picker dialogs | Required for import/export/backup/restore file selection |
| `tauri-plugin-fs` (Rust) + `@tauri-apps/plugin-fs` | Filesystem access | Required for backup/restore file copy operations |
| `zustand` | State management | Selective subscriptions for live totals, persist middleware, slices pattern |
| `date-fns` | Date manipulation | Turkish locale formatting, period calculations, tree-shakeable |
| `recharts` | Chart rendering | SVG-based (print-friendly), declarative React API |
| `xlsx` (SheetJS) | Spreadsheet I/O | Excel import/export with Turkish character support |
| `react-to-print` | Print triggering | Component-targeted print via native print dialog |

### Post-Phase 1 Re-Check

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Tool-First Development | ✅ PASS | Research used Context7 for Tauri plugin APIs. Implementation will use shadcn tools for each component. |
| II. Type Safety & Code Quality | ✅ PASS | Data model uses typed interfaces. Zustand store is fully typed. Category constants are `as const` arrays. |
| III. Component-Driven UI | ✅ PASS | Data model is UI-framework agnostic. Components will be built from shadcn/ui primitives. |
| IV. Testing Standards | ✅ PASS | No test infrastructure. Manual testing covers all workflows. |
| V. User Experience Consistency | ✅ PASS | Amount stored as kuruş avoids floating-point. date-fns/locale/tr handles all date display. Categories match `src/lib/categories.ts` constants exactly. |
| VI. Performance & Responsiveness | ✅ PASS | SQLite indexes on date, (date,type), category. Zustand selective subscriptions. Recharts ResponsiveContainer. |

## Project Structure

### Documentation (this feature)

```text
specs/001-finance-tracker-rewrite/
├── plan.md              # This file
├── research.md          # Phase 0 output — technology decisions and rationale
├── data-model.md        # Phase 1 output — entity definitions and SQLite schema
├── quickstart.md        # Phase 1 output — setup and project layout guide
├── contracts/
│   ├── database.md      # SQLite query contracts
│   └── file-io.md       # Import/export/backup file format contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── main.tsx                  # React entry point
├── App.tsx                   # Root component + view routing
├── App.css                   # Global styles + @media print rules
├── components/
│   ├── ui/                   # shadcn/ui managed components (do not edit)
│   ├── daily/                # Daily transaction view
│   │   ├── daily-view.tsx
│   │   ├── transaction-form.tsx
│   │   ├── transaction-list.tsx
│   │   └── daily-summary.tsx
│   ├── analysis/             # Period analysis view
│   │   ├── analysis-view.tsx
│   │   ├── period-chart.tsx
│   │   ├── period-metrics.tsx
│   │   └── category-breakdown.tsx
│   ├── filter/               # Filtering/exploration view
│   │   ├── filter-view.tsx
│   │   ├── filter-builder.tsx
│   │   └── results-grid.tsx
│   ├── settings/             # Settings view
│   │   └── settings-view.tsx
│   └── shared/               # Shared components
│       ├── category-select.tsx
│       ├── date-picker.tsx
│       ├── nav-bar.tsx
│       └── confirm-dialog.tsx
├── stores/
│   ├── app-store.ts          # Combined Zustand store
│   └── slices/
│       ├── transaction-slice.ts
│       ├── filter-slice.ts
│       └── ui-slice.ts
├── services/
│   ├── db.ts                 # SQLite database layer
│   ├── migrations.ts         # Schema migration runner (additive only, pre-migration backup)
│   ├── auto-backup.ts        # Automatic background backup (startup + 30min interval + retention)
│   ├── export.ts             # Spreadsheet export
│   ├── import.ts             # Spreadsheet import + validation
│   └── backup.ts             # Manual backup/restore operations
├── lib/
│   ├── utils.ts              # shadcn cn() utility (existing)
│   ├── categories.ts         # Category constants
│   ├── format.ts             # Turkish number/date formatting
│   └── calculations.ts       # Financial computation helpers
├── types/
│   └── index.ts              # Shared TypeScript types
├── hooks/
│   ├── use-transactions.ts   # Transaction query hooks
│   └── use-analysis.ts       # Period analysis hook
└── providers/
    └── db-provider.tsx        # Database initialization + auto-backup startup

src-tauri/
├── src/
│   ├── lib.rs                # Plugin registration + commands
│   └── main.rs               # Entry point
├── migrations/
│   └── 001_create_transactions.sql
├── capabilities/
│   └── default.json          # Plugin permissions
├── Cargo.toml
└── tauri.conf.json           # SQL plugin preload config
```

**Structure Decision**: Tauri 2 desktop app — single `src/` directory for the React frontend with feature-based component subdirectories, `src-tauri/` for the Rust backend (plugins only, no custom Rust logic beyond plugin registration). View routing is state-based via Zustand (no URL router). No `tests/` directory — manual testing per constitution.

## Complexity Tracking

> No constitution violations to justify. All planned dependencies are additions within the approved technology stack. No architectural patterns conflict with constitution principles.
