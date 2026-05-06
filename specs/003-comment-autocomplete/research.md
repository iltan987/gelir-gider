# Research: Comment Autocomplete

**Feature**: `003-comment-autocomplete`  
**Date**: 2026-05-06

---

## Decision 1: Autocomplete Primitive

**Decision**: Use `@base-ui/react/autocomplete` (`Autocomplete` namespace)

**Rationale**: The package is already installed (`@base-ui/react ^1.4.1`) and exports a full-featured `Autocomplete` primitive that directly covers the use case:
- Built-in `mode='list'` that filters items as the user types (case-insensitive, locale-aware by default)
- `limit` prop to cap visible suggestions at 8
- Full keyboard navigation (arrow keys, Enter, Escape) built-in
- `Autocomplete.Portal` + `Autocomplete.Positioner` + `Autocomplete.Popup` follows the same Portal/Positioner/Popup pattern already used by `dropdown-menu.tsx` and `select.tsx` in the project — styling and animation patterns can be copied directly
- `Autocomplete.Input` replaces the plain `<Input>` for the note field; it accepts all standard input props including `autoComplete="off"`
- `Autocomplete.Empty` for the zero-results state

**Alternatives considered**:
- `cmdk` (shadcn Command component): not installed; requires Radix UI primitives which this project doesn't use
- Custom Popover + list: more code, manual keyboard handling, worse accessibility
- `@base-ui/react/combobox` (lower-level): `Autocomplete` wraps it and handles filtering automatically — no benefit to dropping down to `Combobox` for this case

---

## Decision 2: Filter Strategy

**Decision**: Use the built-in locale-aware `mode='list'` filter (default). Optionally pass an explicit `filter` using `Autocomplete.useFilter({ sensitivity: 'base' })` for guaranteed case-insensitive contains matching across Turkish text.

**Rationale**:
- `Autocomplete.useFilter({ sensitivity: 'base' })` returns a `contains(haystack, needle)` function backed by `Intl.Collator` — correct for Turkish locale (handles dotted/dotless İ/i)
- Default mode already filters; making the filter explicit makes the behaviour obvious in the code
- No fuzzy matching library needed (`match-sorter` etc.) — simple substring match is sufficient per spec

**Alternatives considered**:
- `match-sorter` fuzzy matching: nice-to-have per spec, deferred to future iteration; adds a package dependency not worth it for a single field

---

## Decision 3: Data Source

**Decision**: New `getDistinctNotes(): Promise<string[]>` function in `src/services/db.ts` using:
```sql
SELECT DISTINCT note
FROM transactions
WHERE note IS NOT NULL AND note != ''
ORDER BY note COLLATE NOCASE
```

**Rationale**:
- Single-user app — all notes belong to the same user; no privacy concern
- Dataset is small (well under 10,000 unique notes) — one-shot load on form open is fine
- SQLite `DISTINCT` handles deduplication at the query level — no client-side dedup needed
- `COLLATE NOCASE` returns case-insensitively deduplicated results (e.g., "fatura" and "Fatura" collapse into one)
- `ORDER BY ... COLLATE NOCASE` gives a stable, alphabetical list for consistent UX

**Alternatives considered**:
- Reload on every keystroke: unnecessary — dataset doesn't change while the form is open
- Zustand store: overkill for ephemeral suggestion data; a local hook state suffices

---

## Decision 4: Custom Hook

**Decision**: New `useNoteSuggestions()` hook in `src/hooks/use-note-suggestions.ts`

**Rationale**:
- Encapsulates the async DB load and provides `string[]` state to consumers
- Used in both `TransactionForm` and the analysis note filter — single implementation
- Loads once on mount; no refetch needed during a session (new notes added in same session appear after next form open, acceptable UX)

---

## Decision 5: New `NoteAutocomplete` Component

**Decision**: Create `src/components/shared/note-autocomplete.tsx` — a controlled wrapper component

**Rationale**:
- Reusable across `TransactionForm` (note field) and `AnalysisView` (note filter)
- Props mirror those of the current `Input` used for notes: `value`, `onChange`, `id`, `placeholder`, `autoFocus`, `className`
- Internally wires `Autocomplete.Root` (controlled via `value`/`onValueChange`) with `useNoteSuggestions()`
- Styled to match the existing `Input` component's appearance using the same Tailwind design tokens

---

## Decision 6: Browser Autocomplete Suppression

**Decision**: Add `autoComplete="off"` to the `<form>` element in `TransactionForm`, plus `autoComplete="off"` on the amount `Input` explicitly.

**Rationale**:
- `autoComplete="off"` on a `<form>` disables browser autocomplete for all its children by default in the Tauri WebView (Chromium-based, honours the attribute)
- The note field gets `autoComplete="off"` through `Autocomplete.Input` (set internally)
- Belt-and-suspenders: also add it on the amount `Input` directly since it's a numeric field that historically sees aggressive browser autocomplete behaviour

**Alternatives considered**:
- `autocomplete="new-password"` hack: unnecessary for Tauri's embedded WebView which respects `off`
- Individual `autoComplete="off"` on every field: redundant if on the form, but explicit per-field is acceptable

---

## Decision 7: React Hook Form Integration

**Decision**: `NoteAutocomplete` accepts `value: string` and `onChange: (value: string) => void` — these map directly to the `field.value` / `field.onChange` provided by RHF `Controller`, with `onBlur` and `ref` forwarded to `Autocomplete.Input`.

**Rationale**:
- Controlled mode (`value` + `onValueChange`) is the correct pattern when RHF owns the field state
- `Autocomplete.Root` onValueChange receives `(value: string, eventDetails)` — the component wraps it to call `onChange(value)` discarding eventDetails

---

## Resolved Clarifications

All items from spec were assumptions with no [NEEDS CLARIFICATION] markers. Key assumption validated:
- "The autocomplete component will be built using the existing Popover primitive" → **revised**: `@base-ui/react/autocomplete` is the better primitive (same Portal/Positioner pattern, purpose-built for this use case)
