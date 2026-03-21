# Research: Financial Tracker Application

**Branch**: `001-finance-tracker-rewrite` | **Date**: 2026-03-21

## Storage Solution

**Decision**: SQLite via `tauri-plugin-sql`

**Rationale**: SQLite is purpose-built for embedded, single-user, offline desktop databases. 50,000 records is trivial for SQLite. Native SQL queries with indexes give sub-millisecond date range and category filtering. The database is a single `.db` file, making backup/restore a simple file copy operation. The plugin is maintained in the official Tauri `plugins-workspace` monorepo and supports automatic migrations.

**Alternatives considered**:
- `tauri-plugin-store` (key-value JSON): Designed for small config data. No query capability — all records loaded into memory, manual JS filtering. Rejected.
- `tauri-plugin-fs` (direct file storage): Too low-level. Would require building a custom query engine. Rejected.
- `tauri-plugin-libsql` (community plugin): Adds encryption and Drizzle ORM support, but is third-party with smaller community. Overkill for this use case. Rejected.

**Packages**:
- Rust: `tauri-plugin-sql` v2 with `sqlite` feature
- Frontend: `@tauri-apps/plugin-sql`
- Supporting: `tauri-plugin-dialog` + `@tauri-apps/plugin-dialog` (file picker for backup/restore/import/export), `tauri-plugin-fs` + `@tauri-apps/plugin-fs` (file operations)

---

## State Management

**Decision**: Zustand v5

**Rationale**: Zustand provides selective subscriptions (critical for live-updating totals without full re-renders), built-in persist middleware (for Tauri filesystem integration), and a slices pattern that maps directly to the app's domain: `transactionSlice` (CRUD + data), `filterSlice` (active filters), `uiSlice` (selected date, active view, theme). At ~1.2 KB gzipped, it adds negligible bundle weight. Works outside the React tree, which is useful for Tauri IPC callbacks.

**Alternatives considered**:
- React Context + useReducer: Triggers re-renders for all consumers on every state change. Would need many split contexts to avoid performance issues with live-updating totals. Rejected.
- Jotai: Atomic model is overkill for a document-oriented data model (transaction list with CRUD). More ceremony than Zustand for managing collections. Rejected.
- TanStack Store: Pre-1.0 (v0.9.2), no built-in persistence, no devtools. Not mature enough. Rejected.

**Package**: `zustand` v5.0.12

---

## Routing

**Decision**: State-based routing via Zustand (no routing library)

**Rationale**: This is a Tauri desktop app with 4 flat top-level views (daily transactions, period analysis, filtering, settings). There are no URLs to manage, no browser navigation expectations, no deep linking, no SSR. A `View` union type in a Zustand UI slice provides type-safe routing with zero additional dependencies. The active view can be persisted so users return to where they left off.

**Alternatives considered**:
- TanStack Router: Powerful but designed for URL-driven web apps. ~35 KB for features irrelevant in a desktop context. Rejected.
- React Router v7: Evolved into a framework with loaders/actions/SSR. ~15 KB of URL management machinery for 4 flat views. Rejected.

**Package**: None (built into Zustand store)

---

## Charts

**Decision**: Recharts

**Rationale**: SVG-based rendering produces crisp output at any resolution when printed — critical since print-ready reports are a P2 requirement. Declarative React component API (`<ComposedChart>`, `<Bar>`, `<Line>`) is idiomatic React 19. Full TypeScript support, tree-shakeable, and `<ResponsiveContainer>` handles window resize automatically. `<ComposedChart>` enables overlaying revenue bars with net trend lines.

**Alternatives considered**:
- Chart.js + react-chartjs-2: Canvas-based rendering produces rasterized output that appears blurry when printed. Imperative registration pattern is verbose. Larger combined bundle. Rejected.
- uPlot: Canvas-based, minimal imperative API. Optimized for millions of time-series points — overkill for hundreds of data points per chart. Same print quality issue as Chart.js. Rejected.

**Package**: `recharts`

---

## Spreadsheet I/O

**Decision**: SheetJS (xlsx)

**Rationale**: Pure JavaScript (no native dependencies), works identically in browser/webview environments. Full UTF-8 support for Turkish characters. Both read and write capability for round-trip import/export. SheetJS has documented Tauri integration patterns. ~200 KB minified is reasonable for the functionality provided.

**Alternatives considered**:
- ExcelJS: Excellent for rich cell formatting but ~800 KB, Node.js-oriented API requires more adaptation for Tauri webview. Only needed if advanced cell styling is required later. Rejected for initial implementation.

**Package**: `xlsx`

**Note**: SheetJS docs reference Tauri v1 APIs. For Tauri v2, use `@tauri-apps/plugin-dialog` and `@tauri-apps/plugin-fs` instead of the deprecated v1 imports.

---

## Date Handling

**Decision**: date-fns v4

**Rationale**: Tree-shakeable by design — each function is a standalone ES module import, bundling only what's used (~5-15 KB after tree-shaking). 200+ functions including exact matches for period aggregation needs: `startOfMonth`, `endOfMonth`, `eachMonthOfInterval`, `eachDayOfInterval`, `isWithinInterval`, `differenceInDays`. Turkish locale built-in (`date-fns/locale/tr`) produces "21 Mart 2026". Immutable pure functions working with native `Date` objects. TypeScript-first.

**Alternatives considered**:
- dayjs: 2 KB headline is misleading — required plugins (customParseFormat, isBetween, duration, etc.) approach date-fns size without tree-shaking. Plugin registration is mutable global state. ~50 built-in methods vs date-fns's 200+ functions. Rejected.
- Native Intl API alone: Good for formatting but provides zero date math utilities (add, intervals, ranges). Would require error-prone manual Date arithmetic. Rejected as sole solution — Intl.NumberFormat will be used for currency formatting alongside date-fns.

**Package**: `date-fns` v4

---

## Print

**Decision**: react-to-print + CSS `@media print`

**Rationale**: Tauri v2's webview supports `window.print()` natively — no special Tauri print API exists. `react-to-print` provides a `useReactToPrint` hook that targets specific React component refs for printing (isolating report content from navigation chrome). CSS `@media print` controls layout, page breaks, and element visibility. SVG charts from Recharts print natively without conversion. The native print dialog gives users printer selection, page range, and "Save as PDF" for free.

**Alternatives considered**:
- jsPDF / @react-pdf/renderer: Significant complexity and bundle size for a feature the native print dialog already provides. Rejected.
- window.print() alone (no library): Works but loses the ability to cleanly target a specific component without showing the surrounding app chrome. react-to-print adds this for ~5 KB. Rejected as insufficient.

**Package**: `react-to-print`

---

## Data Preservation Strategy

**Decision**: Additive-only SQLite migrations + GFS tiered automatic backups

**Rationale**: Financial data is irreplaceable. The application must guarantee zero data loss across updates. This is achieved through two complementary mechanisms:

1. **Additive-only migrations**: Schema changes only add new columns or tables — never DROP, DELETE, or ALTER existing structures. This ensures that even if a migration fails mid-way, existing data remains intact and accessible. SQLite's `ALTER TABLE ADD COLUMN` is atomic and safe.

2. **GFS tiered automatic backups**: A calendar-based Grandfather-Father-Son backup strategy provides recovery points at multiple time horizons. Session backups cover the last 1-2 workdays, daily backups cover the past week, weekly backups cover the past month, and monthly backups cover the past 6 months. Pre-migration backups are kept indefinitely for schema rollback.

**Alternatives considered**:
- Flat FIFO ring buffer (keep last 10): Too shallow — a user creating 2-3 session backups per day would burn through 10 slots in 3-4 days. If a problem introduced on Monday is discovered on Friday, all 10 backups may contain the corrupted data. Rejected.
- WAL mode + crash recovery only: SQLite WAL provides crash safety but not protection against application-level bugs that write bad data. Rejected as insufficient alone (WAL mode should still be enabled for performance).
- User-initiated backups only: Relies on user discipline. A financial manager may forget to back up for weeks. Rejected — automatic backups cover this gap.
- Exponential thinning (Tower of Hanoi / pylog2rotate): Produces unpredictable retention periods. A Finance Manager thinks in "last week" and "last month", not "approximately 8 days ago". Calendar-based tiers are more intuitive. Rejected.
- Cloud sync: Requires network connectivity and adds complexity. This is an offline desktop app. Rejected.

**Tier structure**:

| Tier | Prefix | Keep | Covers | Protects Against |
|------|--------|------|--------|-----------------|
| Session | `auto-` | 5 | Last ~1-2 workdays | App crash, immediate undo, intra-day corruption |
| Daily | `daily-` | 7 | Last 7 working days | Bad import discovered next day, bug from earlier this week |
| Weekly | `weekly-` | 4 | Last ~1 month | Gradual corruption not noticed for weeks |
| Monthly | `monthly-` | 6 | Last ~6 months | Historical comparison, seasonal error discovery |
| Pre-migration | `pre-migration-` | Unlimited | All schema versions | Failed migration, version-introduced data bugs |

**Key design decisions**:
- All tier decisions evaluated at app startup (only reliable trigger for a desktop app)
- Independent snapshots, not promotion (avoids corrupted-backup-promotion edge case)
- Periodic session interval for intra-day coverage during long work sessions
- Maximum ~22 files + pre-migration = ~110 MB worst case (bounded growth)
- Auto-backup failure is silently logged, never blocks the user
