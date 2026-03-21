# gelir-gider Development Guidelines

Single-user financial tracker desktop app. Tauri 2 + React 19 + SQLite.

## Tech Stack

- **Frontend**: TypeScript 5.8+ (strict), React 19, Tailwind CSS 4, shadcn/ui, Zustand 5
- **Backend**: Tauri 2 (Rust — plugin registration only, no custom Rust logic)
- **Storage**: SQLite via tauri-plugin-sql
- **Libraries**: date-fns 4 (Turkish locale), Recharts (charts), SheetJS/xlsx (spreadsheet I/O), react-to-print

## Commands

```bash
pnpm dev              # Vite dev server (frontend only)
pnpm tauri dev        # Full Tauri dev (frontend + Rust shell)
pnpm build            # tsc && vite build
pnpm lint             # ESLint
pnpm lint:fix         # ESLint with auto-fix
pnpm format:check     # Prettier check
pnpm format           # Prettier write
```

## Project Structure

```
src/                   # React frontend
├── components/ui/     # shadcn/ui managed (do not edit manually)
├── components/        # Feature components (daily/, analysis/, filter/, settings/, shared/)
├── stores/            # Zustand store + slices
├── services/          # Database, export, import, backup services
├── lib/               # Utilities (categories, formatting, calculations)
├── types/             # Shared TypeScript types
├── hooks/             # Custom React hooks
└── providers/         # Database initialization provider

src-tauri/             # Tauri backend
├── src/               # Rust entry + plugin registration
├── migrations/        # SQLite migration files (additive only — never DROP or remove columns)
└── capabilities/      # Tauri plugin permissions
```

## Key Conventions

- **Amounts**: Integer kuruş (1 TL = 100 kuruş). Display layer handles Turkish formatting.
- **Dates**: ISO `YYYY-MM-DD` in storage. Turkish locale display via date-fns.
- **Categories**: Constants in `src/lib/categories.ts`. Never hardcoded elsewhere.
- **Views**: State-based routing via Zustand (daily | analysis | filter | settings). No URL router.
- **Migrations**: Additive only. Never DROP tables/columns. Always `ALTER TABLE ADD COLUMN` or create new tables. Auto-backup runs before every migration.
- **Auto-backups**: GFS tiered retention — session (keep 5), daily (keep 7), weekly (keep 4), monthly (keep 6). All tier decisions at startup. Pre-migration backups kept indefinitely. Failure never blocks user.
- **No tests/ directory**: Manual testing per constitution. No automated test infrastructure.

## Current Feature

Branch `001-finance-tracker-rewrite` — specs in `specs/001-finance-tracker-rewrite/`

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
