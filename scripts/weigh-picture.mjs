// What a level SOUNDS LIKE, second by second, out of the browser's own audio graph.
//
// docs/decisions/0226-the-level-holds-one-loudness.md.
//
// Usage:  node scripts/weigh-picture.mjs [--level=approach] [--seconds=90] [--step=0.2]
//                                        [--from=30 --to=60]
//
// ⚠️ IT EXISTS BECAUSE SIX REPORTS ARRIVED ON ONE STRETCH OF ONE LEVEL, AND FIVE ANSWERS WERE EACH
// CORRECT ABOUT A MODEL. `weigh-arc` sums powers in node and says so; `tests/clean.ts` runs a model
// of the compressor and says so. This drives `rig/arc.html`, which renders the level through
// `makeMusicOut`'s own graph in a real Chromium — the browser's DynamicsCompressorNode, the browser's
// WaveShaperNode, the browser's resampling — and reports K-weighted loudness (LUFS), which is the unit
// a listener's "volume" is closest to. docs/decisions/0027-measure-the-picture-not-the-model.md is
// the rule; this is the instrument it owes the sound channel.
//
//   weigh-arc        the mix summed in power, pre-shaper, in node       — the model, fast
//   weigh-picture    the speaker's signal, in the browser, in LUFS      — this file
//
// ⚠️ IT FAILS LOUD, per scripts/trace-frame.mjs: a tool whose only job is to produce an artefact for
// a human must exit non-zero when it produces nothing — no Chromium, a page error, a render that
// never finished.
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createServer } from 'vite';
import { launchChromium } from './chromium.mjs';

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit === undefined ? fallback : hit.slice(name.length + 3);
};
const level = arg('level', 'approach');
const seconds = Number(arg('seconds', '90'));
const step = Number(arg('step', '0.2'));
const from = Number(arg('from', 'NaN'));
const to = Number(arg('to', 'NaN'));
const windowed = Number.isFinite(from) && Number.isFinite(to);

const root = fileURLToPath(new URL('..', import.meta.url));

const server = await createServer({
  root,
  configFile: resolve(root, 'vite.config.ts'),
  logLevel: 'error',
  server: { port: 5187, strictPort: false, open: false, host: '127.0.0.1' },
});
await server.listen();
const base = server.resolvedUrls?.local?.[0];
if (!base) {
  console.error('weigh-picture: vite gave no URL');
  process.exit(1);
}

let browser;
try {
  browser = await launchChromium({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto(`${base}rig/arc.html?level=${level}&seconds=${seconds}&step=${step}`);
  await page.waitForFunction(() => window.__picture !== undefined, null, { timeout: 900_000 });
  const picture = await page.evaluate(() => window.__picture);
  if (picture.error || picture.seconds.length === 0) {
    console.error(`weigh-picture: the page produced nothing — ${picture.error ?? 'no seconds'}`);
    for (const e of errors) console.error(`  ${e}`);
    process.exit(1);
  }
  console.log(`\n══ ${level} — the speaker's signal, out of Chromium's own graph ═══════════════════`);
  console.log('K-weighted loudness (LUFS) is the listener\'s unit; `step` is the change since the line above.\n');
  console.log('  time   rung        rms dBFS     LUFS    step');
  let previous = null;
  let lastRung = null;
  for (const s of picture.seconds) {
    const change = previous === null ? 0 : s.loud - previous;
    previous = s.loud;
    const turned = lastRung !== null && lastRung !== s.rung;
    lastRung = s.rung;
    if (windowed && (s.second < from || s.second > to)) continue;
    const mm = String(Math.floor(s.second / 60));
    const ss = String(s.second % 60).padStart(2, '0');
    console.log(
      `  ${mm}:${ss}   ${s.rung.padEnd(10)}  ${s.rms.toFixed(1).padStart(7)}  ${s.loud.toFixed(1).padStart(7)}  ${(change >= 0 ? '+' : '') + change.toFixed(1)}${turned ? '   ← rung' : ''}`,
    );
  }
  // What each rung SETTLES to: the mean of its last five seconds, which is past every ramp.
  console.log('\n  rung        settled LUFS   over run');
  const byRung = new Map();
  for (const s of picture.seconds) {
    if (!byRung.has(s.rung)) byRung.set(s.rung, []);
    byRung.get(s.rung).push(s.loud);
  }
  const settle = (list) => list.slice(Math.max(0, list.length - 5)).reduce((a, b) => a + b, 0) / Math.min(5, list.length);
  const runLevel = byRung.has('run') ? settle(byRung.get('run')) : NaN;
  for (const [rung, list] of byRung) {
    const settled = settle(list);
    console.log(`  ${rung.padEnd(10)}  ${settled.toFixed(1).padStart(12)}   ${(settled - runLevel >= 0 ? '+' : '') + (settled - runLevel).toFixed(1)}`);
  }
  console.log('\n  the browser\'s compressor at MUSIC_COMPRESSOR, on a 1 kHz sine');
  console.log('  in dBFS   out dBFS   gain');
  for (const p of picture.compressor) {
    console.log(`  ${p.inDb.toFixed(0).padStart(7)}   ${p.outDb.toFixed(1).padStart(8)}   ${(p.outDb - p.inDb >= 0 ? '+' : '') + (p.outDb - p.inDb).toFixed(1)}`);
  }
  if (errors.length > 0) {
    console.error('\npage errors:');
    for (const e of errors) console.error(`  ${e}`);
    process.exit(1);
  }
} finally {
  await browser?.close();
  await server.close();
}
