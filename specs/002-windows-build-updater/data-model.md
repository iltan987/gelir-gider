# Data Model: Financial Tracker Application

**Date**: 2026-03-21

## Entities

### Transaction

The core data unit. Represents a single financial movement (revenue or expense).

| Field | Type | Constraints | Notes |
|-------|------|------------|-------|
| `id` | `TEXT` (UUID) | PRIMARY KEY, NOT NULL | Generated client-side via `crypto.randomUUID()` |
| `date` | `TEXT` (ISO 8601) | NOT NULL, INDEX | Stored as `YYYY-MM-DD` for sorting/querying |
| `type` | `TEXT` | NOT NULL, CHECK(`type` IN ('revenue', 'expense')) | Discriminator for category validation |
| `amount` | `INTEGER` | NOT NULL, CHECK(`amount` != 0) | Stored in kuruş (1 TL = 100 kuruş) to avoid floating-point issues |
| `category` | `TEXT` | NOT NULL | Must match predefined list for the transaction type |
| `note` | `TEXT` | NULLABLE | Free-text, optional |
| `created_at` | `TEXT` (ISO 8601) | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Audit trail |

**Amount convention**: Amounts are always stored as positive integers in kuruş. The `type` field determines the financial direction. Exception: refund categories (İADE) store negative amounts to reflect refund semantics (FR-018).

**Indexes**:
- `idx_transaction_date` on `date` — fast daily record lookup and date range queries
- `idx_transaction_date_type` on `(date, type)` — fast daily summary calculation
- `idx_transaction_category` on `category` — fast category filtering

### Category (Static, Not Stored)

Categories are fixed lists defined in application code. They are not a database table — they are TypeScript constants in `src/lib/categories.ts`.

**Revenue categories** (9):
`BARTER`, `CARİYE MAHSUBEN`, `ÇEK`, `DİĞER`, `EFT-HAVALE`, `İADE`, `KREDİ KARTI`, `NAKİT`, `SENET`

**Expense categories** (40):
`AKSESUAR`, `ARAÇ KİRALAMA`, `ARAÇ TAMİR`, `BANKA KOMİSYON`, `CAM VE MLZ`, `CARİYE MAHSUBEN`, `ÇEK`, `DİĞER`, `ELEKTRİK FT`, `FAİZ`, `FAZLA MESAİ`, `FİNANSMAN`, `HGS`, `HIRDAVAT MLZ`, `İADE`, `İŞ GÜVENLİĞİ`, `KİRA`, `KONAKLAMA`, `MAAŞ`, `MAKİNA-TESİSAT`, `MAMA`, `MARKET`, `MUHASEBE`, `NAKLİYE GİDERİ`, `PANJUR`, `PRİM`, `PROFİL`, `PVC DOĞRAMA`, `PVC YRD. MLZ`, `REKLAMASYON`, `SAC`, `SARF-KIRTASİYE`, `SGK`, `SU FT`, `TELEFON FT`, `TRAFİK CEZASI`, `VERGİ`, `YAKIT`, `YEMEK`, `YÖNETİM GİDERLERİ`

**Refund categories**: `İADE` appears in both revenue and expense lists. When selected, the amount is automatically negated (FR-018).

### Derived Views (Not Stored)

These are computed from Transaction data and live in Zustand store state or component-level calculations.

#### DailySummary

| Field | Type | Derivation |
|-------|------|-----------|
| `date` | `string` | The selected day |
| `totalRevenue` | `number` | Sum of revenue transaction amounts for the day |
| `totalExpense` | `number` | Sum of expense transaction amounts for the day (absolute value) |
| `netResult` | `number` | `totalRevenue - totalExpense` |
| `profitPercentage` | `number \| null` | `(netResult / totalRevenue) * 100` when totalRevenue > 0, else `null` |

#### PeriodAnalysis

| Field | Type | Derivation |
|-------|------|-----------|
| `startDate` | `string` | Period start (inclusive) |
| `endDate` | `string` | Period end (inclusive) |
| `totalRevenue` | `number` | Sum of all revenue in period |
| `totalExpense` | `number` | Sum of all expenses in period |
| `netResult` | `number` | `totalRevenue - totalExpense` |
| `activeDays` | `number` | Count of days with at least one transaction |
| `avgDailyRevenue` | `number` | `totalRevenue / activeDays` |
| `avgDailyExpense` | `number` | `totalExpense / activeDays` |
| `bestDay` | `{ date: string; net: number }` | Day with highest net result |
| `worstDay` | `{ date: string; net: number }` | Day with lowest net result |
| `revenueByCategory` | `Map<string, number>` | Revenue totals grouped by category |
| `expenseByCategory` | `Map<string, number>` | Expense totals grouped by category |
| `dailyBreakdown` | `Array<{ date; revenue; expense; net }>` | Per-day data for chart rendering |

### AppMetadata (Singleton)

Tracks application-level state: schema version and auto-backup timestamps.

| Field | Type | Constraints | Notes |
|-------|------|------------|-------|
| `key` | `TEXT` | PRIMARY KEY, NOT NULL | Metadata key name |
| `value` | `TEXT` | NOT NULL | Metadata value (JSON-encoded when complex) |

**Known keys**:
- `schema_version`: Current migration version (integer as string, e.g., `"1"`)
- `last_auto_backup`: ISO 8601 timestamp of the most recent automatic backup
- `last_auto_backup_path`: File path of the most recent automatic backup

## Database Schema (SQLite)

```sql
-- Migration 001: Initial schema
CREATE TABLE IF NOT EXISTS transactions (
  id         TEXT PRIMARY KEY NOT NULL,
  date       TEXT NOT NULL,
  type       TEXT NOT NULL CHECK(type IN ('revenue', 'expense')),
  amount     INTEGER NOT NULL CHECK(amount != 0),
  category   TEXT NOT NULL,
  note       TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_transaction_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transaction_date_type ON transactions(date, type);
CREATE INDEX IF NOT EXISTS idx_transaction_category ON transactions(category);

CREATE TABLE IF NOT EXISTS app_metadata (
  key   TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO app_metadata (key, value) VALUES ('schema_version', '1');
```

## Migration Safety Rules

All future schema changes MUST follow these rules to prevent data loss (FR-024, FR-025):

1. **Additive only**: Permitted operations: `CREATE TABLE`, `ALTER TABLE ADD COLUMN`, `CREATE INDEX`. Prohibited: `DROP TABLE`, `DROP COLUMN`, `ALTER TABLE RENAME COLUMN`, `DELETE FROM`.
2. **Pre-migration backup**: Before executing any new migration, the application MUST create an automatic backup of the current database file. This backup is stored alongside auto-backups but tagged with the migration version.
3. **Version tracking**: Each migration increments `schema_version` in `app_metadata`. Migrations are idempotent — re-running a migration that has already been applied is a no-op.
4. **Migration file naming**: `{NNN}_{description}.sql` (e.g., `001_create_transactions.sql`, `002_add_tags_column.sql`). Files are applied in sequence order.

## Validation Rules

1. **Amount**: Must be non-zero. Stored as integer kuruş. Display layer converts to/from Turkish format (`15.000,00`).
2. **Category**: Must exist in the appropriate list (revenue categories for `type='revenue'`, expense categories for `type='expense'`). Validated at the application layer before INSERT.
3. **Date**: Must be a valid ISO 8601 date string (`YYYY-MM-DD`). No inherent restriction on past/future dates.
4. **Refund logic**: When category is `İADE`, the amount is stored as a negative value regardless of user input sign.
5. **Type**: Must be exactly `'revenue'` or `'expense'`. Enforced by CHECK constraint.

### UpdateStatus (Transient UI State, Not Stored)

Tracks the state of a manual update check. Lives only in component-level React state, not in the Zustand store or database.

| Field | Type | Notes |
|-------|------|-------|
| `status` | `"idle" \| "checking" \| "available" \| "downloading" \| "error" \| "upToDate"` | Current check/download state |
| `version` | `string \| null` | Available update version (when `status === "available"` or `"downloading"`) |
| `body` | `string \| null` | Release notes markdown (when `status === "available"`) |
| `date` | `string \| null` | Release date ISO string |
| `progress` | `number` | Download progress 0-100 (when `status === "downloading"`) |
| `error` | `string \| null` | Error message (when `status === "error"`) |

**Design decision**: Not stored in Zustand because update state is ephemeral (only relevant while the Settings view is open) and has no consumers outside the update checker card. Component-local state via `useState`/`useReducer` is simpler and avoids polluting the global store.

## State Transitions

Transactions have no state machine — they are created, optionally updated, and deleted. There is no draft/pending/approved workflow.

The only state-like behavior is the **bulk delete** for a day, which requires double confirmation (two distinct user actions) before execution (FR-005).

## Auto-Backup Lifecycle (GFS Tiered Retention)

Automatic backups use a calendar-based Grandfather-Father-Son strategy with four tiers:

| Tier | Prefix | Keep | Created When | Covers |
|------|--------|------|-------------|--------|
| Session | `auto-` | 5 | Every startup + periodic interval | Last ~1-2 workdays |
| Daily | `daily-` | 7 | First startup of each calendar day | Last 7 working days |
| Weekly | `weekly-` | 4 | First startup of each ISO week | Last ~1 month |
| Monthly | `monthly-` | 6 | First startup of each calendar month | Last ~6 months |
| Pre-migration | `pre-migration-` | Unlimited | Before any schema migration | All schema versions ever |

### Startup Sequence

On every app startup, after database connection but before user interaction:

1. **Always** create a session backup: `auto-{YYYY-MM-DD-HHmmss}.db`
2. **If** first startup of the calendar day: create `daily-{YYYY-MM-DD}.db`
3. **If** first startup of the ISO week: create `weekly-{YYYY}-W{NN}.db`
4. **If** first startup of the calendar month: create `monthly-{YYYY-MM}.db`
5. **Prune** each tier independently — delete oldest files exceeding the keep count
6. Update `last_auto_backup` in `app_metadata`
7. Start periodic session backup interval timer

### Key Design Decisions

- **Independent snapshots, not promotion**: Each tier is a fresh copy of the database at the moment of creation. Daily backups are NOT "promoted" session backups — they are independent snapshots. This avoids edge cases (what if the session backup to promote is corrupted?).
- **Startup-triggered**: All tier decisions happen at startup because a desktop app cannot guarantee it will be running at a fixed time. This is the only reliable trigger.
- **Periodic session interval**: Additional session backups during long work sessions provide intra-day coverage. These only create `auto-*` files, never higher-tier backups.
- **Pre-migration backups**: Kept indefinitely because schema-related bugs may not surface for months.
- **Failure handling**: If backup creation fails (disk full, permissions), log the error and continue. Auto-backup failure MUST NOT block application startup or normal operation.
