// `node --experimental-transform-types --import ./scripts/ts.mjs <script>` — the loader a script that
// drives the frame needs. See `scripts/ts-hooks.mjs`.

import { register } from 'node:module';

register('./ts-hooks.mjs', import.meta.url);
