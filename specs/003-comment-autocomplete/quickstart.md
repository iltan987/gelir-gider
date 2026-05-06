# Quickstart: Comment Autocomplete

**Feature**: `003-comment-autocomplete`  
**Date**: 2026-05-06

---

## Prerequisites

- Node.js + pnpm installed
- Rust toolchain installed (for `pnpm tauri dev`)
- Branch: `003-comment-autocomplete`

## Dev Commands

```bash
pnpm dev          # Vite only (no Tauri shell — DB unavailable, suggestions list empty)
pnpm tauri dev    # Full stack — DB available, autocomplete fully functional
pnpm build        # TypeScript + Vite build (must pass with zero errors)
pnpm lint:fix     # Auto-fix ESLint issues
pnpm format       # Prettier auto-format
```

## Testing the Feature Manually

### 1. Disable browser autocomplete (P2)
1. Run `pnpm tauri dev`
2. Click any date on the daily view to open the transaction form
3. Click the **Tutar** (amount) field — confirm no browser autocomplete popup appears
4. Click the **Not** (note) field — confirm no browser autocomplete popup appears

### 2. Note autocomplete in the transaction form (P1)
1. Add a transaction with a non-empty note (e.g., "Fatura - Elektrik")
2. Open the form again (add another transaction)
3. In the **Not** field, type "fat" — the suggestion "Fatura - Elektrik" should appear
4. Press **↓** to highlight it, then **Enter** to select — the field should fill with the full note
5. Alternatively, type "elektrik" (substring match) — same suggestion should appear
6. Press **Escape** — the dropdown should close without changing the input value
7. Click a suggestion with the mouse — the field should fill and the dropdown should close
8. Type a string with no matches (e.g., "zzz") — no dropdown should appear

### 3. Note filter autocomplete in analysis view (P3)
1. Navigate to **Analiz** view
2. In the **Not ara...** field, type a partial note — suggestions from history should appear
3. Select a suggestion — the transaction table should filter to matching rows

## Key Files

| File | Purpose |
|------|---------|
| `src/services/db.ts` | Add `getDistinctNotes()` |
| `src/hooks/use-note-suggestions.ts` | New hook |
| `src/components/shared/note-autocomplete.tsx` | New component |
| `src/components/daily/transaction-form.tsx` | Use `NoteAutocomplete` + disable browser autocomplete |
| `src/components/analysis/analysis-view.tsx` | Use `NoteAutocomplete` for note filter |
