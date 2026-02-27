---
title: Linked Lovelace Partials Card
layout: page
---

# Linked Lovelace Partials Card

## Overview

A card template that defines reusable partials for use across your dashboards.

## Card Configuration

### Configuration Options


- **key string
  url? (required)**

- **template string
  priority? (required)**


## Usage Examples


``yaml
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
``


## Integration with Templates

Partials can be referenced from templates and other components. Use the partial key to reference them in your templates.

### Basic Usage

`` yaml
type: custom:your-card
ll_template: my-partial
``

## Notes

Partials can be referenced from templates using the ETA.js template syntax.
See [Creating Partials](/creating-partials) for detailed usage.
Use [providing-template-context](/providing-template-context) to pass data to partials.

## See Also

- [Creating Partials](/creating-partials)
- [Providing Template Context](/providing-template-context)
- [ETA.js Template Syntax](https://eta.js.org/docs/)
