# Documentation Site Maintenance Rules

*Apply: always*  *Version: 1.0.0*

---

## Purpose

These rules govern how documentation is maintained, updated, and verified for the VitePress-based documentation site.

---

## 1. Navigation Updates (MANDATORY)

**Rule**: Every time you add or modify a documentation page, you MUST update the navigation.

### When to Update Navigation
- ✓ Adding a new `.md` file to `docs_site/`
- ✓ Renaming or moving a document
- ✓ Reorganizing documentation structure

### Navigation Update Checklist
```markdown
1. ✅ Edit `.vitepress/config.mts` sidebar configuration
2. ✅ Add new entry with correct path format: `/page-name`
3. ✅ Ensure sidebar section exists or create new one
4. ✅ Verify text matches expected label
5. ✅ Check for trailing whitespace or syntax errors
6. ✅ Test navigation works in preview mode
```

### Example Navigation Addition
```typescript:
// .vitepress/config.mts
sidebar: [
  {
    text: 'Quick Start',
    items: [
      { text: 'Getting Started', link: '/getting-started' },
    ]
  },
  {
    text: 'Advanced',
    items: [
      { text: 'Enhanced Usage', link: '/enhanced-usage' },  // NEW ENTRY
    ]
  }
]
```

---

## 2. Code Quality Rules

### Code Block Standards
- **REQUIRED**: Every code block MUST have a language identifier
- **TypeScript**: Use ````typescript` prefix, not ````ts`
- **YAML**: Use ````yaml` for configuration examples
- **JavaScript**: Use ````javascript` or ````js`

**Before**:
```markdown
```
const x = getValue();
```
```

**After**:
```markdown
```typescript
const x: string = getValue();
``` ```

### Code Example Requirements
- All code blocks should be syntactically valid
- Provide complete, runnable examples where possible
- Include comments for complex logic portions only

---

## 3. Link Integrity Rules

### Internal Link Format
- **MUST START WITH SLASH**: `/page-name`
- **NO trailing slashes**: `/getting-started` not `/getting-started/`
- **Anchor links allowed**: `/getting-started#advanced-setup`

### Link Creation Standards
```markdown
✅ [Getting Started](/getting-started)
✅ [Advanced Configuration](/creating-partials#setup)
✅ [API Examples](/api-examples)
```

❌ [Link](getting-started) - Missing leading slash
❌ [Link](/getting-started/) - Trailing slash included
❌ [Link](/api) - Points to non-existent page

---

## 4. Image Asset Rules

### Image Path Format
```markdown
![Alternative Text](./images/filename.png)
![Diagram](../images/architecture.png)
```

### Naming Conventions
- Lowercase: `status-card-example.png`
- Kebab-case: `template-partial-example.md`
- Descriptive: `enhanced-usage-overview.png`

### Asset Management
```bash
# Check for orphaned images
find docs_site/images -type f

# Verify referenced images exist
scripts/docs-audit.sh
```

---

## 5. Build Verification Rules

### Pre-Commit Verification
```bash
# 1. Run documentation audit
./scripts/docs-audit.sh

# 2. Test development build
npm run docs:dev

# 3. Verify production build builds
npm run docs:build && vitepress preview
```

### Build Validation
- Build must complete without errors
- No `WARN` messages in build output
- Search functionality must index all pages

---

## 6. Documentation Pattern Rules

### Front Matter (REQUIRED for all pages)
```markdown
---
title: Page Title
description: Brief description for SEO
layout: page  # 'page' for content, 'home' for index
---
```

### Page Structure Template
```markdown
---
title: Enhanced Usage
description: Advanced configuration guide
layout: page
---

## Overview

Brief description of section purpose.

## Configuration

```yaml
config_key: value
```

## Example Usage

```typescript
Example code snippet here.
```

## Related Documentation

- [Related Page 1](/) link text
- [Related Page 2](/) link text
```

---

## 7. Content Consistency Rules

### Heading Hierarchy
```
# (from front matter title)
## Main Section     (required)
### Subsection      (for details)
#### Detail         (optional)
```

### Formatting Standards
- Use `---` for horizontal rules, not `***` or `___`
- Use `> ` for blockquotes
- Use `**bold**` for emphasis, *italics* for technical terms
- Use `code` inline for code references

### Language Consistency
- Document in **American English** (color, center, organize)
- Use **present tense** for current features
- Use **past tense** for deprecated features

---

## 8. Missing Documentation Rules

### Required Documentation Topics

#### **MUST-HAVE** (Critical for all features)
- `enhanced-usage.md` - Advanced/extended usage examples
- `best-practices.md` - Guidelines for optimal usage
- `contributing.md` - Contribution guidelines
- `status-card.md` - Complete status card documentation

#### **RECOMMENDED** (High value for users)
- `troubleshooting.md` - Common issues and solutions
- `faq.md` - Frequently asked questions
- `changelog.md` - Version history

#### **OPTIONAL** (Nice to have)
- `roadmap.md` - Future features
- `comparison.md` - vs other solutions
- `tutorial.md` - End-to-end guided tutorial

---

## 9. Testing and Audit Rules

### Documentation Audit (Pre-merge)
Always run `scripts/docs-audit.sh` before merging documentation changes.

**Common Issues Detected**:
- [ ] 404 broken links
- [ ] Missing image references
- [ ] Orphaned markdown code without language spec
- [ ] Unused images in `images/`
- [ ] Inconsistent heading hierarchy

### Manual Testing Checklist
```markdown
- [ ] All navigation items accessible
- [ ] No 404 links (except intentionally)
- [ ] Search returns relevant results
- [ ] Mobile responsive
- [ ] Code examples copy-paste ready
```

---

## 10. Deployment Rules

### GitHub Pages Deployment
```yaml
# .github/workflows/docs-deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main, master]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm docs:build
      
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs_site/.vitepress/dist
```

### Release Process
1. Update `docs_site/index.md` homepage with latest changes
2. Run `./scripts/docs-audit.sh` - all checks must pass
3. `npm run docs:build` - build must succeed without warnings
4. Commit and push to trigger GitHub Actions
5. Monitor deployment job status

---

## 11. Agent Behavior Rules

### Before Writing Documentation
1. ✅ Call `docs-audit.sh` to understand current state
2. ✅ Read 2+ existing docs to match patterns
3. ✅ Check `config.mts` for current navigation structure
4. ✅ Identify gaps in documentation coverage

### When Proposing Changes
1. ✅ Outline proposed documentation changes
2. ✅ Specify affected files and locations
3. ✅ Identify what standards will apply
4. ✅ Highlight any deviations from standard patterns

### After Writing Documentation
1. ✅ Run documentation audit again
2. ✅ Verify all links resolve correctly
3. ✅ Confirm build succeeds locally
4. ✅ Update navigation if new pages created

---

## Enforcement

These rules are mandatory for all documentation contributions. Non-compliance results in:
- ❌ Documentation rejected during review
- ❌ Build failures if navigation incomplete
- ❌ Deployment errors if links are broken

**Agent Identity**: This file is maintained by the **Documentation Site Maintenance Agent**

---

*Last Updated: 2026-02-27*  
*Maintained by Documentation Site Maintenance Agent*
