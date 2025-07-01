import { TemplateEngine } from '../../v2/template-engine';
import type { DashboardCard } from '../../types/DashboardCard';

export const parseTemplateCardData = (templateCardData: Record<string, any>, dataFromTemplate: Record<string, any>): DashboardCard | undefined => {
  // If data in template, find and replace each key
  let template = JSON.stringify(templateCardData);
  try {
    template = TemplateEngine.instance.eta.renderString(template, dataFromTemplate)
    // Convert rendered string back to JSON
    return JSON.parse(template) as DashboardCard;
  } catch (e) {
    console.error(e);
    return undefined
  }
}
