import { APP_VERSION, BUILD_ID, GAME_TITLE } from './brand.ts';

// Deliberately trivial. Its one job at this phase is to be a real module graph with a real
// consumer of `brand.ts`, so `npm run build` proves the version and commit injections actually
// reach the bundle rather than only type-checking — and so they are not tree-shaken back out,
// which would make the guards in `tests/brand.test.ts` assert nothing.
const app = document.querySelector('#app');
if (app) app.textContent = `${GAME_TITLE} ${APP_VERSION} (${BUILD_ID})`;
