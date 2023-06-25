import './types';
import { LIB_VERSION } from './version';
import { log } from './helpers';
import { initialize } from './instance';
import './linked-lovelace-template';
import './linked-lovelace-templates';

initialize(() => {log(`Version: ${LIB_VERSION}`);})

