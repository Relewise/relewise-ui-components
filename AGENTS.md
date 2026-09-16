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
- All Lit-based Relewise web components must extend `RelewiseLitElement` unless there is a documented reason not to. This preserves shared behavior such as `components.domMode`, Light DOM stylesheet registration, and future cross-component runtime settings.
- Prefer extending existing base classes for recommendations/search components when applicable.
- For component localization, keep default labels at their usage/rendering sites and resolve each property independently (for example, `localization?.showMore ?? 'Show More'`). Do not shallow-spread default and override localization objects into a merged object; future nested localization sections could be replaced wholesale and lose default properties. If localization must be normalized elsewhere, merge nested fields explicitly and test partial overrides.

### Component Ownership And Communication
- Any abstraction that owns renderable UI state, returns Lit templates, or manages an asynchronous UI lifecycle must be a Lit component extending `RelewiseLitElement`.
- Do not use a Lit `ReactiveController` for feature-specific fetching, caching, result state, loading state, or rendering. A controller is only appropriate for non-rendering cross-cutting behavior that is concretely shared by multiple host components, and the reason for using it must be documented.
- A controller must not expose `render()`, own feature result state, call `host.requestUpdate()` for domain-state changes, or receive a callback-property bag that substitutes for component communication.
- Pass state from parent to child through properties. Communicate from child to parent through bubbling, composed custom events. Use imperative child methods only for an established coordination contract such as preparing and applying a parent-owned batch request.
- Parent components own orchestration and placement. Focused child components own their cohesive request/result lifecycle and rendering. Do not move half of one responsibility into a helper while leaving the other half parent-managed.
- Preserve configurable Shadow and Light DOM behavior for every component. When a public parent exposes styling for an internal child, forward the child's CSS parts with `exportparts` and test both DOM modes.

### Public, Internal, And Shared APIs
- Decide whether a new component or abstraction is public or internal before implementing it.
- Internal feature components must be scoped and named after their owning feature, registered only with that feature, and omitted from public barrels and standalone API documentation.
- Public/shared naming requires a current second consumer or an explicit standalone public-component requirement. A hypothetical future consumer alone is not sufficient.
- A public component must own its standalone lifecycle and behavior, use Web Component properties/events instead of consumer callbacks, and have direct registration, documentation, development example, and component tests.
- Place code according to its current owner and consumers, not according to possible future reuse. Extract shared infrastructure when the reuse is real and the shared contract can be described independently of its first consumer.

Prefer the simplest type/control-flow that correctly expresses the runtime behavior:
- Do not add defensive null/undefined checks when the type system or earlier guards already guarantee a value exists.
- Reuse existing public/shared types instead of creating duplicate local aliases for the same shape unless there is a clear separation-of-concerns reason.
- Avoid recomputing the same derived configuration multiple times in a single code path; build or resolve it once and pass it through.
- When exposing ordered user-configured options, prefer defaults derived from the configured order unless a stronger domain-specific default is required.
- Do not require users to supply internal-only identifiers when those ids can be derived deterministically from the configuration itself.

## Safe Change Patterns
When adding/changing components:
1. Identify the nearest existing reference components and compare ownership, properties, events, lifecycle, rendering, styling, registration, exports, and tests before choosing an architecture.
2. Decide and record whether the component is public/shared or internal to a feature.
3. Extend `RelewiseLitElement` so global component options apply consistently.
4. Implement component logic in the folder belonging to its current owner.
5. Register the tag through the existing app registration flow.
6. Export through relevant barrel files only when the component is public.
7. Add focused component tests under `tests/`, plus parent integration tests when orchestration crosses a component boundary.
8. Update `packages/web-components/README.md` and development examples for public attributes, properties, events, behavior, or styling APIs.

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
- Shadow and Light DOM behavior for new components
- CSS part forwarding across public component boundaries

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
6. New stateful abstractions compared against the nearest established components
7. Public/internal ownership, event direction, DOM mode, and CSS part behavior verified

## Notes for Agents
- Prefer minimal, targeted edits over broad refactors.
- Preserve public tag names and API signatures unless explicitly asked to break compatibility.
- Call out assumptions when integration-test credentials are unavailable.
