import { DashboardCard, DashboardView } from '../types';

export interface CardPath {
  path: string[];
  card: DashboardCard;
  ll_template?: string;
}

/**
 * Extracts all cards with templates from a card recursively
 * @param card - The card to extract from
 * @param currentPath - Current path in the card tree
 * @returns Array of CardPath objects for cards with templates
 */
export const extractCardPaths = (card: DashboardCard, currentPath: string[] = []): CardPath[] => {
  const paths: CardPath[] = [];
  const path = [...currentPath];
  
  // If this card has a template, record it
  if (card.ll_template) {
    paths.push({
      path, 
      card,
      ll_template: card.ll_template
    });
  }
  
  // Handle cards array
  if (Array.isArray(card.cards)) {
    card.cards.forEach((c, idx) => {
      const newPath = [...path, 'cards', idx.toString()];
      paths.push(...extractCardPaths(c, newPath));
    });
  }
  
  // Handle single nested card
  if (card.card && !Array.isArray(card.card)) {
    paths.push(...extractCardPaths(card.card, [...path, 'card']));
  }
  
  // Handle sections (new dashboard format)
  if (card.sections && Array.isArray(card.sections)) {
    card.sections.forEach((section, idx) => {
      if (section.cards && Array.isArray(section.cards)) {
        section.cards.forEach((c, cardIdx) => {
          const newPath = [...path, 'sections', idx.toString(), 'cards', cardIdx.toString()];
          paths.push(...extractCardPaths(c, newPath));
        });
      }
    });
  }
  
  return paths;
};

/**
 * Extracts all cards with templates from a dashboard view
 * @param view - The dashboard view to extract from
 * @returns Array of CardPath objects for all cards
 */
export const extractCardsFromView = (view: DashboardView): CardPath[] => {
  const paths: CardPath[] = [];
  let viewIndex = 0;
  
  // Regular cards array
  if (view.cards && Array.isArray(view.cards)) {
    view.cards.forEach((card, cardIdx) => {
      const newPath = [viewIndex.toString(), 'cards', cardIdx.toString()];
      paths.push(...extractCardPaths(card, newPath));
    });
  }
  
  // Sections array
  if (view.sections && Array.isArray(view.sections)) {
    view.sections.forEach((section, sectionIdx) => {
      if (section.cards && Array.isArray(section.cards)) {
        section.cards.forEach((card, cardIdx) => {
          const newPath = [viewIndex.toString(), 'sections', sectionIdx.toString(), 'cards', cardIdx.toString()];
          paths.push(...extractCardPaths(card, newPath));
        });
      }
    });
  }
  
  return paths;
};
