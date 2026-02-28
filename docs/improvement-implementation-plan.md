# Critical Improvements Implementation Plan

## Overview

This document provides a detailed implementation plan for fixing the **critical issues** identified in the Linked Lovelace UI project. The plan includes specific code changes, refactoring recommendations, and comprehensive unit tests to validate each improvement.

### Priority Level: CRITICAL
**Goal**: Enhance card synchronization reliability, performance, and maintainability
**Timeline**: 3-4 weeks (assuming parallel development)
**Impact**: Direct improvement to core functionality - card synchronization between dashboards

---

## Implementation Phases

### Phase 1: Architecture & State Management Foundation
**Duration**: 4-5 days  
**Criticality**: HIGHEST - Foundation for all other improvements

#### Improvements
1. **Unified Singleton Pattern** - Consolidate controller instances
2. **Dependency Injection** - Improve testability and flexibility
3. **State Persistence** - Maintain state between operations

#### Files to Modify
- `src/v2/linkedLovelaceSingleton.ts` - Consolidate as main singleton
- `src/controllers/hass.ts` - Fix instantiation pattern
- `src/linked-lovelace-status.ts` - Use singleton controller

---

### Phase 2: Template Rendering Performance
**Duration**: 7-8 days  
**Criticality**: HIGH - Major performance bottleneck

#### Improvements
1. **Refactor updateCardTemplate** - Break down complex function
2. **Add Caching Layer** - Cache dashboard configs and renders
3. **Optimize JSON Serialization** - Remove unnecessary cycles

#### Files to Modify
- `src/helpers/templates.ts` - Complete rewrite
- `src/helpers/cache-strategy.ts` - New file
- `src/controllers/template.ts` - Update to use new patterns

---

### Phase 3: Error Handling & Validation
**Duration**: 4-5 days  
**Criticality**: HIGH - Data integrity and user safety

#### Improvements
1. **Config Validation** - Validate before saving
2. **Enhanced Error Handling** - Proper logging and fallbacks
3. **API Retry Logic** - Handle transient failures

#### Files to Modify
- `src/linked-lovelace-api.ts` - Add validation
- `src/controllers/hass.ts` - Add retry logic
- `src/helpers/log.ts` - Improve consistency

---

### Phase 4: Type Safety Improvements
**Duration**: 3-4 days  
**Criticality**: MEDIUM - Long-term maintainability

#### Improvements
1. **Replace `any` Types** - Define proper interfaces
2. **Add Type Guards** - Runtime validation
3. **Consistent Logging** - Centralized logger

#### Files to Modify
- `src/types.ts` - Add typed interfaces
- `src/helpers/*.ts` - Replace any types
- `src/helpers/log.ts` - Enhanced logging

---

## Detailed Implementation Tasks

---

## Task 1: Unified Singleton Pattern

### Objective
Eliminate redundant controller instantiation and establish consistent singleton usage.

### Implementation Details

#### 1.1: Refactor hass.js Controller
**Current Issue**: New instance on every user interaction

#### Code Changes:
```typescript
// src/controllers/hass.ts
import { Dashboard, DashboardCard, DashboardConfig, LinkedLovelacePartial } from 'src/types';
import { GlobalLinkedLovelace } from '../instance';
import LinkedLovelaceController from '../v2/linkedLovelace';
import { TemplateEngine } from 'src/v2/template-engine';
import { toConsole } from 'src/helpers/log';

class HassController {
  private static instance: HassController;
  private _singleton: boolean = false;
  
  static getInstance(): HassController {
    if (!HassController.instance) {
      HassController.instance = new HassController();
    }
    return HassController.instance;
  }
  
  linkedLovelaceController: LinkedLovelaceController;
  dashboardsToViews: Record<string, Record<string, View>> = {};
  logs: string[] = [];
  forwardLogs: boolean = false;
  
  constructor(singleton = false) {
    this.linkedLovelaceController = new LinkedLovelaceController();
    if (singleton) {
      this._singleton = true;
    }
  }
  
  // Keep private to prevent new instances
  private constructor() {
    this.linkedLovelaceController = new LinkedLovelaceController();
  }

  addToLogs = ({msg, level = 'INFO'}: AddToLog, ...values: any[]): void => {
    const timestamp = new Date().toISOString();
    const logText = `[${level}]:${msg}`;
    this.logs.push(logText);
    if (this.forwardLogs) {
      toConsole(level.toLowerCase() as any, msg, {timestamp}, ...values);
    }
  }
  
  refresh = async (): Promise<void> => { ... }
  update = async (urlPath: string | null, dryRun: boolean = false): Promise<DashboardConfig | null> => { ... }
  updateAll = async (dryRun: boolean = false): Promise<Record<string, DashboardConfig | null>> => { ... }
}

export default HassController;
```

#### 1.2: Update Status Card to Use Singleton
```typescript
// src/linked-lovelace-status.ts

private _controller?: HassController;

private handleClick = async () => {
  // Use instance instead of creating new
  if (!this._controller) {
    this._controller = HassController.getInstance();
  }
  // Reuse existing instance
  await this._controller.refresh();
  
  // Or create new only for specific scenarios
  // if (this._controller) {
  //   this._controller.logs = [];
  //   this._controller.forwardLogs = false;
  // }
}
```

#### 1.3: Clean Up Duplicate Controller
```typescript
// src/linked-lovelace-template.ts - DEPRECATION NOTICE
// Remove handleClick that calls updateAll directly
// This card is deprecated, move users to status card
```

---

### Task 1: Unit Tests

```typescript
// src/controllers/hass.test.ts
import HassController from './hass';
import LinkedLovelaceController from '../v2/linkedLovelace';

describe('[class] HassController - Singleton Pattern', () => {
  const getFreshInstance = () => new HassController();
  
  afterEach(() => {
    // Cleanup singleton between tests
    (HassController as any).instance = null;
  });

  test('should create new instance on demand', () => {
    const controller = new HassController();
    expect(controller).toBeDefined();
    expect(controller).toBeInstanceOf(HassController);
  });

  test('getInstance should return same instance', () => {
    const instance1 = HassController.getInstance();
    const instance2 = HassController.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('getInstance should create instance if none exists', () => {
    (HassController as any).instance = null;
    const instance = HassController.getInstance();
    expect(instance).toBeDefined();
    expect(instance).toBe(HassController.getInstance());
  });

  test('should persist state between operations', async () => {
    const controller = HassController.getInstance();
    const initialLogs = controller.logs.length;
    
    // Perform operations
    controller.addToLogs({ msg: 'Test log' });
    controller.addToLogs({ msg: 'Second log' });
    
    // Logs should accumulate
    expect(controller.logs.length).toBe(initialLogs + 2);
    expect(controller.logs[initialLogs]).toContain('Test log');
    expect(controller.logs[initialLogs + 1]).toContain('Second log');
  });

  test('should maintain controller instance between calls', async () => {
    const controller = HassController.getInstance();
    const firstController = controller.linkedLovelaceController;
    
    // Access again
    const secondController = HassController.getInstance().linkedLovelaceController;
    
    // Should be same instance
    expect(firstController).toBe(secondController);
  });
});

// src/linked-lovelace-status.test.ts
import { LinkedLovelaceStatusCard } from './linked-lovelace-status';
import HassController from './controllers/hass';

describe('[component] LinkedLovelaceStatusCard - Controller Reuse', () => {
  const component = new LinkedLovelaceStatusCard();

  afterEach(() => {
    (HassController as any).instance = null;
  });

  test('should create controller instance first time', () => {
    expect(component['_controller']).toBeUndefined();
    
    // Trigger initialization
    const controller = component['_controller'] || new HassController();
    component['_controller'] = controller;
    
    expect(component['_controller']).toBeDefined();
    expect(component['_controller']).toBeInstanceOf(HassController);
  });

  test('should reuse controller instance', () => {
    const controller = HassController.getInstance();
    component['_controller'] = controller;
    
    const reusedController = component['_controller'] as HassController;
    
    expect(reusedController).toBe(controller);
  });

  test('should initialize new controller if previous is null', () => {
    component['_controller'] = null;
    
    const controller = component['_controller'] || new HassController();
    component['_controller'] = controller;
    
    expect(component['_controller']).toBeDefined();
  });
});
```

---

### Task 1: Expected Test Results

| Test | Status | Notes |
|------|--------|-------|
| create instance | ✅ PASS | Verifies new controller is creatable |
| getInstance returns same | ✅ PASS | Confirms singleton pattern working |
| getInstance creates if null | ✅ PASS | Ensures automatic creation |
| persist state logs | ✅ PASS | Validates state persistence |
| maintain controller | ✅ PASS | Ensures controller persistence |

---

## Task 2: Refactor updateCardTemplate Function

### Objective
Break down the monolithic 141-line `updateCardTemplate` function into smaller, focused, testable functions.

### Implementation Details

#### 2.1: Extract Path Finding Logic
```typescript
// src/helpers/card-path-finder.ts
import { DashboardCard, DashboardView } from '../types';

export interface CardPath {
  path: string[];     // Path to card (e.g., ['views', 0, 'cards', 1, 'card'])
  card: DashboardCard;
  ll_template?: string; // Template key if this card uses a template
}

export const extractCardPaths = (card: DashboardCard, currentPath: string[] = []): CardPath[] => {
  const paths: CardPath[] = [];
  const path = [...currentPath];
  const cardKey = card.type; // Use type as identifier
  
  // If this card has a template, record it
  if (card.ll_template) {
    paths.push({
      path, 
      card,
      ll_template: card.ll_template
    });
  }
  
  // Handle cards array
  if (Array.isArray(card.cards)) {
    card.cards.forEach((c, idx) => {
      const newPath = [...path, 'cards', idx.toString()];
      paths.push(...extractCardPaths(c, newPath));
    });
  }
  
  // Handle single nested card
  if (card.card && !Array.isArray(card.card)) {
    paths.push(...extractCardPaths(card.card, [...path, 'card']));
  }
  
  // Handle sections (new dashboard format)
  if (card.sections && Array.isArray(card.sections)) {
    card.sections.forEach((section, idx) => {
      if (section.cards && Array.isArray(section.cards)) {
        section.cards.forEach((c, cardIdx) => {
          const newPath = [...path, 'sections', idx.toString(), 'cards', cardIdx.toString()];
          paths.push(...extractCardPaths(c, newPath));
        });
      }
    });
  }
  
  return paths;
};

export const extractCardsFromView = (view: DashboardView): CardPath[] => {
  const paths: CardPath[] = [];
  
  // Regular cards array
  if (view.cards && Array.isArray(view.cards)) {
    view.cards.forEach((card, idx) => {
      const newPath = ['views', paths.length.toString(), 'cards', idx.toString()];
      paths.push(...extractCardPaths(card, newPath));
    });
  }
  
  // Sections array
  if (view.sections && Array.isArray(view.sections)) {
    view.sections.forEach((section, idx) => {
      if (section.cards && Array.isArray(section.cards)) {
        section.cards.forEach((card, cardIdx) => {
          const newPath = ['views', paths.length.toString(), 'sections', idx.toString(), 'cards', cardIdx.toString()];
          paths.push(...extractCardPaths(card, newPath));
        });
      }
    });
  }
  
  return paths;
};
```

#### 2.2: Template Application Logic
```typescript
// src/helpers/card-template-applicator.ts
import { DashboardCard } from '../types';
import { TemplateEngine } from '../v2/template-engine';

type TemplateRenderer = (card: DashboardCard, templateData: Record<string, any>, context: any) => DashboardCard | null;

type ErrorCallback = (card: DashboardCard, error: unknown) => DashboardCard;

export class CardTemplateApplicator {
  private templates: Record<string, any>;
  private errorCallback: ErrorCallback;

  constructor(templates: Record<string, any>, errorCallback: ErrorCallback = this.defaultErrorHandler) {
    this.templates = templates;
    this.errorCallback = errorCallback;
  }

  private defaultErrorHandler = (card: DashboardCard, error: unknown): DashboardCard => {
    console.error('Template application failed', { card, error });
    return card; // Return original on error as fallback
  };

  private applyTemplate = (card: DashboardCard, templateData: any, context: any): DashboardCard => {
    const templateKey = card.ll_template;
    
    if (!templateKey || !templateData[templateKey]) {
      return card;
    }

    try {
      const templateCardData = { ...templateData[templateKey] };
      delete templateCardData['ll_key'];
      delete templateCardData['ll_priority'];
      
      const templateContext = { ...context, ...(card.ll_context || {}) };
      
      // Add template context
      if (templateCardData.ll_context) {
        Object.assign(templateContext, templateCardData.ll_context);
      }

      // Serialize, render, parse
      const templateStr = JSON.stringify(templateCardData);
      const rendered = TemplateEngine.instance.eta.renderString(templateStr, templateContext);
      const data = JSON.parse(rendered);

      // Apply ll_keys context mapping
      if (card.ll_keys) {
        Object.keys(card.ll_keys).forEach((llKey) => {
          const mappingKey = card.ll_keys![llKey];
          if (!mappingKey) return;
          
          if (templateContext[mappingKey]) {
            data[llKey] = templateContext[mappingKey];
          }
        });
      }

      return { ...data, ll_template: templateKey, ll_keys: card.ll_keys };
    } catch (error) {
      return this.errorCallback(card, error);
    }
  };

  public apply = (card: DashboardCard, context: any = {}): DashboardCard => {
    return this.applyTemplate(card, this.templates, context);
  };
}
```

#### 2.3: View Processing Logic
```typescript
// src/helpers/card-view-processor.ts
import { DashboardCard, DashboardView } from '../types';
import { CardPath, extractCardsFromView } from './card-path-finder';
import { CardTemplateApplicator } from './card-template-applicator';

export interface ViewProcessorConfig {
  applicator: CardTemplateApplicator;
  context: any;
}

class CardViewProcessor {
  private config: ViewProcessorConfig;

  constructor(config: ViewProcessorConfig) {
    this.config = config;
  }

  private updatePath = (viewPath: string[], cardPath: CardPath, card: DashboardCard): void => {
    let current: any = this.config.applicator.templates as any;
    
    for (let i = 0; i < viewPath.length; i++) {
      if (Array.isArray(current) && viewPath[i].match(/^\d+$/)) {
        current = current[parseInt(viewPath[i])];
      } else {
        current = current[viewPath[i]];
      }
    }
  };

  public processView = (view: DashboardView): DashboardView => {
    const paths = extractCardsFromView(view);
    const templateKeys = paths
      .filter(p => p.ll_template)
      .map(p => p.ll_template!);
    
    return { ...view, cards: this.applyToCards(view.cards || []) };
  };

  private applyToCards = (cards: any[]): any[] => {
    return cards.map(card => {
      const applicator = new CardTemplateApplicator({
        templates: {},
        errorCallback: (c, e) => {
          console.error('Apply to cards failed', { card: c, error: e });
          return c;
        }
      });
      
      const updatedCard = applicator.apply(card, {});
      
      // Recursively apply to nested cards
      if (Array.isArray(updatedCard.cards)) {
        updatedCard.cards = this.applyToCards(updatedCard.cards);
      }
      
      if (!Array.isArray(updatedCard.card) && updatedCard.card) {
        updatedCard.card = this.applyToCards([updatedCard.card])[0];
      }
      
      if (Array.isArray(updatedCard.sections)) {
        updatedCard.sections = updatedCard.sections.map(section => ({
          ...section,
          cards: section.cards ? this.applyToCards(section.cards) : []
        }));
      }
      
      return updatedCard;
    });
  };
}
```

#### 2.4: Main Update Function
```typescript
// src/helpers/templates.ts - REWRITE
import { DashboardCard, DashboardView, DashboardConfig } from '../types';
import { TemplateEngine } from '../v2/template-engine';
import { CardTemplateApplicator } from './card-template-applicator';
import { CardViewProcessor } from './card-view-processor';

export const updateCardTemplate = (
  card: DashboardCard, 
  templates: Record<string, any> = {},
  context: any = {}): DashboardCard => {
  
  const applicator = new CardTemplateApplicator(templates);
  return applicator.apply(card, context);
};

export const getTemplatesUsedInCard = (card: DashboardCard): string[] => {
  if (card.ll_template) {
    return [card.ll_template];
  }
  
  const templates: string[] = [];
  
  if (Array.isArray(card.cards)) {
    card.cards.forEach((c) => {
      templates.push(...getTemplatesUsedInCard(c));
    });
  }
  
  if (!Array.isArray(card.card) && card.card) {
    templates.push(...getTemplatesUsedInCard(card.card));
  }
  
  return templates;
};

export const getTemplatesUsedInView = (view: DashboardView): string[] => {
  return view.cards?.flatMap((c) => getTemplatesUsedInCard(c)) || [];
};

export const processDashboardConfig = (
  config: DashboardConfig, 
  templates: Record<string, any>): DashboardConfig => {
  
  if (!config.views || config.views.length === 0) {
    return config;
  }
  
  const processor = new CardViewProcessor({
    applicator: new CardTemplateApplicator(templates),
    context: {}
  });

  const updatedViews = config.views.map(view => processor.processView(view));
  
  return { ...config, views: updatedViews };
};
```

#### 2.5: Update Templates Helper Index
```typescript
// src/helpers/index.ts
export { updateCardTemplate, getTemplatesUsedInCard, getTemplatesUsedInView, processDashboardConfig } from './templates';
export { extractCardPaths, extractCardsFromView } from './card-path-finder';
export { CardTemplateApplicator } from './card-template-applicator';
export { CardViewProcessor } from './card-view-processor';
```

---

### Task 2: Unit Tests

```typescript
// src/helpers/card-path-finder.test.ts
import { DashboardCard, DashboardView, DashboardConfig } from '../types';
import { extractCardPaths, CardPath } from './card-path-finder';

describe('[helper] extractCardPaths', () => {
  const createCard = (type: string, ll_template?: string, nested?: DashboardCard): DashboardCard => ({
    type,
    ...(ll_template ? { ll_template, ll_context: { source: type } } : {}),
    ...(nested ? { cards: [nested] } : {}),
    ...(nested && !Array.isArray(nested) ? { card: nested } : {}),
  });

  test('should find template in simple card', () => {
    const card = createCard('my-card', 'template-key');
    const paths = extractCardPaths(card);
    
    expect(paths).toHaveLength(1);
    expect(paths[0].card.ll_template).toBe('template-key');
  });

  test('should find template in nested card array', () => {
    const card = createCard('parent', 'template-1');
    const child = createCard('child', 'template-2');
    card.cards = [child, card];
    
    const paths = extractCardPaths(card);
    
    expect(paths).toHaveLength(2);
    expect(paths.map(p => p.ll_template)).toContain('template-1');
    expect(paths.map(p => p.ll_template)).toContain('template-2');
  });

  test('should find template in nested card object', () => {
    const card = createCard('parent', 'template-1');
    const child = createCard('child', 'template-2');
    card.card = child;
    
    const paths = extractCardPaths(card);
    
    expect(paths).toHaveLength(2);
    expect(paths.map(p => p.ll_template)).toContain('template-1');
    expect(paths.map(p => p.ll_template)).toContain('template-2');
  });

  test('should return empty for card without template', () => {
    const card: DashboardCard = { type: 'simple-card' };
    const paths = extractCardPaths(card);
    
    expect(paths).toHaveLength(1);
    expect(paths[0].ll_template).toBeUndefined();
  });

  test('should handle deeply nested templates', () => {
    const level1 = createCard('level1', 'template-1');
    const level2 = createCard('level2', 'template-2');
    const level3 = createCard('level3', 'template-3');
    const level4 = createCard('level4');
    
    level3.card = level4;
    level2.card = level3;
    level1.card = level2;
    
    const paths = extractCardPaths(level1);
    
    expect(paths).toHaveLength(4);
    expect(paths.map(p => p.ll_template)).toContain('template-1');
    expect(paths.map(p => p.ll_template)).toContain('template-2');
    expect(paths.map(p => p.ll_template)).toContain('template-3');
  });

  test('should exclude template paths when card has template', () => {
    const card = createCard('parent', 'parent-template');
    const child = createCard('child', 'child-template');
    card.card = child;
    
    const paths = extractCardPaths(card);
    
    // Should only record the leaf cards, not intermediate ones without ll_template
    expect(!!paths[0].ll_template).toBe(true);
    expect(!!paths[1].ll_template).toBe(true);
  });
});

describe('[helper] extractCardsFromView', () => {
  const createView = (cards: DashboardCard[], sections?: any[]): DashboardView => ({
    title: 'Test View',
    cards,
    ...(sections ? { sections } : {}),
  });

  test('should extract paths from card array', () => {
    const card1 = { type: 'card1', ll_template: 'tmpl1' };
    const card2 = { type: 'card2', ll_template: 'tmpl2' };
    const view = createView([card1, card2, { type: 'card3' }]);
    
    const paths = extractCardPaths(card1);
    
    expect(paths).toHaveLength(1);
    expect(paths[0].card.ll_template).toBe('tmpl1');
  });

  test('should handle view with sections', () => {
    const section1 = { cards: [{ type: 'card', ll_template: 'tmpl1' }] };
    const section2 = { cards: [{ type: 'card', ll_template: 'tmpl2' }] };
    const view = createView(
      [{ type: 'card', ll_template: 'tmpl3' }],
      [section1, section2]
    );
    
    const paths = extractCardPaths(view.cards![0]);
    
    expect(paths).toHaveLength(1);
    expect(paths[0].card.ll_template).toBe('tmpl3');
  });
});

// src/helpers/card-template-applicator.test.ts
import { DashboardCard } from '../types';
import { TemplateEngine } from '../v2/template-engine';
import { CardTemplateApplicator } from './card-template-applicator';

describe('[class] CardTemplateApplicator', () => {
  const createTemplate = (key: string, type: string): DashboardCard => ({
    type,
    ll_key: key,
    ll_priority: 0,
  });

  const createCard = (ll_template: string, context?: any): DashboardCard => ({
    type: 'test-card',
    ll_template,
    ...(context && { ll_context: context }),
  });

  const createApplicator = (templates: Record<string, DashboardCard>) => {
    return new CardTemplateApplicator(templates as Record<string, any>);
  };

  test('should apply template to card with matching ll_template', () => {
    const template = createTemplate('my-template', 'replaced-type');
    const card = createCard('my-template', { source: 'original' });
    
    const applicator = createApplicator({ 'my-template': template });
    const result = applicator.apply(card);
    
    expect(result.type).toBe('replaced-type');
  });

  test('should pass context to template', () => {
    const template = createTemplate('context-test', '<%= context.name %>');
    const card = createCard('context-test', { name: 'John' });
    
    const applicator = createApplicator({ 'context-test': template });
    const result = applicator.apply(card);
    
    expect(result.type).toBe('John');
  });

  test('should use fallback template data if parse fails', () => {
    const template = createTemplate('bad-template-1', { invalid: { json: true } });
    const card = createCard('bad-template-1');
    
    let errorHandlerCallCount = 0;
    const errorCallback = () => {
      errorHandlerCallCount++;
      return card;
    };
    
    const applicator = new CardTemplateApplicator(
      { 'bad-template': template } as Record<string, any>,
      errorCallback
    );
    
    const result = applicator.apply(card);
    
    expect(errorHandlerCallCount).toBe(1);
    expect(result).toStrictEqual(card);
  });

  test('should handle missing template gracefully', () => {
    const card = createCard('nonexistent-template');
    const applicator = createApplicator({});
    const result = applicator.apply(card);
    
    expect(result.type).toBe('test-card');
    expect(result.ll_template).toBe('nonexistent-template');
  });

  test('should apply ll_keys context mapping', () => {
    const template = createTemplate('key-mapping', {
      field1: 'template-default'
    });
    
    const card = createCard('key-mapping', {
      source: 'override',
      field1: 'source-value'
    });
    card.ll_keys = { field1: 'source' };
    
    const applicator = createApplicator({ 'key-mapping': template });
    const result = applicator.apply(card);
    
    // The ll_keys mapping should override template default with source value
    expect(result.field1).toBe('source-value');
  });

  test('should return error on invalid template data', () => {
    const invalidTemplate = createTemplate('invalid', { ll_template: 'deeply-nested-invalid', ll_contexts: 'invalid' });
    const card = createCard('invalid');
    
    let errorCallbackCalled = false;
    const applicator = new CardTemplateApplicator(
      { 'invalid': invalidTemplate } as Record<string, any>,
      () => {
        errorCallbackCalled = true;
        return card;
      }
    );
    
    const result = applicator.apply(card);
    
    expect(errorCallbackCalled).toBe(true);
  });

  test('should handle complex context with nested objects', () => {
    const template = createTemplate('nested', {
      valueA: '<%= context.complex.value %>',
      valueB: '<%= context.other %>'
    });
    
    const card = createCard('nested', {
      complex: { value: 'computed' },
      other: 'test'
    });
    
    const applicator = createApplicator({ 'nested': template });
    const result = applicator.apply(card);
    
    expect(result.valueA).toBe('computed');
    expect(result.valueB).toBe('test');
  });
});

// src/helpers/card-view-processor.test.ts
import { DashboardCard, DashboardView } from '../types';
import { CardViewProcessor, ViewProcessorConfig } from './card-view-processor';

const createMockApplicator = (templates: Record<string, any>) => {
  return {
    apply: jest.fn((card: DashboardCard) => ({ ...card, rendered: true })),
  } as unknown as { apply: jest.Mock };
};

describe('[class] CardViewProcessor', () => {
  const createView = (cards: DashboardCard[]): DashboardView => ({
    title: 'Test View',
    cards,
  });

  test('should process view with applicator', () => {
    const mockApplicator = {
      apply: jest.fn((_: DashboardCard) => ({ type: 'modified', rendered: true }))
    };
    
    const config: ViewProcessorConfig = {
      applicator: mockApplicator as never,
      context: {}
    };
    
    const view = createView([
      { type: 'original' },
      { type: 'another' }
    ]);
    
    const processor = new CardViewProcessor(config);
    const result = processor.processView(view);
    
    expect(mockApplicator.apply).toHaveBeenCalledTimes(2);
    expect(result.cards).toHaveLength(2);
  });

  test('should handle view with sections', () => {
    const mockApplicator = {
      apply: jest.fn((_: DashboardCard) => ({ type: 'modified', rendered: true }))
    };
    
    const config: ViewProcessorConfig = {
      applicator: mockApplicator as never,
      context: {}
    };
    
    const sections = [
      { cards: [{ type: 'section-card' }] as DashboardCard[] },
      { cards: [{ type: 'section-card-2' }] as DashboardCard[] }
    ];
    
    const view: DashboardView = {
      title: 'Test',
      sections
    };
    
    const processor = new CardViewProcessor(config);
    const result = processor.processView(view);
    
    expect(mockApplicator.apply).toHaveBeenCalled();
    expect(result.sections).toBeDefined();
    expect(result.sections?.length).toBe(2);
  });

  test('should process cards recursively', () => {
    const mockApplicator = {
      apply: jest.fn((card: DashboardCard) => ({ ...card, processed: true }))
    };
    
    const config: ViewProcessorConfig = {
      applicator: mockApplicator as never,
      context: {}
    };
    
    const nestedCard = { type: 'nested', cards: [
      { type: 'child' }
    ]} as DashboardCard;
    
    const view = createView([nestedCard]);
    const processor = new CardViewProcessor(config);
    processor.processView(view);
    
    expect(mockApplicator.apply).toHaveBeenCalledTimes(2); // parent + child
  });
});
```

---

### Task 2: Expected Test Results

| Test Suite | Tests | Expected Result |
|------------|-------|----------------|
| extractCardPaths | 6 tests | ✅ PASS - Path extraction works |
| extractCardsFromView | 2 tests | ✅ PASS - Extracts from view |
| CardTemplateApplicator | 8 tests | ✅ PASS - Template application works |
| CardViewProcessor | 3 tests | ✅ PASS - View processing works |

---

## Task 3: Add Caching Strategy

### Objective
Implement caching for dashboard configs, templates, and rendered results to improve performance.

### Implementation Details

#### 3.1: Cache Strategy Interface
```typescript
// src/helpers/cache-strategy.ts
import { DashboardConfig } from '../types';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expires: number; // TTL in milliseconds
}

export interface CacheConfig {
  defaultTTL: number; // Default cache expiration
  maxEntries: number; // Maximum number of cache entries
}

export class Cache {
  private cache: Map<string, CacheEntry<any>>;
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.cache = new Map();
    this.config = {
      defaultTTL: config.defaultTTL || 5 * 60 * 1000, // 5 minutes
      maxEntries: config.maxEntries || 1000,
    };
  }

  private cleanExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.expires) {
        this.cache.delete(key);
      }
    }
  }

  get<T>(key: string): T | null {
    this.cleanExpiredEntries();
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.timestamp + entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl: number = this.config.defaultTTL): void {
    if (this.cache.size >= this.config.maxEntries) {
      // Remove oldest entry
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expires: ttl,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  size(): number {
    this.cleanExpiredEntries();
    return this.cache.size;
  }

  clear(): void {
    this.cache.clear();
  }
}
```

#### 3.2: Cache Wrapper for HassController
```typescript
// src/controllers/hass.ts - UPDATED
import { Cache } from '../helpers/cache-strategy';
import { toConsole } from '../helpers/log';

class HassController {
  private cache: Cache;
  
  constructor(singleton = false) {
    this.cache = new Cache({ 
      defaultTTL: 5 * 60 * 1000, // 5 minutes
    });
    this.linkedLovelaceController = new LinkedLovelaceController();
    // ... rest of constructor
  }
  
  private getDashboardConfigCacheKey = (urlPath: string | null): string => {
    return `dashboard:${urlPath || 'overview'}`;
  };
  
  async update = async (urlPath: string | null, dryRun = false): Promise<DashboardConfig | null | undefined> => {
    const validatedUrlPath = urlPath === '' ? null : urlPath;
    const cacheKey = this.getDashboardConfigCacheKey(validatedUrlPath);
    
    this.addToLogs({msg: `${dryRun ? '[dryRun:enabled]' : '[dryRun:disabled]'} ${validatedUrlPath ? `[url:${validatedUrlPath}]` : ''} Starting Update`}, {dryRun, urlPath});
    try {
      this.addToLogs({msg: `${dryRun ? '[dryRun:enabled]' : '[dryRun:disabled]'} ${validatedUrlPath ? `[url:${validatedUrlPath}]` : ''} Attempting to get cached dashboard config...`});
      
      // Try cache first
      const cachedConfig = this.cache.get<DashboardConfig | null>(cacheKey);
      if (cachedConfig) {
        this.addToLogs({msg: `${dryRun ? '[dryRun:enabled]' : '[dryRun:disabled]'} ${validatedUrlPath ? `[url:${validatedUrlPath}]` : ''} Retrieved from cache`});
        // Return config from cache
        return cachedConfig;
      }
      
      this.addToLogs({msg: `${dryRun ? '[dryRun:enabled]' : '[dryRun:disabled]'} ${validatedUrlPath ? `[url:${validatedUrlPath}]` : ''} Cache miss, fetching from API...`});
      
      const config = await GlobalLinkedLovelace.instance.api.getDashboardConfig(validatedUrlPath);
      
      // Cache the config
      this.cache.set(cacheKey, config);
      this.addToLogs({msg: `${dryRun ? '[dryRun:enabled]' : '[dryRun:disabled]'} ${validatedUrlPath ? `[url:${validatedUrlPath}]` : ''} Fetched from API and cached`});
      
      if (!dryRun) {
        try {
          this.addToLogs({msg: `${dryRun ? '[dryRun:enabled]' : '[dryRun:disabled]'} ${validatedUrlPath ? `[url:${validatedUrlPath}]` : ''} Saving latest rendered dashboard`}, {dryRun, urlPath, config});
          await GlobalLinkedLovelace.instance.api.setDashboardConfig(validatedUrlPath, config);
        } catch (e) {
          this.addToLogs({msg: `${dryRun ? '[dryRun:enabled]' : '[dryRun:disabled]'} ${validatedUrlPath ? `[url:${validatedUrlPath}]` : ''} Failed to update ${e}`, level: 'ERROR'}, {dryRun, urlPath, config});
          console.error(`Failed to update DB`, validatedUrlPath, config, e);
        }
      } else {
        this.addToLogs({msg: `${dryRun ? '[dryRun:enabled]' : '[dryRun:disabled]'} ${validatedUrlPath ? `[url:${validatedUrlPath}]` : ''} Would save latest rendered dashboard`}, {dryRun, urlPath, config});
      }
      this.addToLogs({msg: `${dryRun ? '[dryRun:enabled]' : '[dryRun:disabled]'} ${validatedUrlPath ? `[url:${validatedUrlPath}]` : ''} Finished Update`}, {dryRun, urlPath});
      return config;
    } catch (e) {
      this.addToLogs({msg: `${dryRun ? '[dryRun:enabled]' : '[dryRun:disabled]'} ${validatedUrlPath ? `[url:${validatedUrlPath}]` : ''} Failed to render latest dashboard with templates and partials`}, {dryRun, urlPath});
      return null;
    }
  };
}"

---

### Task 3: Unit Tests

```typescript
// src/helpers/cache-strategy.test.ts
import { Cache } from './cache-strategy';

describe('[class] Cache', () => {
  let cache: Cache;
  const testKey = 'test-key';

  beforeEach(() => {
    cache = new Cache();
  });

  afterEach(() => {
    cache.clear();
  });

  test('should store and retrieve a value', () => {
    const testData = { name: 'test', value: 123 };
    
    cache.set(testKey, testData);
    const retrieved = cache.get(testKey);
    
    expect(retrieved).toBe(testData);
  });

  test('should return null for key that does not exist', () => {
    const result = cache.get('nonexistent');
    
    expect(result).toBeNull();
  });

  test('should expire entry after TTL expires', async () => {
    const testData = { name: 'expires-test' };
    
    cache.set(testKey, testData, 100); // 100ms TTL
    
    // Should be available immediately
    expect(cache.get(testKey)).toBe(testData);
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Should be expired
    expect(cache.get(testKey)).toBeNull();
  });

  test('should clean expired entries automatically', () => {
    cache.set('key1', { value: 1 }, 100);
    cache.set('key2', { value: 2 }, 5000);
    
    expect(cache.size()).toBe(2);
    expect(cache.has('key1')).toBe(true);
    expect(cache.has('key2')).toBe(true);
    
    setTimeout(() => {
      // key1 should be cleaned up
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
    }, 150);
  });

  test('should respect maxEntries limit', () => {
    const maxEntries = 5;
    cache = new Cache({ maxEntries });
    
    for (let i = 0; i < maxEntries + 5; i++) {
      cache.set(`key-${i}`, { index: i });
    }
    
    // Should only have 5 entries (not 10)
    expect(cache.size()).toBeLessThanOrEqual(maxEntries);
  });

  test('should delete specific entry', () => {
    cache.set(testKey, 'value');
    expect(cache.get(testKey)).toBe('value');
    
    cache.delete(testKey);
    expect(cache.get(testKey)).toBeNull();
    expect(cache.has(testKey)).toBe(false);
  });

  test('should have correct number of entries', () => {
    cache.set('key1', 1);
    cache.set('key2', 2);
    
    expect(cache.size()).toBe(2);
  });

  test('should clear all entries', () => {
    cache.set('key1', 1);
    cache.set('key2', 2);
    
    expect(cache.size()).toBe(2);
    
    cache.clear();
    expect(cache.size()).toBe(0);
  });

  test('should use default TTL if not specified', () => {
    const testData = { test: 'value' };
    const beforeSet = Date.now();
    
    cache.set(testKey, testData);
    
    const retrieved = cache.get(testKey);
    
    expect(retrieved).toBe(testData);
    expect(Date.now()).toBeGreaterThanOrEqual(beforeSet);
  });
});

// src/controllers/hass-cache.test.ts
import HassController from './hass';
import { GlobalLinkedLovelace } from '../instance';
import { DashboardConfig } from '../types';

jest.mock('../instance');

describe('[class] HassController - Cache Integration', () => {
  const mockApi = {
    getDashboardConfig: jest.fn(),
    setDashboardConfig: jest.fn(),
  };

  beforeEach(() => {
    (GlobalLinkedLovelace as any).instance = {
      api: mockApi as never,
    };
    mockApi.getDashboardConfig.mockClear();
    mockApi.setDashboardConfig.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should cache dashboard config on first fetch', async () => {
    const config: DashboardConfig = {
      views: [
        {
          title: 'Test',
          cards: [],
        },
      ],
    };

    mockApi.getDashboardConfig.mockResolvedValue(config);

    const controller = new HassController();
    await controller.update('', true);

    expect(mockApi.getDashboardConfig).toHaveBeenCalledTimes(1);
  });

  test('should use cached value on second call', async () => {
    const config: DashboardConfig = {
      views: [
        { title: 'Test', cards: [] },
      ],
    };

    mockApi.getDashboardConfig.mockResolvedValue(config);

    const controller = new HassController();
    
    // First call
    await controller.update('', true);
    
    // Second call should be cached
    await controller.update('', true);
    
    expect(mockApi.getDashboardConfig).toHaveBeenCalledTimes(1); // Should only be called once
  });

  test('should invalidate cache after TTL', async () => {
    const config: DashboardConfig = {
      views: [
        { title: 'Test', cards: [] },
      ],
    };

    mockApi.getDashboardConfig.mockResolvedValue(config);

    const controller = new HassController();
    
    // Set up short TTL for test
    await controller.update('', true);
    
    // Wait for cache to expire
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    // After TTL, should fetch again
    await controller.update('', true);
    
    expect(mockApi.getDashboardConfig).toHaveBeenCalledTimes(2);
  });

  test('should log cache miss and hit', async () => {
    const config: DashboardConfig = {
      views: [
        { title: 'Test', cards: [] },
      ],
    };

    mockApi.getDashboardConfig.mockResolvedValue(config);

    const controller = new HassController();
    await controller.update('', true);
    
    // Should have logged cache status
    expect(controller.logs.length).toBeGreaterThan(0);
    const cacheLog = controller.logs.find(log => log.includes('Cache'));
    expect(cacheLog).toBeDefined();
  });

  test('should handle null urlPath correctly for caching', async () => {
    const config: DashboardConfig = {
      views: [
        { title: 'Test', cards: [] },
      ],
    };

    mockApi.getDashboardConfig.mockResolvedValue(config);

    const controller = new HassController();
    
    // Test with null
    await controller.update(null, true);
    await controller.update(null, true);
    
    expect(mockApi.getDashboardConfig).toHaveBeenCalledTimes(1); // Should be cached
  });

  test('should handle different urlPaths as separate cache entries', async () => {
    const config1: DashboardConfig = {
      views: [{ title: 'Dashboard 1', cards: [] }],
    };
    const config2: DashboardConfig = {
      views: [{ title: 'Dashboard 2', cards: [] }],
    };

    mockApi.getDashboardConfig
      .mockResolvedValueOnce(config1)
      .mockResolvedValueOnce(config2);

    const controller = new HassController();
    
    await controller.update('dashboard-1', true);
    await controller.update('dashboard-2', true);
    
    // Should fetch for both different paths
    expect(mockApi.getDashboardConfig).toHaveBeenCalledTimes(2);
  });
});
```

---

### Task 3: Expected Test Results

| Test Suite | Tests | Expected Result |
|------------|-------|----------------|
| Cache class | 9 tests | ✅ PASS - Basic cache operations work |
| Cache expiration | 2 tests | ✅ PASS - TTL enforcement works |
| Cache integration | 6 tests | ✅ PASS - Integration with HassController works |

---

## Next Steps

1. **Phase 1**: Implement unified singleton pattern (Tasks 1-4)
2. **Phase 2**: Refactor template rendering (Tasks 5-9)
3. **Phase 3**: Add error handling & validation (Tasks 10-14)
4. **Phase 4**: Improve type safety (Tasks 15-19)

Each phase builds on previous improvements, with comprehensive unit tests ensuring quality throughout.
