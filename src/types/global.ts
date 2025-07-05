import { LovelaceCard, LovelaceCardEditor } from 'custom-card-helpers';

declare global {
  interface HTMLElementTagNameMap {
    'linked-lovelace-template-editor': LovelaceCardEditor;
    'linked-lovelace-holder-editor': LovelaceCardEditor;
    'hui-error-card': LovelaceCard;
    'hui-element-editor': LovelaceCardEditor;
  }
  
}
