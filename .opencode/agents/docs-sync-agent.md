---
name: DocuDocsSyncAgent
type: agent
description: Documentation synchronization agent for VitePress site
aliases: [docs-sync, doc-sync, docs-syncher, docu-syncer]
---

# 📚 DocsSyncAgent

A specialized agent that keeps the VitePress documentation site synchronized with the actual codebase behavior.

## Purpose

The DocsSyncAgent continuously monitors the codebase and updates the VitePress documentation site (`docs_site/`) to ensure documentation reflects how the plugin actually works. This prevents documentation drift where docs become outdated as the code evolves.

## What It Does

- **Scans code files** for configuration interfaces, card types, and template structures
- **Extracts documentation metadata** from TypeScript interfaces and JSDoc comments
- **Generates/reviews markdown files** in `docs_site/` for all documented features
- **Syncs examples** from test files and actual usage patterns
- **Creates visual documentation** (placeholders for GIFs/screenshots where needed)
- **Validates sidebar/nav** configuration matches actual documentation structure

## Architecture

### Discovery Pattern (Inspired by DiscoveryEngine)

Similar to the `DiscoveryEngine` in `src/v2/`, the DocsSyncAgent uses a discovery pattern:

```
DocsSyncAgent
├── Scanner
│   ├── scanTypes()           → Extract interfaces from types.ts
│   ├── scanCardFiles()       → Extract card configurations
│   └── scanJSDoc()           → Extract documentation comments
├── Generator
│   ├── docFromInterface()    → Generate markdown from TypeScript interfaces
│   ├── docFromCard()         → Generate card documentation
│   └── docFromDiscovery()    → Generate usage docs from discovered items
├── Syncer
│   ├── compareDocs()         → Compare existing docs with extracted info
│   ├── updateDoc()           → Regenerate outdated docs
│   └── createMissingDoc()    → Create docs for undocumented features
└── MediaManager
    └── captureDemo()         → Placeholder generation for GIFs/screenshots
```

## Integration

### HEARTBEAT Task

The DocsSyncAgent runs as a periodic HEARTBEAT task (see `.opencode/HEARTBEAT.md`). It should be triggered automatically during work sessions to keep documentation current.

### Execution Flow

```
1. Load existing docs from docs_site/
2. Scan source files for documentation-relevant content
3. Compare extracted docs with existing docs
4. Update or regenerate as-needed
5. Update sidebar navigation if docs were added/removed
6. Report changes and pending updates
```

## Documentation Structure

### Card Type Docs (`docs_site/*.md`)

Each card template should have documentation that includes:

1. **Features list** (from JSDoc/type descriptions)
2. **Configuration options** (from TypeScript interfaces)
3. **Usage examples** (from test files or examples)
4. **Context variables** (from ll_context usage)
5. **Template system info** (from template discovery)

## Configuration

### Scan Paths
- `src/types.ts` - Type definitions and configuration interfaces
- `src/*.ts` - Card component implementations
- `src/controllers/*.ts` - Controller logic
- `src/v2/*.ts` - V2 architecture patterns
- `.test.md` files in `docs_site/` - Example usage patterns

### Output Paths
- `docs_site/getting-started.md` - Overview and setup
- `docs_site/*-template.md` - Individual card template docs
- `docs_site/*-partials.md` - Partials documentation
- `docs_site/ideals-plugin.md` - Feature documentation

## Maintenance

This agent should be run:
- **Periodically** via HEARTBEAT (recommended: every few hours during active work)
- **Manually** when making significant code changes
- **Pre-commit** when updating the plugin features

## Example Usage

```bash
# Run the sync script
npm run docs:sync

# Or run via the task agent
/task DocsSyncAgent "Sync documentation site with current codebase. Focus on updates to linked-lovelace-status card configurations."
```

## Related

- [DiscoveryEngine](../src/v2/discovery-engine.ts) - Inspiration for the discovery pattern
- [HEARTBEAT](../HEARTBEAT.md) - Periodic task execution
- [.opencode/rules/taking_notes.md](../rules/taking_notes.md) - Documentation organization standards

## Version

This agent was created to address the recurring task: "Update the documentation in docs_site" (marked incomplete in HEARTBEAT). It implements a proactive solution to prevent documentation drift.
