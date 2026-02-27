# VitePress Documentation Standards

*Category: Documentation*
*Version: 1.0.0*

---

## Project Context

This project uses **VitePress v1.0.1** for documentation hosted at GitHub Pages under the `docs_site/` directory.

---

## Navigation Structure Standards

### File Location
**Path**: `.vitepress/config.mts`

### Sidebar Organization Rules
1. Group documentation logically (Quick Start, Advanced, etc.)
2. Maintain consistent heading levels
3. Always use relative paths starting with `/`
4. Match text labels to actual file names (slugs)

**Example Structure**:
```typescript
sidebar: [
  {
    text: 'Quick Start',
    items: [
      { text: 'Getting Started', link: '/getting-started' },
      { text: 'Creating Partials', link: '/creating-partials' },
    ]
  },
  {
    text: 'Advanced',
    items: [
      { text: 'Enhanced Usage', link: '/enhanced-usage' },
    ]
  }
]
```

### Link Path Format
- ✅ `/page-name` - Relative to `base` path
- ✅ `/api-examples` - Internal links
- ❌ `page-name` - Missing leading slash
- ❌ `/docs/page-name` - Overly nested

---

## Documentation File Standards

### Front Matter Template
```markdown
---
title: Page Title
description: SEO description (max 160 chars)
layout: page  # or 'home' for index.md
sidebar: 'Section Title'  # Optional, for custom sidebar labels
---
```

### Heading Hierarchy
```
# (No header in markdown - uses front matter)
## Main Section      (Required for all content pages)
### Subsection       (For detailed topics)
#### Detail          (Optional, for granular breakdown)
```

### Content Requirements per Page
- **Minimum**: 2 code examples
- **Required**: At least one functional example
- **Best Practice**: Link out to related pages (`[text](/other-page)`)

---

## Code Block Standards

### Always Specify Language
```markdown
❌ ```
const x = 1
```

✅ ```typescript
const x: number = 1;
``` ```

### YAML for Config Examples
```yaml
# High Assistant

card:
  type: custom:linked-lovelace
type: 'custom:button-card'
```

### TypeScript Examples
```typescript
interface TemplateConfig {
  name: string;
  template: string;
  priority: number;
}

export const templates: Record<string, TemplateConfig> = {};
```

---

## Image Asset Standards

### Placement
**Directory**: `docs_site/images/`

### Reference Format
```markdown
![Image Description](./images/filename.png)
```

### Naming Convention
- kebab-case: `status-card-example.png`
- No spaces, lowercase only
- Descriptive but concise

---

## Internal Linking

### Link Pattern
```markdown
[Link Text](/page-name)
[API Reference](/api-examples)
[Related Doc](/getting-started#advanced-setup)
```

### Cross-References
```markdown
See [Creating Partials](/creating-partials) § for advanced usage.

Related: [Providing Template Context](/providing-template-context)
```

---

## Build Configuration Rules

### VitePress Base Path
```typescript
// .vitepress/config.mts
export default defineConfig({
  base: "/linked-lovelace-ui/",  // Must match GitHub repo
  // ... other config
})
```

### Theme Configuration
- Keep navigation minimal (5-7 items max per section)
- Use consistent sidebar labels
- Social links should use icon format

---

## Quality Checkpoints

### Pre-Merge Review
- [ ] All markdown has valid front matter
- [ ] Sidebar updated in `config.mts`
- [ ] No broken links (run `docs-audit.sh`)
- [ ] Code blocks have language specifiers
- [ ] All referenced images exist in `images/`
- [ ] No trailing whitespace
- [ ] Heading hierarchy maintained

### Deployment Checklist
- [ ] `vitepress build` succeeds
- [ ] Build output in `docs_site/.vitepress/dist`
- [ ] All navigation items clickable in preview
- [ ] Search index generated
- [ ] GitHub Actions deployment status green

---

## Common Issues & Solutions

| Issue | Root Cause | Solution |
|-------|-----------|----------|
| 404 on navigation click | Missing sidebar entry | Update `config.mts` sidebar |
| Images not displaying | Wrong path format | Use `./images/filename.png` |
| Links broken after rename | Hardcoded paths | Find/replace in markdown files |
| Build warnings | Missing language spec | Add ````typescript` to code blocks |
| Search broken | Missing search config | Check `.vitepress/config.mts` |

---

## Version History

| Version | Date | Changes |
|---------|------|----------|
| 1.0.0 | 2026-02-27 | Initial documentation standards |

---

*Last Updated: 2026-02-27*  
*Maintained by: Documentation Site Maintenance Agent*
