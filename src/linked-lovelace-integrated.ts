/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html } from 'lit';

import type { Dashboard, DashboardCard, DashboardConfig, DashboardView } from './types';
import './types';
import { log } from './helpers';
import { HomeAssistant } from 'custom-card-helpers';
log(`Integration loading`);
let prevState = false;

let _hass: HomeAssistant;

const getHass = () => {
  const hass = document.getElementsByTagName('home-assistant')[0] as LitElement;
  _hass = (hass as any).hass;
  return hass;
};

const getDashboard = () => {
  try {
    return (getHass() as any).___route.path.trim().split('/')[1];
  } catch {
    return '';
  }
};

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    const currentState = (mutation.target as Element).classList.contains('edit-mode');
    if (prevState !== currentState) {
      // console.log(getDashboard());
      prevState = currentState;
      console.log(`edit-mode' class ${currentState ? 'added' : 'removed'}`);
    }
  });
});

const getAppLayout = () => {
  const ha = getHass();
  const layout = ha.renderRoot
    .querySelector<LitElement>('home-assistant-main')
    ?.renderRoot.querySelector<LitElement>('app-drawer-layout');
  const panel = layout?.getElementsByTagName('partial-panel-resolver')[0];
  const child = panel?.getElementsByTagName('ha-panel-lovelace')[0] as LitElement;
  console.log(child);
  const appLayout = child?.renderRoot
    .querySelector<LitElement>('hui-root')
    ?.renderRoot.querySelector<LitElement>('ha-app-layout');
  return appLayout;
};

(async () => {
  // Wait for scoped customElements registry to be set up
  // otherwise the customElements registry card-mod is defined in
  // may get overwritten by the polyfill if card-mod is loaded as a module
  while (customElements.get('home-assistant') === undefined)
    await new Promise((resolve) => window.setTimeout(resolve, 100));

  const appLayout = getAppLayout();
  if (appLayout) {
    // Set initial state on page load
    prevState = appLayout.classList.contains('edit-mode');
    // Start observing class changes
    observer.observe(appLayout, {
      attributes: true,
    });
  }
})();

class LinkedLovelaceIntegrated {}

const menuItemHTML = html`
  <mwc-list-item graphic="icon" mwc-list-item="" tabindex="-1" aria-disabled="false" role="menuitem">
    <ha-svg-icon slot="graphic"></ha-svg-icon>
    <!--?lit$06003746$-->Use as template
  </mwc-list-item>
`;

const getTemplatesUsedInCard = (card: DashboardCard): string[] => {
  if (card.template) {
    return [card.template];
  }
  if (card.cards) {
    return card.cards.flatMap((c) => {
      return getTemplatesUsedInCard(c);
    });
  }
  return [];
};

const getTemplatesUsedInView = (view: DashboardView): string[] => {
  return (
    view.cards?.flatMap((c) => {
      return getTemplatesUsedInCard(c);
    }) || []
  );
};

const parseDashboards = (data) => {
  const dashboards: Record<string, Dashboard> = {};
  data.forEach((dashboard) => {
    dashboards[dashboard.id] = dashboard;
  });
  return dashboards;
};

const parseDashboardGenerator = (dashboardId, dashboardUrl) => {
  const func = async (dashboardConfig: DashboardConfig) => {
    const response = {
      templates: {},
      dashboard: dashboardConfig,
      views: {},
      dashboardId,
      dashboardUrl,
    };
    if (dashboardConfig.template) {
      dashboardConfig.views.forEach((view) => {
        if (view.cards?.length == 1) {
          response.templates[`${view.path}`] = view.cards[0];
        }
      });
    }
    dashboardConfig.views.forEach((view) => {
      response.views[`${dashboardId}${view.path ? `.${view.path}` : ''}`] = view;
    });
    dashboardConfig.views = Object.values(response.views);
    return response;
  };
  return func;
};
