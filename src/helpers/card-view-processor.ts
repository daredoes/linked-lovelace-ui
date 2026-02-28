import { DashboardCard, DashboardView, DashboardConfig } from '../types';
import { CardTemplateApplicator } from './card-template-applicator';

export interface ViewProcessorConfig {
  applicator: CardTemplateApplicator;
  context: any;
}

/**
 * Applies templates to all cards in a dashboard view
 */
export class CardViewProcessor {
  private config: ViewProcessorConfig;

  constructor(config: ViewProcessorConfig) {
    this.config = config;
  }

  /**
   * Process a view and apply templates to all cards
   */
  public processView = (view: DashboardView): DashboardView => {
    return {
      ...view,
      cards: this.applyToCards(view.cards || [])
    };
  };

  /**
   * Recursively apply templates to cards
   */
  private applyToCards = (cards: DashboardCard[]): DashboardCard[] => {
    const applicator = this.config.applicator;
    const context = this.config.context;
    
    return cards.map((card: DashboardCard) => {
      const updatedCard = applicator.apply(card, context);
      
      // Recursively apply to nested cards
      if (Array.isArray(updatedCard.cards)) {
        (updatedCard as any).cards = this.applyToCards(updatedCard.cards);
      }
      
      if (!Array.isArray(updatedCard.card) && updatedCard.card) {
        const nested = this.applyToCards([updatedCard.card])[0];
        (updatedCard as any).card = nested;
      }
      
      // Handle sections
      if (Array.isArray(updatedCard.sections)) {
        (updatedCard as any).sections = (updatedCard as any).sections.map((section: any) => ({
          ...section,
          cards: section.cards ? this.applyToCards(section.cards) : []
        }));
      }
      
      return updatedCard;
    });
  };
}
