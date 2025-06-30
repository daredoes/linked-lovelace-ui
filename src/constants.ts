export const LINKED_LOVELACE_PARTIALS = 'linked-lovelace-partials'
export const LINKED_LOVELACE_TEMPLATE_REPLACEMENT_KEYS_KEY = 'll_keys'
export const LINKED_LOVELACE_TEMPLATE_REPLACEMENT_KEY = 'll_key'
export const LINKED_LOVELACE_TEMPLATE_KEY = 'll_template'
export const LINKED_LOVELACE_TEMPLATE_CONTEXT_KEY = 'll_context'

export interface LinkedLovelaceUpdatableConstants {
    context_keys: string;
    root_card_key: string;
    template_key: string;
    context_key: string;
}

export const defaultLinkedLovelaceUpdatableConstants: LinkedLovelaceUpdatableConstants = {
    context_keys: LINKED_LOVELACE_TEMPLATE_REPLACEMENT_KEYS_KEY,
    root_card_key: LINKED_LOVELACE_TEMPLATE_REPLACEMENT_KEY,
    template_key: LINKED_LOVELACE_TEMPLATE_KEY,
    context_key: LINKED_LOVELACE_TEMPLATE_CONTEXT_KEY,
}