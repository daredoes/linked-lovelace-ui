import type { DashboardCard } from '../../types/DashboardCard';
import { defaultLinkedLovelaceUpdatableConstants } from '../../constants';
import type { LinkedLovelaceUpdatableConstants } from '../../constants';
import { walkObject } from './walkObject';
import { onTemplateObjectFactory } from './onTemplateObjectFactory';


export const updateCardTemplate = (data: DashboardCard, templateData: Record<string | symbol | number, any> = {}, parentContext: Record<string | symbol | number, any> = {}, linkedLovelaceUpdatableConstants: LinkedLovelaceUpdatableConstants = defaultLinkedLovelaceUpdatableConstants): DashboardCard => {
  const onTemplateObject = onTemplateObjectFactory(linkedLovelaceUpdatableConstants, templateData)
  data = walkObject(data, parentContext, onTemplateObject, linkedLovelaceUpdatableConstants) as DashboardCard
  return data;
};
