import { DashboardConfig } from './types';

// The url_path of the drop-in demo dashboard created by the starter card.
export const DEMO_DASHBOARD_URL_PATH = 'linked-lovelace-demo';
export const DEMO_DASHBOARD_TITLE = 'Linked Lovelace Demo';

// A self-contained, network-free showcase dashboard. It demonstrates the core
// powers of Linked Lovelace in one place:
//   - the status (controller) card to run "Update All"
//   - a partial with Eta logic (stateToIcon)
//   - a reusable template (`room`) using context variables + the partial
//   - three usages of that one template -> reuse across cards
//   - a nested template (`panel` embeds `badge`) forwarding a variable inward
//
// Only built-in Home Assistant card types are used (markdown / vertical-stack)
// so it renders without any extra custom-card resources.
export const buildDemoDashboardConfig = (): DashboardConfig => ({
  title: DEMO_DASHBOARD_TITLE,
  views: [
    // ---- View 1: the payoff. Clean output the user sees after syncing. ------
    {
      title: 'Demo',
      path: 'demo',
      cards: [
        {
          type: 'markdown',
          content: [
            '# 🔗 Linked Lovelace — Live Demo',
            '',
            'The three room cards and the welcome panel below are all generated',
            'from a **single** set of reusable templates (see the **Templates**',
            'tab above). To bring them to life:',
            '',
            '1. On the status card, click **Load Data**, then **Update All**.',
            '2. Edit a template on the **Templates** view and re-sync — every',
            '   copy updates at once.',
          ].join('\n'),
        },

        // The controller: discovers templates/partials and runs the sync.
        { type: 'custom:linked-lovelace-status' },

        // --- Reuse the SAME `room` template three times with different context
        { type: 'custom:linked-lovelace-template', ll_template: 'room', ll_context: { name: 'Living Room', state: 'on' } },
        { type: 'custom:linked-lovelace-template', ll_template: 'room', ll_context: { name: 'Bedroom', state: 'off' } },
        { type: 'custom:linked-lovelace-template', ll_template: 'room', ll_context: { name: 'Kitchen', state: 'unknown' } },

        // --- Use the nested `panel` template (which embeds `badge`) ----------
        { type: 'custom:linked-lovelace-template', ll_template: 'panel', ll_context: { title: 'Welcome' } },
      ],
    },

    // ---- View 2: the source. Where the reusable templates live. ------------
    {
      title: 'Templates',
      path: 'templates',
      cards: [
        {
          type: 'markdown',
          content: [
            '# Templates (source)',
            '',
            'These cards define the reusable pieces that power the **Demo** view.',
            'Any top-level card with an `ll_key` is a template; `ll_priority`',
            'controls the order they are processed (lowest first).',
            '',
            'Edit one and click **Update All** on the Demo view to re-sync.',
          ].join('\n'),
        },

        // --- Partial: Eta logic mapping a state to an icon emoji -------------
        {
          type: 'custom:linked-lovelace-partials',
          partials: [
            {
              key: 'stateToIcon',
              priority: 0,
              template:
                "<% const s = (context.state || '').toLowerCase() _%>" +
                "<% if (s === 'on') { _%>🟢<% } else if (s === 'off') { _%>⚪<% } else { _%>❔<% } _%>",
            },
          ],
        },

        // --- Reusable template: a "room" card using variables + the partial -
        {
          type: 'markdown',
          ll_key: 'room',
          ll_priority: 1,
          content:
            "### <%= context.name %>\n\n" +
            "<%~ include('stateToIcon', { state: context.state }) %> " +
            'State: **<%= context.state %>**',
        },

        // --- Nested template: `panel` embeds the `badge` template -----------
        { type: 'markdown', ll_key: 'badge', ll_priority: 0, content: '`✅ <%= context.label %>`' },
        {
          type: 'vertical-stack',
          ll_key: 'panel',
          ll_priority: 2,
          cards: [
            { type: 'markdown', content: '## <%= context.title %>' },
            {
              type: 'custom:linked-lovelace-template',
              ll_template: 'badge',
              ll_context: { label: '<%= context.title %> ready' },
            },
          ],
        },
      ],
    },
  ],
});
