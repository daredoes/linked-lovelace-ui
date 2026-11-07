---
outline: deep
---

# Troubleshooting

---

## Plugin Not Loading

**Symptom:** No `linked-lovelace-*` card types are available; no log message appears in the browser console.

**Check list:**

1. In Home Assistant go to HACS → Frontend and confirm that "Linked Lovelace" appears and has a checkmark.
2. Go to Settings → Dashboards → ⋮ → Manage resources and confirm that `/hacsfiles/linked-lovelace-ui/linked-lovelace-ui.js` is listed as a JavaScript module.
3. After installing, do a hard reload in the browser (`Ctrl+Shift+R` / `Cmd+Shift+R`). Service workers can cache the old state.
4. Open DevTools (F12) → Console and look for errors mentioning `linked-lovelace`.

---

## Template Not Found

**Symptom:** The Dashboards tab lists a missing template, and the card doesn't change after a sync.

**Check list:**

1. Confirm the `ll_template` value matches an `ll_key` exactly (case-sensitive). The Templates tab on the status card lists every key it found.
2. Make sure the template sits directly in a view or a section, not inside a stack or another container card.
3. Save the dashboard that holds the template, then click **Load Data** again.

---

## Template Variables Show As "undefined"

**Symptom:** Output contains the literal string `undefined` where a variable value was expected.

**Causes:**

- The context key does not match between `ll_context` and the `<%= context.key %>` expression (typo, case mismatch).
- The context key is missing on the instance and no default is provided.

**Fix:** Add a default value:

```yaml
# Before
name: "<%= context.label %>"

# After, with fallback
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

1. Linked Lovelace runs in the browser context. If your user does not have admin access to a dashboard it cannot write to it.
2. Dashboards managed in `configuration.yaml` or `ui-lovelace.yaml` are read-only via the API. Linked Lovelace cannot modify them.
3. Check the Logs tab in the Status card for WebSocket errors when fetching dashboard configs.

---

## Diff Shows Unexpected Changes

**Symptom:** The Status card diff shows changes on cards that should not have been modified.

**Causes:**

- A previous sync added `ll_context` or `ll_template` metadata to cards that were not originally marked as instances. This can happen if `ll_context` was accidentally left on a template.
- A sync removes `ll_context` keys on an instance that match the template's default, because the template already provides them. If you change that default later, those instances follow it.
- The Eta engine renders template syntax found in non-linked cards (e.g. a card that happens to contain `<%= ... %>` in a string value).

**Fix:**

- On templates (`ll_key`), only keep `ll_context` for defaults you want instances to use.
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

1. Both the key and value in `ll_keys` must be the same string and must match a property on the template and a property in `ll_context`.

   ```yaml
   # Correct
   ll_keys:
     cards: cards

   # Wrong: key and value differ
   ll_keys:
     cards: myCards
   ```

2. The context property must be an array of objects, not strings, for cards to be rendered.
3. Each object in the array that you want rendered must have `ll_template` set.
4. Make sure the referenced templates are registered before the parent template (`ll_priority`).

---

## Changes Are Not Persistent After HA Restart

**Symptom:** After a Home Assistant restart, dashboards revert to the template placeholders.

**Explanation:** Linked Lovelace modifies dashboard configs stored in the `.storage/lovelace.*` files. These changes *do* persist across restarts. If you are seeing reverts, one of these is likely happening:

1. A Home Assistant update reset the storage file.
2. Another tool or automation is overwriting the dashboard config.
3. The dashboard is in YAML mode and the `ui-lovelace.yaml` file is the source of truth.

**Best practice:** After a successful sync, make a backup of your Home Assistant configuration.

---

## Custom Element Doesn't Exist: linked-lovelace-template

**Symptom:** A card shows this error after you update Linked Lovelace.

**Fix:** `custom:linked-lovelace-template` no longer exists, and a sync replaces any that are left. Click **Load Data**, then **Update All**. A card whose template exists renders as normal. One with a missing template becomes a markdown note naming that key, and a sync renders over it once the template exists. A card with no `ll_template` becomes `custom:linked-lovelace-status`, so delete it if that dashboard doesn't need one.

---

## Known Limitations

- A sync only runs when you start it from the status card. Saving a change to a template does not update the cards that use it.
- Each card with `ll_template` gets replaced by a fresh render on every sync, so hand edits to it are lost. Change the template or the card's `ll_context` instead.
- A template must sit directly in a view or a section. A template nested inside a stack or another container card is not discovered, though cards using `ll_template` can be nested.
- `ll_key` values are shared across all dashboards. When two templates use the same key, the lowest `ll_priority` wins, a tie keeps the first one discovered, and the Logs tab shows a warning.
- Dashboards managed in YAML can't be written to.
- Strategy dashboards, which have no `views`, are not rendered.
- Writes use the permissions of the user in the browser, so a user without access to a dashboard can't sync it.
- If a template renders to invalid JSON, the card gets the unrendered template body and the error only appears in the browser console.
- The only undo is **Download Backup** on the status card, so download it before you write anything.

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
2. Your templates
3. One or two instances

This makes it easy to iterate quickly without affecting your production dashboards.
