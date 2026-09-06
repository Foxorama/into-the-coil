// A resolve hook so a script can import the frame — `node --import ./scripts/ts.mjs <script>`.
//
// Three files under src/app import `../content/actions.js` — the extension Vite resolves to the
// `.ts` beside it and node does not — and the frame's `GameFrame` uses a parameter property, which
// node strips only under `--experimental-transform-types`. Every other `scripts/weigh-*.mjs` imports
// content alone and needs neither; an instrument that drives the frame needs both, and this is the
// half a flag cannot carry. Registered by `scripts/ts.mjs`.

import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export async function resolve(specifier, context, next) {
  if (specifier.endsWith('.js') && (specifier.startsWith('./') || specifier.startsWith('../'))) {
    const asTs = specifier.slice(0, -'.js'.length) + '.ts';
    if (context.parentURL !== undefined && existsSync(fileURLToPath(new URL(asTs, context.parentURL)))) {
      return next(asTs, context);
    }
  }
  return next(specifier, context);
}
