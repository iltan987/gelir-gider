# Quickstart: Financial Tracker Application

**Branch**: `001-finance-tracker-rewrite` | **Date**: 2026-03-21

## Prerequisites

- **pnpm** 10.x (enforced by `packageManager` field)
- **Rust** toolchain (for Tauri 2 backend)
- **Node.js** 20+ (for Vite dev server)

## Setup

```bash
# Clone and checkout
git checkout 001-finance-tracker-rewrite

# Install frontend dependencies
pnpm install

# Install Tauri plugins (each adds both Rust crate + JS bindings)
pnpm tauri add sql
pnpm tauri add dialog
pnpm tauri add fs
pnpm tauri add process

# Enable sqlite feature on tauri-plugin-sql in src-tauri/Cargo.toml

# Install application dependencies
pnpm add zustand date-fns recharts xlsx react-to-print
```

## Development

```bash
# Start Tauri dev (launches both Vite + Tauri)
pnpm tauri dev

# Frontend only (no Tauri shell)
pnpm dev

# Type check
pnpm build    # tsc && vite build

# Lint & format
pnpm lint
pnpm format:check
```

## Project Layout

```
src/
├── main.tsx              # React entry point
├── App.tsx               # Root component + view routing
├── App.css               # Global + print styles
├── components/
│   ├── ui/               # shadcn/ui managed components (do not edit manually)
│   ├── daily/            # Daily transaction view components
│   ├── analysis/         # Period analysis view components
│   ├── filter/           # Filtering/exploration view components
│   ├── settings/         # Settings view components
│   └── shared/           # Shared components (transaction form, category select, etc.)
├── stores/
│   ├── app-store.ts      # Combined Zustand store
│   ├── slices/
│   │   ├── transaction-slice.ts  # Transaction CRUD + data
│   │   ├── filter-slice.ts       # Active filters state
│   │   └── ui-slice.ts           # View routing, selected date, theme
├── services/
│   ├── db.ts             # SQLite database layer (tauri-plugin-sql wrapper)
│   ├── migrations.ts     # Schema migration runner (additive only, pre-migration backup)
│   ├── auto-backup.ts    # Automatic background backup (startup + 30min interval + retention)
│   ├── export.ts         # Spreadsheet export logic
│   ├── import.ts         # Spreadsheet import + validation logic
│   └── backup.ts         # Manual backup/restore file operations
├── lib/
│   ├── utils.ts          # shadcn cn() utility
│   ├── categories.ts     # Category constants
│   ├── format.ts         # Turkish number/date formatting utilities
│   └── calculations.ts   # Financial computation helpers (daily summary, period analysis)
├── types/
│   └── index.ts          # Shared TypeScript types (Transaction, DailySummary, etc.)
├── hooks/
│   ├── use-transactions.ts   # Transaction query hooks (by date, by filter)
│   └── use-analysis.ts       # Period analysis computation hook
└── providers/
    └── db-provider.tsx       # Database init + migration runner + auto-backup startup

src-tauri/
├── src/
│   ├── lib.rs            # Tauri plugin registration + custom commands
│   └── main.rs           # Entry point
├── capabilities/
│   └── default.json      # Tauri capabilities (permissions for plugins)
├── Cargo.toml            # Rust dependencies
└── tauri.conf.json       # Tauri configuration (including SQL plugin preload)
```

## Key Conventions

- **Amounts**: Stored as integer kuruş (1 TL = 100 kuruş). Display layer handles Turkish formatting.
- **Dates**: Stored as ISO `YYYY-MM-DD` strings. Display layer handles Turkish locale rendering via date-fns.
- **Categories**: Defined as TypeScript constants in `src/lib/categories.ts`. Never hardcoded elsewhere.
- **Views**: Routed via Zustand UI slice (`daily | analysis | filter | settings`). No URL-based routing.
- **Components**: Use shadcn/ui components from `src/components/ui/`. Custom components go in feature directories.
- **Migrations**: Additive only (CREATE TABLE, ALTER TABLE ADD COLUMN, CREATE INDEX). Never DROP or remove. Pre-migration backup always runs first.
- **Auto-backups**: GFS tiered retention — session (5), daily (7), weekly (4), monthly (6). All tier decisions at startup. Stored in `{app_data}/auto-backups/`. Pre-migration backups kept indefinitely.
