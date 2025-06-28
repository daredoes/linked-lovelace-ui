import { LovelaceCard, LovelaceCardEditor } from 'custom-card-helpers';

declare global {
  interface HTMLElementTagNameMap {
    'linked-lovelace-template-editor': LovelaceCardEditor;
    'hui-error-card': LovelaceCard;
  }
}
