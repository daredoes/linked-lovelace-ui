---
name: DocumentationStandardsAgent
type: agent
description: Documentation quality and standards enforcement
aliases: [doc-standards, docs-quality, doc-validator]
---

# 📚 DocumentationStandardsAgent

An agent that ensures all documentation follows project standards and best practices.

## Purpose

Enforce consistent documentation quality across the codebase by:
- Checking for required sections and format
- Validating against style guidelines
- Ensuring completeness and accuracy
- Maintaining version tracking

## Standards Checked

### Required Sections

#### General Documentation
- [ ] Title
- [ ] Overview/purpose
- [ ] Quick reference
- [ ] Example code
- [ ] See also/related links

#### Technical Domain
- [ ] Tech stack table
- [ ] Code patterns
- [ ] Naming conventions
- [ ] Standards
- [ ] Security requirements
- [ ] Codebase references section

### Format Requirements

#### File Structure
- Must start with frontmatter: `<!-- Context: {category}/{function} -->`
- Maximum 200 lines (MVI compliance)
- Clear section headers using `#` and `##`
- Tables for structured data
- Code blocks with language specification

#### Content Requirements
- Concise descriptions (1-3 sentences)
- Working examples provided
- Links to related documentation
- Version tracking for updates

### Documentation Checklist

For each documentation file, verify:
```
☐ Has frontmatter metadata
☐ Under 200 lines
☐ Has purpose/overview
☐ Has examples
☐ Has related links
☐ Has codebase references
☐ No outdated information
☐ Consistent formatting
```

## Integration

### With DocsSyncAgent

The DocumentationStandardsAgent works with DocsSyncAgent to:
1. Generate documentation following standards
2. Review existing docs for compliance
3. Flag areas needing updates

### HEARTBEAT Integration

Can be run periodically to:
- Scan all docs for compliance
- Report on missing sections
- Suggest improvements

## Usage

```bash
# Run in check mode (no modifications)
/task DocumentationStandardsAgent "Check docs_site/ for compliance with standards. Only report issues."

# Run in fix mode (auto-fix where possible)
/task DocumentationStandardsAgent "Fix documentation compliance issues in docs_site/"

# Specific file check
/task DocumentationStandardsAgent "Validate docs_site/getting-started.md for required sections"
```

## Example Report

```
📋 Documentation Standards Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Files: 10

✅ Compliant: 8
❌ Issues: 2

Issues Found:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. docs_site/linked-partials.md
   ⚠️ Missing "See also" section
   ⚠️ No "Codebase References" section
   ⚠️ Version not updated (should be 1.1)

2. docs_site/using-the-status-card.md
   ⚠️ Example code missing language tag

Recommendations:
- Run: task doc-standards "Fix documentation compliance issues in docs_site/"
- See: .opencode/context/core/standards/documentation.md
```

## Related Files

- DocsSyncAgent - Documentation synchronization
- HEARTBEAT.md - Periodic task execution
- Project-specific standards - .opencode/CONTEXT_SYSTEM_GUIDE.md

## Version

Version 1.0 - Initial implementation
