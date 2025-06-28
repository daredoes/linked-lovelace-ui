import { LLCard } from "./LLCard";
import { LLTemplateCard } from "./LLTemplateCard";


export interface DashboardCard extends LLCard, LLTemplateCard {
  cards?: DashboardCard[];
  card?: DashboardCard;
}