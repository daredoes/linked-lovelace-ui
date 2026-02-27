#!/usr/bin/env node

/**
 * Performance Benchmark Generator for Linked Lovelace UI
 * 
 * This script generates test dashboards with varying complexity to benchmark
 * template rendering performance under different conditions.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface BenchmarkConfig {
  name: string;
  cardCount: number;
  templateComplexity: 'simple' | 'medium' | 'complex';
  nestingDepth: number;
  outputDir: string;
}

const BENCHMARK_CONFIGS: BenchmarkConfig[] = [
  {
    name: 'minimal',
    cardCount: 10,
    templateComplexity: 'simple',
    nestingDepth: 1,
    outputDir: 'benchmark-minimal'
  },
  {
    name: 'small',
    cardCount: 50,
    templateComplexity: 'simple',
    nestingDepth: 1,
    outputDir: 'benchmark-small'
  },
  {
    name: 'medium',
    cardCount: 100,
    templateComplexity: 'medium',
    nestingDepth: 2,
    outputDir: 'benchmark-medium'
  },
  {
    name: 'large',
    cardCount: 250,
    templateComplexity: 'medium',
    nestingDepth: 3,
    outputDir: 'benchmark-large'
  },
  {
    name: 'stress',
    cardCount: 500,
    templateComplexity: 'complex',
    nestingDepth: 4,
    outputDir: 'benchmark-stress'
  },
  {
    name: 'extreme',
    cardCount: 1000,
    templateComplexity: 'complex',
    nestingDepth: 5,
    outputDir: 'benchmark-extreme'
  }
];

function generateSimpleTemplate(index: number): string {
  return `{\n  "type": "sensor",\n  "entity": "sensor.temperature_${index}",\n  "name": "Temperature ${index}"\n}`;
}

function generateMediumTemplate(index: number): string {
  return `{\n  "type": "button",\n  "entity": "binary_sensor.motion_${index}",\n  "name": "Motion ${index}",\n  "icon": "mdi:motion-sensor",
  "tap_action": {"action": "toggle"}\n}`;
}

function generateComplexTemplate(index: number): string {
  return `{\n  "type": "custom:vertical-stack-in-card",\n  "title": "Stack ${index}",\n  "cards": [\n    {\n      "type": "sensor",\n      "entity": "sensor.temperature_${index}",\n      "name": "Temp ${index}"\n    },\n    {\n      "type": "button",\n      "entity": "binary_sensor.motion_${index}",\n      "name": "Motion ${index}",\n      "icon": "mdi:motion-sensor"\n    }\n  ]\n}`;
}

function generateLinkedListTemplate(index: number, maxIndex: number): string {
  const nextLink = index < maxIndex ? `ll_key": "template_link_${index + 1}"` : '';  
  const nextIndex = index < maxIndex ? index + 1 : index;
  
  return `{\n  "type": "custom:linked-lovelace",\n  "ll_template": "template_${index}",\n  "ll_key": "template_link_${index}",\n  "ll_context": {\n    "index": ${index},\n    "max_index": ${maxIndex}\n  }\n${index < maxIndex ? ',' : ''}${nextLink}\n}`;
}

function generateStackWithNestedTemplates(baseIndex: number, depth: number): string {
  if (depth === 0) {
    return generateSimpleTemplate(baseIndex);
  }

  const cards: string[] = [];
  for (let i = 0; i < 5; i++) {
    cards.push(generateStackWithNestedTemplates(baseIndex * 10 + i, depth - 1));
  }

  return `{\n  "type": "custom:vertical-stack-in-card",\n  "title": "Nested Stack ${baseIndex}",\n  "cards": [\n    ${cards.join(',\n    ')}\n  ]\n}`;
}

function generateYamlConfiguration(config: BenchmarkConfig): string {
  const cards = [];
  const totalCards = config.cardCount;
  const complexityFn = config.templateComplexity === 'simple'  
    ? generateSimpleTemplate 
    : config.templateComplexity === 'medium' 
      ? generateMediumTemplate 
      : generateComplexTemplate;
  
  if (config.name === 'stress' || config.name === 'extreme') {
    // Generate template cards for stress tests
    for (let i = 0; i < 10; i++) {
      cards.push({
        type: 'custom:linked-lovelace',
        ll_template: `stress_template_$i`,
        ll_key: `stress_link_$i`,
        ll_context: {
          index: i,
          total: totalCards
        }
      });
    }
    
    // Add remaining cards with templates
    for (let i = 10; i < totalCards; i++) {
      cards.push(complexityFn(i));
    }
  } else {
    // Generate standard test cards based on complexity
    for (let i = 0; i < Math.floor(totalCards / 2); i++) {
      cards.push(complexityFn(i));
    }
    
    // Add linked template cards for the rest
    for (let i = Math.floor(totalCards / 2); i < totalCards; i++) {
      cards.push({
        type: 'custom:linked-lovelace',
        ll_template: `linked_template_${i % 10}`,
        ll_key: `linked_card_${i}`,
        ll_context: {
          card_id: i,
          template_id: i % 10
        }
      });
    }
  }

  const dashboard = {
    title: `Benchmark Dashboard - ${config.name}`,
    path: `benchmark/${config.name}`,
    mode: 'yaml',
    cards: cards
  };

  return YAML.stringify(dashboard, { lineWidth: -1 });
}

function generateTemplateContent(index: number, complexity: string): string {
  const contextIndex = index;
  
  if (complexity === 'simple') {
    return `\n  type: sensor\n  entity: \<%= "sensor.temperature_${contextIndex}" %\>\n  name: \<%= "Temperature ${contextIndex}" %\>`;
  }
  
  if (complexity === 'medium') {
    return `\n  type: button\n  entity: \<%= "binary_sensor.motion_${contextIndex}" %\>\n  name: \<%= "Motion ${contextIndex}" %\>\n  icon: mdi:motion-sensor\n  tap_action:\n    action: toggle`;
  }
  
  // Complex
  return `\n  type: custom:vertical-stack-in-card\n  title: Stack \<%= ${contextIndex} %\>\n  cards:\n    - type: sensor\n      entity: \<%= "sensor.temp_${contextIndex}" %\>\n    - type: button\n      entity: \<%= "binary_sensor.motion_${contextIndex}" %\>`;
}

function generateYamlFile(config: BenchmarkConfig): void {
  try {
    const outputDir = path.join(__dirname, '..', 'benchmark', config.outputDir);
    const outputDir2 = path.join(__dirname, '..', 'benchmark-templates', config.outputDir);

    // Ensure directories exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    if (!fs.existsSync(outputDir2)) {
      fs.mkdirSync(outputDir2, { recursive: true });
    }

    // Write main dashboard
    const dashboardContent = generateYamlConfiguration(config);
    const dashboardPath = path.join(outputDir, 'resources-yaml');
    fs.writeFileSync(dashboardPath, dashboardContent);

    // Generate template files for stress tests
    if (config.name === 'stress' || config.name === 'extreme') {
      for (let i = 0; i < 10; i++) {
        const templateContent = generateTemplateContent(i, config.templateComplexity);
        const templatePath = path.join(outputDir2, `stress_template_${i}.yml`);
        fs.writeFileSync(templatePath, templateContent);
      }
    }

    console.log(`✓ Generated benchmark: ${config.name} (${config.cardCount} cards, complexity: ${config.templateComplexity})`);
  } catch (error) {
    console.error(`✗ Failed to generate benchmark ${config.name}:`, error);
  }
}

// YAML stringifier (simplified version - use actual library in production)
function yamlStringify(obj: any, options?: any): string {
  return JSON.stringify(obj, null, 2)
    .replace(/"/g, '')
    .replace(/"([^"]+)":/g, '$1:')
    .replace(/"/g, '');
}

// Run all benchmarks
console.log('🚀 Starting Linked Lovelace Performance Benchmarks...');
console.log('='.repeat(60));

BENCHMARK_CONFIGS.forEach(config => {
  generateYamlFile(config);
});

console.log('\n✅ All benchmarks generated successfully!');
console.log('='.repeat(60));
console.log('Generated directories:');
BENCHMARK_CONFIGS.forEach(config => {
  console.log(`  - benchmark/${config.outputDir}/`);
});

export { BENCHMARK_CONFIGS, generateBenchmark };
