# Tasks: Windows Build, Turkish NSIS Installer & Update Checker

**Input**: Design documents from `/specs/001-finance-tracker/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/updater.md

**Tests**: Not requested. Manual testing per constitution.

**Organization**: Tasks grouped by concern area. The app (US1-US9) is already implemented. These tasks add Windows distribution infrastructure and a manual update checker feature.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US10 = Manual Update Checker)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Signing & Plugin Installation)

**Purpose**: Generate update signing keys and install the updater plugin via CLI

- [x] T001 Generate update signing key pair via `pnpm tauri signer generate -w ~/.tauri/gelir-gider.key` and note the public key output
- [x] T002 Install tauri-plugin-updater via `pnpm tauri add updater` (adds Rust crate + JS bindings automatically)
- [x] T003 Verify plugin installation: confirm `tauri-plugin-updater` in `src-tauri/Cargo.toml` and `@tauri-apps/plugin-updater` in `package.json`

**Checkpoint**: Signing keys generated, updater plugin installed. Commit.

---

## Phase 2: Foundational (Tauri Configuration)

**Purpose**: Configure NSIS Turkish installer, updater plugin backend, and capabilities. MUST complete before UI work.

**CRITICAL**: No updater UI work (Phase 3) can begin until this phase is complete.

- [x] T004 Configure NSIS Turkish installer and updater artifacts in `src-tauri/tauri.conf.json`: add `bundle.windows.nsis` with `"languages": ["Turkish"]` and `"installMode": "both"`, add `bundle.createUpdaterArtifacts: true`, add `plugins.updater` with pubkey from T001, endpoint `https://github.com/iltan987/gelir-gider/releases/latest/download/latest.json`, and `windows.installMode: "passive"`
- [x] T005 Register updater plugin in `src-tauri/src/lib.rs`: registered by `pnpm tauri add updater` CLI
- [x] T006 Add updater permissions to `src-tauri/capabilities/desktop.json`: add `"updater:default"`, `"updater:allow-check"`, `"updater:allow-download-and-install"`

**Checkpoint**: Tauri backend fully configured for NSIS Turkish + updater. Commit.

---

## Phase 3: User Story 10 - Manual Update Checker (Priority: P3)

**Goal**: Add a card in Settings that lets the user manually check for updates, view available version info, download + install with progress, and relaunch.

**Independent Test**: Open Settings, click "Guncelleme Kontrol Et". Without a published release, it should show "Guncel surum" or a graceful connection error. With a published release of a higher version, it should show the version and offer download.

### Implementation for User Story 10

- [x] T007 [US10] Add `UpdateStatus` type to `src/types/index.ts`: discriminated union with states `idle | checking | available | downloading | error | upToDate` and associated fields (version, body, date, progress, error)
- [x] T008 [US10] Create updater service in `src/services/updater.ts`: export `checkForUpdate()` that calls `check()` from `@tauri-apps/plugin-updater` and returns typed result, and `installUpdate(onProgress)` that calls `downloadAndInstall()` with progress callback then `relaunch()` from `@tauri-apps/plugin-process`
- [x] T009 [US10] Add update checker card to `src/components/settings/settings-view.tsx`: new Card section with "Guncelleme" heading, current version display via `getVersion()` from `@tauri-apps/api/app`, "Guncelleme Kontrol Et" button, and state-driven UI for all `UpdateStatus` states (checking spinner, available version info with "Guncelle" button, download progress bar, error with retry, up-to-date confirmation). All text in Turkish.
- [x] T010 [US10] Verify `pnpm build` succeeds with zero TypeScript errors after updater integration

**Checkpoint**: Update checker feature complete and type-safe. Commit.

---

## Phase 4: CI/CD (GitHub Actions Workflow)

**Purpose**: Create the GitHub Actions workflow that builds the Windows NSIS installer and publishes to GitHub Releases

- [x] T011 [P] Create `.github/workflows/release.yml`: workflow triggered on `workflow_dispatch` and tag push `v*`, `windows-latest` runner only, `pnpm/action-setup@v4`, `tauri-apps/tauri-action@v0` with `tagName: v__VERSION__`, `includeUpdaterJson: true`. Pass signing secrets.
- [x] T012 [P] Quickstart already has secrets docs from planning phase

**Checkpoint**: CI/CD workflow ready. Commit.

---

## Phase 5: Polish & Verification

**Purpose**: Final checks across all changes

- [x] T013 Run `pnpm lint:fix` and `pnpm format` across all modified files
- [x] T014 Run `pnpm build` to confirm zero TypeScript errors and successful Vite build
- [x] T015 Verify `src-tauri/tauri.conf.json` is valid JSON and all new fields are correctly structured
- [x] T016 Review all Turkish UI strings in settings-view.tsx for spelling and consistency

**Checkpoint**: All changes verified. Final commit.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (needs pubkey from T001, plugin from T002)
- **User Story 10 (Phase 3)**: Depends on Phase 2 (needs plugin registered and configured)
- **CI/CD (Phase 4)**: Depends on Phase 2 (needs tauri.conf.json configured), can run in parallel with Phase 3
- **Polish (Phase 5)**: Depends on Phase 3 and Phase 4

### Task Dependencies

```
T001 (signing keys) -> T004 (tauri.conf.json needs pubkey)
T002 (install plugin) -> T003 (verify) -> T005 (register in lib.rs)
T004, T005, T006 -> T007, T008, T009 (UI needs backend configured)
T004 -> T011 (workflow needs tauri.conf.json ready)
T007 -> T008 -> T009 -> T010
T011, T012 can run in parallel with T007-T010
T013-T016 after everything else
```

### Parallel Opportunities

- T005 and T006 can run in parallel (different files: lib.rs vs default.json)
- T011 and T012 can run in parallel with T007-T010 (different concern: CI/CD vs frontend)
- T013 and T015 can run in parallel (lint vs JSON validation)

---

## Parallel Example: Phase 2

```bash
# After T004 (tauri.conf.json), these can run in parallel:
Task T005: "Register updater plugin in src-tauri/src/lib.rs"
Task T006: "Add updater permissions to src-tauri/capabilities/default.json"
```

## Parallel Example: Phase 3 + Phase 4

```bash
# After Phase 2 completes, these can run in parallel:
Phase 3 (T007-T010): "Update checker UI in frontend"
Phase 4 (T011-T012): "GitHub Actions workflow"
```

---

## Implementation Strategy

### MVP First (Phase 1 + 2 + 3)

1. Complete Phase 1: Generate keys, install plugin
2. Complete Phase 2: Configure Tauri backend
3. Complete Phase 3: Update checker in Settings
4. **STOP and VALIDATE**: Test update checker manually (should show "up to date" or connection error)
5. Commit and verify build

### Full Delivery

1. Phases 1-3 as above (MVP)
2. Add Phase 4: GitHub Actions workflow
3. Phase 5: Polish
4. Push to GitHub, add secrets, test workflow via manual dispatch

---

## Notes

- [P] tasks = different files, no dependencies
- [US10] label maps to the Manual Update Checker feature
- Phases 1-2 are infrastructure; Phase 3 is the user-facing feature
- Phase 4 (CI/CD) is independently testable via GitHub Actions
- Commit after each phase (per constitution checkpoint rule)
- Stop at any checkpoint to validate
- All UI text must be Turkish
- No Co-Authored-By in commits
