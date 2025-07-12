import type { LinkedLovelacePartial } from "../../types/LinkedLovelacePartial";
import type { LinkedLovelaceHolderCardConfig } from "../../types/LinkedLovelaceHolderCardConfig";

type PriorityCards = LinkedLovelacePartial | LinkedLovelaceHolderCardConfig;

const sortPriorityCardsByPriorityFunc = ([_, partialA]: [string, PriorityCards], [__, partialB]: [string, PriorityCards]) => {
    const priorityA = partialA.ll_priority || 0
    const priorityB = partialB.ll_priority || 0
    return priorityA - priorityB
}

export const sortPriorityCardsByPriority = (cards: Record<string, PriorityCards>) => {
  return Object.entries(cards).sort(sortPriorityCardsByPriorityFunc)
}