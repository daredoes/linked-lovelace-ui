import { DashboardCard, DashboardView, DashboardConfig } from '../types';
import { TemplateEngine } from '../v2/template-engine';
import { CardTemplateApplicator } from './card-template-applicator';
import { CardViewProcessor } from './card-view-processor';

/**
 * Applies a single template to a card
 * @param card - Card to apply template to
 * @param templates - Collection of registered templates
 * @param context - Context data to pass to template
 */
export const updateCardTemplate = (
  card: DashboardCard, 
  templates: Record<string, any> = {},
  context: any = {}): DashboardCard => {
  
  const applicator = new CardTemplateApplicator(templates);
  return applicator.apply(card, context);
};

/**
 * Extracts all template keys used in a card and its children
 * @param card - Card to search
 * @returns Array of template keys
 */
export const getTemplatesUsedInCard = (card: DashboardCard): string[] => {
  if (card.ll_template) {
    return [card.ll_template];
  }
  
  const templates: string[] = [];
  
  if (Array.isArray(card.cards)) {
    card.cards.forEach((c) => {
      templates.push(...getTemplatesUsedInCard(c));
    });
  }
  
  if (!Array.isArray(card.card) && card.card) {
    templates.push(...getTemplatesUsedInCard(card.card));
  }
  
  return templates;
};

/**
 * Extracts all template keys used in a dashboard view
 * @param view - Dashboard view to search
 * @returns Array of template keys
 */
export const getTemplatesUsedInView = (view: DashboardView): string[] => {
  return view.cards?.flatMap((c) => getTemplatesUsedInCard(c)) || [];
};

/**
 * Processes a dashboard configuration, applying all registered templates
 * @param config - Dashboard configuration to process
 * @param templates - Collection of registered templates
 */
export const processDashboardConfig = (
  config: DashboardConfig, 
  templates: Record<string, any>): DashboardConfig => {
  
  if (!config.views || config.views.length === 0) {
    return config;
  }
  
  const applicator = new CardTemplateApplicator(templates);
  const processor = new CardViewProcessor({ applicator, context: {} });

  const updatedViews = config.views.map((view: DashboardView) => processor.processView(view));
  
  return { ...config, views: updatedViews };
};
