#!/usr/bin/env tsx
/**
 * docs-sync.ts - Documentation Synchronization Script
 * 
 * This script scans the codebase and generates/updates VitePress documentation
 * to ensure the docs_site/ remains synchronized with how the plugin actually works.
 * 
 * Usage: npx tsx scripts/docs-sync.ts [options]
 *   --help      Show help information
 *   --check     Only check for discrepancies, don't write
 *   --verbose   Show detailed output
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { globSync } from 'glob';
import { fileURLToPath } from 'url';
import path from 'path';

// Configuration (ES module compatible)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const DOCS_SITE_DIR = path.join(ROOT_DIR, 'docs_site');
const DOCS_DIR = path.join(DOCS_SITE_DIR, '.vitepress', 'config.mts');

interface DocTemplate {
  key: string;
  displayName: string;
  description: string;
  configOptions: string[];
  examples: string[];
  notes: string[];
}

interface DocPartial {
  key: string;
  displayName: string;
  description: string;
  configOptions: string[];
  examples: string[];
  notes: string[];
}

/**
 * Extract interface information from TypeScript files
 */
function extractInterfaces(filePath: string): Record<string, any> {
  const content = readFileSync(filePath, 'utf-8');
  const interfaces: Record<string, any> = {};
  
  // Match interface definitions
  const interfaceRegex = /export interface (\w+)( extends [\w,]+)?\s*\{([\s\S]*?^\})/gm;
  let match;
  
  while ((match = interfaceRegex.exec(content)) !== null) {
    const interfaceName = match[1];
    const extendsClause = match[2] || '';
    const body = match[3];
    
    // Extract properties
    const properties = [];
    const propertyRegex = /\s*(@property|[\w\-]+)\?:?\s*([\w\[\]{}<>?,\s]+);?/g;
    let propMatch;
    
    while ((propMatch = propertyRegex.exec(body)) !== null) {
      properties.push({
        name: propMatch[1].trim().replace('@property', ''),
        type: propMatch[2].trim(),
        deprecated: propMatch[1].includes('@deprecated')
      });
    }
    
    interfaces[interfaceName] = {
      name: interfaceName,
      extends: extendsClause.replace('extends ', '').trim(),
      properties
    };
  }
  
  return interfaces;
}

/**
 * Extract card type information from source files
 */
function extractCardTypes(): DocTemplate[] {
  const templates: DocTemplate[] = [];
  
  // Find all card TypeScript files
  const cardFiles = globSync('src/linked-lovelace-*.ts', { cwd: SRC_DIR });
  
  cardFiles.forEach(file => {
    const content = readFileSync(path.join(SRC_DIR, file), 'utf-8');
    const fileName = path.basename(file, '.ts');
    
    // Extract card type
    const typeMatch = content.match(/type:\s*'([^']+)'/);
    const type = typeMatch ? typeMatch[1] : 'unknown';
    
    // Extract card name from registration
    const nameMatch = content.match(/name:\s*'([^']+)'/);
    const displayName = nameMatch ? nameMatch[1] : fileName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    // Extract description from registration or JSDoc
    const descMatch = content.match(/description:\s*'([^']+)'/);
    const description = descMatch ? descMatch[1] : 'Documentation placeholder';
    
    // Extract config interface usage
    const configMatch = content.match(/setConfig\(config:\s*([^)]+)/);
    const configInterface = configMatch ? configMatch[1].trim() : 'unknown';
    
    // Add to templates
    templates.push({
      key: type,
      displayName,
      description,
      configOptions: [], // Will be filled from types.ts analysis
      examples: [
        `
\`\`yaml
type: $$type$$
name: $$Card Name$$
debug: true
\`\`
`
      ],
      notes: [
        `This card type is defined in \`${file}\`.`,
        'Configuration options should reference the corresponding interface in `src/types.ts`.',
        'See [Using the Status Card](/using-the-status-card) for examples.'
      ]
    });
  });
  
  return templates;
}

/**
 * Extract partial definitions
 */
function extractPartials(): DocPartial[] {
  const partials: DocPartial[] = [];
  
  // Find partial-related files and patterns
  const content = readFileSync(path.join(SRC_DIR, 'types.ts'), 'utf-8');
  
  // Extract LinkedLovelacePartial interface
  const partialInterface = extractInterfaces(path.join(SRC_DIR, 'types.ts'));
  const linkedLovelacePartial = partialInterface['LinkedLovelacePartial'];
  
  if (linkedLovelacePartial) {
    const configOptions = linkedLovelacePartial.properties.map(p => ({
      name: p.name,
      type: p.type,
      required: !p.name.includes('?')
    }));
    
    partials.push({
      key: 'linked-lovelace-partials',
      displayName: 'Linked Lovelace Partials Card',
      description: 'A card template that defines reusable partials for use across your dashboards.',
      configOptions: configOptions.map(o => `${o.name}${o.name.includes('?') ? ':' : ''} ${o.type} ${o.required ? '(required)' : '(optional)'}`),
      examples: [
        `
\`\`yaml
type: custom:linked-lovelace-partials
partials:
  - key: partial1
    template: |-
      card:
        type: custom:template-card
        entity: sensor.example
  - key: partial2
    template: |-
      card:
        type: gauge
        entity: sensor.temperature
\`\`
`
      ],
      notes: [
        'Partials can be referenced from templates using the ETA.js template syntax.',
        'See [Creating Partials](/creating-partials) for detailed usage.',
        'Use [providing-template-context](/providing-template-context) to pass data to partials.'
      ]
    });
  }
  
  return partials;
}

/**
 * Generate markdown from extracted template data
 */
function generateTemplateDoc(template: DocTemplate): string {
  const filename = `linked-${template.key}.md`;
  
  return `---
title: ${template.displayName}
layout: page
---

# ${template.displayName}

## Overview

${template.description}

## Configuration

### Required Options

${template.configOptions.filter(o => o.includes('required') || o.includes('?')).map(o => `
- **${o}**
`).join('') || 'None'}

### Optional Options

${template.configOptions.filter(o => !o.includes('required') && !o.includes('?')).map(o => `
- **${o}**
`).join('') || 'None'}

## Usage Examples

${template.examples.join('\n')}

## Notes

${template.notes.join('\n')}

## See Also

- [Getting Started](/getting-started)
- [Creating Your First Template](/create-your-first-template)
- [Using the Status Card](/using-the-status-card)
- [Creating Partials](/creating-partials)
`;
}

/**
 * Generate markdown from extracted partial data
 */
function generatePartialDoc(partial: DocPartial): string {
  const filename = 'linked-partials.md';
  
  return `---
title: ${partial.displayName}
layout: page
---

# ${partial.displayName}

## Overview

${partial.description}

## Card Configuration

### Configuration Options

${partial.configOptions.map(o => `
- **${o}**
`).join('')}

## Usage Examples

${partial.examples.join('\n')}

## Integration with Templates

Partials can be referenced from templates and other components. Use the partial key to reference them in your templates.

### Basic Usage

\`\` yaml
type: custom:your-card
ll_template: my-partial
\`\`

## Notes

${partial.notes.join('\n')}

## See Also

- [Creating Partials](/creating-partials)
- [Providing Template Context](/providing-template-context)
- [ETA.js Template Syntax](https://eta.js.org/docs/)
`;
}

/**
 * Update sidebar navigation based on existing doc files
 */
function updateSidebarNavigation(): void {
  const configPath = DOCS_DIR;
  const configContent = readFileSync(configPath, 'utf-8');
  
  // Extract existing items
  const itemsMatch = configContent.match(/items:\s*\[([\s\S]*?)\n\s*\]/);
  if (!itemsMatch) {
    console.warn('Could not parse sidebar items in config');
    return;
  }
  
  // Find all doc files in docs_site/
  const docFiles = globSync('docs_site/*.md', { cwd: path.join(__dirname, '..') })
    .filter(f => !f.includes('markdown-examples') && !f.includes('api-examples'));
  
  // Generate sidebar items
  const newItems = docFiles.map(file => {
    const name = path.basename(file, '.md');
    // Convert kebab-case to Title Case
    const title = name.replace(/-[a-z]/g, m => m[1].toUpperCase());
    return `{ text: '${title}', link: '/${name}' }`;
  });
  
  if (itemsMatch[1].includes(newItems.join('\n'))) {
    console.log('Sidebar navigation is up to date.');
    return;
  }
  
  const newItemBlock = `sidebar: [
      {
        text: 'Quick Start',
        items: [
          ${newItems.join('\n          ')}
        ]
      }
    ],`;
  
  console.log('Updating sidebar navigation...');
  const updatedConfig = configContent.replace(
    /sidebar:\s*\[[\s\S]*?\n\s*\]/,
    newItemBlock
  );
  
  writeFileSync(configPath, updatedConfig);
  console.log('✅ Sidebar navigation updated.');
}

/**
 * Check for documentation discrepancies
 */
function checkDiscrepancies(): boolean {
  let hasDiscrepancies = false;
  
  // Check card types
  const templates = extractCardTypes();
  const docFiles = globSync('docs_site/*.md', { cwd: path.join(__dirname, '..') });
  
  templates.forEach(template => {
    const expectedFile = `docs_site/${template.key}.md`;
    const exists = docFiles.some(f => f.includes(expectedFile));
    
    if (!exists) {
      console.warn(`⚠️  Missing documentation for ${template.displayName} (${template.key})`);
      hasDiscrepancies = true;
    }
  });
  
  // Check partials
  const partials = extractPartials();
  partials.forEach(partial => {
    const exists = docFiles.some(f => f.includes('partials'));
    if (!exists) {
      console.warn(`⚠️  Missing documentation for ${partial.displayName}`);
      hasDiscrepancies = true;
    }
  });
  
  return hasDiscrepancies;
}

/**
 * Generate all documentation
 */
function generateDocumentation(): void {
  console.log('📝 Generating documentation...\n');
  
  // Generate template documentation
  const templates = extractCardTypes();
  templates.forEach(template => {
    const content = generateTemplateDoc(template);
    const filename = `docs_site/${template.key}.md`;
    writeFileSync(path.join(__dirname, '..', filename), content);
    console.log(`✅ Generated: ${filename}`);
  });
  
  // Generate partial documentation
  const partials = extractPartials();
  partials.forEach(partial => {
    const content = generatePartialDoc(partial);
    const filename = 'docs_site/linked-partials.md';
    writeFileSync(path.join(__dirname, '..', filename), content);
    console.log(`✅ Generated: ${filename}`);
  });
  
  // Update sidebar
  updateSidebarNavigation();
  
  console.log('\n🎉 Documentation generation complete!');
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
Docs Sync Script - Keep your documentation in sync with the codebase

Usage:
  npx tsx scripts/docs-sync.ts [options]

Options:
  --help     Show this help message
  --check    Only check for discrepancies, don't write files
  --generate Generate all documentation (default if no flags)
  --verbose  Show detailed output
`);
    process.exit(0);
  }
  
  if (args.includes('--check')) {
    console.log('🔍 Checking for documentation discrepancies...\n');
    const hasIssues = checkDiscrepancies();
    
    if (hasIssues) {
      console.log('\n⚠️  Some documentation is missing or out of date.');
      console.log('Run without --check to generate missing documentation.');
      process.exit(1);
    } else {
      console.log('✅ All documentation is up to date!');
      process.exit(0);
    }
  }
  
  generateDocumentation();
}

main();
