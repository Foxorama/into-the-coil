/**
 * The bench: the game itself, with a level select and a scrub bar.
 *
 * `docs/decisions/0205-the-bench-jumps-to-where-the-thing-is.md`.
 *
 * ── WHAT IT IS FOR ──────────────────────────────────────────────────────────────────────────────
 *
 * Asked for, 2026-09-01: *"we'll need to review graphics, weapons, levels, sounds, music, basically
 * everything and having to playthrough every time is going to be hard without an easy harness that we
 * can use to jump around."*
 *
 * ⚠️ **IT IS THE ANSWER TO A MEASURED COST AND NOT A CONVENIENCE.** Across
 * `docs/decisions/0203-the-rule-was-never-about-size.md` and
 * `docs/decisions/0204-a-landmark-is-lit-by-the-place-it-stands-in.md`, **four of the six defects
 * were invisible to every guard in the repository and obvious in one screenshot** — columns drawn
 * sideways, feet cut off in mid-air, a rectangle clipped around the gas, and entirely the wrong
 * colour. Guards found the other two. A picture is the only instrument that has caught anything in
 * that arc, and until now each one cost a temporary content edit, a rebuild and a boss fight.
 *
 * ⚠️ **IT PLAYS THE GAME AND NOT A MODEL OF IT** — `docs/decisions/0116-the-rig-plays-the-level.md`.
 * `mount()` is the shell's own, `world` is the field the player flies in, and the level is put on it
 * with `advanceLevel`, which is the function a real level boundary calls. The WAV rig drifted from
 * the game twice by rebuilding it; the cheapest way not to drift is not to have a second copy.
 */

import { mount } from '../src/app/mount.ts';
import { advanceLevel } from '../src/app/frame.ts';
import { LEVELS, LEVEL_KINDS, type LevelKind } from '../src/content/levels.ts';
import { THEMES } from '../src/content/themes.ts';
import { WEAPON_KINDS, type WeaponKind } from '../src/content/weapons.ts';
import { SCROLL_PER_STEP } from '../src/sim/flight.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';

const stage = document.querySelector('#stage');
const levelPick = document.querySelector<HTMLSelectElement>('#level');
const along = document.querySelector<HTMLInputElement>('#along');
const where = document.querySelector('#where');
const hold = document.querySelector<HTMLInputElement>('#hold');
const note = document.querySelector('#note');
if (!stage || !levelPick || !along || !where || !hold || !note) throw new Error('bench: the page is not the page');

const mounted = mount(stage, 'vivid');
if (mounted === null) throw new Error('bench: the game would not mount');
const { world, dispatch, lifecycle } = mounted.rig;

for (const kind of LEVEL_KINDS) {
  const option = document.createElement('option');
  option.value = kind;
  option.textContent = `${LEVEL_KINDS.indexOf(kind) + 1} — ${THEMES[LEVELS[kind].theme].title}`;
  levelPick.append(option);
}

/** How far into the current level the camera is, in world units. */
const localAlong = (): number => world.cameraAlong - world.levelOrigin;

/**
 * Put a level on the field and stand the camera at `at` units into it.
 *
 * ⚠️ **THE SPAWN CURSORS ARE WOUND FORWARD, AND WITHOUT THAT THE JUMP IS A LIE.** The spawner walks
 * `w.level.waves` from `nextWave` and fires everything whose `at` is behind the horizon — so a camera
 * moved to 1299 with the cursor still at zero empties the whole first half of the level onto the
 * screen at once. Winding the cursors is what makes *jump to 1299* mean the same thing as *fly to
 * 1299*, which is the only version of this tool worth having.
 */
function goTo(kind: LevelKind, at: number): void {
  advanceLevel(world, LEVELS[kind], LEVEL_KINDS.indexOf(kind));
  world.cameraAlong = world.levelOrigin + at;
  world.prevCameraAlong = world.cameraAlong;
  while (world.nextWave < world.level.waves.length && world.level.waves[world.nextWave]!.at <= at) {
    world.nextWave += 1;
  }
  while (world.nextPickup < world.level.pickups.length && world.level.pickups[world.nextPickup]!.at <= at) {
    world.nextPickup += 1;
  }
  world.bossSpawned = at >= world.level.bossAt;
  readOut();
}

/** The one line that says where the bench is standing, in the units the level script is written in. */
function readOut(): void {
  const kind = LEVEL_KINDS[world.levelIndex] ?? LEVEL_KINDS[0]!;
  const at = Math.round(localAlong());
  const seconds = (at / (SCROLL_PER_STEP * STEPS_PER_SECOND)).toFixed(1);
  const section = [...LEVELS[kind].sections].reverse().find((entry) => entry.at <= at);
  where!.textContent = `${at} units · ${seconds}s · ${section?.section ?? 'run'}`;
}

function currentKind(): LevelKind {
  return (levelPick!.value || LEVEL_KINDS[0]!) as LevelKind;
}

levelPick.addEventListener('change', () => {
  const kind = currentKind();
  along.max = String(Math.ceil(LEVELS[kind].bossAt));
  along.value = '0';
  goTo(kind, 0);
});

along.addEventListener('input', () => {
  goTo(currentKind(), Number(along.value));
});

/*
  ⚠️ **A RUN HAS TO BE BEGUN BEFORE A LEVEL CAN BE PUT ON THE FIELD.** `begin` resolves the
  difficulty row and the weapon, and `show playing` is what makes the frame draw the field rather
  than a menu — the same two the shell dispatches. Skipping either gives a black canvas and no
  message, which is the failure mode `docs/decisions/0199-a-verdict-is-an-exit-code.md` is about
  wearing a different hat.
*/
lifecycle.begin('savior');
dispatch({ slice: 'screen', type: 'show', screen: 'playing' });

/*
  ── THE GUN, FROM THE QUERY — 0233 ──────────────────────────────────────────────────────────────

  `?weapon=arc&tier=3` fits the arc at three rungs before the level is put on the field, through the
  same `upgraded` action a pickup dispatches — so the hull, the ladder and the cue are the game's own
  and not a copy. A weapon is a kind now and a bench that could only fly the base gun could not show
  the other one at all; this is the bench jumping to where the thing is, one axis over.
*/
const query = new URLSearchParams(location.search);
const fitted = query.get('weapon');
if (fitted !== null && (WEAPON_KINDS as readonly string[]).includes(fitted)) {
  const rungs = Math.max(1, Number(query.get('tier') ?? '1'));
  for (let i = 0; i < rungs; i++) dispatch({ slice: 'run', type: 'upgraded', upgrade: 'weapon', kind: fitted as WeaponKind });
}
along.max = String(Math.ceil(LEVELS[LEVEL_KINDS[0]!].bossAt));
goTo(LEVEL_KINDS[0]!, 0);

/*
  ── HOLD ────────────────────────────────────────────────────────────────────────────────────────

  ⚠️ **IT PINS THE CAMERA AND DOES NOT PAUSE THE GAME, AND THE DIFFERENCE IS THE POINT.** There is no
  pause screen in the shell, and adding one to the game so that a tool could use it would be the tail
  wagging the dog — a rig may not change what it measures
  (`docs/decisions/0116-the-rig-plays-the-level.md`).

  So this holds `cameraAlong` where the scrub bar left it and lets everything else run. The backdrop
  is camera-driven, so it stops dead — which is what a landmark is reviewed against — while enemies,
  shots and the music go on moving, which is what makes the picture worth looking at at all. A frozen
  frame would have hidden the seam in `skyNebula` twice over.
*/
const holdAt = (): void => {
  if (!hold.checked) return;
  world.cameraAlong = world.levelOrigin + Number(along.value);
  world.prevCameraAlong = world.cameraAlong;
};

// The scrub bar is a jump, so the readout would go stale the moment the level walked on from it.
setInterval(() => {
  holdAt();
  readOut();
}, 100);

note.textContent =
  'The game itself, not a copy of it — mount() and advanceLevel(), the same two a level boundary calls.';
