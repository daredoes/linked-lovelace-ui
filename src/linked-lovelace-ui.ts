import './types';
import { LIB_VERSION } from './version';
import { localize } from './localize/localize';
import StaticLinkedLovelace from './shared-linked-lovelace';
import { log } from './helpers';

log(`${localize('common.version')} ${LIB_VERSION}`);
(async () => {
  // Wait for scoped customElements registry to be set up
  // otherwise the customElements registry card-mod is defined in
  // may get overwritten by the polyfill if card-mod is loaded as a module
  while (customElements.get('home-assistant') === undefined)
    await new Promise((resolve) => window.setTimeout(resolve, 100));

  StaticLinkedLovelace.instance.log('initialized');
})();

import './linked-lovelace-template';

