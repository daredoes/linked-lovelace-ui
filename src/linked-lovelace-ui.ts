import './types';
import { LIB_VERSION } from './version';
import { log } from './util';
import { initialize } from './instance';
import './linked-lovelace-template';
import './linked-lovelace-status';
import './linked-lovelace-partials';

initialize(() => { log(`Version: ${LIB_VERSION}`); })

