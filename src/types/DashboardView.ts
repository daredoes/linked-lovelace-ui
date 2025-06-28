import { DashboardCard } from "./DashboardCard";

export interface DashboardView {
  title: string;
  path?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  badges?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cards?: DashboardCard[];
  sections?: DashboardCard[];
  theme?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: any;
}