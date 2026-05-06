# Implementation Plan: Comment Autocomplete

**Branch**: `003-comment-autocomplete` | **Date**: 2026-05-06 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/003-comment-autocomplete/spec.md`

## Summary

Add custom autocomplete to the note/comment field in the transaction form and the analysis note filter, using `@base-ui/react/autocomplete` (already installed). Suggestions come from distinct non-empty notes in the transaction history, loaded once per form open and filtered client-side. Browser-native autocomplete is suppressed on all form inputs via `autoComplete="off"`.

## Technical Context

**Language/Version**: TypeScript 5.8+, strict mode  
**Primary Dependencies**: @base-ui/react 1.4.1 (Autocomplete primitive), React 19, React Hook Form 7, Zod 4  
**Storage**: SQLite via tauri-plugin-sql — one new read query (`SELECT DISTINCT note ...`)  
**Testing**: Manual testing per constitution (no automated test suite)  
**Target Platform**: Desktop (Tauri 2 / Chromium WebView), Windows primary  
**Project Type**: Desktop app (single-user financial tracker)  
**Performance Goals**: Suggestions appear within a single render frame after typing — no perceptible lag for <10,000 unique notes  
**Constraints**: No new npm packages; must pass `pnpm build` with zero TypeScript errors and ESLint clean  
**Scale/Scope**: 1 user, ~1,000–5,000 unique notes at most; all client-side filtering

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Tool-First Development | PASS | `@base-ui/react/autocomplete` docs fetched via Context7 before design; shadcn MCP queried |
| II. Type Safety & Code Quality | PASS | Strict TypeScript; no `any`; must pass `pnpm build` + `pnpm lint:fix` |
| III. Component-Driven UI | PASS | shadcn MCP queried (no matching combobox component found); using @base-ui/react primitive directly per constitution pattern |
| IV. Testing Standards | PASS | Manual testing; no automated tests added |
| V. UX Consistency | PASS | Turkish locale; `Autocomplete.useFilter({ sensitivity: 'base' })` for Intl-aware matching (handles İ/i correctly) |
| VI. Performance & Responsiveness | PASS | One-shot DB load on form mount; in-memory filtering; `limit=8` caps render work |

No violations. Complexity Tracking section omitted.

## Project Structure

### Documentation (this feature)

```text
specs/003-comment-autocomplete/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── services/
│   └── db.ts                              ← add getDistinctNotes()
├── hooks/
│   └── use-note-suggestions.ts            ← NEW: load & expose distinct notes
├── components/
│   ├── shared/
│   │   └── note-autocomplete.tsx          ← NEW: reusable autocomplete field
│   ├── daily/
│   │   └── transaction-form.tsx           ← replace note Input + disable browser autocomplete
│   └── analysis/
│       └── analysis-view.tsx              ← replace note filter Input
```

**Structure Decision**: Single-project, feature-slice additions. No new top-level directories. Follows existing `src/hooks/`, `src/services/`, `src/components/shared/` conventions.

## Implementation Notes

### `src/services/db.ts`

Add at the end of the file:

```typescript
export async function getDistinctNotes(): Promise<string[]> {
  const rows = await select<Array<{ note: string }>>(
    "SELECT DISTINCT note FROM transactions WHERE note IS NOT NULL AND note != '' ORDER BY note COLLATE NOCASE",
  );
  return rows.map((r) => r.note);
}
```

---

### `src/hooks/use-note-suggestions.ts` (new file)

```typescript
import { useState, useEffect } from "react";
import { getDistinctNotes } from "@/services/db";

export function useNoteSuggestions(): string[] {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    getDistinctNotes()
      .then(setSuggestions)
      .catch(() => {});
  }, []);

  return suggestions;
}
```

---

### `src/components/shared/note-autocomplete.tsx` (new file)

Wraps `Autocomplete.Root` from `@base-ui/react/autocomplete`. Key structure:

```tsx
import { Autocomplete } from "@base-ui/react/autocomplete";
import { useNoteSuggestions } from "@/hooks/use-note-suggestions";
import { cn } from "@/lib/utils";

// Props mirror the existing note <Input> usage so it's a drop-in swap.
// value + onChange wired to RHF Controller field.value / field.onChange.

// Autocomplete.Root controlled:
//   items={suggestions}
//   value={value ?? ""}
//   onValueChange={(val) => onChange(val)}
//   limit={8}
//   filter — custom contains-based, case-insensitive
//
// Autocomplete.Portal > Autocomplete.Positioner (sideOffset=4, side="bottom", align="start")
//   > Autocomplete.Popup (styled to match PopoverContent)
//     > Autocomplete.Empty ("Sonuç bulunamadı")
//     > Autocomplete.List > Autocomplete.Item (styled to match DropdownMenuItem)
//
// Autocomplete.Input:
//   autoComplete="off"
//   className — matches existing Input styles
//   id, placeholder, autoFocus, onBlur, ref forwarded
```

Popup width: `w-[var(--anchor-width)]` — matches input width.  
Max height: `max-h-[240px] overflow-y-auto` — fits 8 items.  
Animation: reuse existing Popover data-open/data-closed classes.

---

### `src/components/daily/transaction-form.tsx`

Two changes:

1. `<form>` element: add `autoComplete="off"`
2. Note field `Controller` render: replace `<Input {...field} ... />` with `<NoteAutocomplete value={field.value} onChange={field.onChange} onBlur={field.onBlur} ref={field.ref} id="note" placeholder="Açıklama" autoFocus />`
3. Amount `Input`: add `autoComplete="off"` prop

---

### `src/components/analysis/analysis-view.tsx`

Replace:
```tsx
<Input
  type="text"
  placeholder="Not ara..."
  value={noteFilter}
  onChange={(e) => setNoteFilter(e.target.value)}
  className="w-40"
/>
```

With:
```tsx
<NoteAutocomplete
  value={noteFilter}
  onChange={setNoteFilter}
  placeholder="Not ara..."
  className="w-40"
/>
```

---

## Constitution Re-Check (Post-Design)

All principles satisfied. No new dependencies added. No architectural violations.
