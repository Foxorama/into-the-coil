// What the MUSIC ROOM plays against what a RUN plays — the two mixes, side by side.
//
// Usage:  node scripts/weigh-room.mjs [theme ...]
//
// ⚠️ IT EXISTS BECAUSE A REPORT ARRIVED THAT NO NUMBER IN THIS REPOSITORY COULD CHECK. Reported
// 2026-09-03, of the room `docs/decisions/0210-the-title-plays-the-music.md` shipped the day before:
// *"why the ingame music sounds different from the music that plays in the music menu section."*
//
// ⚠️ THE ROOM PLAYS ONE RUNG AND A LEVEL WALKS FOUR. `src/app/mount.ts`'s `AUDITION_RUNG` is `run`,
// and 0210's own words for that choice are *"the rung a level spends most of its length at"*. That
// sentence is the thing this script measures, and it has not been true since
// `docs/decisions/0158-a-level-says-where-its-sections-open.md` gave every level a four-entry script.
//
// ⚠️ THE UNIT IS `apartBy`'s AND IT IS ALREADY CALIBRATED, which is the only reason a number here
// means anything. `docs/decisions/0147-a-place-is-a-balance.md` measured **1.9 dB** between the two
// places a play-test called interchangeable and **6.0 dB** between the two it called different
// worlds. So a rung more than 6 dB from the room's is, by this project's own established scale, as
// far from what the room auditions as one place is from another.
//
// ⚠️ THE ARITHMETIC IS `tests/pace.ts`'s AND IS NOT REPEATED HERE, on `scripts/weigh-rung.mjs`'s own
// terms — a printed figure that disagrees with an asserted one is
// docs/decisions/0029-the-tracked-record-is-the-record.md happening in arithmetic. This file is the
// FORMATTING; the measurement is shared.

import { AUDITION_FIGHT_UNITS, auditionAura, auditionLength, auditionRung, levelOfPlace } from '../src/app/music.ts';
import { SAMPLE_RATE } from '../src/app/sound.ts';
import { SCROLL_PER_STEP } from '../src/sim/flight.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { MUSIC_LAYERS } from '../src/content/music.ts';
import { THEMES, THEME_KINDS, paceAt } from '../src/content/themes.ts';
import { loopsAt } from '../tests/bakes.ts';
import { apartBy, profileAt, soundingAt } from '../tests/pace.ts';

/**
 * The rung the room held before 0212, kept here as the thing every figure below is measured against.
 *
 * ⚠️ **IT IS NOT READ FROM `src/` ANY MORE, AND THAT IS THE POINT** — the constant it named is gone,
 * so this is a historical baseline rather than a second copy of a live number. What the room plays
 * now is the walk in the second table, and the two tables together are the before and the after.
 */
const AUDITION_RUNG = 'run';

/** The rungs a level actually walks, in the order it walks them. The room plays only the first. */
const WALKED = ['run', 'push', 'surge', 'approach', 'boss', 'bossPeak'];

/** 0147's own two readings, so the number below is read against something rather than admired. */
const INTERCHANGEABLE_DB = 1.9;
const DIFFERENT_WORLDS_DB = 6.0;

const UNITS_PER_SECOND = SCROLL_PER_STEP * STEPS_PER_SECOND;

const themes = process.argv.length > 2 ? process.argv.slice(2) : THEME_KINDS;

/**
 * How long a level holds each of its sections, in seconds.
 *
 * ⚠️ **OFF THE LEVEL'S OWN SCRIPT AND `bossAt`, NOT OFF A SHARED SHAPE** — 0158. The last section
 * ends where the boss arrives, which is the one boundary a script may not name.
 *
 * ⚠️ **THE FIGHT IS NOT IN HERE AND THAT UNDERSTATES THE CASE.** A boss is beaten in time rather
 * than in distance, so its two rungs have no length to read off a table — every second of a fight is
 * a second more that is not `run`.
 */
function secondsPerSection(level) {
  const out = new Map();
  const script = level.sections;
  for (let i = 0; i < script.length; i++) {
    const from = script[i].at;
    const to = i + 1 < script.length ? script[i + 1].at : level.bossAt;
    const held = (to - from) / UNITS_PER_SECOND;
    out.set(script[i].section, (out.get(script[i].section) ?? 0) + held);
  }
  return out;
}

/** Which level plays this place, so a place's own script is the one reported against it. */
function levelOf(theme) {
  const kind = LEVEL_KINDS.find((k) => LEVELS[k].theme === theme);
  return kind === undefined ? null : LEVELS[kind];
}

for (const theme of themes) {
  const loops = loopsAt(SAMPLE_RATE, theme);
  const room = profileAt(theme, AUDITION_RUNG, loops);
  const roomHeard = soundingAt(theme, AUDITION_RUNG, loops);
  const level = levelOf(theme);
  const held = level === null ? new Map() : secondsPerSection(level);
  const travelled = [...held.values()].reduce((a, b) => a + b, 0);

  console.log(`\n── ${THEMES[theme].title} (${theme}) ────────────────────────────────────────`);
  console.log(
    `the room plays ${AUDITION_RUNG}: ${roomHeard.length} layers, ` +
      `${paceAt(theme, AUDITION_RUNG).toFixed(0)} notes a bar`,
  );
  console.log('\nrung        layers  notes/bar   apart from the room   held in a level');
  for (const rung of WALKED) {
    const sounding = soundingAt(theme, rung, loops);
    const apart = apartBy(room, profileAt(theme, rung, loops));
    const seconds = held.get(rung) ?? 0;
    /*
      ⚠️ **THE VERDICT IS 0147'S TWO READINGS AND NOT A THRESHOLD OF MY OWN.** A number invented here
      would be a fourth opinion about a quantity that already has a calibrated one — CLAUDE.md's *no
      counting guard*, met inside a printout.
    */
    const verdict =
      rung === AUDITION_RUNG
        ? ''
        : apart >= DIFFERENT_WORLDS_DB
          ? '⚠️ another world away'
          : apart >= INTERCHANGEABLE_DB
            ? 'audibly apart'
            : 'interchangeable';
    const share =
      seconds > 0
        ? `${seconds.toFixed(0).padStart(4)}s  ${((seconds / travelled) * 100).toFixed(0).padStart(3)}%`
        : rung === 'boss' || rung === 'bossPeak'
          ? '   the fight'
          : '        —';
    console.log(
      `${rung.padEnd(10)} ${String(sounding.length).padStart(5)}  ${paceAt(theme, rung).toFixed(0).padStart(8)}  ` +
        `${apart.toFixed(1).padStart(15)} dB   ${share.padStart(12)}  ${verdict}`,
    );
  }

  const away = WALKED.filter((r) => r !== AUDITION_RUNG).reduce(
    (sum, r) => (apartBy(room, profileAt(theme, r, loops)) >= INTERCHANGEABLE_DB ? sum + (held.get(r) ?? 0) : sum),
    0,
  );
  console.log(
    `\nof ${travelled.toFixed(0)}s of travel, ${(travelled - (held.get(AUDITION_RUNG) ?? 0)).toFixed(0)}s ` +
      `is spent above the rung the room plays, and ${away.toFixed(0)}s of that is a balance ` +
      `${INTERCHANGEABLE_DB} dB or more away from it — before the fight, which has no length here at all.`,
  );

  /*
    ⚠️ **AND WHICH LAYERS ARE SIMPLY NOT THERE**, which is the half of the answer a dB figure hides:
    `apartBy` compares only the layers BOTH mixes sound, so a rung that opens four new parts and
    changes nothing else reads as zero.
  */
  const missing = MUSIC_LAYERS.filter(
    (l) => !roomHeard.includes(l) && WALKED.some((r) => soundingAt(theme, r, loops).includes(l)),
  );
  if (missing.length > 0) {
    console.log(`never heard at the old fixed rung, heard in a run: ${missing.join(', ')}`);
  }

  /*
    ── AND WHAT THE ROOM PLAYS NOW — 0212 ────────────────────────────────────────────────────────

    ⚠️ **THE SAME WALK THE ROOM ITSELF RUNS, THROUGH `auditionRung`.** Not a model of it: this is the
    function `src/app/mount.ts` asks every step, over the same level row, so a printout that
    disagreed with the room would be a defect in the room rather than in the formatting.
  */
  if (level !== null) {
    const length = auditionLength(level);
    console.log('\nthe walk, at the game\'s own scroll rate:');
    console.log('at        time    rung        aura');
    let last = null;
    for (let along = 0; along <= length; along += 10) {
      const rung = auditionRung(level, along);
      if (rung === last) continue;
      last = rung;
      const seconds = along / UNITS_PER_SECOND;
      console.log(
        `${along.toFixed(0).padStart(6)}  ${clock(seconds).padStart(6)}  ${rung.padEnd(10)}  ` +
          `${auditionAura(level, theme, along).toFixed(2)}`,
      );
    }
    console.log(
      `${length.toFixed(0).padStart(6)}  ${clock(length / UNITS_PER_SECOND).padStart(6)}  ` +
        `(round again)   — of which the fight is ` +
        `${(AUDITION_FIGHT_UNITS / UNITS_PER_SECOND).toFixed(0)}s`,
    );
  }
}

/** `m:ss`, because a walk is now a thing with a duration and a printout of 170.6 is not readable. */
function clock(seconds) {
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

console.log(
  `\n0147 measured ${INTERCHANGEABLE_DB} dB between the two places a play-test called interchangeable, ` +
    `and ${DIFFERENT_WORLDS_DB} dB between the two it called different worlds.`,
);
