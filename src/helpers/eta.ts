import { DashboardCard, LinkedLovelacePartial, DashboardPartialsCard, LINKED_LOVELACE_PARTIALS } from "../types";

export const getCardTemplate = async (possiblePartial: LinkedLovelacePartial) => {
  if (possiblePartial.url) {
    try {
      const response = await fetch(possiblePartial.url)
      if (response.ok) {
        return await response.text()
      }
      console.error("Could not fetch data from url", response.status, possiblePartial)
    } catch (e) {
      console.error("Could not fetch data from url", e, possiblePartial)
    }
  } else if (possiblePartial.template) {
    return possiblePartial.template
  }
  return ''
}

export const getPartialsFromCard = async (card: DashboardCard): Promise<Record<string, LinkedLovelacePartial>> => {
  const partials:  Record<string, LinkedLovelacePartial> = {};
  if (card.type === `custom:${LINKED_LOVELACE_PARTIALS}`) {
    const parentCard: DashboardPartialsCard = card as DashboardPartialsCard;
    const parsing = parentCard.partials?.map(async (possiblePartial) => {
      if (possiblePartial.key) {
        partials[possiblePartial.key] = { ...possiblePartial, template: await getCardTemplate(possiblePartial)}
      }
    })
    await Promise.all(parsing || []);
  }
  return partials;
}
