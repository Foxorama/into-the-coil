// How big every hostile bullet and every enemy hull is drawn, in CSS pixels of the screen the
// play-tests are given.
//
// Usage:  node --experimental-transform-types --import ./scripts/ts.mjs scripts/weigh-sizes.mjs
//
// ⚠️ IT EXISTS BECAUSE A REPORT ARRIVED THAT NOTHING IN THE REPOSITORY COULD ANSWER — *"there's some
// enemy bullets that are incredibly small and hard to see and some enemy ships that just look like
// bullets so in some cases you can't tell what's what."* `tests/legibility.test.ts` asks whether two
// things share an INK; nothing asked how big either of them is, so *which of these is a ship* had no
// measurement at all. docs/decisions/0027-measure-the-picture-not-the-model.md: build the instrument
// that shows the reported thing before tuning anything.
//
// ⚠️ AND IN THE PLAYER'S PIXELS RATHER THAN IN WORLD UNITS, which is the whole point. A world unit is
// a number the file holds; the report is about what is on a screen, and the two are one multiply
// apart that nobody was doing.
//
// WHAT IT PRINTS
//
//   every shot, enemy and boss, smallest first, with its size in CSS pixels and in world units
//   the floor      the smallest hostile bullet, which is the *incredibly small* half of the report
//   the overlap    the biggest ordinary hostile bullet against the smallest enemy hull, which is the
//                  *ships that look like bullets* half — under 1 means the two categories cross
//
// ⚠️ A BLAST IS NOT A BULLET AND IS LEFT OUT OF THE OVERLAP. The bomb's area is drawn hundreds of
// pixels across on purpose; counting it would make the ratio meaningless and hide the thing the
// report is about.

import { SHOTS, SHOT_KINDS } from '../src/content/shots.ts';
import { ENEMIES, ENEMY_KINDS } from '../src/content/enemies.ts';
import { BOSSES, BOSS_KINDS } from '../src/content/bosses.ts';
import { WEAPONS, WEAPON_KINDS } from '../src/content/weapons.ts';
import { SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';
import { viewOf } from '../src/sim/camera.ts';

/** The screen every report in `reports/` was made on. */
const VIEW = viewOf(1280, 720);

/*
  What the player's own guns throw, so a hostile bullet can be told from one of the player's.

  ⚠️ **THE WEAPON ROWS ARE NOT THE WHOLE OF IT, AND READING ONLY THOSE PUT FOUR OF THE PLAYER'S OWN
  SHOTS IN THE HOSTILE COLUMN.** `WEAPONS[k].shot` is what a gun fires; the missile, the seeker, the
  bomb and its blasts leave the ship by other routes entirely, so the first run of this reported the
  bomb as an enemy bullet and the smallest-hull ratio was measured against the wrong set. The
  instrument built to answer *which of these is a ship* got the sides wrong, which is the failure
  `docs/decisions/0027-measure-the-picture-not-the-model.md` is about, in the measuring device.

  ⚠️ **AND IT IS A HAND-KEPT LIST, WHICH IS OWED.** Nothing on a `ShotRow` says whose a shot is —
  `tests/legibility.test.ts` infers it from the ink, which `docs/decisions/0295-a-ranking-guard-is-a-content-limiter.md`
  turned from a mandate into a convention. A `hostile` field on the row would answer both and is a
  change to the bullet table, so it is named here rather than assumed.
*/
export const PLAYER_SHOTS = new Set([
  ...WEAPON_KINDS.map((k) => WEAPONS[k].shot),
  'missile',
  'seeker',
  'bomb',
  'blast',
  'blastHalf',
  'blastWide',
  'blastWidest',
]);

/** A bomb's area, which is drawn hundreds of pixels across on purpose and is not a bullet. */
export const isBlast = (kind) => kind.startsWith('blast');

/** Every drawn thing that can be on the field against the player, in CSS pixels of that screen. */
export function weighSizes() {
  const rows = [];
  const add = (what, kind, sprite) => {
    const units = SPRITE_EXTENT[SPRITE_KINDS[sprite]];
    rows.push({ what, kind, units, px: units * VIEW.scale, whose: what === 'shot' && PLAYER_SHOTS.has(kind) ? 'player' : 'enemy' });
  };
  for (const kind of SHOT_KINDS) add('shot', kind, SHOTS[kind].sprite);
  for (const kind of ENEMY_KINDS) add('enemy', kind, ENEMIES[kind].sprite);
  for (const kind of BOSS_KINDS) add('boss', kind, BOSSES[kind].sprite);
  rows.sort((a, b) => a.px - b.px);
  return rows;
}

/** The two numbers the report is about. */
export function legibility(rows = weighSizes()) {
  const bullets = rows.filter((r) => r.what === 'shot' && r.whose === 'enemy' && !isBlast(r.kind));
  const hulls = rows.filter((r) => r.what === 'enemy');
  const smallest = bullets[0];
  const biggest = bullets[bullets.length - 1];
  const thinnest = hulls[0];
  return { smallest, biggest, thinnest, overlap: thinnest.px / biggest.px };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  const rows = weighSizes();
  console.log(`a 1280x720 screen: ${VIEW.scale.toFixed(2)} px per world unit\n`);
  for (const r of rows) {
    console.log(`${r.px.toFixed(1).padStart(6)} px ${r.units.toFixed(1).padStart(6)} u  ${r.what.padEnd(6)} ${r.whose.padEnd(6)} ${r.kind}`);
  }
  const { smallest, biggest, thinnest, overlap } = legibility(rows);
  console.log(`\nsmallest hostile bullet  ${smallest.px.toFixed(1)} px  (${smallest.kind})`);
  console.log(`biggest hostile bullet   ${biggest.px.toFixed(1)} px  (${biggest.kind})`);
  console.log(`smallest enemy hull      ${thinnest.px.toFixed(1)} px  (${thinnest.kind})`);
  console.log(`\nhull against bullet      ${overlap.toFixed(2)}x  — under 1 means a ship is smaller than a bullet`);
  const crossed = rows.filter((r) => r.what === 'enemy' && r.px < biggest.px);
  if (crossed.length > 0) {
    console.log(`\n${crossed.length} hull(s) smaller than the biggest bullet: ${crossed.map((r) => r.kind).join(', ')}`);
  }
}
