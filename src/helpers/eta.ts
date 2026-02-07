import { DashboardCard, LinkedLovelacePartial, DashboardPartialsCard, LINKED_LOVELACE_PARTIALS } from "../types";
import axios from "axios";

export const getCardTemplate = async (possiblePartial: LinkedLovelacePartial) => {
  if (possiblePartial.url) {
    try {
      const response = await axios.get(possiblePartial.url, { responseType: 'text', timeout: 10000 })
      if (typeof response.data === 'string') {
        return response.data
      }
      throw new Error(`Invalid response type from ${possiblePartial.url}`)
    } catch (e: any) {
      let errorMessage = `Failed to fetch template from ${possiblePartial.url}`;

      if (e.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage += `: HTTP ${e.response.status} ${e.response.statusText}`;
      } else if (e.request) {
        // The request was made but no response was received
        errorMessage += `: No response received (timeout or network error)`;
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage += `: ${e.message}`;
      }

      console.error(errorMessage, e);
      throw new Error(errorMessage);
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