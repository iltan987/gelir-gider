# Database Contract

**Layer**: Frontend ↔ SQLite (via tauri-plugin-sql)

## Connection

The database is preloaded by Tauri at startup via `tauri.conf.json`:

```json
{
  "plugins": {
    "sql": {
      "preload": ["sqlite:gelir-gider.db"]
    }
  }
}
```

The frontend connects with:
```typescript
import Database from '@tauri-apps/plugin-sql';
const db = await Database.load('sqlite:gelir-gider.db');
```

## Queries

### Insert Transaction

```sql
INSERT INTO transactions (id, date, type, amount, category, note, created_at)
VALUES ($1, $2, $3, $4, $5, $6, datetime('now'))
```

**Parameters**: `[id: string, date: string, type: 'revenue'|'expense', amount: number, category: string, note: string|null]`

### Update Transaction

```sql
UPDATE transactions
SET date = $1, type = $2, amount = $3, category = $4, note = $5
WHERE id = $6
```

### Delete Transaction

```sql
DELETE FROM transactions WHERE id = $1
```

### Delete All Transactions for Date

```sql
DELETE FROM transactions WHERE date = $1
```

**Precondition**: Requires double confirmation at the UI layer before execution.

### Get Transactions by Date

```sql
SELECT id, date, type, amount, category, note, created_at
FROM transactions
WHERE date = $1
ORDER BY created_at ASC
```

### Get Transactions by Date Range

```sql
SELECT id, date, type, amount, category, note, created_at
FROM transactions
WHERE date BETWEEN $1 AND $2
ORDER BY date ASC, created_at ASC
```

### Get Daily Summary

```sql
SELECT
  type,
  SUM(amount) as total
FROM transactions
WHERE date = $1
GROUP BY type
```

### Get Period Summary by Day

```sql
SELECT
  date,
  type,
  SUM(amount) as total
FROM transactions
WHERE date BETWEEN $1 AND $2
GROUP BY date, type
ORDER BY date ASC
```

### Get Category Breakdown

```sql
SELECT
  category,
  type,
  SUM(amount) as total,
  COUNT(*) as count
FROM transactions
WHERE date BETWEEN $1 AND $2
GROUP BY category, type
ORDER BY total DESC
```

### Filter Transactions

Dynamic query built from filter conditions:

```sql
SELECT id, date, type, amount, category, note, created_at
FROM transactions
WHERE 1=1
  AND (date BETWEEN $start AND $end)           -- if date range filter
  AND (category IN ($cat1, $cat2, ...))         -- if category equals filter
  AND (category NOT IN ($cat1, $cat2, ...))     -- if category not-equals filter
  AND (note LIKE '%' || $search || '%'          -- if free-text search
       OR category LIKE '%' || $search || '%')
ORDER BY date DESC, created_at DESC
```

### Count Transactions

```sql
SELECT COUNT(*) as count FROM transactions
```

Used for backup validation and import preview.

### Get/Set App Metadata

```sql
-- Read a metadata value
SELECT value FROM app_metadata WHERE key = $1

-- Write a metadata value (upsert)
INSERT INTO app_metadata (key, value) VALUES ($1, $2)
  ON CONFLICT(key) DO UPDATE SET value = excluded.value
```

**Used for**: schema version tracking, last auto-backup timestamp.

## Migration Strategy

### Rules (FR-024, FR-025)

1. **Additive only**: `CREATE TABLE`, `ALTER TABLE ADD COLUMN`, `CREATE INDEX` only. Never `DROP`, `DELETE`, or `RENAME`.
2. **Pre-migration backup**: Before applying any new migration, copy the database file to `{app_data}/auto-backups/pre-migration-{NNN}-{timestamp}.db`. Pre-migration backups are never auto-deleted.
3. **Version tracking**: After each migration, update `schema_version` in `app_metadata`.
4. **Idempotent**: Use `IF NOT EXISTS` on all `CREATE` statements. Re-running is safe.

### Migration Files

```
src-tauri/migrations/
└── 001_create_transactions.sql    # Initial schema (transactions + app_metadata + indexes)
```

### Startup Sequence

1. Open database connection
2. Read `schema_version` from `app_metadata` (default `0` if table doesn't exist)
3. For each migration file with number > current version:
   a. Create pre-migration backup (`pre-migration-{NNN}-{timestamp}.db`)
   b. Execute migration SQL
   c. Update `schema_version`
4. Create tiered backups (session always; daily/weekly/monthly if first startup of that period)
5. Prune each tier to its retention limit
6. Update `last_auto_backup` timestamp in `app_metadata`
7. Start periodic session backup interval timer
8. Application ready

## Auto-Backup Contract (GFS Tiered Retention)

### Backup Directory

```typescript
import { appDataDir } from '@tauri-apps/api/path';
const backupDir = `${await appDataDir()}/auto-backups`;
```

### Tier Metadata Keys

| Key | Value | Purpose |
|-----|-------|---------|
| `last_auto_backup` | ISO 8601 timestamp | Most recent backup of any tier |
| `last_daily_backup` | `YYYY-MM-DD` | Date of last daily-tier backup |
| `last_weekly_backup` | `YYYY-WNN` | ISO week of last weekly-tier backup |
| `last_monthly_backup` | `YYYY-MM` | Month of last monthly-tier backup |

### Create Tiered Backups (on startup)

```typescript
// 1. Session (always)
copy(dbPath, `${backupDir}/auto-${timestamp}.db`)

// 2. Daily (if new day)
const today = formatDate(now, 'YYYY-MM-DD')
if (today !== metadata.last_daily_backup) {
  copy(dbPath, `${backupDir}/daily-${today}.db`)
  setMetadata('last_daily_backup', today)
}

// 3. Weekly (if new ISO week)
const thisWeek = formatDate(now, 'YYYY-WNN')
if (thisWeek !== metadata.last_weekly_backup) {
  copy(dbPath, `${backupDir}/weekly-${thisWeek}.db`)
  setMetadata('last_weekly_backup', thisWeek)
}

// 4. Monthly (if new month)
const thisMonth = formatDate(now, 'YYYY-MM')
if (thisMonth !== metadata.last_monthly_backup) {
  copy(dbPath, `${backupDir}/monthly-${thisMonth}.db`)
  setMetadata('last_monthly_backup', thisMonth)
}

// 5. Update last_auto_backup
setMetadata('last_auto_backup', now.toISOString())
```

### Prune Per Tier

```typescript
for (const { prefix, keepCount } of [
  { prefix: 'auto-', keepCount: 5 },
  { prefix: 'daily-', keepCount: 7 },
  { prefix: 'weekly-', keepCount: 4 },
  { prefix: 'monthly-', keepCount: 6 },
  // pre-migration-* is NEVER pruned
]) {
  const files = listFiles(backupDir, `${prefix}*.db`).sort()
  if (files.length > keepCount) {
    for (const f of files.slice(0, files.length - keepCount)) {
      deleteFile(f)
    }
  }
}
```

### Failure Handling

Auto-backup errors are caught and logged. They never throw to the caller. The application continues normally even if auto-backup fails.
