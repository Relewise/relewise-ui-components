# AGENTS.md

## Scope
This file defines working rules for agents and contributors in this repository.

Repository focus:
- Primary maintained package: `packages/web-components`
- Root repo contains metadata/docs and GitHub workflows.

## Tech Stack and Runtime Shape
- Language: TypeScript
- UI: Lit-based Web Components
- Build: Rollup + TypeScript
- Dev server/examples: Vite (`development/`)
- Tests: Web Test Runner + Playwright + `@open-wc/testing`
- Lint: ESLint (`packages/web-components/.eslintrc.cjs`)
- API typing bundle: API Extractor (`build:types`)

Core architecture:
- Initialization stores config on `window` globals (`initializeRelewiseUI`).
- Components are registered through `useRecommendations`, `useSearch`, `useBehavioralTracking`.
- Search/recommendation behaviors are event-driven (custom events + window listeners).
- Public package surface is barrel-exported via `src/index.ts`.

## Environment Prerequisites
- Node.js 22 (matches CI)
- npm (package-lock based workflow)

## Working Directory Rules
For almost all code tasks, run commands in:
- `packages/web-components`

Use root only for repository-level inspection/docs.

## Setup Commands
From `packages/web-components`:
1. `npm install`
2. `npm run build`
3. `npm run build:types`
4. `npx playwright install --with-deps` (first run or browser mismatch)
5. `npm run test`

## Required Validation (Default: CI-Parity)
For code changes, run all before finishing:
1. `npm run build`
2. `npm run build:types`
3. `npm run test`

If a task is docs-only or clearly non-runtime, state which commands were skipped and why.

## Coding Conventions
Follow existing lint/config rather than introducing new style systems:
- 4-space indentation
- single quotes
- semicolons
- trailing commas in multiline constructs

Do not add Prettier unless explicitly requested.

Preserve current file/module patterns:
- Keep exports wired through existing barrels (`src/index.ts` and feature `index.ts` files).
- Keep custom-element definitions idempotent (existing `tryRegisterElement` pattern).
- Keep event listener lifecycle symmetric (`connectedCallback` add, `disconnectedCallback` remove).
- Prefer extending existing base classes for recommendations/search components when applicable.

## Safe Change Patterns
When adding/changing components:
1. Implement component logic in feature folder (`recommendations`, `search`, `tracking`, or `components`).
2. Register tag via existing app registration flow if needed.
3. Export through relevant barrel files.
4. Add/update tests under `tests/`.
5. Update `packages/web-components/README.md` for new attributes, behavior, or examples.

When changing initialization/configuration behavior:
- Preserve backward compatibility of `RelewiseUIOptions` and `RelewiseUISearchOptions`.
- Maintain global window key names and semantics.
- Ensure context updates still propagate via `Events.contextSettingsUpdated`.

When changing search/recommendation behavior:
- Verify URL/session helpers remain consistent (`src/helpers/urlState.ts`, session keys/events).
- Validate targeted configuration behavior still works (`targeted*Configurations`).

## Testing Guidance
Test framework conventions in this repo:
- Use `suite(...)` / `test(...)` style with `@open-wc/testing`.
- Prefer focused unit tests for builder/config logic and component behavior.
- For component render tests, assert shadow DOM output and state transitions.
- For integration-like flows, rely on existing env-driven test options:
  - `INTEGRATION_TEST_DATASET_ID`
  - `INTEGRATION_TEST_API_KEY`

Add tests for:
- New public options/attributes
- Event lifecycle behavior
- Registration/initialization behavior
- Regressions in existing defaults

## Files and Artifacts
- Do not commit `dist/` or `build/` unless explicitly requested by maintainers.
- Keep `.npmignore`/publish expectations aligned with package outputs.
- Do not change CI workflows unless the task explicitly requires it.

## PR/Change Checklist
For non-trivial code changes:
1. Code updated in `packages/web-components/src`
2. Exports updated (if public surface changed)
3. Tests added/updated in `packages/web-components/tests`
4. README updated for user-facing API/attribute changes
5. `build`, `build:types`, and `test` pass locally

## Notes for Agents
- Prefer minimal, targeted edits over broad refactors.
- Preserve public tag names and API signatures unless explicitly asked to break compatibility.
- Call out assumptions when integration-test credentials are unavailable.
