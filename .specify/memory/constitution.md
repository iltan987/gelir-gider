<!--
  Sync Impact Report
  ==================
  Version change: N/A (initial) → 1.0.0
  Modified principles: N/A (first version)
  Added sections:
    - Core Principles (6 principles)
    - Technology Standards
    - Development Workflow
    - Governance
  Removed sections: N/A
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ no update needed (Constitution Check section is generic)
    - .specify/templates/spec-template.md ✅ no update needed (structure is generic)
    - .specify/templates/tasks-template.md ✅ no update needed (structure is generic)
    - .specify/templates/agent-file-template.md ✅ no update needed (placeholder-based)
    - .specify/templates/checklist-template.md ✅ no update needed (placeholder-based)
  Follow-up TODOs: None
-->

# Gelir-Gider Constitution

## Core Principles

### I. Tool-First Development (NON-NEGOTIABLE)

When an MCP tool is available for a task, it MUST be used instead of
manual approaches or outdated knowledge. This is the primary mechanism
for staying current with library APIs, component patterns, and best
practices.

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
  defined in `categories.txt` — no normalization or translation
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

1. Run `pnpm lint` after changes — fix all violations before
   proceeding
2. Run `pnpm format:check` — formatting MUST pass
3. Run `pnpm build` — TypeScript compilation MUST succeed with zero
   errors
4. Test the affected workflow manually when UI changes are involved

### Commit Discipline

- Commits MUST NOT include `Co-Authored-By` lines
- Commit messages MUST be concise and describe the "why"
- Each commit MUST represent a single logical change

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

**Version**: 2.0.0 | **Ratified**: 2026-03-21 | **Last Amended**: 2026-03-21
