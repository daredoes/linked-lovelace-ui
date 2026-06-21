import { buildDemoDashboardConfig, DEMO_DASHBOARD_URL_PATH } from './demoDashboard';
import { DashboardCard } from './types';

describe('[demoDashboard] buildDemoDashboardConfig', () => {
  const config = buildDemoDashboardConfig();
  const demoView = (config.views || [])[0];
  const templatesView = (config.views || [])[1];
  const allCards = (config.views || []).flatMap((v) => (v.cards || []) as DashboardCard[]);

  const keysOf = (cs: DashboardCard[]) => cs.filter((c) => c.ll_key).map((c) => c.ll_key);
  const usages = (cs: DashboardCard[]) => cs.filter((c) => c.ll_template);

  test('has a stable url path and Demo + Templates views', () => {
    expect(DEMO_DASHBOARD_URL_PATH).toBe('linked-lovelace-demo');
    expect(config.views).toHaveLength(2);
    expect(demoView.path).toBe('demo');
    expect(templatesView.path).toBe('templates');
  });

  test('includes the status card on the Demo view so users can run Update All', () => {
    expect((demoView.cards as DashboardCard[]).some((c) => c.type === 'custom:linked-lovelace-status')).toBe(true);
  });

  test('defines the room, badge and panel templates (on the Templates view)', () => {
    expect(keysOf(templatesView.cards as DashboardCard[]).sort()).toEqual(['badge', 'panel', 'room']);
  });

  test('reuses the room template three times on the Demo view', () => {
    expect(usages(demoView.cards as DashboardCard[]).filter((c) => c.ll_template === 'room')).toHaveLength(3);
  });

  test('declares a stateToIcon partial', () => {
    const partialsCard = allCards.find((c) => c.type === 'custom:linked-lovelace-partials');
    expect(partialsCard?.partials?.[0]?.key).toBe('stateToIcon');
  });

  test('nested panel template embeds the badge template', () => {
    const panel = allCards.find((c) => c.ll_key === 'panel');
    expect(panel?.cards?.some((c: DashboardCard) => c.ll_template === 'badge')).toBe(true);
  });
});
