<!--
  Sync Impact Report
  ==================
  Version change: 2.1.0 → 2.2.0
  Modified sections:
    - Core Principles > I. Tool-First Development — expanded with
      CLI automation preference, automate-verify-fix workflow, and
      explicit zero-assumption mandate
  Added sections: None
  Removed sections: None
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ no update needed
      (Constitution Check already gates on all principles)
    - .specify/templates/spec-template.md ✅ no update needed
    - .specify/templates/tasks-template.md ✅ already aligned
      (Notes section includes "Commit after each task or logical
      group" and "Stop at any checkpoint to validate")
  Follow-up TODOs: None
-->

# Gelir-Gider Constitution

## Core Principles

### I. Tool-First Development (NON-NEGOTIABLE)

NEVER assume. ALWAYS look it up. When any tool — MCP, CLI, or
automated script — can perform a task, it MUST be used instead of
manual approaches or prior knowledge.

**MCP Tools & Documentation**:

- Context7 MUST be used to fetch up-to-date documentation before
  using any library API, hook, or pattern where the agent is not
  certain of the current interface
- shadcn MCP tools MUST be used to discover components, read
  examples, and get install commands — never guess component APIs
- When the user enables a new tool (e.g., Zod, TanStack, Drizzle),
  that tool MUST be used for all related work from that point forward
- If no dedicated MCP tool is available and cannot be installed,
  WebSearch and WebFetch MUST be used to retrieve current
  documentation from official sources before relying on prior
  knowledge
- If a tool is unavailable and web lookup is not feasible, explicitly
  state the gap and ask the user whether to proceed with best-effort
  knowledge or wait for the tool
- Tool output MUST be treated as the authoritative source; prior
  knowledge yields to tool output when they conflict

**CLI Automation**:

- When a CLI command can automate a task (e.g., `pnpm tauri add`,
  `eslint --fix`, `pnpm format`, scaffolding generators), it MUST
  be used instead of manual file edits
- After running any automated command, ALWAYS verify what it changed:
  read the modified files, compare against documentation, and fill
  any gaps the automation missed
- If automation produces incorrect or incomplete results, research
  the issue via tools or web search before manually correcting

**The Automate → Verify → Fix Pattern**:

This workflow applies universally — plugin installs, lint fixes,
code generation, dependency updates, and any other automated task:

1. **Automate**: Run the CLI command or automated tool
2. **Verify**: Read what it changed; compare against docs
3. **Fix**: If anything is missing or wrong, research and correct

Never skip steps 2–3. Automation is a starting point, not the end.

### II. Type Safety & Code Quality

All code MUST pass TypeScript strict-mode compilation, ESLint, and
Prettier checks without suppression.

- TypeScript `strict: true` is mandatory; `any` is prohibited except
  at validated system boundaries (e.g., parsing external JSON)
- `as` type assertions MUST be justified; prefer type guards and
  discriminated unions
- ESLint and Prettier configurations in the repository are
  authoritative — never disable rules inline without explicit user
  approval
- Unused imports, variables, and exports MUST be removed (enforced by
  `eslint-plugin-unused-imports`)
- Functions MUST have explicit return types when exported; inferred
  types are acceptable for local/private functions
- Lint and format issues MUST be fixed using automated tools
  (`pnpm lint:fix`, `pnpm format`) before attempting manual fixes

### III. Component-Driven UI

The UI MUST be built from shadcn/ui components composed with Tailwind
CSS utility classes. Custom components are permitted only when no
shadcn/ui primitive covers the need.

- Before building any UI element, query shadcn MCP tools to check
  whether a suitable component or pattern exists
- All components MUST use the project's design tokens (colors,
  spacing, typography) defined through Tailwind and CSS variables
- Component variants MUST use `class-variance-authority` (CVA) for
  consistent prop-driven styling
- Icons SHOULD come from `lucide-react` as the primary icon library;
  other libraries are acceptable when specific icons are unavailable
  or deprecated in Lucide (e.g., social media icons)
- Layout and spacing MUST use Tailwind utility classes; inline styles
  are prohibited except for truly dynamic computed values
- `src/components/ui/` is reserved for shadcn/ui managed components;
  custom components SHOULD be placed elsewhere (e.g.,
  `src/components/` root or feature-specific subdirectories)

### IV. Testing Standards

Manual testing is the primary verification method. This is a
single-user application — heavyweight automated test suites are not
warranted.

- Manual testing of affected workflows is sufficient for most changes
- Temporary test scripts MAY be written to verify specific logic
  (e.g., financial calculations, data parsing) and removed after
  verification
- Automated tests are optional and SHOULD only be added when the
  cost of a regression is high (e.g., import/export data integrity,
  currency formatting logic)

### V. User Experience Consistency

The application serves one Turkish-speaking Finance and Administration
Manager. Every interaction MUST respect Turkish locale conventions and
financial domain expectations.

- All monetary values MUST use Turkish number formatting (dot as
  thousands separator, comma as decimal separator)
- Dates MUST render in Turkish locale format (e.g., `21 Mart 2026`)
- Category names MUST match the canonical category list exactly as
  defined in `src/lib/categories.ts` — no normalization or translation
- Destructive actions (delete day, clear records, restore backup)
  MUST require explicit confirmation with a clear description of
  the consequences
- Print output MUST be treated as a first-class output path: every
  report view MUST have a print-optimized stylesheet
- Default date context MUST be today; navigation MUST provide a
  quick "go to today" action
- Revenue and expense listings MUST be displayed side by side, not
  stacked vertically
- Record tables MUST have visible grid lines (at minimum horizontal
  rules) to ensure readability
- Filtering MUST go beyond date selection — users MUST be able to
  filter by free-text search, category, and date range in
  combination

### VI. Performance & Responsiveness

The application MUST feel instant for daily operations. Perceived
latency breaks trust in a financial tool.

- Daily transaction list MUST render in under 100ms for up to 200
  records per day
- Date navigation (switching days) MUST complete and re-render in
  under 200ms
- Period analysis views MUST show a loading indicator if computation
  exceeds 300ms
- Export/import operations MUST provide progress feedback for files
  exceeding 1000 records
- Bundle size SHOULD be kept as small as practical — optimize imports,
  tree-shake unused code, and prefer lightweight dependencies
- No synchronous blocking operations on the main thread for data
  operations exceeding 50 records

## Technology Standards

The following stack is authoritative. Additions require explicit user
approval; substitutions are prohibited without constitution amendment.

| Layer | Technology | Version Constraint |
|-------|-----------|-------------------|
| Runtime | Tauri 2 | `@tauri-apps/api ^2` |
| UI Framework | React 19 | `react ^19.1.0` |
| Language | TypeScript 5.8+ | `strict: true` |
| Styling | Tailwind CSS 4 | via `@tailwindcss/vite` |
| Components | shadcn/ui | via `shadcn ^4.1.0` |
| Primitives | Base UI React | `@base-ui/react ^1.3.0` |
| Variants | CVA | `class-variance-authority` |
| Icons | Lucide React | `lucide-react` |
| Build | Vite 7 | ESM only (`"type": "module"`) |
| Package Manager | pnpm 10 | `packageManager` field enforced |
| Font | Geist Variable | `@fontsource-variable/geist` |

## Development Workflow

### Before Writing Code

1. Check available MCP tools for the relevant libraries
2. Fetch current documentation via Context7 for any API being used
3. If using a shadcn component, use shadcn tools to read its docs and
   examples before implementation
4. Read existing code in the affected area before making changes

### Code Changes

1. Run `pnpm lint:fix` after changes — prefer automated fix over
   manual edits; review remaining violations and fix manually only
   if the auto-fixer cannot resolve them
2. Run `pnpm format` — prefer auto-format over manual formatting
3. Run `pnpm build` — TypeScript compilation MUST succeed with zero
   errors
4. Test the affected workflow manually when UI changes are involved

### Commit Discipline

- Commits MUST be made frequently — once a task, phase, or
  logical unit of work is complete, commit immediately
- Commit messages MUST be short and describe the change; because
  commits are frequent and small, messages are naturally concise
- Each commit MUST represent a single logical change
- Commits MUST NOT include `Co-Authored-By` lines

### Review Checkpoints

- The agent MUST NOT rush through implementation. At natural
  boundaries (phase completion, milestone, complex decision
  point), the agent MUST pause and present work for user review
  and approval before proceeding
- When in doubt about direction, stop and ask — do not accumulate
  speculative changes that may need to be reverted
- The user's explicit approval is required before moving to the
  next phase or major section of work

## Governance

This constitution is the authoritative source for development
standards in the Gelir-Gider project. All implementation decisions
MUST be consistent with these principles.

- **Amendment process**: Any principle change requires explicit user
  approval and a version bump in this document
- **Versioning**: Follows semantic versioning — MAJOR for principle
  removals or incompatible redefinitions, MINOR for new principles
  or material expansions, PATCH for clarifications and wording fixes
- **Compliance**: Every spec, plan, and task generated by speckit
  commands MUST reference and satisfy applicable principles
- **Tool precedence**: When a tool provides guidance that conflicts
  with this constitution, the constitution governs architectural
  decisions; the tool governs API-level implementation details
- **Review**: Constitution MUST be reviewed when adding new
  technology dependencies or changing architectural patterns

**Version**: 2.2.0 | **Ratified**: 2026-03-21 | **Last Amended**: 2026-03-21
