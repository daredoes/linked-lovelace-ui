# Documentation Site Maintenance Agent - Summary

*Created: 2026-02-27*

---

## ✅ Deliverables Created

### 1. Agent File
**Location**: `.opencode/agents/doc-maintenance.md`
- Complete maintenance instructions
- Navigation and structure guidelines
- Quality checkpoints and standards

### 2. Documentation Standards
**Location**: `.opencode/context/core/standards/documentation.md`
- VitePress navigation structure
- Front matter requirements
- Code block standards
- Image asset rules

### 3. Maintenance Rules
**Location**: `.opencode/rules/docs_maintenance.md`
- Navigation update requirements
- Code quality rules
- Link integrity standards
- Build verification checklist
- Missing documentation requirements

### 4. Audit Script
**Location**: `scripts/docs-audit.sh`
- Identifies broken links
- Detects orphaned images
- Validates markdown syntax
- Checks navigation consistency
- Runs VitePress build test

---

## 📋 Documentation Requirements

### Current Documentation Status

**Existing** (✅ Complete):
- `index.md` - Homepage
- `getting-started.md` - Quick start guide
- `create-your-first-template.md` - Template creation
- `creating-partials.md` - Partials documentation
- `providing-template-context.md` - Context and variables
- `using-the-status-card.md` - Status card usage
- `api-examples.md` - API examples

**Missing** (⚠️ Recommended):
- `enhanced-usage.md` - Advanced features and patterns
- `best-practices.md` - Usage guidelines and recommendations
- `contributing.md` - Contribution instructions
- `troubleshooting.md` - Common issues and solutions (optional)

---

## 🔧 Usage Instructions

### Running Documentation Maintenance

1. **Pre-deployment Audit**:
   ```bash
   ./scripts/docs-audit.sh
   ```

2. **Development Preview**:
   ```bash
   cd docs_site
   npm run docs:dev
   ```

3. **Production Build**:
   ```bash
   cd docs_site
   npm run docs:build
   ```

### Updating Navigation

When adding new documentation:

1. Write the markdown file in `docs_site/`
2. Open `.vitepress/config.mts`
3. Add entry to `sidebar` array
4. Save and verify in preview mode

### Adding New Documentation

**Step 1**: Create file with proper front matter
```markdown
---
title: Enhanced Usage
description: Advanced configuration and patterns
layout: page
---

## Overview

Section description...

## Example

```typescript
Example code...
```
```

**Step 2**: Update navigation in `.vitepress/config.mts`
```	ypescript
sidebar: [
  {
    text: 'Quick Start',
    items: [
      // ... existing
    ]
  },
  {
    text: 'Advanced',
    items: [
      { text: 'Enhanced Usage', link: '/enhanced-usage' }
    ]
  }
]
``` ```

**Step 3**: Run audit
```bash
./scripts/docs-audit.sh
```

---

## 📖 Reference Files

| File | Purpose | Location |
|------|---------|----------|
| Agent Instructions | Task execution | `.opencode/agents/doc-maintenance.md` |
| Standards | Documentation patterns | `.opencode/context/core/standards/documentation.md` |
| Rules | Quality gate enforcement | `.opencode/rules/docs_maintenance.md` |
| Audit Script | Issue detection (automated) | `scripts/docs-audit.sh` |

---

## ✅ Checklist for New Documentation

Before publishing any new documentation:

- [ ] Follow existing page patterns
- [ ] Include proper front matter
- [ ] Add at least 2 code examples
- [ ] Update navigation in `config.mts`
- [ ] Run `docs-audit.sh` successfully
- [ ] Verify in dev preview mode
- [ ] Test build production mode
- [ ] Check mobile responsiveness

---

## 🚀 Deployment

**Automated via GitHub Actions**:
- Trigger: Push to `main` or `master`
- Action: Deploy to GitHub Pages
- Input: `docs_site/.vitepress/dist`

**Manual Deployment**:
```bash
# 1. Run audit
./scripts/docs-audit.sh

# 2. Build
npm run docs:build

# 3. Commit and push
git add docs_site/
git commit -m "docs: update documentation

# 4. GitHub Actions will deploy automatically
```

---

*This documentation site is maintained following the standards and rules defined in `.opencode/` directory.*
