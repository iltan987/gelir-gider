# Data Model: Comment Autocomplete

**Feature**: `003-comment-autocomplete`  
**Date**: 2026-05-06

---

## Schema Changes

**None.** This feature reads from the existing `transactions.note` column. No migrations required.

---

## Existing Entities Used

### `transactions.note` (existing column)

| Column | Type | Constraints |
|--------|------|-------------|
| `note` | `TEXT` | nullable, no length limit |

Relevant values: non-null, non-empty strings. These are the candidates for suggestions.

---

## New Query

### `getDistinctNotes(): Promise<string[]>`

**Location**: `src/services/db.ts`

**SQL**:
```sql
SELECT DISTINCT note
FROM transactions
WHERE note IS NOT NULL AND note != ''
ORDER BY note COLLATE NOCASE
```

**Returns**: Flat `string[]` of unique, non-empty note values, alphabetically sorted (case-insensitive).

**Deduplication**: Handled at SQL level by `DISTINCT`. Case-insensitive dedup via `COLLATE NOCASE` — "Fatura" and "fatura" will collapse to the first encountered value in sort order.

---

## New Components & Hooks

### `useNoteSuggestions()` hook

**Location**: `src/hooks/use-note-suggestions.ts`

**State shape**:
```typescript
{
  suggestions: string[];   // Loaded distinct notes, empty until resolved
  loading: boolean;        // True while DB query is in flight
}
```

**Behaviour**:
- Calls `getDistinctNotes()` once on mount
- Returns `suggestions` and `loading`; errors are silent (empty array on failure, autocomplete degrades gracefully)

---

### `NoteAutocomplete` component

**Location**: `src/components/shared/note-autocomplete.tsx`

**Props interface**:
```typescript
interface NoteAutocompleteProps {
  value: string | undefined;
  onChange: (value: string) => void;
  onBlur?: () => void;
  id?: string;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  ref?: React.Ref<HTMLInputElement>;
}
```

**Internal state**: none (fully controlled by parent via `value`/`onChange`)

**Data dependencies**:
- `useNoteSuggestions()` — provides the `string[]` items list
- `Autocomplete.useFilter({ sensitivity: 'base' })` — provides locale-aware `contains` function for the custom filter

**Key `Autocomplete.Root` props used**:
| Prop | Value |
|------|-------|
| `items` | `suggestions` from hook |
| `value` | `value` prop (controlled) |
| `onValueChange` | `(val) => onChange(val)` |
| `limit` | `8` |
| `filter` | custom `contains`-based function |

---

## Component Placement in Existing Files

### `src/components/daily/transaction-form.tsx`
- **Change**: Replace `<Input {...field} id="note" placeholder="Açıklama" autoFocus />` with `<NoteAutocomplete {...} />`
- **Change**: Add `autoComplete="off"` to `<form>` element
- **Change**: Add `autoComplete="off"` to the amount `<Input>`

### `src/components/analysis/analysis-view.tsx`
- **Change**: Replace `<Input type="text" placeholder="Not ara..." value={noteFilter} onChange={...} className="w-40" />` with `<NoteAutocomplete value={noteFilter} onChange={setNoteFilter} placeholder="Not ara..." className="w-40" />`

---

## State Transitions

```
NoteAutocomplete lifecycle:
  Mount → useNoteSuggestions loads → suggestions[] populated
  User types ≥1 char → Autocomplete.Root filters suggestions → Popup opens
  User selects item (Enter / click) → onValueChange fires → parent state updated → Popup closes
  User presses Escape → Popup closes, input value unchanged
  User clears input → suggestions filtered to all (none shown when empty, per FR-011)
  User types with no matches → Autocomplete.Empty renders inside Popup (or Popup stays closed per FR-010)
```
