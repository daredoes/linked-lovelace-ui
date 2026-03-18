---
outline: deep
---

# Troubleshooting

---

## Plugin Not Loading

**Symptom:** No `linked-lovelace-*` card types are available; no log message appears in the browser console.

**Check list:**

1. **HACS installation** – In Home Assistant go to HACS → Frontend and confirm that "Linked Lovelace" appears and has a checkmark.
2. **Resource registration** – Go to Settings → Dashboards → ⋮ → Manage resources and confirm that `/hacsfiles/linked-lovelace-ui/linked-lovelace-ui.js` is listed as a JavaScript module.
3. **Hard reload** – After installing, do a hard reload in the browser (`Ctrl+Shift+R` / `Cmd+Shift+R`). Service workers can cache the old state.
4. **Browser console** – Open DevTools (F12) → Console. Look for errors mentioning `linked-lovelace`.

---

## Template Not Found

**Symptom:** A consumer card renders as an error card with "Template not found" or the card appears empty.

**Check list:**

1. Confirm the `ll_key` value on the source card matches the `ll_template` value on the consumer card exactly (case-sensitive).
2. Ensure the source card (`ll_key`) is on a dashboard that was loaded before the Status card ran. All dashboards are scanned, but if the source card's dashboard hasn't been saved yet the template won't be found.
3. Open the Status card → Templates tab and verify the template key appears in the list.

---

## Template Variables Show As "undefined"

**Symptom:** Output contains the literal string `undefined` where a variable value was expected.

**Causes:**

- The context key does not match between `ll_context` and the `<%= context.key %>` expression (typo, case mismatch).
- The context key is missing on the consumer card and no default is provided.

**Fix:** Add a default value:

```yaml
# Before
name: "<%= context.label %>"

# After – with fallback
name: "<%= context.label || 'Default Name' %>"
```

Or verify spelling:

```yaml
ll_context:
  label: My Room    # must match context.label in the template
```

---

## Sync Does Not Update All Dashboards

**Symptom:** Some dashboards are updated but others are not.

**Check list:**

1. **Admin access** – Linked Lovelace runs in the browser context. If your user does not have admin access to a dashboard it cannot write to it.
2. **YAML-mode dashboards** – Dashboards managed in `configuration.yaml` or `ui-lovelace.yaml` are **read-only** via the API. Linked Lovelace cannot modify them.
3. **Network / WebSocket errors** – Check the Logs tab in the Status card for WebSocket errors when fetching dashboard configs.

---

## Diff Shows Unexpected Changes

**Symptom:** The Status card diff shows changes on cards that should not have been modified.

**Causes:**

- A previous sync added `ll_context` or `ll_template` metadata to cards that were not originally marked as consumers. This can happen if `ll_context` was accidentally left on a template source card.
- The Eta engine renders template syntax found in non-linked cards (e.g. a card that happens to contain `<%= ... %>` in a string value).

**Fix:**

- On source cards (`ll_key`), remove `ll_context` if you do not want default context written back to the source card. Default context is informational only and is not required for rendering.
- Escape angle brackets in non-template strings if they accidentally match Eta syntax.

---

## Partial Not Rendering

**Symptom:** `<%~ include('myPartial', context) %>` outputs an empty string or throws an error.

**Check list:**

1. Confirm the `custom:linked-lovelace-partials` card is on a dashboard and was loaded by the Status card before the template that uses it.
2. Verify the `key` in the partials card exactly matches the string in `include()`.
3. For URL-loaded partials, open the browser DevTools → Network tab and confirm the URL is reachable and returns plain text.
4. Check the Logs tab for errors mentioning the partial key.
5. Verify partial priority: if partial A includes partial B, partial B must have a **lower** `priority` value (loaded first).

---

## ll_keys Not Injecting Cards

**Symptom:** The rendered template still shows an empty `cards: []` instead of the injected cards.

**Check list:**

1. Both the key and value in `ll_keys` must be the **same string** and must match a property on the template and a property in `ll_context`.

   ```yaml
   # Correct
   ll_keys:
     cards: cards

   # Wrong – key and value differ
   ll_keys:
     cards: myCards
   ```

2. The context property must be an **array of objects** (not strings) for cards to be rendered.
3. Each object in the array that you want rendered must have `ll_template` set.
4. Make sure the referenced templates are registered before the parent template (`ll_priority`).

---

## Changes Are Not Persistent After HA Restart

**Symptom:** After a Home Assistant restart, dashboards revert to the template placeholders.

**Explanation:** Linked Lovelace modifies dashboard configs stored in the `.storage/lovelace.*` files. These changes **are** persistent across restarts. If you are seeing reverts, one of these is likely happening:

1. A Home Assistant update reset the storage file.
2. Another tool or automation is overwriting the dashboard config.
3. The dashboard is in YAML mode and the `ui-lovelace.yaml` file is the source of truth.

**Best practice:** After a successful sync, make a backup of your Home Assistant configuration.

---

## Debugging Tips

### Browser Console

The most information-rich debugging source. Open DevTools (F12) and look for messages prefixed with `[linked-lovelace]`.

### Status Card Logs Tab

The Logs tab shows a timestamped log of all operations the plugin performed, including which templates were found and any errors encountered.

### Dry Run

Before applying changes to all dashboards, use Dry Run mode to preview the diff on individual dashboards. This helps identify unexpected changes before they are written.

### Isolate With A Test Dashboard

Create a dedicated dashboard with only:
1. The `custom:linked-lovelace-status` card
2. Your template source cards
3. One or two consumer cards

This makes it easy to iterate quickly without affecting your production dashboards.
