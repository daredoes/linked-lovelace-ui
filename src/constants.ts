export const LINKED_LOVELACE_PARTIALS = 'linked-lovelace-partials'
export const LINKED_LOVELACE_TEMPLATE_REPLACEMENT_KEYS_KEY = 'll_keys'
export const LINKED_LOVELACE_TEMPLATE_REPLACEMENT_KEY = 'll_key'
export const LINKED_LOVELACE_TEMPLATE_KEY = 'll_template'
export const LINKED_LOVELACE_TEMPLATE_CONTEXT_KEY = 'll_context'

export interface LinkedLovelaceUpdatableConstants {
    contextKeys: string;
    isTemplateKey: string;
    useTemplateKey: string;
    contextKey: string;
}

export const defaultLinkedLovelaceUpdatableConstants: LinkedLovelaceUpdatableConstants = {
    contextKey: LINKED_LOVELACE_TEMPLATE_CONTEXT_KEY,
    contextKeys: LINKED_LOVELACE_TEMPLATE_REPLACEMENT_KEYS_KEY,
    isTemplateKey: LINKED_LOVELACE_TEMPLATE_REPLACEMENT_KEY,
    useTemplateKey: LINKED_LOVELACE_TEMPLATE_KEY,
}