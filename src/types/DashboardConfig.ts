import { DashboardView } from "./DashboardView";

export interface DashboardConfig {
  views?: DashboardView[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: any;
}