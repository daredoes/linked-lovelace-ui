import { Dashboard, DashboardView } from '../types';
import ViewController from './view';

const dashboard: Dashboard = {
  id: 'test',
  mode: 'storage',
  require_admin: false,
  show_in_sidebar: false,
  title: 'test',
  url_path: 'test',
};

describe('[class] ViewController', () => {
  test('sets up as expected', () => {
    const controller = new ViewController();
    expect(controller).toBeDefined;
  });

  test('adds a new view as expected', () => {
    const controller = new ViewController();
    const view: DashboardView = {
      title: 'test',
      path: 'test',
    };
    expect(controller.addView(dashboard, view)).toEqual(true);
    expect(controller.views[`${dashboard.id}.${view.path}`]).toEqual(view);
  });

  test('overwrites a view as expected', () => {
    const controller = new ViewController();
    const oldView: DashboardView = {
      title: 'old',
      path: 'test',
    };
    controller.addView(dashboard, oldView);
    const view: DashboardView = {
      title: 'new',
      path: 'test',
    };
    expect(controller.addView(dashboard, view)).toEqual(true);
    expect(controller.views[`${dashboard.id}.${view.path}`]).toEqual(view);
  });

  test('does not overwrite a view as expected', () => {
    const controller = new ViewController();
    const oldView: DashboardView = {
      title: 'old',
      path: 'test',
    };
    controller.addView(dashboard, oldView);
    const view: DashboardView = {
      title: 'new',
      path: 'test',
    };
    expect(controller.addView(dashboard, view, false)).toEqual(false);
    expect(controller.views[`${dashboard.id}.${view.path}`]).toEqual(oldView);
  });

  test('does not overwrite a view and still adds as expected', () => {
    const controller = new ViewController();
    const view: DashboardView = {
      title: 'new',
    };
    expect(controller.addView(dashboard, view, false)).toEqual(true);
    expect(controller.views[`${dashboard.id}`]).toEqual(view);
  });

  test('viewsByDashboard works as expected', () => {
    const controller = new ViewController();
    const view: DashboardView = {
      title: 'new',
      path: 'test',
    };
    const newDashboard = { ...dashboard, id: 'new' };
    controller.addView(dashboard, view);
    controller.addView(newDashboard, view);
    const response = controller.viewsByDashboard(dashboard.id);
    expect(response).toStrictEqual({
      'test.test': view,
    });
  });
});
