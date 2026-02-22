# The Ideal Plugin: A Roadmap

To achieve the "Optimal System" identified in our project history, we recommend the following key improvements.

## 1. Discovery Engine

**Current State**: Templates and partials are discovered and registered somewhat ad-hoc or as part of the main controller's initialization.

**Ideal State**: A dedicated `DiscoveryEngine` that:
- Periodically scans all available dashboards.
- Parses templates and partials.
- Maintains an up-to-date registry of all available "Linked Lovelace" assets.
- Provides a centralized source of truth for all controllers.

## 2. Robust Traversal & Cycle Detection

**Current State**: The system uses recursive traversal of the dashboard configuration tree. While recursion limits have been addressed, it is still inherently more fragile than iterative approaches.

**Ideal State**:
- **Iterative Traversal**: Use a queue-based (BFS) or stack-based (DFS) approach to navigate the dashboard configuration.
- **Cycle Detection**: Implement a "visited" set that tracks the chain of templates being rendered. If the same template is encountered again in its own rendering chain, an error should be thrown (or a warning rendered).
- **Depth Limiting**: Explicitly limit the depth of nested templates to prevent runaway processes.

## 3. Pre-compilation & Performance

**Current State**: Templates are often rendered from strings directly.

**Ideal State**:
- **Pre-compilation**: Eta supports pre-compiling templates into functions. This should be done during the discovery phase.
- **Caching**: Compiled templates and rendered partials should be cached and only invalidated when the underlying source changes.

## 4. Enhanced Type Safety

**Current State**: The system uses TypeScript, but many Home Assistant dashboard structures are loosely typed (using `Record<string, any>` or `any`).

**Ideal State**:
- **Strict Dashboard Schemas**: Use a library like `Zod` or `io-ts` to define and validate the structure of dashboards being processed.
- **Strongly-typed Context**: Define schemas for `ll_context` to ensure that templates receive the data they expect.

## 5. Independent Testing Pipeline

**Current State**: Most tests are unit tests for individual functions.

**Ideal State**:
- **Mocked Home Assistant Environment**: A set of tests that can simulate the entire lifecycle (Discovery -> Registration -> Rendering -> Deployment) using mocked WebSocket responses.
- **Performance Benchmarks**: Automated benchmarks to ensure that large dashboards (e.g., 100+ cards) are processed within acceptable time limits.
