import { HomeAssistant } from 'custom-card-helpers';
import { LitElement } from 'lit';
import LinkedLovelace from './linked-lovelace';
import { Dashboard, DashboardCard, DashboardConfig, DashboardView } from './types';

import { log } from './helpers';

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
    if (dashboard.mode == 'storage') {
      dashboards[dashboard.id] = dashboard;
    }
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

const getHass = (): HomeAssistant => {
  const hass = document.getElementsByTagName('home-assistant')[0] as LitElement;
  return (hass as any).hass as HomeAssistant;
};

class StaticLinkedLovelace {
  static _linkedLovelace?: LinkedLovelace;
  static self?: StaticLinkedLovelace;
  debug = false;
  dryRun = false;
  dashboards: Record<string, Dashboard> = {};
  dashboardConfigs: Record<string, DashboardConfig> = {};
  templates: Record<string, DashboardCard> = {};
  views: Record<string, DashboardView> = {};
  viewsByDashboard: Record<string, DashboardView[]> = {};
  templatesToViews: Record<string, Record<string, boolean>> = {};
  viewsToTemplates: Record<string, string[]> = {};

  log(msg, ...values) {
    if (this.debug) {
      log(msg, ...values);
    }
  }

  public _setDebug = (debug: boolean) => {
    this.debug = debug;
  };

  public _setDryRun = (dryRun: boolean) => {
    this.dryRun = dryRun;
  };

  public enableDebug = () => {
    this._setDebug(true);
  };

  public disableDebug = () => {
    this._setDebug(false);
  };

  parseDashboardConfigs = async (dashboards: Record<string, Dashboard>) => {
    const responses = await Promise.all(
      Object.keys(dashboards).map(async (dashboardId) => {
        const dashboard = dashboards[dashboardId];
        return await this.parseDashboardConfig(dashboard);
      }),
    );
    return responses;
  };

  parseDashboardConfig = async (dashboard: Dashboard) => {
    return await StaticLinkedLovelace.linkedLovelace
      ?.getDashboardConfig(dashboard.url_path)
      .then(parseDashboardGenerator(dashboard.id, dashboard.url_path));
  };

  flattenParsedDashboardConfigs = (responses) => {
    const templates = {};
    const views = {};
    const dashboardConfigs = {};
    responses.forEach((response) => {
      Object.assign(templates, response.templates);
      Object.assign(views, response.views);
      dashboardConfigs[response.dashboardUrl] = response.dashboard;
    });
    const response = {
      templates,
      views,
      dashboardConfigs,
    };
    return response;
  };

  getDashboardConfigs = async () => {
    const dashboards: Record<string, Dashboard> = await StaticLinkedLovelace.linkedLovelace
      .getDashboards()
      .then(parseDashboards);
    // this.log(`Parsed Dashboards`, dashboards);
    const responses = await this.parseDashboardConfigs(dashboards);
    const flattenedResponses = this.flattenParsedDashboardConfigs(responses);
    return {
      dashboards,
      ...flattenedResponses,
    };
  };

  setDashboardConfig = async (urlPath: string, config?: DashboardConfig): Promise<null> => {
    const dashboardConfig = config ? config : this.dashboardConfigs[urlPath];
    return await StaticLinkedLovelace.linkedLovelace.setDashboardConfig(urlPath, dashboardConfig);
  };

  private _updateTemplates = (templates: Record<string, DashboardCard>) => {
    const tmplts = templates;
    const allTemplates = Object.assign({}, this.templates, templates);
    Object.keys(templates).forEach((templateKey) => {
      this.log(`Updating template '${templateKey}' with other template data`, templates[templateKey]);
      tmplts[templateKey] = StaticLinkedLovelace.linkedLovelace.updateTemplate(
        tmplts[templateKey],
        allTemplates,
      ) as DashboardCard;
      this.log(`Updated template '${templateKey}' with other template data`, templates[templateKey]);
    });
    this.templates = Object.assign({}, this.templates, templates);
  };

  private _updateDashboards = (dashboards: Record<string, Dashboard>) => {
    this.dashboards = Object.assign({}, this.dashboards, dashboards);
  };

  private _updateViews = (views: Record<string, DashboardView>) => {
    this.views = Object.assign({}, this.views, views);
  };

  private _updateDashboardConfigs = (dashboardConfigs: Record<string, DashboardConfig>) => {
    Object.keys(dashboardConfigs).forEach((dashboardId) => {
      const dashboard = dashboardConfigs[dashboardId];
      const updatedDashboard = StaticLinkedLovelace.linkedLovelace.updateTemplate(dashboard, this.templates);
      this.dashboardConfigs[dashboardId] = updatedDashboard as DashboardConfig;
      this.log(`Updated Dashboard Data (original) (updated)'${dashboardId}'`, dashboard, updatedDashboard);
    });
  };

  private _updateViewsByDashboard = () => {
    const views: Record<string, DashboardView[]> = {};
    Object.keys(StaticLinkedLovelace.instance.views).forEach((viewKey) => {
      const view = StaticLinkedLovelace.instance.views[viewKey];
      const key = viewKey.split('.', 1)[0];
      if (!views[key]) {
        views[key] = [];
      }
      views[key].push(view);
    });
    this.viewsByDashboard = views;
  };

  private _updateFromLatest = async () => {
    this.templates = {};
    this.dashboardConfigs = {};
    this.dashboards = {};
    this.templatesToViews = {};
    this.views = {};
    this.viewsToTemplates = {};

    const response = await StaticLinkedLovelace.instance.getDashboardConfigs();
    this.log(`Got Dashboard Configs`, response);
    const { dashboards, views, templates, dashboardConfigs } = response;
    this._updateTemplates(templates);
    this._updateDashboards(dashboards);
    this._updateViews(views);
    this._updateDashboardConfigs(dashboardConfigs);
    this._updateViewsByDashboard();
    this.log(
      this.templates,
      this.dashboardConfigs,
      this.dashboards,
      this.templatesToViews,
      this.views,
      this.viewsToTemplates,
    );
  };

  private _getTemplatesUsedInViews = (views: Record<string, DashboardView>) => {
    Object.keys(views).forEach((viewKey) => {
      const view = this.views[viewKey];
      const templates = getTemplatesUsedInView(view);
      templates.forEach((template) => {
        if (!this.templatesToViews[template]) {
          this.templatesToViews[template] = {};
        }
        this.templatesToViews[template][viewKey] = true;
        if (!this.viewsToTemplates[viewKey]) {
          this.viewsToTemplates[viewKey] = [];
        }
        this.viewsToTemplates[viewKey].push(template);
      });
    });
  };

  getLinkedLovelaceData = async () => {
    await this._updateFromLatest();
    this._getTemplatesUsedInViews(this.views);
  };

  updateLinkedLovelace = async () => {
    await Promise.all(
      Object.keys(this.dashboardConfigs).map(async (dashboardId) => {
        const dashboard = this.dashboardConfigs[dashboardId];
        return StaticLinkedLovelace.linkedLovelace.setDashboardConfig(dashboardId, dashboard);
      }),
    );
  };

  static get linkedLovelace(): LinkedLovelace {
    if (!this._linkedLovelace) {
      const hass = getHass();
      this._linkedLovelace = new LinkedLovelace(hass);
    }
    return this._linkedLovelace;
  }

  static get instance(): StaticLinkedLovelace {
    if (this.self) {
      return this.self;
    }
    this.self = new StaticLinkedLovelace();
    return this.self;
  }
}

export default StaticLinkedLovelace;
