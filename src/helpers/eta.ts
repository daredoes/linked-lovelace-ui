import type { DashboardCard } from "../types/DashboardCard";
import type { LinkedLovelacePartial } from "../types/LinkedLovelacePartial";
import type { DashboardPartialsCard } from "../types/DashboardPartialsCard";
import { LINKED_LOVELACE_PARTIALS } from "../constants";
import axios from "axios";

// Extracts the template from the card based on whether it has the key "url" or "template".
export const getCardTemplate = async (possiblePartial: LinkedLovelacePartial) => {
  if (possiblePartial.url) {
    try {
      const response = await axios.get(possiblePartial.url, { responseType: 'text'})
      if (typeof response.data === 'string') {
        return response.data
      }
    } catch (e) {
      console.error("Could not fetch data from url", e, possiblePartial)
    }
  } else if (possiblePartial.template) {
    return possiblePartial.template
  }
  return ''
}

export const loadPartialData  = async (possiblePartial: LinkedLovelacePartial) => {
  if (possiblePartial.key) {
    // Keep all of the data linked in the partial, and extract the template if it is URL-based
    return {[possiblePartial.key] : { ...possiblePartial, template: await getCardTemplate(possiblePartial)}} as Record<string, LinkedLovelacePartial>
  }
  return {}
}

// Takes a Lovelace Dashboard Card and extracts the data as a partial if the type matches the linked lovelace partials key 
export const getPartialsFromCard = async (card: DashboardCard): Promise<Record<string, LinkedLovelacePartial>> => {
  let partials:  Record<string, LinkedLovelacePartial> = {};
  // Only extract data from cards that are (custom:linked-lovelace-partials)
  if (card.type === `custom:${LINKED_LOVELACE_PARTIALS}`) {
    const parentCard: DashboardPartialsCard = card as DashboardPartialsCard;
    // iterates over list of partials listed in the card, which are objects that may contain data that should be asynchronously downloaded
    const parsing = await Promise.all(parentCard.partials?.map(loadPartialData) || [])
    // Once all asynchronous chunks have loaded data into the parent dictionary, continue
    console.log("data", parsing)
    parsing.forEach((data) => {
      partials = {...partials, ...data}
    })
  }
  // Send back all extracted partials from the card
  return partials;
}