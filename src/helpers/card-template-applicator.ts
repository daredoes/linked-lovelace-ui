import { DashboardCard, DashboardView } from '../types';
import { TemplateEngine } from '../v2/template-engine';
import { toConsole } from './log';

type ErrorCallback = (card: DashboardCard, error: unknown) => DashboardCard;

/**
 * Applies registered templates to dashboard cards
 * Handles template rendering with proper error handling
 */
export class CardTemplateApplicator {
  private templates: Record<string, any>;
  private errorCallback: ErrorCallback;
  private useDefaultErrorHandler: boolean = true;

  constructor(templates: Record<string, any>, errorCallback?: ErrorCallback) {
    this.templates = templates;
    this.errorCallback = errorCallback || ((card, error) => this.defaultErrorHandler(card, error));
    this.useDefaultErrorHandler = !errorCallback;
  }

  setCustomErrorHandler(callback: ErrorCallback): void {
    this.errorCallback = callback;
    this.useDefaultErrorHandler = false;
  }

  /**
   * Default error handler - logs error and returns original card
   */
  private defaultErrorHandler = (card: DashboardCard, error: unknown): DashboardCard => {
    toConsole('error', 'Template application failed', { 
      card: card.ll_template || card.type,
      error: error instanceof Error ? error.message : error
    });
    return card; // Return original on error as fallback
  };

  /**
   * Applies a single template to a card
   */
  private applyTemplate = (card: DashboardCard, templateData: any, context: any): DashboardCard => {
    const templateKey = card.ll_template;
    
    if (!templateKey || !templateData[templateKey]) {
      return card;
    }

    try {
      const templateCardData = { ...templateData[templateKey] };
      delete templateCardData['ll_key'];
      delete templateCardData['ll_priority'];
      delete templateCardData['ll_keys'];
      
      const templateContext = { ...context, ...(card.ll_context || {}) };
      
      // Add template context
      if (templateCardData.ll_context) {
        Object.assign(templateContext, templateCardData.ll_context);
      }

      // Serialize, render, parse
      const templateStr = JSON.stringify(templateCardData);
      const rendered = TemplateEngine.instance.eta.renderString(templateStr, templateContext);
      const data = JSON.parse(rendered);

      // Apply ll_keys context mapping
      if (card.ll_keys) {
        Object.keys(card.ll_keys).forEach((llKey) => {
          const mappingKey = card.ll_keys![llKey];
          if (!mappingKey) return;
          
          // Map the context values using ll_keys
          if (templateContext[mappingKey] !== undefined) {
            data[llKey] = templateContext[mappingKey];
          }
        });
      }

      return {
        ...data,
        ll_template: templateKey,
        ll_keys: card.ll_keys
      };
    } catch (error) {
      return this.errorCallback(card, error);
    }
  };

  /**
   * Applies template to a single card
   * @param card - Card to apply template to
   * @param context - Context data to pass to template
   * @returns The processed card
   */
  public apply = (card: DashboardCard, context: any = {}): DashboardCard => {
    return this.applyTemplate(card, this.templates, context);
  };
}
