// entrypoint.ts
import "src/types/global" // Add global types for custom-card-helpers
import { LIB_VERSION } from 'src/version'; // Dynamically set during the build process
import { Debug } from 'src/debug';
// Cards to add to Home Assistant
import 'src/linked-lovelace-status';
import 'src/linked-lovelace-partials';
import 'src/linked-lovelace-template';
import './linked-lovelace-key'

export const initialize = () => {
  (async () => {
    // Wait for scoped customElements registry to be set up
    // otherwise the customElements registry card-mod is defined in
    // may get overwritten by the polyfill if card-mod is loaded as a module
    while (customElements.get('home-assistant') === undefined)
      await new Promise((resolve) => window.setTimeout(resolve, 100));
  
    Debug.instance.log(`Initialized Linked Lovelace UI Version: ${LIB_VERSION}`)
  })();
}

initialize()
