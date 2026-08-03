import { APP_VERSION, GAME_TITLE } from './brand.ts';

// Deliberately trivial. Its one job at this phase is to be a real module graph with a real
// consumer of `brand.ts`, so `npm run build` proves the version injection actually reaches the
// bundle rather than only type-checking.
const app = document.querySelector('#app');
if (app) app.textContent = `${GAME_TITLE} ${APP_VERSION}`;
