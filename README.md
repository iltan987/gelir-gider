# Gelir Gider

Single-user financial tracker desktop app for managing daily income and expenses. Built with Tauri 2, React 19, and SQLite.

<!-- Add a screenshot: ![Gelir Gider](docs/screenshot.png) -->

## Features

- **Daily transactions** -- add, edit, and delete income/expense entries per day with real-time summary
- **52 categories** -- 9 revenue and 43 expense categories tailored for Turkish small-business use
- **Period analysis** -- date range filtering with quick presets, charts, metrics dashboard, and category breakdowns
- **Charts** -- composed bar/line charts showing daily revenue, expenses, and net profit over time
- **Excel import/export** -- import transactions from `.xlsx`/`.xls` files with preview and validation; export daily or period reports
- **Print reports** -- print-optimized daily and analysis reports
- **Auto-backup** -- GFS tiered retention: session (keep 5), daily (keep 7), weekly (keep 4), monthly (keep 6)
- **Manual backup/restore** -- save and restore SQLite database files with validation
- **Auto-updater** -- check and install updates via GitHub releases (Windows NSIS installer)
- **Theming** -- system, light, and dark modes
- **Turkish locale** -- all UI text, date formatting, and currency display in Turkish

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop shell | Tauri 2 (Rust) |
| Frontend | React 19, TypeScript 5.8 (strict) |
| Styling | Tailwind CSS 4, shadcn/ui |
| State | Zustand 5 |
| Database | SQLite via tauri-plugin-sql |
| Charts | Recharts |
| Spreadsheets | SheetJS (xlsx) |
| Dates | date-fns (Turkish locale) |
| Printing | react-to-print |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [pnpm](https://pnpm.io/) 10+
- [Rust](https://www.rust-lang.org/tools/install)
- [Tauri 2 prerequisites](https://v2.tauri.app/start/prerequisites/) for your platform

### Install and Run

```bash
git clone https://github.com/iltan987/gelir-gider.git
cd gelir-gider
pnpm install
pnpm tauri dev
```

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Vite dev server (frontend only) |
| `pnpm tauri dev` | Full Tauri dev (frontend + Rust shell) |
| `pnpm build` | TypeScript check + Vite production build |
| `pnpm lint` | ESLint |
| `pnpm lint:fix` | ESLint with auto-fix |
| `pnpm format:check` | Prettier check |
| `pnpm format` | Prettier write |

## Project Structure

```
src/                   # React frontend
├── components/ui/     # shadcn/ui primitives
├── components/        # Feature components (daily/, analysis/, settings/, shared/)
├── stores/            # Zustand store + slices
├── services/          # Database, export, import, backup services
├── lib/               # Utilities (categories, formatting, calculations)
├── types/             # Shared TypeScript types
├── hooks/             # Custom React hooks
└── providers/         # Database initialization provider

src-tauri/             # Tauri backend
├── src/               # Rust entry + plugin registration
├── migrations/        # SQLite migration files
└── capabilities/      # Tauri plugin permissions
```

## License

[MIT](LICENSE)
