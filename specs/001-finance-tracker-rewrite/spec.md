# Feature Specification: Financial Tracker Application

**Feature Branch**: `001-finance-tracker-rewrite`
**Created**: 2026-03-21
**Status**: Draft
**Input**: Full rewrite of a single-user financial operations tool for a Finance and Administration Manager. The application tracks daily revenue and expense transactions, provides period-based analysis, supports import/export and backup/restore workflows, and produces print-ready reports. All interactions use Turkish locale conventions.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Daily Transaction Capture (Priority: P1)

The Finance Manager opens the application each morning to record the day's financial movements. He adds revenue entries (e.g., a wire transfer of 15.000,00 TL categorized as "EFT-HAVALE") and expense entries (e.g., a fuel purchase of 2.500,00 TL categorized as "YAKIT"). Each entry requires a date, amount, and category; a note is optional. He can edit an entry if he made a mistake and delete entries that were entered in error. The application defaults to today's date for new entries but allows selecting any past or future date.

**Why this priority**: Transaction capture is the foundational workflow. Without it, no other feature has data to operate on. The manager performs this task multiple times daily.

**Independent Test**: Can be fully tested by adding, editing, and deleting revenue and expense records for a given day, and verifying that records persist correctly across navigation.

**Acceptance Scenarios**:

1. **Given** the application is open on today's date, **When** the manager adds a revenue entry with amount "5.000,00", category "NAKİT", and note "Peşin satış", **Then** the entry appears in the revenue list for today with the correct amount, category, and note.
2. **Given** a revenue entry exists for today, **When** the manager edits the amount from "5.000,00" to "7.500,00", **Then** the entry reflects the updated amount and daily totals recalculate immediately.
3. **Given** an expense entry exists for today, **When** the manager deletes it, **Then** the entry is removed from the list and daily totals recalculate immediately.
4. **Given** the manager is viewing today's records, **When** he navigates to a different date, **Then** the records for the selected date are displayed and the date context updates accordingly.
5. **Given** the manager is viewing a past date, **When** he uses the "go to today" action, **Then** the view returns to today's date immediately.
6. **Given** the manager adds an entry with category "IADE" (refund type), **Then** the amount is treated as a negative value automatically based on the refund semantics of the category.

---

### User Story 2 - Daily Summary & Live Totals (Priority: P1)

As the manager enters transactions throughout the day, he needs immediate financial feedback. The application continuously displays the total revenue, total expense, net result (profit or loss), and a percentage indicator for the selected day. These values update instantly as records are added, edited, or deleted.

**Why this priority**: Immediate financial feedback is critical to the manager's decision-making during the day. This is inseparable from the transaction capture workflow.

**Independent Test**: Can be tested by adding and modifying records and verifying that totals, net result, and percentage indicator update in real time.

**Acceptance Scenarios**:

1. **Given** today has revenue entries totaling 20.000,00 TL and expense entries totaling 12.000,00 TL, **When** the manager views the daily summary, **Then** total revenue shows "20.000,00 TL", total expense shows "12.000,00 TL", net result shows "+8.000,00 TL" (profit), and the percentage indicator shows the profit ratio.
2. **Given** a new expense entry of 3.000,00 TL is added, **When** the entry is saved, **Then** the total expense updates to 15.000,00 TL and net result updates to +5.000,00 TL without requiring a page refresh.
3. **Given** a day has no records, **When** the manager views that day, **Then** all totals display zero and the summary indicates no transactions.

---

### User Story 3 - Period-Based Financial Analysis (Priority: P2)

At week's end or month's end, the manager reviews financial performance across a time range. He selects a period (a single month, a multi-month window, or a year-to-date view) and the application presents a visual comparison of revenue versus expense over that period, along with summary metrics: total revenue, total expense, net result, number of active days, average daily values, best and worst turnover days, and category breakdowns for both revenues and expenses. The manager can also apply category filters to narrow the analysis — for example, viewing only "NAKİT" transactions across the selected period. When a category filter is active, all metrics, charts, and breakdowns recalculate to reflect only the filtered subset of transactions.

**Why this priority**: Period analysis is essential for operational monitoring and management reporting. It transforms raw data into actionable business intelligence.

**Independent Test**: Can be tested by selecting various time ranges and verifying that charts, totals, averages, best/worst days, and category breakdowns render correctly based on existing transaction data.

**Acceptance Scenarios**:

1. **Given** the manager selects "March 2026" as the analysis period, **When** the analysis view loads, **Then** a visual chart comparing daily revenue and expense is displayed, along with total revenue, total expense, and net result for the month.
2. **Given** the analysis view is showing March 2026, **When** the manager reviews summary metrics, **Then** the number of active days (days with at least one transaction), average daily revenue, average daily expense, best turnover day (highest net), and worst turnover day (lowest net) are all displayed.
3. **Given** the analysis view is active, **When** the manager reviews category breakdowns, **Then** revenue categories and expense categories are each shown with their total amounts and proportional share of the total.
4. **Given** the manager selects a multi-month window (e.g., January-March 2026), **Then** all metrics aggregate across the full selected range.
5. **Given** the manager applies a category filter (e.g., "NAKİT") while viewing the analysis for March 2026, **When** the filter is applied, **Then** all charts, totals, averages, best/worst days, and category breakdowns recalculate to reflect only "NAKİT" transactions.
6. **Given** a category filter is active in the analysis view, **When** the manager clears the filter, **Then** all metrics revert to the unfiltered full dataset for the selected period.

---

### User Story 4 - Print-Ready Reports (Priority: P2)

The manager needs to produce printed reports for administrative and operational review. He initiates printing from the daily view or the period analysis view. The output includes a report header (title, period, print date), a print-optimized rendering of the financial summary and charts, and formatted tables. The print layout is adjusted for paper readability, and the on-screen view returns to normal after print preparation.

**Why this priority**: Printing is described as a mission-critical capability. The manager regularly produces physical reports for administrative use and formal records.

**Independent Test**: Can be tested by initiating print from daily and period views and verifying that the print preview contains proper headers, formatted data, and readable layout.

**Acceptance Scenarios**:

1. **Given** the manager is viewing the daily summary for 2026-03-21, **When** he initiates print, **Then** a print-ready layout is generated with a header showing "Gunluk Rapor - 21 Mart 2026", the report date, and all daily financial data formatted for paper.
2. **Given** the manager is viewing a period analysis for March 2026, **When** he initiates print, **Then** the charts, summary metrics, and category breakdowns are rendered in a print-optimized format with visible grid lines and appropriate page breaks.
3. **Given** the print preview is active, **When** printing completes or is cancelled, **Then** the on-screen view returns to its normal interactive state.

---

### User Story 5 - Advanced Filtering & Record Exploration (Priority: P3)

The manager needs to find and review specific records across her data. He can filter by one or more categories, apply date filters with operators (within the last N days, more than N days ago, between two dates, in a specific range), and combine category filters with operators (equals, not equals). He can also search by free text. Results appear in a structured tabular grid for scanning and analysis.

**Why this priority**: Filtering is essential for auditing, trend investigation, and finding specific transactions, but depends on having data entered (P1) and basic viewing (P2) in place first.

**Independent Test**: Can be tested by applying various filter combinations and verifying that the result grid shows only matching records.

**Acceptance Scenarios**:

1. **Given** the manager selects category filter "equals NAKIT", **When** the filter is applied, **Then** only records with category "NAKIT" appear in the results grid.
2. **Given** the manager applies a date filter "between 2026-03-01 and 2026-03-15" combined with category filter "not equals DIGER", **When** the filter executes, **Then** only records within that date range that are not categorized as "DIGER" appear.
3. **Given** the manager applies a date filter "within the last 7 days", **Then** only records from the last 7 calendar days appear.
4. **Given** the manager selects multiple categories (e.g., "NAKIT" and "EFT-HAVALE"), **When** the filter is applied, **Then** records matching any of the selected categories appear.
5. **Given** filter results are displayed, **Then** the data grid shows columns for date, type (revenue/expense), amount, category, and note, with visible grid lines for readability.
6. **Given** the manager types a free-text search term, **Then** records matching the search term in the note or category fields are displayed.

---

### User Story 6 - Export to Spreadsheet (Priority: P3)

The manager exports transaction data for backup and archival. He can export a single day, a full month, or a custom date range. The exported file includes day-level structured transaction detail, summarized financial totals, and profit/ratio summary values. When category filters are active at the time of export, only the filtered subset of transactions is exported — the export reflects exactly what the manager currently sees.

**Why this priority**: Export enables data continuity and archiving. It's important but operates on existing data and is not part of the daily capture loop.

**Independent Test**: Can be tested by exporting data for a day, a month, and a custom range, then verifying the spreadsheet content matches the application data.

**Acceptance Scenarios**:

1. **Given** the manager selects "Export day: 2026-03-21", **When** the export completes, **Then** a spreadsheet file is generated containing all transactions for that day, organized with structured detail and summary totals.
2. **Given** the manager selects "Export month: March 2026", **When** the export completes, **Then** the spreadsheet contains all transactions for the entire month, grouped by day, with daily and monthly summary totals and profit ratios.
3. **Given** the manager selects a custom date range for export, **Then** the application enforces reasonable boundary limits to keep the export manageable.
4. **Given** the manager has a category filter active (e.g., "YAKIT") and selects "Export month: March 2026", **When** the export completes, **Then** the spreadsheet contains only "YAKIT" transactions for March 2026, with summary totals reflecting the filtered data.
5. **Given** no category filter is active, **When** the manager exports, **Then** all transactions for the selected period are included.

---

### User Story 7 - Import from Spreadsheet (Priority: P3)

The manager can import transaction data from a spreadsheet file. The import workflow includes file selection, a parse-and-validation preview showing the data to be imported, explicit error listing for invalid rows (bad categories, invalid amounts, malformed data), and controlled import execution. Import is additive: imported records are appended to existing data.

**Why this priority**: Import supports data continuity and recovery from backups. It requires careful validation to prevent data corruption.

**Independent Test**: Can be tested by importing a valid spreadsheet and an invalid spreadsheet, verifying that valid data is appended correctly and invalid rows are reported with specific error messages.

**Acceptance Scenarios**:

1. **Given** the manager selects a valid spreadsheet file, **When** the preview step loads, **Then** the application displays all parsed records and highlights any validation warnings.
2. **Given** the spreadsheet contains rows with invalid categories or malformed amounts, **When** the preview loads, **Then** each invalid row is listed with a specific error message explaining what is wrong.
3. **Given** the manager confirms the import after preview, **When** the import executes, **Then** valid records are appended to existing data without overwriting or duplicating existing entries.
4. **Given** the manager cancels the import after preview, **Then** no data changes occur.

---

### User Story 8 - Backup & Restore (Priority: P3)

The manager can create a full backup of all application data to a file and restore from a previously created backup file. The restore workflow includes file selection, confirmation with a clear description of consequences, feedback on restore progress, and automatic application relaunch to ensure consistent state.

In addition, the application automatically creates background backups using a tiered retention strategy inspired by the Grandfather-Father-Son (GFS) method. Backups are organized into four tiers — session, daily, weekly, and monthly — each with its own retention limit. All backups are triggered at application startup (the only reliable trigger for a desktop app); a session-tier backup also runs on a periodic interval during active use. The manager can see when the last automatic backup was created.

**Why this priority**: Data safety is critical for a financial tool but is an infrequent operation. Manual backup/restore serves as insurance rather than a daily workflow. Automatic backups ensure that even if the manager forgets to back up manually, recent data is never lost.

**Independent Test**: Can be tested by creating a backup, modifying data, restoring from the backup, and verifying that data returns to the backed-up state. Automatic backups can be verified by checking the backup directory after application startup.

**Acceptance Scenarios**:

1. **Given** the manager initiates a manual backup, **When** the backup completes, **Then** a backup file is created containing all application data, and the manager receives confirmation with the file location.
2. **Given** the manager selects a backup file to restore, **When** he confirms the restore action, **Then** a confirmation dialog clearly describes that all current data will be replaced by the backup data.
3. **Given** the manager confirms restore, **When** the restore completes, **Then** the application relaunches automatically and all data matches the backup state.
4. **Given** the application starts, **When** initialization completes, **Then** a session-tier automatic backup is created before any user interaction. If this is the first startup of the calendar day, a daily-tier backup is also created. If this is the first startup of the ISO week, a weekly-tier backup is also created. If this is the first startup of the calendar month, a monthly-tier backup is also created.
5. **Given** the application has been running for an extended period, **When** the session backup interval elapses, **Then** a new session-tier backup is created silently in the background.
6. **Given** any tier exceeds its retention limit (5 session, 7 daily, 4 weekly, 6 monthly), **When** a new backup is created in that tier, **Then** the oldest backups in that tier are pruned to restore the limit.
7. **Given** the manager views the settings or status area, **Then** the timestamp of the last automatic backup is visible.
8. **Given** a data corruption issue is discovered days or weeks later, **When** the manager browses available backups, **Then** daily backups from the past week, weekly backups from the past month, and monthly backups from the past 6 months are available for restoration.

---

### User Story 9 - Visual Theme Preference (Priority: P4)

The manager can change the application's visual theme (e.g., light/dark mode) to suit her preference. The chosen theme persists across sessions.

**Why this priority**: Theme preference is a comfort feature that enhances daily usability but is not essential to core financial workflows.

**Independent Test**: Can be tested by switching themes and verifying that the change applies immediately and persists after restarting the application.

**Acceptance Scenarios**:

1. **Given** the manager selects a different theme, **When** the selection is confirmed, **Then** the application's visual appearance updates immediately.
2. **Given** the manager has set a theme preference, **When** he reopens the application, **Then** the previously selected theme is active.

---

### Edge Cases

- What happens when the manager enters an amount with incorrect formatting (e.g., using a period instead of comma for decimals)? The application normalizes the input according to Turkish number formatting rules.
- What happens when a day is cleared of all records? The application requires double confirmation (two distinct confirmation steps) before executing the bulk delete.
- What happens when a spreadsheet import contains a category not in the predefined list? The row is flagged as invalid with an explicit error message naming the unrecognized category.
- What happens when a backup file is corrupted or from an incompatible version? The restore process detects the issue and displays a clear error message without modifying current data.
- What happens when the application is updated and the database schema changes? The application runs additive migrations (new columns, new tables) automatically on startup, never dropping or removing existing data. An automatic backup is created before any migration runs.
- What happens when the auto-backup directory is inaccessible or full? The application logs the failure silently and continues normal operation — auto-backup failure must never block the user from using the application.
- What happens when the export date range is excessively large? The application enforces a boundary limit and informs the manager to narrow the range.
- What happens when the manager enters an amount of zero? The application rejects zero-amount entries with a validation message.
- What happens when a refund category (e.g., "IADE") is selected for a revenue entry? The amount is automatically treated as negative to reflect the refund semantics.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow the manager to create revenue entries with date, amount, category (from the predefined revenue categories list), and optional note.
- **FR-002**: System MUST allow the manager to create expense entries with date, amount, category (from the predefined expense categories list), and optional note.
- **FR-003**: System MUST allow the manager to edit any field of an existing revenue or expense entry.
- **FR-004**: System MUST allow the manager to delete individual revenue or expense entries.
- **FR-005**: System MUST allow the manager to delete all entries for a selected day, requiring double confirmation before execution.
- **FR-006**: System MUST display daily totals (total revenue, total expense, net result, and percentage indicator) that update immediately when records change.
- **FR-007**: System MUST default the date context to today and provide a "go to today" quick action for navigation.
- **FR-008**: System MUST allow date navigation to view records for any date.
- **FR-009**: System MUST provide period-based analysis for single month, multi-month, and year-to-date windows, including visual revenue vs. expense comparison, summary metrics (totals, averages, best/worst days), and category breakdowns. Analysis MUST respect active category filters, recalculating all metrics and charts to reflect only the filtered subset when a filter is applied.
- **FR-010**: System MUST provide advanced record filtering with date operators (within the last, more than, between, in the range) and category operators (equals, not equals), with results displayed in a structured data grid.
- **FR-011**: System MUST allow combining multiple filter conditions in a query-style workflow.
- **FR-012**: System MUST allow free-text search across record notes and categories.
- **FR-013**: System MUST support export to spreadsheet format for a single day, a full month, or a custom date range, including transaction detail, summary totals, and profit ratios. Export MUST respect active category filters, exporting only the filtered subset of transactions when a filter is applied.
- **FR-014**: System MUST support import from spreadsheet files with a preview step, explicit validation error reporting for invalid rows, and additive import behavior.
- **FR-015**: System MUST support full data backup to a file and restore from a backup file, with confirmation, progress feedback, and automatic relaunch after restore.
- **FR-015a**: System MUST create automatic backups using a tiered retention strategy: session (on startup + periodic interval), daily (first startup of each calendar day), weekly (first startup of each ISO week), and monthly (first startup of each calendar month). All stored in a dedicated auto-backup directory within the application data folder.
- **FR-015b**: System MUST enforce per-tier retention limits: 5 session, 7 daily, 4 weekly, 6 monthly. Oldest backups within each tier are pruned when the limit is exceeded. Pre-migration backups are kept indefinitely.
- **FR-015c**: System MUST display the timestamp of the last automatic backup in the settings or status area.
- **FR-024**: System MUST use additive-only database migrations. Schema changes MUST only add new columns or tables — never DROP, DELETE, or ALTER existing columns. An automatic backup MUST be created before any migration executes.
- **FR-025**: System MUST preserve all existing transaction data across application updates. No update operation may result in data loss.
- **FR-016**: System MUST provide print-ready report output for daily and period views, with report headers, print-optimized formatting, and restoration of normal view after printing.
- **FR-017**: System MUST normalize monetary amounts according to Turkish number formatting (dot as thousands separator, comma as decimal separator).
- **FR-018**: System MUST automatically apply negative amount logic for refund-style categories (e.g., "IADE") when applicable.
- **FR-019**: System MUST enforce that categories for revenue entries come exclusively from the predefined revenue categories list, and categories for expense entries come exclusively from the predefined expense categories list.
- **FR-020**: System MUST allow the manager to change the visual theme, and the preference MUST persist across sessions.
- **FR-021**: System MUST display revenue and expense listings side by side, not stacked vertically.
- **FR-022**: System MUST display record tables with visible grid lines (at minimum horizontal rules) for readability.
- **FR-023**: System MUST present all dates in Turkish locale format (e.g., "21 Mart 2026") and all monetary values in Turkish currency format.

### Key Entities

- **Transaction**: A single financial record representing a revenue or expense movement. Attributes: date, amount, type (revenue or expense), category, optional note. Transactions are the core data unit of the application.
- **Category**: A predefined classification label for transactions. Revenue and expense categories are separate, fixed lists. Categories cannot be created, modified, or deleted by the user.
  - **Revenue categories**: BARTER, CARİYE MAHSUBEN, ÇEK, DİĞER, EFT-HAVALE, İADE, KREDİ KARTI, NAKİT, SENET
  - **Expense categories**: AKSESUAR, ARAÇ KİRALAMA, ARAÇ TAMİR, BANKA KOMİSYON, CAM VE MLZ, CARİYE MAHSUBEN, ÇEK, DİĞER, ELEKTRİK FT, FAİZ, FAZLA MESAİ, FİNANSMAN, HGS, HIRDAVAT MLZ, İADE, İŞ GÜVENLİĞİ, KİRA, KONAKLAMA, MAAŞ, MAKİNA-TESİSAT, MAMA, MARKET, MUHASEBE, NAKLİYE GİDERİ, PANJUR, PRİM, PROFİL, PVC DOĞRAMA, PVC YRD. MLZ, REKLAMASYON, SAC, SARF-KIRTASİYE, SGK, SU FT, TELEFON FT, TRAFİK CEZASI, VERGİ, YAKIT, YEMEK, YÖNETİM GİDERLERİ
- **Daily Summary**: An aggregated view of a single day's transactions. Derived values: total revenue, total expense, net result (revenue minus expense), and percentage indicator. Not stored directly but calculated from transactions.
- **Period Analysis**: An aggregated view of transactions across a date range. Includes visual charts, summary metrics (totals, averages, active days, best/worst days), and category breakdowns. Derived from transaction data.
- **Backup**: A complete snapshot of all application data at a point in time, stored as an external file for recovery purposes.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: The manager can complete a typical daily entry session (5-10 revenue and expense entries) in under 5 minutes.
- **SC-002**: Daily totals and net result update within 1 second of any record change, requiring no manual refresh.
- **SC-003**: Period analysis for a single month loads and displays all metrics, charts, and category breakdowns within 3 seconds.
- **SC-004**: The manager can produce a print-ready report from any view in 2 actions or fewer (e.g., navigate to view, click print).
- **SC-005**: Export of a full month of data completes within 10 seconds and produces a valid spreadsheet file.
- **SC-006**: Import validation preview identifies and reports 100% of invalid rows (bad categories, malformed amounts) before any data is written.
- **SC-007**: Backup and restore complete successfully with zero data loss, with restored data exactly matching the backup state.
- **SC-008**: All monetary values and dates throughout the application display consistently in Turkish locale format with no formatting exceptions.
- **SC-009**: The manager can filter records by any combination of date range, category, and free text and see results in under 2 seconds.
- **SC-010**: The application supports at least 3 years of daily transaction data (approximately 50,000 records) without noticeable performance degradation in daily operations.

## Assumptions

- The application is single-user with no authentication or multi-user access control required.
- Revenue and expense category lists are fixed as listed in the Category entity definition and are not user-configurable.
- "IADE" (refund) is the primary refund-style category requiring automatic negative amount handling. If other categories require similar logic, this will be clarified during implementation planning.
- The percentage indicator in daily summary represents the profit margin: (net result / total revenue) \* 100, displayed as a percentage. When total revenue is zero, no percentage is shown.
- "Best turnover day" means the day with the highest positive net result; "worst turnover day" means the day with the lowest (or most negative) net result within the selected period.
- Export boundary limits for custom date ranges default to a maximum of 1 year per export operation.
- The additive import behavior means imported records are always appended; there is no merge or deduplication logic.
- Automatic application relaunch after backup restore means the application restarts itself to ensure clean state.
- The visual theme preference supports at minimum light and dark modes.
- Automatic backups are stored in the Tauri application data directory (platform-specific, managed by Tauri) in an `auto-backups/` subdirectory.
- The tiered backup strategy follows a calendar-based Grandfather-Father-Son (GFS) approach: session tier provides short-term recovery (hours), daily tier covers the past week, weekly tier covers the past month, monthly tier covers the past 6 months. Pre-migration backups provide indefinite schema rollback.
- All tiered backup decisions (whether to create a daily/weekly/monthly backup) are evaluated at app startup — the only reliable trigger point for a desktop app. The periodic session interval provides additional intra-day coverage during long work sessions.
- Database migrations are version-tracked. Each migration has a sequence number and is executed exactly once. The migration runner creates a pre-migration backup before applying any new migration.
- "Additive-only migrations" means: `CREATE TABLE`, `ALTER TABLE ADD COLUMN`, `CREATE INDEX` are permitted. `DROP TABLE`, `DROP COLUMN`, `ALTER TABLE RENAME COLUMN`, `DELETE FROM` are prohibited in migration files.
