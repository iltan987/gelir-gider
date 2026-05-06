# Feature Specification: Comment Autocomplete

**Feature Branch**: `003-comment-autocomplete`  
**Created**: 2026-05-06  
**Status**: Draft  
**Input**: User description: "User wants autocomplete for comment field in invoice/expense forms to avoid duplication and typing differences. Disable browser autocomplete on all inputs (especially numeric), add custom autocomplete only on the comment/note field. Similar (not just exact) matches should appear. Also useful in analysis view note filter/search."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Comment Autocomplete in Transaction Form (Priority: P1)

A user types a note/comment while adding or editing a transaction (revenue or expense). As they type, a dropdown appears below the note field showing past comments from the transaction history that match what has been typed so far. The user can pick a suggestion with keyboard or mouse instead of retyping the full comment, ensuring consistent phrasing across transactions.

**Why this priority**: This is the core feature. Prevents comment duplication and spelling variations that make filtering/grouping difficult. Delivers immediate value every time a transaction is entered.

**Independent Test**: Can be fully tested by opening the transaction form, typing a partial comment that matches a previously saved note, and verifying the suggestion dropdown appears and selecting a suggestion fills the field.

**Acceptance Scenarios**:

1. **Given** the user has previously saved transactions with a note "Fatura - Elektrik", **When** the user types "fatura" in the note field of a new transaction form, **Then** "Fatura - Elektrik" (and other fatura-containing notes) appear in a suggestion dropdown below the field.
2. **Given** a suggestion dropdown is visible, **When** the user presses the Down arrow key, **Then** the first suggestion is highlighted; pressing Enter selects it and fills the note field.
3. **Given** a suggestion dropdown is visible, **When** the user clicks a suggestion with the mouse, **Then** the note field is filled with that suggestion and the dropdown closes.
4. **Given** a suggestion dropdown is visible, **When** the user presses Escape, **Then** the dropdown closes without changing the input value.
5. **Given** the user types a comment that has no matches in history, **When** no match is found, **Then** no dropdown appears (or it shows a "no results" state) and the user can type freely.
6. **Given** the note field is empty, **When** the user focuses the field, **Then** no dropdown appears (autocomplete only triggers after typing begins).

---

### User Story 2 - Browser Autocomplete Disabled on All Form Inputs (Priority: P2)

The browser's built-in autocomplete popups no longer appear for any input field in the transaction form — including the amount field, which is a numeric/decimal field. Only the custom note autocomplete is shown, not the browser's native popup.

**Why this priority**: The browser autocomplete for numeric and category fields is confusing and irrelevant (suggesting previous URLs, names, or unrelated values). It must be suppressed before adding custom autocomplete so the two don't conflict.

**Independent Test**: Can be fully tested by focusing the amount field and verifying no browser autocomplete popup appears. Repeat for the note field to confirm only the custom dropdown (not the browser popup) shows.

**Acceptance Scenarios**:

1. **Given** the user clicks or tabs into the amount (Tutar) field, **When** the field receives focus, **Then** no browser autocomplete dropdown appears.
2. **Given** the user clicks or tabs into the note field, **When** the user types, **Then** the browser's own autocomplete dropdown does NOT appear — only the custom suggestion dropdown is shown.
3. **Given** any input in the transaction form, **When** it receives focus or input, **Then** no browser-generated autocomplete suggestions appear for any field.

---

### User Story 3 - Note Filter Autocomplete in Analysis View (Priority: P3)

In the Analysis view, the note filter input field shows autocomplete suggestions from past transaction notes as the user types. This lets the user quickly locate and filter by a specific comment without needing to remember the exact phrasing.

**Why this priority**: Enhances discoverability when searching for specific notes. Depends on P1 infrastructure (the note suggestion data source) being in place.

**Independent Test**: Can be fully tested by navigating to Analysis view, typing a partial known note in the "Not ara..." field, and verifying matching suggestions appear and selecting one filters the transaction table.

**Acceptance Scenarios**:

1. **Given** there are transactions with notes in the database, **When** the user types a partial string in the "Not ara..." filter in Analysis view, **Then** a suggestion dropdown shows matching past notes.
2. **Given** a suggestion is selected in the analysis note filter, **When** selected, **Then** the note filter value is set to the selected suggestion and the transaction table updates accordingly.
3. **Given** the analysis note filter is cleared, **When** the field is empty, **Then** no dropdown appears.

---

### Edge Cases

- What happens when the note history is empty (new installation or all notes are null)? → Autocomplete shows nothing; field behaves as a plain text input.
- What happens when there are many matching suggestions (e.g., 50+ notes)? → Dropdown is capped at a reasonable maximum (e.g., 8 items) with scrolling if needed.
- What happens if the user types and then deletes all text? → Dropdown hides immediately.
- What happens if two suggestions are identical (same note saved many times)? → Deduplication: each unique note text appears only once in the list.
- What happens with very long note strings in the dropdown? → Text is truncated with ellipsis in the dropdown; full value is applied when selected.
- What happens if the user pastes text into the note field? → Autocomplete triggers and shows matching suggestions based on pasted value.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST disable browser-native autocomplete on all input fields in the transaction form (note, amount, category).
- **FR-002**: The note field MUST display a custom autocomplete dropdown when the user has typed at least 1 character.
- **FR-003**: The autocomplete dropdown MUST show suggestions sourced from all unique, non-empty note values previously saved in the transaction history.
- **FR-004**: Suggestion matching MUST be case-insensitive and support both prefix matching and substring (contains) matching — suggestions containing the typed text anywhere in the string MUST be shown.
- **FR-005**: The dropdown MUST be navigable by keyboard (arrow keys to move, Enter to select, Escape to dismiss).
- **FR-006**: The dropdown MUST be dismissable by clicking outside the field or pressing Escape.
- **FR-007**: Clicking a suggestion with the mouse MUST fill the note field with the selected value and close the dropdown.
- **FR-008**: The suggestions list MUST deduplicate — each unique note text appears at most once.
- **FR-009**: The dropdown MUST cap displayed suggestions (maximum 8 visible at once, scrollable if list is longer).
- **FR-010**: When no matching suggestions exist, the dropdown MUST NOT appear (or MUST close if already open).
- **FR-011**: When the note field is empty, the dropdown MUST NOT appear on focus alone.
- **FR-012**: The note filter input in the Analysis view MUST also support the same autocomplete behaviour (same data source, same interaction model).
- **FR-013**: Suggestion matching SHOULD rank prefix matches above contains-only matches in the list ordering.

### Key Entities

- **Note Suggestion**: A unique, non-empty string derived from the `note` column of past transactions. Has no identity of its own — derived at query time.
- **Note Field**: The freetext comment input on the transaction form. Currently optional; autocomplete augments it without changing its optional nature.
- **Note Filter**: The text search input in the Analysis view used to filter the transaction table by note content.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can select a previously used comment from the suggestion dropdown in under 3 keystrokes (type 1–2 characters, arrow key or click to select).
- **SC-002**: No browser-native autocomplete popups appear on any form input field after the fix.
- **SC-003**: All unique past notes are available as suggestions; zero duplicates appear in the dropdown.
- **SC-004**: Selecting a suggestion via keyboard or mouse takes under 200 ms from user action to field being filled.
- **SC-005**: The same note typed with minor spelling variations (e.g., "Fatura" vs "fatura") is recognisable via case-insensitive matching and appears as a suggestion.
- **SC-006**: The analysis note filter with autocomplete enables users to locate a specific note without typing the full string.

## Assumptions

- The application is single-user and all past notes belong to the same user; there is no privacy concern about suggesting any stored note.
- The number of unique notes will remain small enough (well under 10,000) that client-side filtering of a pre-loaded list is fast and acceptable — no server-side search pagination is needed.
- The note field remains optional; autocomplete does not add any validation or make the field required.
- The `autoComplete="off"` attribute is sufficient to suppress browser autocomplete in the Tauri embedded WebView; no additional browser-specific hacks are needed.
- Fuzzy matching (e.g., tolerating single-character typos) is a nice-to-have for a future iteration; this spec covers exact substring matching only.
- The autocomplete component will be built using the existing Popover primitive already present in the UI component library, without requiring new third-party autocomplete packages.
- The note suggestions data is loaded once when the form opens (not on every keystroke) and filtered in-memory, keeping the interaction fast.
