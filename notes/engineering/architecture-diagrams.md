# Linked Lovelace Architecture Diagrams

## Evolution Timeline

```mermaid
timeline
    title Linked Lovelace Evolution
    2022-10-29 : Initial Commit (V1)
                : Basic card with WebSocket
    2022-10-31 : Working Version 1
                : Removed action-handler-directive
    2022-11-05 : Component Extraction
                : Created dashboard.ts, view.ts
                : Split helpers into modules
    2022-11-19 : Template Card Feature
                : Added linked-lovelace-template.ts
                : Separate template editor
    2023 (mid) : V2 Architecture Overhaul
                : Complete rewrite
                : Singleton pattern
                : Any card can be template
    2023 (late) : V2 Refinement
                : Comprehensive testing
                : API integration
                : Status tracking
```

## V1 Architecture

```mermaid
graph TB
    subgraph V1_Architecture["V1 Architecture (Monolithic)"]
        A[linked-lovelace-card.ts] --> B[linked-lovelace.ts]
        A --> C[editor.ts]
        A --> D[types.ts]
        B --> E[action-handler-directive.ts]
        B --> F[WebSocket Connection]
    end

    style V1_Architecture fill:#ffcccc
```

## V2 Architecture (Current)

```mermaid
graph TB
    subgraph V2_Architecture["V2 Architecture (Component-Based)"]
        A[linkedLovelaceSingleton.ts] --> B[template-engine.ts]
        A --> C[template controller]
        A --> D[hass controller]

        E[linked-lovelace-ui.ts] --> A
        F[linked-lovelace-partials.ts] --> B

        B --> G[Eta JS v3.0.3]
        C --> H[Template Registry]
        D --> I[Home Assistant API]

        J[Dashboard] --> E
        K[View] --> E
    end

    style V2_Architecture fill:#ccffcc
```

## Data Flow in V2

```mermaid
sequenceDiagram
    participant User
    participant Dashboard
    participant UI
    participant Singleton
    participant TemplateEngine
    participant HomeAssistant

    User->>Dashboard: Load dashboard
    Dashboard->>UI: Render linked-lovelace-ui cards
    UI->>Singleton: Register templates (ll_key)
    Singleton->>TemplateEngine: Process templates by priority
    TemplateEngine->>TemplateEngine: Render with Eta JS
    TemplateEngine->>Singleton: Store rendered templates
    Singleton->>UI: Provide rendered templates
    UI->>HomeAssistant: Fetch template context
    HomeAssistant->>UI: Return context data
    UI->>TemplateEngine: Final render with context
    TemplateEngine->>UI: Rendered HTML
    UI->>User: Display final card
```

## Template Priority System

```mermaid
graph LR
    A[Dashboard Load] --> B[Find all ll_key cards]
    B --> C[Sort by ll_priority]
    C --> D[Priority 0]
    C --> E[Priority 1]
    C --> F[Priority 2]

    D --> G[Process first]
    G --> E
    E --> H[Process second]
    H --> F
    F --> I[Process third]

    I --> J[All templates ready]
```

## Template Rendering Pipeline

```mermaid
graph TB
    A[Raw Template] --> B{Has partials?}
    B -->|Yes| C[Fetch partials]
    B -->|No| D[Parse template]
    C --> D
    D --> E[Compile with Eta JS]
    E --> F[Inject context]
    F --> G[Render final HTML]
    G --> H[Display in UI]
```

## Test Coverage Structure

```mermaid
graph TB
    subgraph Tests["Test Suite"]
        A[eta.test.ts] --> B[Eta rendering]
        C[template.test.ts] --> D[Template management]
        E[templates.test.ts] --> F[Helper functions]
        G[linkedLovelace.test.ts] --> H[Singleton logic]
        I[template-engine.test.ts] --> J[Rendering engine]
    end

    style Tests fill:#ccccff
```

## Optimal System Architecture (Proposed)

```mermaid
graph TB
    subgraph Core["Core System"]
        A[Template Registry<br/>Singleton] --> B[Rendering Engine]
        A --> C[Template Manager]
        A --> D[Context Provider]
    end

    subgraph Components["UI Components"]
        E[linked-lovelace-ui<br/>Reference Card]
        F[linked-lovelace-partials<br/>Partial Manager]
        G[Template Editor<br/>Optional]
    end

    subgraph Integration["Integration Layer"]
        H[API Controller<br/>For external use]
        I[Status Tracker<br/>Debugging]
    end

    subgraph Testing["Test Suite"]
        J[Unit Tests]
        K[Integration Tests]
        L[E2E Tests]
    end

    E --> A
    F --> B
    G --> C
    H --> A
    I --> A

    J --> A
    K --> B
    L --> C

    style Core fill:#ffeb3b
    style Components fill:#4caf50
    style Integration fill:#2196f3
    style Testing fill:#ff5722
```

## Migration Path (V1 to V2)

```mermaid
graph TB
    A[V1 Configuration] --> B{Template Dashboard?}
    B -->|Yes| C[Move cards to regular dashboard]
    B -->|No| D[Keep in place]
    C --> E[Remove template dashboard reference]
    D --> E
    E --> F{Has ll_key?}
    F -->|No| G[Add ll_key: template_name]
    F -->|Yes| H[Keep existing key]
    G --> I{Has ll_data?}
    H --> I
    I -->|Yes| J[Rename to ll_context]
    I -->|No| K[Skip]
    J --> L{Has $variable$ syntax?}
    K --> L
    L -->|Yes| M[Convert to <%= context.variable %>]
    L -->|No| N[Skip]
    M --> O[V2 Configuration Ready]
    N --> O
```

## Key Decisions Impact

```mermaid
graph LR
    A[Design Decisions] --> B[Positive Impact]
    A --> C[Negative Impact]
    A --> D[Mixed Impact]

    B --> B1[Singleton pattern]
    B --> B2[Component extraction]
    B --> B3[Test coverage]
    B --> B4[Automatic processing]

    C --> C1[Action-handler-directive]
    C --> C2[Separate template dashboards]

    D --> D1[ll_keys feature]
    D --> D2[Template editor]
```

## Regression Timeline

```mermaid
graph TB
    A[Commit 77773f72c] --> B[Removed action-handler-directive<br/>Positive: Simplified]
    A --> C[Removed editor.ts<br/>Positive: Less UI complexity]

    D[Commit 9607d004] --> E[Created dashboard.ts & view.ts<br/>Positive: Better separation]
    D --> F[Created shared-linked-lovelace.ts<br/>Positive: Reusable logic]

    G[V2 Rewrite] --> H[Broke V1 configs<br/>Negative: Breaking change]
    G --> I[ll_keys partially broken<br/>Negative: Feature regression]

    J[Recent commits] --> K[Added comprehensive tests<br/>Positive: Better reliability]
    J --> L[Added API support<br/>Positive: Extensible]
```
