/**
 * The score bench — 0428, 0429. The real game, stood on each screen the score is shown on.
 *
 * ⚠️ **EVERY SCREEN IS REACHED BY THE GAME'S OWN PATH.** The break is `world.onCleared()` — the call
 * the frame makes when a boss's death has played out — so the tally on it is the shell's own
 * arithmetic over a made-up level, not a copy of it. The run over is lives spent by `lifeLost`, and
 * the victory is every level banked and cleared. Only the counts the frame would have made by flying
 * (kills, bodies sent, hits, points) are written by hand, and that is what makes the bench a bench.
 *
 * `?seed` fills the table with made-up runs before the game mounts, so the title has something to
 * roll; *Wipe the table* empties it.
 */

import { mount } from '../src/app/mount.ts';
import { LEVEL_KINDS } from '../src/content/levels.ts';
import { SCORES_KEY, serialiseScores, type ScoreEntry } from '../src/save/scores.ts';
import { GOLFER_KINDS } from '../src/content/golfers.ts';

const stage = document.querySelector('#stage');
if (!stage) throw new Error('score bench: the page is not the page');

if (new URLSearchParams(location.search).has('seed')) {
  const made: ScoreEntry[] = [];
  for (let i = 0; i < 10; i++) {
    made.push({
      score: 480000 - i * 41000 + (i % 3) * 1370,
      bonus: 60000 - i * 5000,
      pilot: GOLFER_KINDS[i % GOLFER_KINDS.length]!,
      difficulty: 'savior',
      levels: Math.max(0, LEVEL_KINDS.length - i),
      cleared: i < 2,
      continues: i % 2,
      when: Date.UTC(2026, 8, 1 + i),
    });
  }
  localStorage.setItem(SCORES_KEY, serialiseScores(made));
}

const mounted = mount(stage, 'vivid');
if (mounted === null) throw new Error('score bench: the game would not mount');
const { world, dispatch, lifecycle, stateOf } = mounted.rig;

lifecycle.begin('savior', 'fighter');
dispatch({ slice: 'screen', type: 'show', screen: 'playing' });

/** A level flown well: most of it killed, one shield lost, a streak going. */
function flown(): void {
  world.score.spawned = 120;
  world.score.kills = 111;
  world.score.hits = 1;
  world.score.points = 84250;
  world.score.streak = 34;
  world.score.best = 58;
}

/** Bank `n` levels the way a clear does, without the break for each. */
function bankLevels(n: number): void {
  for (let i = 0; i < n; i++) {
    flown();
    world.onCleared();
    // The break's own button, so the run goes on the way the player's would.
    dispatch({ slice: 'screen', type: 'show', screen: 'playing' });
  }
}

const go: Record<string, () => void> = {
  playing: () => {
    flown();
    dispatch({ slice: 'screen', type: 'show', screen: 'playing' });
  },
  kill: () => {
    world.score.streak += 1;
    world.score.kills += 1;
    world.score.points += 250 * Math.min(8, 1 + Math.floor(world.score.streak / 10));
  },
  hit: () => {
    world.score.streak = 0;
    world.score.hits += 1;
  },
  cleared: () => {
    flown();
    // Two shields on the hull as it clears.
    world.ship.health = world.shipRow.health + 2;
    world.onCleared();
  },
  gameOver: () => {
    flown();
    while (stateOf().run.lives > 0) dispatch({ slice: 'run', type: 'lifeLost' });
  },
  victory: () => {
    bankLevels(LEVEL_KINDS.length - 1 - stateOf().run.level);
    flown();
    world.onCleared();
    dispatch({ slice: 'screen', type: 'show', screen: 'victory' });
  },
  title: () => dispatch({ slice: 'screen', type: 'show', screen: 'title' }),
  wipe: () => localStorage.removeItem(SCORES_KEY),
};

for (const button of document.querySelectorAll<HTMLButtonElement>('button[data-go]')) {
  button.addEventListener('click', () => go[button.dataset.go ?? '']?.());
}

// `?go=cleared` stands straight on a screen, for a photograph.
const asked = new URLSearchParams(location.search).get('go');
if (asked !== null) go[asked]?.();
