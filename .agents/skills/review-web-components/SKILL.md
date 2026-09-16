---
name: review-web-components
description: Review, design, implement, or refactor Lit Web Components in relewise-ui-components. Use for changes under packages/web-components/src that add component state, rendering, async requests, parent-child coordination, registration, public APIs, CSS parts, or Shadow/Light DOM behavior, and before declaring a component PR ready for review.
---

# Review Web Components

Apply the repository's component architecture before editing and again to the final diff. Treat `AGENTS.md` as authoritative.

## 1. Establish The Boundary

Before implementation:

1. Read `AGENTS.md` completely.
2. Identify at least two nearest existing components and inspect their implementation, registration, tests, and documentation.
3. Write a short ownership table covering:
   - parent orchestration and placement;
   - child state, requests, and rendering;
   - parent-to-child properties;
   - child-to-parent events;
   - public versus internal status.
4. Prefer the smallest boundary already represented in the repository.

Do not start implementation until every new stateful abstraction has a clear owner.

## 2. Enforce Component Architecture

- Put renderable state, Lit templates, and async UI lifecycle in a `RelewiseLitElement`.
- Reject feature-level `ReactiveController` implementations that fetch, cache, render, or call `host.requestUpdate()` for domain state.
- Reject callback-property bags between components. Use properties downward and bubbling, composed custom events upward.
- Allow imperative child methods only for an established coordination protocol such as parent-owned request batching.
- Keep cohesive orchestration in the parent and cohesive request/result presentation in focused children.
- Reuse existing tiles, facets, builders, templates, localization, URL state, and registration patterns where their contracts match.
- Do not introduce registries, adapters, services, or shared types for one caller without a concrete repeated need.

## 3. Decide Public Versus Internal

For a public/shared component, require:

- a current second consumer or explicit standalone public requirement;
- a self-contained lifecycle when used directly;
- idempotent registration through the established app flow;
- package and feature barrel exports;
- documented properties, events, parts, variables, and examples;
- direct component tests independent of the first parent consumer.

For an internal component:

- scope its name to the owning feature;
- register it only with that feature;
- do not barrel-export or advertise it as standalone;
- expose its styling through the public parent with `exportparts` when needed.

## 4. Verify Runtime Conventions

Check all applicable items:

- `connectedCallback`/`disconnectedCallback` listener symmetry;
- aborting obsolete and disconnected requests;
- protection against stale async responses;
- Shadow and Light DOM behavior through `RelewiseLitElement`;
- CSS part forwarding across nested shadow roots;
- property-level localization fallbacks at render sites;
- existing global configuration, templates, filters, relevance modifiers, targets, and URL/session helpers;
- unchanged behavior for existing components and development examples.

## 5. Test At The Correct Levels

Separate tests by responsibility:

- pure builder/configuration unit tests;
- direct tests for each new public or stateful component;
- parent integration tests for orchestration across component boundaries.

Cover applicable registration, properties, events, lifecycle cleanup, stale requests, failure/empty states, defaults, partial overrides, Shadow DOM, Light DOM, CSS parts, and existing-behavior regressions.

## 6. Perform The Final Drift Audit

Inspect the complete branch diff against its base, not only the latest commit.

Run searches equivalent to:

```powershell
rg -n "ReactiveController|ReactiveControllerHost|host\.requestUpdate|\.render\(\)" packages/web-components/src
git diff --stat <base>...HEAD
git diff --check
```

For every match, verify it follows an established pattern. Confirm:

- ownership still matches the initial table;
- public/internal status did not drift;
- no hypothetical reuse replaced concrete ownership;
- no manual child rendering or callback communication was introduced;
- README and examples describe the actual API;
- required build, type, lint, and test validation was run.

Report unresolved architectural deviations before calling the change PR-ready.
