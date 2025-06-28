// entrypoint.ts
import "./types/global" // Add global types for custom-card-helpers
import { LIB_VERSION } from './version'; // Dynamically set during the build process
import { log } from './helpers';
import { initialize } from './instance';
// Cards to add to Home Assistant
import './linked-lovelace-template';
import './linked-lovelace-status';
import './linked-lovelace-partials';

initialize(() => {log(`Version: ${LIB_VERSION}`);})

