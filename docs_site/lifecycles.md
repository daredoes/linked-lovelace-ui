---
outline: deep
---

# Lifecycles

This page maps **every flow inside Linked Lovelace** — from the moment the
bundle loads in your browser through to writing rendered dashboards back to Home
Assistant. Each section pairs a short description with a Mermaid diagram so you
can follow the exact sequence of classes and methods involved.

The cast of characters referenced throughout:

| Piece | File | Role |
| --- | --- | --- |
| `GlobalLinkedLovelace` | `src/instance.ts` | Singleton holding `hass` + the API client |
| `LinkedLovelaceApi` | `src/linked-lovelace-api.ts` | Thin wrapper over Home Assistant WebSocket calls |
| `HassController` | `src/controllers/hass.ts` | Orchestrates discovery, dry-run, and updates |
| `LinkedLovelaceController` | `src/v2/linkedLovelace.ts` | Renders a dashboard config with templates |
| `TemplateController` | `src/controllers/template.ts` | Registry of card templates + render entry |
| `EtaTemplateController` | `src/controllers/eta.ts` | Registry of Eta partials |
| `TemplateEngine` | `src/v2/template-engine.ts` | Eta.js engine singleton |

## 1. Bundle load & initialization

The entry module imports all four cards (each self-registers in
`window.customCards`) and calls `initialize()`, which simply waits until Home
Assistant's `home-assistant` element exists before logging the version. The
`GlobalLinkedLovelace` singleton is created lazily the first time any card needs
the API.

```mermaid
flowchart TD
    A["linked-lovelace-ui.ts loads"] --> B["import 4 card modules"]
    B --> B1["linked-lovelace-template"]
    B --> B2["linked-lovelace-status"]
    B --> B3["linked-lovelace-partials"]
    B --> B4["linked-lovelace-starter"]
    B1 & B2 & B3 & B4 --> C["each pushes to window.customCards[]"]
    B --> D["initialize(onFinish)"]
    D --> E{"customElements.get('home-assistant')<br/>defined?"}
    E -- no --> F["wait 100ms"] --> E
    E -- yes --> G["log version via onFinish"]
    C --> H["Cards appear in Lovelace card picker"]
    I["First API use"] -.-> J["GlobalLinkedLovelace.instance<br/>getHass() + new LinkedLovelaceApi(hass)"]
```

## 2. Shared Lit card lifecycle

Every card is a `LitElement` and follows the same reactive cycle. `setConfig`
validates and stores config; `firstUpdated` yields a frame then forces a repaint;
`shouldUpdate` gates re-renders via `hasConfigOrEntityChanged`.

```mermaid
flowchart TD
    A["Lovelace creates card element"] --> B["setConfig(config)"]
    B --> C{"config valid?"}
    C -- no --> C1["throw invalid_configuration"]
    C -- yes --> D["store config / state"]
    D --> E["firstUpdated()"]
    E --> F["await paint (setTimeout 0)"]
    F --> G["_repaint() — toggles a @state flag"]
    G --> H["shouldUpdate(changedProps)"]
    H --> I{"config present &&<br/>hasConfigOrEntityChanged?"}
    I -- no --> J["skip render"]
    I -- yes --> K["render() → ha-card HTML"]
    K -.->|"hass / state changes"| H
```

## 3. Template engine rendering

`TemplateEngine` wraps a single Eta instance configured with
`varName: 'context'` and `autoEscape: false`. Rendering takes a card serialized
to JSON, runs it through Eta with a context object, then parses the result back
into a card.

```mermaid
flowchart LR
    A["DashboardCard object"] --> B["JSON.stringify(card)"]
    B --> C["TemplateEngine.instance.eta<br/>.renderString(json, context)"]
    C --> D["Eta evaluates tags:<br/>&lt;%= %&gt; value · &lt;% %&gt; logic · &lt;%~ include() %&gt;"]
    D --> E["rendered JSON string"]
    E --> F{"JSON.parse ok?"}
    F -- yes --> G["rendered DashboardCard"]
    F -- no --> H["console.error + fall back to raw template"]
```

## 4. Partials: discovery & loading

Partials live on `custom:linked-lovelace-partials` cards. During discovery each
partial is resolved — a `url` partial is fetched with axios (its text becomes
`template`), an inline partial is used directly. `loadPartials` then registers
every partial that has template text into the Eta engine, **sorted by priority
(lowest first)**, so they can be pulled in with `<%~ include('key') %>`.

```mermaid
flowchart TD
    A["Card encountered during refresh"] --> B["getPartialsFromCard(card)"]
    B --> C{"type ==<br/>custom:linked-lovelace-partials?"}
    C -- no --> C0["return {}"]
    C -- yes --> D["for each partial with a key"]
    D --> E["getCardTemplate(partial)"]
    E --> F{"partial.url set?"}
    F -- yes --> G["axios.get(url) → text"]
    F -- no --> H["use partial.template inline"]
    G & H --> I["EtaTemplateController.partials[key] = resolved"]
    I --> J["loadPartials()"]
    J --> K["sort partials by priority asc"]
    K --> L["eta.loadTemplate(key, template)"]
    L --> M["available to &lt;%~ include('key') %&gt;"]
```

## 5. Discovery / refresh

`HassController.refresh()` rebuilds a fresh `LinkedLovelaceController`, lists all
dashboards (prepending `overview`), fetches every config in parallel, then walks
each view's cards collecting templates (`ll_key`) and partials. Finally it loads
partials and registers templates into the engine.

```mermaid
sequenceDiagram
    participant SC as Status Card
    participant HC as HassController
    participant API as LinkedLovelaceApi
    participant LLC as LinkedLovelaceController
    participant ETA as EtaTemplateController
    participant TC as TemplateController

    SC->>HC: refresh()
    HC->>HC: new LinkedLovelaceController()
    HC->>API: getDashboards()
    API-->>HC: Dashboard[]
    par per dashboard
        HC->>API: getDashboardConfig(url_path)
        API-->>HC: DashboardConfig (views)
    end
    loop each view → each card
        alt card.ll_key present
            HC->>HC: store template (keep lowest ll_priority)
        end
        HC->>LLC: registerPartials(card)
        LLC->>ETA: addPartialsFromCard(card)
    end
    HC->>ETA: loadPartials()
    HC->>HC: TemplateEngine.instance.eta = controller.eta
    HC->>LLC: registerTemplates(templates)
    LLC->>TC: renderAndAddTemplate(key, template) (priority asc)
```

## 6. Context resolution (`updateCardTemplate`)

The recursive heart of rendering. When a card has `ll_template`, context is
merged from three layers, the template is rendered through Eta, `ll_keys` remap
selected context values onto the card, and nested `ll_context` arrays/objects
recurse. When a card has **no** template, the function instead walks `sections`,
`cards`, `card`, and any nested objects so deeply-placed templates still render.

```mermaid
flowchart TD
    A["updateCardTemplate(card, templates, parentContext)"] --> B{"card.ll_template<br/>in templates?"}
    B -- yes --> C["merge context:<br/>parentContext ⊕ card.ll_context ⊕ template.ll_context"]
    C --> D["renderString(JSON(template), context)"]
    D --> E["JSON.parse → rendered card"]
    E --> F["apply ll_keys: copy context values onto card keys"]
    F --> G["recurse into ll_context arrays/objects"]
    G --> H["re-attach ll_template / ll_keys / ll_context"]
    B -- no --> I["walk view.sections[].cards[]"]
    I --> J["walk card.cards[]"]
    J --> K["walk single card.card"]
    K --> L["walk any other nested objects<br/>(e.g. tap_action)"]
    L --> M["recurse updateCardTemplate on each"]
    H & M --> N["return resolved card"]
```

## 7. Full dashboard sync (main user flow)

Triggered from the **Status card**. `Load Data` backs up every current config,
runs `refresh()`, then a **dry-run** (`updateAll(true)`) that renders configs in
memory and diffs them against the backups to build an HTML preview. Only when the
user confirms `Update All` does it write each changed dashboard back via
`setDashboardConfig` (`lovelace/config/save`).

```mermaid
sequenceDiagram
    actor User
    participant SC as Status Card
    participant HC as HassController
    participant LLC as LinkedLovelaceController
    participant API as LinkedLovelaceApi
    participant HA as Home Assistant

    User->>SC: click "Load Data"
    SC->>API: getDashboards() + getDashboardConfig() (backup)
    API-->>SC: _backedUpDashboardConfigs
    SC->>HC: refresh()  (see Discovery)
    SC->>HC: updateAll(dryRun=true)
    loop each dashboard
        HC->>LLC: getUpdatedDashboardConfig(url)
        LLC->>LLC: renderCard() per card/section
        LLC-->>HC: rendered config (not saved)
    end
    HC-->>SC: new configs
    SC->>SC: Diff backups vs new → HTML preview
    SC-->>User: show "Preview Changes" + "Update All"
    User->>SC: confirm "Update All"
    loop each changed dashboard
        SC->>HC: update(url, dryRun=false)
        HC->>LLC: getUpdatedDashboardConfig(url)
        HC->>API: setDashboardConfig(url, config)
        API->>HA: lovelace/config/save
    end
    HA-->>User: dashboards updated
```

::: tip Per-dashboard updates
The same flow powers the per-dashboard **Update** button — it calls
`overwriteDashboard(key)` → `update(key, dryRun=false)` for a single dashboard
instead of looping over all changed ones.
:::

## 8. Starter / demo install

The Starter card's `Create Demo Dashboard` button calls `_install()`, which
tries to create the dashboard (ignoring "already exists" errors), then saves a
fully self-contained demo config built by `buildDemoDashboardConfig()`.

```mermaid
flowchart TD
    A["User clicks Create Demo Dashboard"] --> B["_install()"]
    B --> C["status = working"]
    C --> D["api.createDashboard(url_path, title, sidebar=true)"]
    D --> E{"already exists?"}
    E -- yes --> F["catch + continue (will overwrite)"]
    E -- no --> G["dashboard created"]
    F & G --> H["buildDemoDashboardConfig()"]
    H --> I["hass.callWS lovelace/config/save"]
    I --> J{"saved?"}
    J -- yes --> K["status = done · show 'Open' link"]
    J -- no --> L["status = error · show message"]
```

## 9. Editor flows

**Template editor** (`linked-lovelace-template-editor`): after `firstUpdated`
runs a `refresh()` to discover templates, it renders one button per template.
Clicking a button copies the template's body into the card config and fires a
`config-changed` event so Lovelace persists it. The **Status editor** is
minimal — it just loads card helpers and renders.

```mermaid
flowchart TD
    A["Lovelace opens card editor"] --> B["setConfig(config) + loadCardHelpers()"]
    B --> C["firstUpdated → controller.refresh()"]
    C --> D["_loaded = true"]
    D --> E["renderTemplates(): button per discovered template key"]
    E --> F["user clicks a template button"]
    F --> G["_valueChanged(ev)"]
    G --> H["merge template body + ll_template into _config"]
    H --> I["fireEvent('config-changed', { config })"]
    I --> J["Lovelace saves card config"]
    J -.->|"next Status-card Update"| K["card rendered against template (Flow 7)"]
```

## API surface

The diagrams above bottom out in these Home Assistant WebSocket calls, all
wrapped by `LinkedLovelaceApi` (`src/linked-lovelace-api.ts`):

| Method | WebSocket type | Used by |
| --- | --- | --- |
| `getDashboards()` | `lovelace/dashboards/list` | Discovery, sync, starter |
| `getDashboardConfig(url)` | `lovelace/config` | Discovery, backup, render |
| `setDashboardConfig(url, config)` | `lovelace/config/save` | Live update |
| `createDashboard(url, title, sidebar)` | `lovelace/dashboards/create` | Starter install |
| `toggleDashboardAsTemplate(url, isTemplate)` | `lovelace/config` (+ save) | Template dashboards |
