# File I/O Contract

**Layer**: Frontend ↔ Filesystem (via tauri-plugin-fs + tauri-plugin-dialog)

## Export (Spreadsheet)

### File Format
- **Type**: `.xlsx` (Office Open XML)
- **Encoding**: UTF-8 (native to .xlsx format, supports Turkish characters)

### Sheet Structure (Single Day Export)

**Sheet name**: Date in Turkish format (e.g., "21 Mart 2026")

| Row | Content |
|-----|---------|
| 1 | Header: "Günlük Rapor - {date}" |
| 2 | Empty |
| 3 | Column headers: Tarih, Tür, Tutar, Kategori, Not |
| 4..N | Transaction rows |
| N+1 | Empty |
| N+2 | Summary: Toplam Gelir: {amount} |
| N+3 | Summary: Toplam Gider: {amount} |
| N+4 | Summary: Net Sonuç: {amount} |
| N+5 | Summary: Kâr Oranı: {percentage}% |

### Sheet Structure (Month/Range Export)

**Sheet name**: Period label (e.g., "Mart 2026" or "Ocak-Mart 2026")

Transactions grouped by day with daily subtotals, followed by period summary at the end.

### Trigger
```typescript
// User initiates via export button
// File save dialog presented via @tauri-apps/plugin-dialog
const path = await save({
  defaultPath: `gelir-gider-${period}.xlsx`,
  filters: [{ name: 'Excel', extensions: ['xlsx'] }],
});
```

## Import (Spreadsheet)

### Accepted Formats
- `.xlsx` (preferred)
- `.xls` (legacy support via SheetJS)

### Validation Pipeline

1. **File selection**: User picks file via `@tauri-apps/plugin-dialog` open dialog
2. **Parse**: SheetJS reads file into row arrays
3. **Validate each row**:
   - Date: Must be parseable to a valid `YYYY-MM-DD`
   - Type: Must be `'revenue'` or `'expense'` (or Turkish equivalents: `'gelir'`, `'gider'`)
   - Amount: Must be a non-zero number
   - Category: Must exist in the appropriate category list for the type
4. **Preview**: Show valid rows + error rows with specific error messages
5. **Execute**: On user confirmation, insert valid rows via batch SQL INSERT

### Error Format
```typescript
interface ImportError {
  row: number;        // 1-indexed row number in spreadsheet
  field: string;      // Which field failed validation
  value: string;      // The raw value that failed
  message: string;    // Human-readable Turkish error message
}
```

## Manual Backup

### File Format
- **Type**: SQLite database file (`.db`)
- **Naming**: `gelir-gider-yedek-{YYYY-MM-DD-HHmmss}.db`

### Backup Flow
1. User initiates backup
2. File save dialog presented
3. SQLite database file is copied to selected path via `tauri-plugin-fs`
4. Confirmation shown with file path

### Restore Flow
1. User selects backup file via open dialog
2. Basic validation: file exists, is a valid SQLite database, has `transactions` table
3. Confirmation dialog with clear consequence description ("Tüm mevcut veriler yedek dosyasındaki verilerle değiştirilecektir.")
4. Current database replaced with backup file
5. Application relaunches (Tauri process restart)

### Restore Validation
```sql
-- Verify backup file has expected schema
SELECT name FROM sqlite_master WHERE type='table' AND name='transactions';
-- Verify column structure
PRAGMA table_info(transactions);
```

## Automatic Background Backups — GFS Tiered Retention (FR-015a, FR-015b, FR-015c)

### Storage Location

```
{app_data}/auto-backups/
├── auto-2026-03-21-083000.db         # Session (startup)
├── auto-2026-03-21-113000.db         # Session (interval)
├── auto-2026-03-21-143000.db         # Session (interval)
├── daily-2026-03-21.db               # Daily (first startup of the day)
├── daily-2026-03-20.db
├── daily-2026-03-19.db
├── weekly-2026-W12.db                # Weekly (first startup of the week)
├── weekly-2026-W11.db
├── monthly-2026-03.db                # Monthly (first startup of the month)
├── monthly-2026-02.db
├── pre-migration-002-2026-03-22-090000.db  # Pre-migration (kept indefinitely)
└── ...
```

`{app_data}` is the platform-specific Tauri app data directory:
- **Linux**: `~/.local/share/com.icaner.gelir-gider/`
- **macOS**: `~/Library/Application Support/com.icaner.gelir-gider/`
- **Windows**: `%APPDATA%/com.icaner.gelir-gider/`

### Tier Structure

| Tier | Prefix | Keep | Created When | Naming Pattern |
|------|--------|------|-------------|----------------|
| Session | `auto-` | 5 | App startup + periodic interval | `auto-YYYY-MM-DD-HHmmss.db` |
| Daily | `daily-` | 7 | First startup of each calendar day | `daily-YYYY-MM-DD.db` |
| Weekly | `weekly-` | 4 | First startup of each ISO week | `weekly-YYYY-WNN.db` |
| Monthly | `monthly-` | 6 | First startup of each calendar month | `monthly-YYYY-MM.db` |
| Pre-migration | `pre-migration-` | Unlimited | Before any schema migration | `pre-migration-NNN-YYYY-MM-DD-HHmmss.db` |

**Maximum files**: 5 + 7 + 4 + 6 + N pre-migration = 22 + N (~110 MB at 5 MB/file)

### Startup Algorithm

```
On app startup (after DB connection, before user interaction):

1. ALWAYS create session backup: auto-{timestamp}.db
2. Read last_daily_backup, last_weekly_backup, last_monthly_backup from app_metadata
3. IF today > last_daily_backup date → create daily-{YYYY-MM-DD}.db
4. IF this ISO week > last_weekly_backup week → create weekly-{YYYY}-W{NN}.db
5. IF this month > last_monthly_backup month → create monthly-{YYYY-MM}.db
6. For each tier: list files matching prefix, sort by name, delete oldest if count > keep limit
7. Update app_metadata timestamps
8. Start periodic session interval timer
```

### Periodic Session Interval

During active use, a timer creates additional `auto-*` session backups. The interval is intentionally generous (not overly frequent) since startup backups and daily backups provide the primary coverage. Only session-tier files are created by the interval — never daily/weekly/monthly.

### Retention Policy

Each tier is pruned independently:
- **Session** (`auto-*`): Keep 5, delete oldest — covers immediate recovery
- **Daily** (`daily-*`): Keep 7, delete oldest — covers "what did I have yesterday/last week?"
- **Weekly** (`weekly-*`): Keep 4, delete oldest — covers "what did I have earlier this month?"
- **Monthly** (`monthly-*`): Keep 6, delete oldest — covers "what did I have last quarter?"
- **Pre-migration** (`pre-migration-*`): Never auto-deleted — indefinite schema rollback

### Failure Handling

Auto-backup failure MUST NOT block application startup or normal operation. Errors are logged silently. The user is not interrupted or notified of auto-backup failures — only the `last_auto_backup` timestamp in settings will appear stale, signaling a problem indirectly.
