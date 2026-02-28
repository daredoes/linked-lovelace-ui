---
outline: deep
---

# API Evolution & Architecture Patterns

This document details the technical evolution of the API and architecture from the initial commit through the v2 modernization, using interactive Mermaid diagrams to visualize key patterns and transformations.

---

## Architecture Evolution Timeline

```mermaid
graph TD
    A[Nov 2022] --> B[Phase 1: Initial]
    B --> C[Jan 2023] --> D[Apr 2023]
    D --> E[Jun 2023] --> F[Aug 2023]
    F --> G[Mar 2024] --> H[Present]
    
    A --> V1[Vanilla JS]
    B --> V2[Controller Pattern]
    C --> V3[Templates & Views]
    D --> V4[LL_Keys Support]
    E --> V5[Lit Migration]
    F --> V6[ETAJS Engine]
    G --> V7[Documentation]
    H --> V8[Testing Infra]
    
    style A fill:#ff9
    style H fill:#9f9

    style V1 fill:#ff9
    style V5 fill:#9f9
```

---

## API Evolution: Before v1 → After v1

### Initial Commit Architecture (Pre-Template)

```mermaid
classDiagram
    class Initial_Commit {
        +renderCard()
        +updateCard()
        +handleEvent()
    }
```

- **Simple DOM Manipulation**
- **Basic Configuration Parsing**
- **Direct Data Binding**

### Controller Refactor (Jan 2023)

```mermaid
classDiagram
    class Controller {
        +init()
        +render()
        +update()
        +dispose()
    }
    
    class TemplateEngine {
        +renderTemplate()
        +processVariables()
        +cacheTemplates()
    }
    
    class StateManager {
        +config: Config
        +templates: {}()
        +partials: {}()
        +update(context)
    }
    
    Controller --> StateManager : manages
    Controller --> TemplateEngine : uses
```

### Key API Changes

```mermaid
flowchart TD
    A[v1 API] --> A1[Config Object]
    A --> A2[Render Callback]
    A --> A3[Event Handler]
    
    B[v2 API] --> B1[Config Interface]
    B --> B2[Template Function]
    B --> B3[Partials Registry]
    B --> B4[Context Manager]
    
    A1 -->|Evolved into| B1
    A2 -->|Evolved into| B2
    A3 -->|Expanded| B3
    A3 -->|Expanded| B4
    
    style A fill:#ff9
    style B fill:#9f9
```

---

## State Evolution Diagram

### v1 State Flow

```mermaid
stateDiagram
    [*] --> Initialize
    Initialize --> LoadDashboard
    LoadDashboard --> FetchTemplates
    FetchTemplates --> RenderCards
    RenderCards --> WaitForWebSocketEvent
    WaitForWebSocketEvent --> RenderCards
    
    style Initialize fill:#ff9
    style RenderCards fill:#ff9
```

### v2 State Flow

```mermaid
stateDiagram
    [*] --> Initializing
    
    Initializing --> LoadingConfig
    LoadingConfig --> LoadingTemplates
    
    LoadingTemplates --> LoadingPartials
    
    LoadingPartials --> Ready
    
    Ready --> ProcessingEvents
    
    Processing --> TemplateParsing
    TemplateParsing --> ContextResolution
    ContextResolution --> PartialInclusion
    PartialInclusion --> Execution
    
    ExecuteTemplate --> RenderOutput
    
    style Initializing fill:#ff9
    style Ready fill:#9f9
```

---

## Template Engine Evolution

### v1 Custom Syntax System

```mermaid
flowchart TD
    A[Template String] --> B[Pattern Matching]
    B --> C[Extract Variables $]
    C --> D[Replace Values]
    D --> E[Render Output]
    
    C --> F[Find $variables.x]
    F --> G[Look up in Context]
    G --> H[Substitute Value]
    
    style F fill:#ff9
    style H fill:#ff9
```

**Example v1 Template:**
```yaml
template: "Your temperature: $variables.temperature$°F"
```

### v2 ETAJS System

```mermaid
flowchart TD
    A[ETAJS Template] --> B[Parse Template]
    B --> C[Resolve Context]
    C --> D[Execute Script]
    D --> E[Render Result]
    
    C --> F[Include Partial]
    F --> G[Load Partial Content]
    G --> H[Context Merge]
    H --> D
    
    style A fill:#9f9
    style E fill:#9f9
    style F fill:#ff9
```

**Example v2 Template:**
```yaml
template: |
  <% let temp = context.temperature %>%
  <%= temp %>°F
```

---

## Partials System Architecture

### Partials Lifecycle

```mermaid
stateDiagram
    [*] --> PartialsInitialized
    
    PartialsInitialized --> RegisteringPartials
    
    RegisteringPartials --> PartialsRegistered
    
    PartialsRegistered --> WaitingForIncludes
    
    WaitingForIncludes --> IncludeDetected
    
    IncludeDetected --> LoadPartial
    
    LoadPartial --> RenderPartial
    
    RenderPartial --> MergeContext
    
    MergeContext --> ExecuteInContext
    
    ExecuteInContext --> ReturnResult
    
    ReturnResult --> WaitingForIncludes
    
    style PartialsInitialized fill:#ff9
    style ReturnResult fill:#ff9
```

### Partials Registry Structure

```mermaid
classDiagram
    class PartialsRegistry {
        +partials: Map
        +register(key, template)
        +getPartial(key)
        +clear()
    }
    
    class PartialTemplate {
        +key: string
        +template: string
        +context: Object
    }
    
    PartialsRegistry o-- PartialTemplate
```

---

## Context Inheritance Pattern

### Context Flow Diagram

```mermaid
flowchart TB
    A[Root Context] --> B[Dashboard Level]
    B --> C[View Level]
    C --> D[Card Level]
    D --> E[Template Execution]
    
    E --> F{Has Partial?}
    
    F -->|Yes| G[Resolve Partial]
    F -->|No| H[Execute Template]
    
    G --> I[Context Merge]
    I --> H
    
    H --> J[Render Output]
    J --> K[Display in UI]
    
    style A fill:#9f9
    style K fill:#9f9
    style F fill:#ff9
```

### Context Inheritance Hierarchy

```mermaid
graph TB
    A[ll_context Root] --> B[Dashboard Context] --> C[View Context] --> D[Card Context]
    
    B --> E[View Variables]
    B --> F[Dashboard Variables]
    
    C --> G[View Variables]
    
    D --> H[Card Variables]
    
    E --> I{Context Available?}
    F --> I
    G --> I
    H --> I
    
    A fill:#9f9
    I fill:#ff9
```

---

## Template Resolution Strategy

### Resolution Algorithm

```mermaid
flowchart TD
    A[Template Request] --> B{Is Template Valid?}
    
    B -->|No| C[Return Error]
    B -->|Yes| D{Has ll_template?}
    
    D -->|Yes| E[Load Named Template]
    D -->|No| F[Process Inline Template]
    
    E --> G{Template Cachable?}
    F --> G
    
    G -->|Yes| H[Load From Cache]
    G -->|No| I[Parse Template]
    
    I --> J{Has Include?}
    
    H --> J
    
    J -->|Yes| K[Resolve Partials]
    J -->|No| L[Execute Template]
    
    K --> L
    L --> M[Render Output]
    
    C fill:#ff9
    M fill:#9f9
```

### Template Cache Strategy

```mermaid
classDiagram
    class TemplateCache {
        +cache: Map
        +maxSize: number
        +add(key, template)
        +get(key)
        +invalidate(key)
    }
    
    class TemplateEngine {
        +engine: Eta
        +partials: Map
        +register()
    }
    
    TemplateEngine --> TemplateCache : uses for caching
```

---

## Event Flow Diagram

### Full Event Lifecycle

```mermaid
stateDiagram
    [*] --> Initialized
    
    Initialized --> WaitingForConfig
    WaitingForConfig --> ConfigReceived
    
    ConfigReceived --> InitializingEngine
    
    InitializingEngine --> LoadingTemplates
    LoadingTemplates --> LoadingPartials
    
    LoadingPartials --> DashboardReady
    
    DashboardReady --> WatchingContext
    
    WatchingContext --> ContextChange
    
    ContextChange --> ProcessTemplates
    
    ProcessTemplates --> UpdateUI
    
    UpdateUI --> WatchingContext
    
    DashboardReady --> CardAdded
    CardAdded --> ProcessTemplates
    
    style Initialized fill:#ff9
    style DashboardReady fill:#9f9
```

---

## v2 Modernization Changes

### Why Rewrite?

```mermaid
flowchart TD
    A[Current State v1] --> B[❌ Vanilla JS]
    A --> C[❌ Custom $ Syntax]
    A --> D[❌ No Type Safety]
    A --> E[❌ Hard to Extend]
    
    F[New Tech Stack]
    F --> G[✅ TypeScript]
    F --> H[✅ Lit Components]
    F --> I[✅ ETAJS Syntax]
    F --> J[✅ Rollup Build]
    
    style A fill:#ff9
    style F fill:#9f9
    style G fill:#ff9
    style H fill:#ff9
    style I fill:#ff9
    style J fill:#ff9
```

### Migration Strategy

```mermaid
gantt
    title v2 Migration Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1
    Architecture Design          :done, des1, 2023-05-01, 7d
    
    section Phase 2
    TypeScript Setup            :active, des2, 2023-05-08, 7d
    Lit Components              :2023-05-15, 14d
    
    section Phase 3
    ETAJS Integration           :2023-06-01, 14d
    Template Refactor           :2023-06-15, 21d
    
    section Phase 4
    Testing Setup               :2023-07-01, 14d
    Documentation               :2023-07-15, 14d
```

---

## Testing Architecture

### Test Strategy Overview

```mermaid
flowchart TD
    A[Testing Strategy] --> B[Unit Tests]
    A --> C[Integration Tests]
    A --> D[E2E Tests]
    
    B --> B1[Jest Framework]
    B --> B2[< 30s runtime]
    B --> B3[90% coverage]
    
    C --> C1[HA Docker Container]
    C --> C2[API Integration]
    C --> C3[Real Template Testing]
    
    D --> D1[Playwright Browser]
    D --> D2[Cross Browser]
    D --> D3[UI Validation]
    
    style A fill:#9f9
    style B fill:#ff9
    style C fill:#ff9
    style D fill:#ff9
```

### CI/CD Pipeline

```mermaid
flowchart TD
    A[Push to master] --> B[Run Unit Tests]
    B --> C{Tests Pass?}
    C -->|Yes| D[Build Project]
    C -->|No| E[Report Failure]
    D --> F{Build Success?}
    F -->|Yes| G[Deploy to HACS]
    F -->|No| H[Report Build Failure]
    G --> I[Update Version]
    
    style A fill:#ff9
    style I fill:#9f9
```

---

## Configuration Schema Evolution

### v1 Configuration

```mermaid
graph LR
    A[config.yaml] --> B[templates:]
    B --> C[template: "key"]
    C --> D[view: "Main"]
    D --> E[sections:]
    E --> F[subsections:]
    F --> G[card: "type"]
    
    style A fill:#ff9
```

**v1 Example:**
```yaml
views:
  - title: Main
    subsections:
      - view: true
        card: |
          $variables.temperature$°F
        type: custom:linked-lovelace
```

### v2 Configuration

```mermaid
graph LR
    A[config.yaml] --> B[ll_templates:]
    B --> C[dashboard:]
    C --> D[title:]
    C --> E[views:]
    E --> F[tabs:]
    F --> G[card:]
    G --> H[ll_template:]
    G --> I[ll_context:]
    
    style A fill:#9f9
    style G fill:#9f9
```

**v2 Example:**
```yaml
ll_templates:
  temperature-card: |
    temperature <%= context.temperature %>°F

dashboard: my-dashboard
ll_context:
  temperature: 72
  mode: passive
```

---

## Card Rendering Flow

### Card Lifecycle

```mermaid
stateDiagram
    [*] --> ParsingConfiguration
    
    ParsingConfiguration --> ConfigParsed
    
    ConfigParsed --> InitializeTemplates
    InitializeTemplates --> TemplatesLoaded
    
    TemplatesLoaded --> InitializePartials
    InitializePartials --> PartialsLoaded
    
    PartialsLoaded --> InitializeController
    InitializeController --> ControllerReady
    
    ControllerReady --> CreateElements
    CreateElements --> AttachElements
    AttachElements --> RenderCards
    
    RenderCards --> DisplayCards
    
    DisplayCards --> WatchingUpdates
    
    WatchingUpdates --> ContextChanged
    ContextChanged --> RenderCards
    
    watchingUpdates --> TemplateChanged
    TemplateChanged --> RenderCards
    
    style ControllerReady fill:#ff9
    style DisplayCards fill:#9f9
```

---

## Summary of Evolution

### Key Transformation Points

1. **Initial Commit** → Simple editor card
2. **Jan 2023** → Controller refactoring
3. **Jan-Apr 2023** → Core feature expansion
4. **Jun-Aug 2023** → v2 modernization rewrite
5. **Mar 2024** → Documentation site launch
6. **Feb 2026** → Comprehensive testing infrastructure

### Current State Capabilities

✅ **Modern Architecture**: TypeScript + Lit + ETAJS  
✅ **Flexible Templates**: Nested, reusable, partially-based  
✅ **Context Management**: Hierarchical inheritance  
✅ **Performance**: Cached templates, optimized rendering  
✅ **Developer Experience**: Testing, docs, CI/CD  

---

**Last Updated**: 2026-02-27  
**Status**: Active Development
