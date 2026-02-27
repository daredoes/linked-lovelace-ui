# 📋 Context Files Management

This agent manages the `.opencode/context/` folder, including external context files in `.tmp/`.

## Purpose

Manage and organize project context files, including:
- **Permanent context**: `context/` (project-specific patterns)
- **External context**: `.tmp/` (temporary files to be organized)
- **Navigation**: Index of all context files and relationships

## What It Does

### External Context Management (`.tmp/`)
- **Harvest**: Extract knowledge from `.tmp/` files into permanent context
- **Extract**: Parse and structure content from external sources
- **Organize**: Move files into `context/` structure (domain, processes, standards, templates)
- **Clean**: Remove temporary files after processing

### Context Organization
- **Domain files**: Project-specific patterns, requirements, business logic
- **Process files**: Workflow definitions, task patterns, execution models
- **Standards files**: Quality criteria, code patterns, validation rules
- **Template files**: Reusable structure definitions, format guidelines

## Operations

### /context harvest - Extract and Organize

Extracts knowledge from `.tmp/` files and organizes into permanent context:

1. **Read** all files in `.tmp/external-context.md`, `.tmp/context-*.md`, `.tmp/*-context.md`
2. **Parse** content structure and metadata
3. **Extract** patterns, domains, standards, templates
4. **Organize** into `context/` subdirectories:
   - `domain/` - Project patterns and requirements
   - `processes/` - Workflows and task patterns
   - `standards/` - Quality and validation rules
   - `templates/` - Reusable document structures
5. **Clean** up `.tmp/` files after successful organization
6. **Update** navigation.md to reflect new files

### /context extract - Parse External

Parse content from external sources (docs, code, URLs) and save to `.tmp/`:

1. Read from source (documentation, code files, URLs)
2. Extract relevant patterns and information
3. Save to `.tmp/external-context.md` or `.tmp/context-{name}.md`
4. Mark for later harvesting into permanent context

### /context organize - Restructure

Restructure flat files into function-based organization:

1. Read existing context files
2. Analyze content and purpose
3. Determine appropriate category (domain/process/standard/template)
4. Move to correct directory structure
5. Update navigation.md

### /context update - Modify Existing

Update specific context files:

1. Read file from `context/` folder
2. Modify content as needed
3. Save changes
4. Update navigation.md if structure changed

### /context create - New Files

Create new context files:

1. Prompt for file purpose and type
2. Create template with frontmatter and structure
3. Save to appropriate `context/` subdirectory
4. Update navigation.md

### /context map - View Structure

Display current context structure:

```
context/
├── core/
│   ├── context-system/
│   │   ├── context-index.md
│   │   ├── standards/
│   │   │   ├── mvi.md
│   │   │   ├── frontmatter.md
│   │   │   └── codebase-refs.md
│   │   ├── patterns/
│   │   │   └── project-intelligence.md
│   │   └── navigation.md
│   └── workflows/
│       ├── task-delegation-basics.md
│       └── code-review.md
├── domain/
│   ├── technical-domain.md
│   └── business-domain.md
├── processes/
│   └── development-workflow.md
├── standards/
│   ├── code-quality.md
│   ├── documentation.md
│   └── test-coverage.md
└── templates/
    └── feature-template.md
```

### /context validate - Check Integrity

Verify context files are valid:

1. Check all context files have required frontmatter
2. Verify navigation.md is up to date
3. Ensure no orphaned files in .tmp/
4. Validate MVI compliance (<200 lines)
5. Report issues found

## Relationship with `/add-context`

The `/context` and `/add-context` commands complement each other:

- **`/add-context`**: Creates NEW context files (tech stack, patterns) via interactive wizard
- **`/context harvest`**: Processes EXTERNAL context files from `.tmp/` into permanent context
- **`/context organize`**: REORGANIZES existing context files into better structure

Use `/add-context` when:
- Creating new project from scratch
- Adding complete new patterns
- Teaching agents YOUR coding standards

Use `/context harvest` when:
- External context files exist in `.tmp/`
- Need to extract from docs, code, or URLs
- Want to organize temporary context into permanent patterns

Use `/context organize` when:
- Existing context files are in wrong location
- File structure needs reorganization
- Want to improve context categorization

## Workflow

### Step 1: Check for External Files

```bash
ls .tmp/external-context.md .tmp/context-*.md .tmp/*-context.md
```

### Step 2: Harvest to Permanent Context

```bash
/context harvest
```

This will:
1. Extract all `.tmp/` files
2. Organize into `context/` structure
3. Clean up `.tmp/` files
4. Update navigation.md

### Step 3: Verify Structure

```bash
/context map
```

Reviews the context structure and verifies all files are properly organized.

### Step 4: Validate

```bash
/context validate
```

Checks for any issues in context file integrity.

## Best Practices

1. **Use `.tmp/` for external content** - Don't edit context files from external sources directly
2. **Harvest regularly** - Process `.tmp/` files before they accumulate
3. **Keep context files <200 lines** - For MVI compliance
4. **Update navigation.md** - After any changes
5. **Review context files periodically** - Remove outdated patterns

## Example

### Extract from Documentation

```bash
# Save docs to .tmp/
curl docs.example.com > .tmp/external-context.md

# Organize into context
/context harvest
```

### Review Current Structure

```bash
/context map
```

Shows all context files and their relationships.

### Validate

```bash
/context validate
```

Checks for issues and reports problems.

## Next Steps

After organizing context:
1. `/add-context` - Create project-specific patterns
2. Test with real agent sessions
3. Verify agents use your patterns correctly
4. Update regularly as project evolves