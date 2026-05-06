# Tasks: Comment Autocomplete

**Input**: Design documents from `specs/003-comment-autocomplete/`  
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ quickstart.md ✅

**Tests**: Not requested — manual testing per constitution and quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: No new project structure required. Feature adds files to the existing `src/` layout; no scaffolding needed.

*(No tasks — existing project structure is sufficient)*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: DB query function and suggestion hook — both US1 and US3 depend on these.

**⚠️ CRITICAL**: Both user story phases (3 and 4) depend on T002 being complete.

- [ ] T001 Add `getDistinctNotes(): Promise<string[]>` function to `src/services/db.ts` using `SELECT DISTINCT note FROM transactions WHERE note IS NOT NULL AND note != '' ORDER BY note COLLATE NOCASE`
- [ ] T002 Create `src/hooks/use-note-suggestions.ts` — a hook that calls `getDistinctNotes()` on mount and returns `string[]` (empty on error); depends on T001

**Checkpoint**: Foundation ready — `useNoteSuggestions()` can be imported and returns distinct notes from the DB.

---

## Phase 3: User Story 1 + 2 — Autocomplete Component & Form Integration (P1 + P2)

**Goal (US1)**: Typing in the note field shows a filtered dropdown of past comments; keyboard and mouse selection both work.

**Goal (US2)**: Browser-native autocomplete popups are suppressed on all transaction form inputs.

**Independent Test (US1)**: Open the transaction form, type a partial known note — suggestion dropdown appears; selecting with Enter or click fills the field. Escape dismisses the dropdown.

**Independent Test (US2)**: Focus the amount (Tutar) field and the note field — no browser autocomplete popup appears on either.

> These two stories are implemented in the same files in the same phase to avoid multiple edits to `transaction-form.tsx`.

### Implementation

- [ ] T003 [US1] Create `src/components/shared/note-autocomplete.tsx` — controlled component wrapping `Autocomplete.Root` from `@base-ui/react/autocomplete`; uses `useNoteSuggestions()` for items; `limit={8}`; custom case-insensitive `contains` filter via `Autocomplete.useFilter({ sensitivity: 'base' })`; portal+positioner+popup styled to match existing `PopoverContent`; items styled to match `DropdownMenuItem`; `Autocomplete.Input` with `autoComplete="off"`; props: `value`, `onChange`, `onBlur`, `id`, `placeholder`, `autoFocus`, `className`, `ref`; depends on T002
- [ ] T004 [P] [US1] [US2] Update `src/components/daily/transaction-form.tsx`: (1) add `autoComplete="off"` to `<form>` element, (2) add `autoComplete="off"` to the amount `<Input>`, (3) replace the note field `<Input {...field} ... />` with `<NoteAutocomplete value={field.value} onChange={field.onChange} onBlur={field.onBlur} ref={field.ref} id="note" placeholder="Açıklama" autoFocus />`; depends on T003

**Checkpoint**: US1 and US2 are both complete. Transaction form note field shows custom autocomplete; no browser popups appear on any form input.

---

## Phase 4: User Story 3 — Analysis View Note Filter Autocomplete (P3)

**Goal**: The "Not ara..." filter input in the Analysis view shows note suggestions as the user types, letting them filter without remembering the exact phrasing.

**Independent Test**: Navigate to Analiz view, type a partial known note in the "Not ara..." field — suggestions appear; selecting one updates the filter and the transaction table updates accordingly.

### Implementation

- [ ] T005 [P] [US3] Update `src/components/analysis/analysis-view.tsx`: replace the note filter `<Input type="text" placeholder="Not ara..." value={noteFilter} onChange={(e) => setNoteFilter(e.target.value)} className="w-40" />` with `<NoteAutocomplete value={noteFilter} onChange={setNoteFilter} placeholder="Not ara..." className="w-40" />`; depends on T003

**Checkpoint**: All three user stories are now complete and independently testable.

---

## Phase 5: Polish & Verification

**Purpose**: Code quality gates and end-to-end manual validation.

- [ ] T006 Run `pnpm lint:fix` then `pnpm format` then `pnpm build` from repo root; fix any TypeScript errors or lint violations before proceeding
- [ ] T007 [P] Manual test all three user stories per `specs/003-comment-autocomplete/quickstart.md` test plan using `pnpm tauri dev`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No prior dependencies — start immediately
- **Phase 3 (US1 + US2)**: Depends on T002 completion
- **Phase 4 (US3)**: Depends on T003 completion (same `NoteAutocomplete` component)
- **Polish (Phase 5)**: Depends on all implementation phases complete

### User Story Dependencies

- **US1 (P1)**: Depends on T002 (hook)
- **US2 (P2)**: Depends on T003 (implemented in the same file edit as US1)
- **US3 (P3)**: Depends on T003 (NoteAutocomplete component)

### Within-Feature Dependency Chain

```
T001 → T002 → T003 → T004  (US1 + US2, transaction-form.tsx)
                   → T005  (US3, analysis-view.tsx) [parallel with T004]
```

### Parallel Opportunities

- **T004 and T005**: Both depend on T003 but touch different files — can run in parallel
- **T006 and T007**: Both are post-implementation — T006 should complete before T007 to ensure a clean build is being tested

---

## Parallel Example: After T003 completes

```
Task T004: Update transaction-form.tsx (US1 + US2)
Task T005: Update analysis-view.tsx (US3)
→ Both can run in parallel; different files, same NoteAutocomplete dependency
```

---

## Implementation Strategy

### MVP First (US1 + US2 — highest user value)

1. Complete Phase 2: Foundational (T001, T002)
2. Complete T003: NoteAutocomplete component
3. Complete T004: Wire into transaction form + disable browser autocomplete
4. **STOP and VALIDATE**: Test note autocomplete and verify browser popups are gone
5. Ready to ship P1 + P2 value

### Incremental Delivery

1. T001 + T002 → Foundation ready
2. T003 + T004 → US1 + US2 done → **Demo / validate with user**
3. T005 → US3 done → Final delivery
4. T006 + T007 → Polish and verify

---

## Notes

- `[P]` tasks = different files or no blocking inter-dependency
- `[Story]` label maps each task to its user story for traceability
- `Autocomplete` component lives in `src/components/shared/` — not `src/components/ui/` (reserved for shadcn managed components per constitution)
- Use `@base-ui/react/autocomplete` import path (already installed, no new packages needed)
- Commit after T002, T003, T004, T005, and T006 at minimum
- If `pnpm build` fails at T006, fix TypeScript errors before running manual tests
