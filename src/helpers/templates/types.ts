import { DashboardCard } from "../../types/DashboardCard";
import { Eta } from "eta";
import { LinkedLovelacePartial } from "../../types/LinkedLovelacePartial";
import { DashboardHolderCard } from "../../types/DashboardHolderCard";
export type OnTemplateObject = (obj: DashboardCard, contextData: Record<string | number | symbol, any>, skipUpdate?: boolean) => DashboardCard

interface RenderTemplateArgs {
    key: string,
    contextData: Record<string | number | symbol, any>,
    keys: string[] | Record<string, unknown>,
    eta: Eta
}

export type RenderTemplate = <T>(args: RenderTemplateArgs) => DashboardCard | T

export interface PartialsAndTemplates {
  partials: Record<string, LinkedLovelacePartial>,
  templates: Record<string, DashboardHolderCard>
}