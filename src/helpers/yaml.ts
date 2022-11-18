import * as YAML from 'yaml';
import { Schema } from 'yaml/types';

const DEFAULT_RESOLVE = (_, node) => {
  const { handle, suffix } = node.tag as { handle: string; suffix: string };
  const tag = `${handle}${suffix}`;
  return `${tag} ${node.rawValue}`;
};

const DEFAULT_IDENTIFY = (value) => {
  return typeof value === 'string';
};

const parseOptionTag: Schema.CustomTag = {
  tag: '!include',
  resolve: DEFAULT_RESOLVE,
  identify: DEFAULT_IDENTIFY,
};

export const createCustomTag = (tag: string): Schema.CustomTag => {
  return Object.assign({}, parseOptionTag, { tag });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type customTagsType = (Schema.TagId | Schema.Tag)[] | ((tags: Schema.Tag[]) => Schema.Tag[]) | undefined
export const fetchYamlToJson = async (url: string, customTags: customTagsType = [parseOptionTag]): Promise<Record<string, any> | undefined> => {
  const res = await fetch(url);
  if (res.status >= 200 && res.status < 300) {
    {
      const text = await res.text();
      const parsedRes = YAML.parse(text, {
        customTags
      });
      return parsedRes;
    }
  }
  return undefined;
};
