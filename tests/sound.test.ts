import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

import { CUES, CUE_KINDS, MAX_CUE_SECONDS, TWIN_KINDS, type CueKind } from '../src/content/cues.ts';
import { DEFAULT_SOUND, SOUNDS, SOUND_KINDS } from '../src/content/sound.ts';
import { MAX_CUE_SAMPLES, MAX_VOICES, SAMPLE_RATE, bakeCues, makeSpeaker, sampleCue, type AudioOut } from '../src/app/sound.ts';
import { makeRng } from '../src/sim/rng.ts';
import { SCREENS } from '../src/state/screens.ts';
import { initialState, reduce, type Action } from '../src/state/root.ts';
import { LEVELS } from '../src/content/levels.ts';
import { GameFrame, SHIP_START_ALONG } from '../src/app/frame.ts';
import { playableWorld } from './world.ts';

/**
 * SOUND — THE TABLE, THE SAMPLES, THE GATE, AND THE BAN.
 *
 * `docs/decisions/0072-a-cue-is-baked-and-played.md`.
 *
 * ⚠️ **Nothing in this file makes a noise, and that is what it is for.** The three things most likely
 * to be wrong about game audio — a cue that fires per barrel instead of per volley, a hold that never
 * expires, a cap that eats the one sound that mattered — are arithmetic, and arithmetic is checkable
 * without an audio device. What is NOT checkable here is whether any of it sounds good;
 * `scripts/hear.mjs` writes a `.wav` for the only instrument that can answer that, and
 * `docs/decisions/0027-measure-the-picture-not-the-model.md` is why the rig is owed before the tuning
 * rather than after it.
 */

const root = fileURLToPath(new URL('..', import.meta.url));

/** Every `.ts` under a directory, recursively. An explicit walk, not a glob. */
function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(resolve(root, dir), { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) out.push(...filesUnder(path));
    else if (entry.name.endsWith('.ts')) out.push(path);
  }
  return out;
}

const read = (path: string): string => readFileSync(resolve(root, path), 'utf8');

/**
 * A source with its comments blanked.
 *
 * ⚠️ **The ban below scans CODE, and `tests/style.test.ts`'s equivalent scans raw text.** The
 * difference is not an inconsistency, it is this repository's own house style catching up with its
 * guards: every rule in `src/` cites the file it comes from, so `src/app/frame.ts` names
 * `src/content/sound.ts` in prose precisely BECAUSE it is forbidden to import it. A raw scan would
 * make the guard fire on the sentence explaining the guard, and the only way to keep it green would
 * be to stop writing the citation down — which is the documentation convention losing an argument to
 * a regex. What the ban is about is the import graph, and an import cannot hide in a comment.
 */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(?<!:)\/\/.*$/gm, ' ');
}

/** An `AudioOut` that records rather than sounds, which is the whole reason the speaker is separate. */
function recorder(ready = true): { out: AudioOut; heard: number[] } {
  const heard: number[] = [];
  return {
    heard,
    out: {
      ready: () => ready,
      sound: (index: number) => {
        heard.push(index);
      },
    },
  };
}

const indexOf = (kind: CueKind): number => CUE_KINDS.indexOf(kind);

describe('the cue table', () => {
  it('gives every cue a visual twin, which is 0024’s unconditional tier and not a preference', () => {
    /*
      `docs/decisions/0024-the-accessibility-floor-is-settings.md`: *"no information by audio alone —
      every cue that tells the player something has a visual twin. Audio stays loud and additive — it
      is the ONLY channel that is banned, not the sound."* It named the cue table as where this lands,
      *"a required field on the row, so the compiler asks."*
    */
    for (const kind of CUE_KINDS) {
      expect(TWIN_KINDS, `${kind} claims a twin that is not a picture this game draws`).toContain(CUES[kind].twin);
    }
  });

  it('and no twin is claimed by nothing, so the list cannot fill up with pictures nobody draws', () => {
    /*
      ⚠️ **The half a bare union could not have.** The compiler stops a cue naming a picture that is
      not on the list; only a walk can stop the list growing a picture no cue uses — which is how a
      promise about accessibility goes stale without anything going red.
    */
    const claimed = new Set(CUE_KINDS.map((kind) => CUES[kind].twin));
    const orphans = TWIN_KINDS.filter((twin) => !claimed.has(twin));
    expect(orphans, `these pictures are listed as twins and no cue is the twin of them: ${orphans.join(', ')}`).toEqual([]);
  });

  it('keeps every cue inside the ceiling, because past a second it is not punctuation', () => {
    for (const kind of CUE_KINDS) {
      expect(CUES[kind].seconds, `${kind} is longer than a cue may be`).toBeLessThanOrEqual(MAX_CUE_SECONDS);
      expect(CUES[kind].seconds, `${kind} has no length`).toBeGreaterThan(0);
    }
  });

  it('and every row is a sound that can actually be synthesised', () => {
    for (const kind of CUE_KINDS) {
      const row = CUES[kind];
      // Both ends of the sweep are a RATE and the sweep is exponential, so zero is not a value either
      // end can take — `Math.pow(to / from, u)` is the whole waveform.
      expect(row.from, `${kind} sweeps from zero`).toBeGreaterThan(0);
      expect(row.to, `${kind} sweeps to zero`).toBeGreaterThan(0);
      expect(row.gain, `${kind} is silent`).toBeGreaterThan(0);
      expect(row.gain, `${kind} is louder than full scale on its own`).toBeLessThanOrEqual(1);
      expect(row.hold, `${kind} has a negative hold`).toBeGreaterThanOrEqual(0);
    }
  });

  it('mixes so that MAX_VOICES of the loudest cues cannot clip', () => {
    /*
      ⚠️ **The arithmetic the master gain exists for, asserted rather than assumed.** Digital audio
      clips hard — it does not compress — so the worst case is not "loud", it is a crunch on the one
      step the game is at its busiest. The four loudest rows sounding together is that step.
    */
    const loudest = CUE_KINDS.map((k) => CUES[k].gain)
      .sort((a, b) => b - a)
      .slice(0, MAX_VOICES)
      .reduce((sum, gain) => sum + gain, 0);
    // The master gain is not exported as a number to compare against on purpose — what matters is
    // that the sum of the peaks is a value a master under 1 can bring inside full scale.
    expect(loudest, 'four cues at once already exceed full scale before the master gain').toBeLessThan(2);
  });
});

describe('the synthesiser', () => {
  it('is deterministic, so what the rig writes is what the game plays', () => {
    /*
      ⚠️ **The reason the noise comes from a seeded generator rather than from `Math.random`** —
      `docs/decisions/0021-one-stream-per-concern.md`. Without it, `scripts/hear.mjs` writes a file
      nobody can claim is the game's sound, and nothing below can assert anything about a sample.
    */
    const a = bakeCues();
    const b = bakeCues();
    for (let i = 0; i < a.length; i++) {
      expect(Array.from(a[i]!.slice(0, 64)), `cue ${i} baked differently twice`).toEqual(Array.from(b[i]!.slice(0, 64)));
    }
  });

  it('takes its stream from the cue’s NAME, so a thirteenth row cannot change the twelve above it', () => {
    /*
      ⚠️ **This is 0021's actual claim, and a positional stream would satisfy every other test here.**
      One shared generator — or one indexed by position — couples every cue to every cue before it, so
      inserting a row in the middle of `CUE_KINDS` would re-roll the noise in everything after it.
    */
    const baked = bakeCues();
    for (const kind of ['kill', 'blast', 'bossDown'] as const) {
      const alone = sampleCue(CUES[kind], SAMPLE_RATE, makeRng('cues').stream(kind));
      expect(Array.from(alone.slice(0, 32)), `${kind} is not rolled from its own name`).toEqual(
        Array.from(baked[indexOf(kind)]!.slice(0, 32)),
      );
    }
  });

  it('never leaves the rails, because a sample past full scale is a crunch and not a loud sound', () => {
    for (const kind of CUE_KINDS) {
      const samples = sampleCue(CUES[kind], SAMPLE_RATE, makeRng('cues').stream(kind));
      let peak = 0;
      for (const s of samples) peak = Math.max(peak, Math.abs(s));
      expect(peak, `${kind} clips on its own, before anything else is playing`).toBeLessThanOrEqual(1);
      // And it is not silence dressed as a cue: the envelope has to actually reach the row's gain.
      expect(peak, `${kind} bakes to something inaudible`).toBeGreaterThan(CUES[kind].gain * 0.5);
    }
  });

  it('starts and ends at zero, because a buffer that stops mid-waveform clicks', () => {
    /*
      ⚠️ **A click is the one artefact that reads as a broken build rather than as a sound**, and both
      ends can produce one: an envelope that begins at full amplitude, and one that never falls.

      ⚠️ **The thresholds are tight ON PURPOSE, and they were loose enough to be useless first time.**
      At 0.02 this test passed with the end-of-buffer fade deleted, because the exponential decay had
      already brought the tail below it — a guard measuring a quantity that two mechanisms both
      satisfy cannot tell you which one is missing. `npm run prove` said STILL GREEN, the fade turned
      out to be the redundant one and is gone, and what is left is a number only the decay can meet.
      `docs/decisions/0019-a-probe-must-be-seen-to-apply.md`.
    */
    for (const kind of CUE_KINDS) {
      const samples = sampleCue(CUES[kind], SAMPLE_RATE, makeRng('cues').stream(kind));
      expect(Math.abs(samples[0]!), `${kind} begins at full amplitude rather than attacking`).toBeLessThan(0.001);
      expect(Math.abs(samples[samples.length - 1]!), `${kind} is still sounding when its buffer ends`).toBeLessThan(0.01);
    }
  });

  it('bakes each cue to the length its row asks for, and none past the ceiling', () => {
    const baked = bakeCues();
    expect(baked.length, 'the bake and the table disagree about how many cues there are').toBe(CUE_KINDS.length);
    CUE_KINDS.forEach((kind, i) => {
      expect(baked[i]!.length, `${kind} baked to the wrong length`).toBe(Math.round(CUES[kind].seconds * SAMPLE_RATE));
      expect(baked[i]!.length, `${kind} is past the ceiling in samples`).toBeLessThanOrEqual(MAX_CUE_SAMPLES);
    });
  });
});

describe('the speaker decides WHEN, and it is the half that is arithmetic', () => {
  it('says nothing at all when the player has turned it off', () => {
    const { out, heard } = recorder();
    const speaker = makeSpeaker(out);
    speaker.setOn(false);
    for (const kind of CUE_KINDS) speaker.play(kind);
    expect(heard, 'sound is off and the speaker sounded anyway').toEqual([]);
  });

  it('sounds a cue once per step however many times the step asks for it', () => {
    /*
      Five barrels of a volley are one sound, and so are two enemies firing on the same step. The
      frame gates the pulse itself (one cue per volley), and this is the general answer underneath it.
    */
    const { out, heard } = recorder();
    const speaker = makeSpeaker(out);
    speaker.step();
    speaker.play('threat');
    speaker.play('threat');
    speaker.play('threat');
    expect(heard).toEqual([indexOf('threat')]);
  });

  it('holds a repeat for the row’s own number of steps, which is what stops a flam', () => {
    /*
      ⚠️ **The failure is not loudness, it is smearing.** Two identical cues 17ms apart are not heard
      as two events — they are heard as one with a broken attack.
    */
    const { out, heard } = recorder();
    const speaker = makeSpeaker(out);
    const hold = CUES.kill.hold;
    expect(hold, 'the kill cue no longer holds, so this test asserts nothing').toBeGreaterThan(1);
    speaker.step();
    speaker.play('kill');
    for (let i = 1; i < hold; i++) {
      speaker.step();
      speaker.play('kill');
    }
    expect(heard.length, 'a held cue retriggered inside its own hold').toBe(1);
    speaker.step();
    speaker.play('kill');
    expect(heard.length, 'the hold never expired, so the cue is heard once and never again').toBe(2);
  });

  it('starts at most MAX_VOICES on one step, which is the frame budget’s audio twin', () => {
    const { out, heard } = recorder();
    const speaker = makeSpeaker(out);
    speaker.step();
    for (const kind of CUE_KINDS) speaker.play(kind);
    expect(heard.length, 'the voice cap did not hold, so a busy step allocates without limit').toBe(MAX_VOICES);
  });

  it('and the cap counts per step rather than for ever', () => {
    const { out, heard } = recorder();
    const speaker = makeSpeaker(out);
    speaker.step();
    for (const kind of CUE_KINDS) speaker.play(kind);
    speaker.step();
    speaker.play('death');
    expect(heard.length, 'the cap leaked across a step boundary').toBe(MAX_VOICES + 1);
  });

  it('does not let a cue held back spend the step’s budget anyway', () => {
    /*
      ⚠️ **The failure: the cap counting DROPS rather than voices.** Four retriggers of one held cue
      would then fill the step's budget and lock out the different cues behind them — the voice cap
      causing precisely the failure it was added to prevent, and doing it only on the busiest steps.

      ⚠️ **This test replaced one asserting the two checks happen in a particular ORDER, and the
      probe is why.** Breaking the order on purpose left the suite green, correctly: whichever check
      runs first, a held repeat returns before `voices` moves, so the ordering cannot be observed. The
      claim was false, the comment in `src/app/sound.ts` said it anyway, and what is actually
      load-bearing is this — `docs/decisions/0019-a-probe-must-be-seen-to-apply.md` catching a guard
      that fires on nothing.
    */
    const { out, heard } = recorder();
    const speaker = makeSpeaker(out);
    speaker.step();
    speaker.play('kill');
    for (let i = 0; i < MAX_VOICES + 4; i++) speaker.play('kill');
    // Every one of these is a different cue, so all of them are inside the cap — unless the
    // repeats above were counted.
    speaker.play('death');
    speaker.play('pickup');
    speaker.play('bomb');
    expect(heard, 'repeats of one cue ate the budget three different cues needed').toEqual([
      indexOf('kill'),
      indexOf('death'),
      indexOf('pickup'),
      indexOf('bomb'),
    ]);
  });

  it('and says nothing before a gesture has unlocked the context', () => {
    const { out, heard } = recorder(false);
    const speaker = makeSpeaker(out);
    speaker.step();
    speaker.play('pulse');
    expect(heard, 'the speaker played into a context that does not exist yet').toEqual([]);
  });
});

describe('a comfort setting cannot reach the game', () => {
  /**
   * ⚠️ **`src/app/frame.ts` is the interesting entry, exactly as it is in `tests/style.test.ts`.** It
   * is the file that NAMES cues, so it must be able to see `src/content/cues.ts` — and it is also the
   * file that decides what hits what, so it must never see whether the player is listening.
   */
  const FORBIDDEN = [...filesUnder('src/sim'), 'src/app/frame.ts', 'src/app/boss.ts'];

  it('finds the files it is scanning, so it cannot pass by scanning nothing', () => {
    expect(FORBIDDEN.length, 'the scan found no simulation files — the walk is broken').toBeGreaterThan(5);
    for (const file of FORBIDDEN) expect(read(file).length, `${file} is empty or missing`).toBeGreaterThan(0);
  });

  it('THE BAN: nothing that decides an outcome may import the sound setting', () => {
    /*
      `docs/decisions/0024-the-accessibility-floor-is-settings.md`: a player who turns the sound down
      must not thereby be playing a different game. A cosmetic setting cannot be made safe by being
      monotone — there is no ordering in which silence is easier — so it is made safe by being
      unreachable from the code that decides anything.
    */
    const offenders = FORBIDDEN.filter((file) => stripComments(read(file)).includes('content/sound.ts'));
    expect(
      offenders,
      `these decide what happens and can see the sound setting: ${offenders.join(', ')}\n` +
        'A step that can read whether the player is listening is a step that can branch on it.',
    ).toEqual([]);
  });

  it('and the frame emits the same cues either way, because it has no speaker to ask', () => {
    // The structural half of the same claim: the frame reports, `src/app/sound.ts` decides.
    const frame = stripComments(read('src/app/frame.ts'));
    expect(frame.includes('app/sound.ts'), 'the frame reached for the speaker').toBe(false);
    expect(frame.includes('SOUNDS'), 'the frame can see the sound setting table').toBe(false);
  });
});

describe('every cue is played by something, and every cue the frame plays exists', () => {
  it('no cue in the table is dead weight', () => {
    /*
      ⚠️ **A row nobody plays is worse than a missing sound**, because it looks like coverage. The two
      files allowed to name a cue are the frame, which reports what happened, and the shell, which
      owns the one cue that is not a model event.
    */
    const sources = read('src/app/frame.ts') + read('src/app/mount.ts');
    const unplayed = CUE_KINDS.filter((kind) => !sources.includes(`'${kind}'`));
    expect(unplayed, `these cues are in the table and nothing ever plays them: ${unplayed.join(', ')}`).toEqual([]);
  });
});

describe('the chooser is the table', () => {
  it('offers exactly the settings that exist, in the table’s order', () => {
    const choice = SCREENS.title.choices.find((c) => c.name === 'sound');
    expect(choice, 'the title screen offers no sound setting at all').toBeDefined();
    expect(choice!.options.map((o) => o.label)).toEqual(SOUND_KINDS.map((kind) => SOUNDS[kind].title));
  });

  it('and says what each one is, because nothing else on the screen will', () => {
    for (const kind of SOUND_KINDS) {
      expect(SOUNDS[kind].title.length, `${kind} has no name`).toBeGreaterThan(0);
      expect(SOUNDS[kind].hint.length, `${kind} does not say what it does`).toBeGreaterThan(0);
    }
  });
});

describe('the sound setting on the settings slice', () => {
  const soundOf = (state: ReturnType<typeof reduce>): string => state.settings.sound;
  const pick = (sound: (typeof SOUND_KINDS)[number]): Action => ({ slice: 'settings', type: 'sound', sound });

  it('starts on, because 0024 says there is one game and it is the loud one', () => {
    expect(soundOf(initialState)).toBe(DEFAULT_SOUND);
    expect(DEFAULT_SOUND).toBe('on');
  });

  it('changes to either setting in the table', () => {
    for (const kind of SOUND_KINDS) expect(soundOf(reduce(initialState, pick(kind)))).toBe(kind);
  });

  it('preserves identity when nothing moved, which is what stops a chime per press', () => {
    // `src/app/mount.ts` sounds the chime on a real change. A slice rebuilt on every dispatch would
    // blip at the player each time they pressed the option that was already on.
    expect(reduce(initialState, pick(DEFAULT_SOUND)), 'choosing the setting already on rebuilt the state').toBe(initialState);
  });

  it('and does not take the style with it, which a slice of two fields makes possible for the first time', () => {
    /*
      ⚠️ **The bug a one-field slice could not have had.** `return { sound }` type-checks against a
      `Record` over `SettingName` only while there is one name; with two, dropping the spread silently
      resets the other setting — and the player's look would vanish every time they touched the sound.
    */
    const retro = reduce(initialState, { slice: 'settings', type: 'style', style: 'retro' });
    const quiet = reduce(retro, pick('off'));
    expect(quiet.settings.style, 'changing the sound threw the style away').toBe('retro');
    expect(quiet.settings.sound).toBe('off');
  });

  it('is untouched by a run, on the same terms the style is', () => {
    const chosen = reduce(initialState, pick('off'));
    const played = reduce(reduce(chosen, { slice: 'run', type: 'begin', difficulty: 'savior' }), {
      slice: 'screen',
      type: 'show',
      screen: 'playing',
    });
    expect(soundOf(played), 'starting a run reset the sound setting').toBe('off');
  });
});

describe('what the real frame actually says out loud', () => {
  /**
   * ⚠️ **The whole game, driven, rather than a fixture calling `onCue` by hand.** Every claim below is
   * about a relationship between a cue and an event, and the only honest way to ask is to run the
   * level that produces the event — `docs/decisions/0015-the-layer-ladder.md`'s promise that a stage
   * plays to completion without a browser is what makes it affordable.
   */
  it('says one thing per volley and not one per barrel', () => {
    /*
      ⚠️ **The specific failure: five identical clicks on one step.** A fully upgraded weapon fires
      five barrels at once (`src/content/pickups.ts`), and the obvious place to put the cue is beside
      the spawn — inside the loop, ungated.
    */
    const { world, cues } = playableWorld(LEVELS.approach);
    const frame = new GameFrame(world);
    // The strongest loadout's barrel count, applied to the resolved weapon rather than by collecting
    // upgrades: what is being measured is the volley, not how the ship came by one.
    const barrels = 5;
    world.weapon = { ...world.weapon, shots: barrels };
    const before = world.playerShots.size;
    /*
      ⚠️ **Forty steps, and the number is bounded at both ends.** `SHIPS.proof` fires every nine, so
      it is four volleys; and the leading cull is well over sixty steps away at this speed, so the
      pool only grows — which is what makes a size difference a spawn count rather than a net.
    */
    for (let i = 0; i < 40; i++) frame.step();
    const fired = world.playerShots.size - before;
    const pulses = cues.filter((c) => c === 'pulse').length;
    expect(fired, 'the ship did not fire at all, so this measures nothing').toBeGreaterThan(barrels);
    expect(pulses, 'the ship fired and said nothing').toBeGreaterThan(0);
    expect(pulses * barrels, 'a cue per barrel rather than per volley — five clicks on one step').toBe(fired);
  });

  it('THE ONE THAT WOULD BE EATEN BY THE CAP: a boss dying is heard, through a real speaker', () => {
    /*
      ⚠️ **This is the assertion the cue-ordering exists for.** `src/app/sound.ts` allows four voices
      a step and drops the rest, and the boss's cue is emitted at the very bottom of the step —
      behind the pulse, the threat and the hit. Asserting that the frame ASKED for it would be green
      with the loudest event in the game inaudible; so the speaker is real, the cap is on, and what is
      checked is what came out.
    */
    const { world, cues } = playableWorld(LEVELS.approach);
    const frame = new GameFrame(world);
    const { out, heard } = recorder();
    const speaker = makeSpeaker(out);
    // Both, and in this order: what the frame ASKED for, and what a real speaker let through. The
    // gap between the two lists is the whole subject of this test, so replacing the fixture's
    // recorder rather than wrapping it would leave only the half that cannot fail.
    const report = world.onCue;
    world.onCue = (kind): void => {
      report(kind);
      speaker.play(kind);
    };
    world.onTick = speaker.step;

    /*
      Straight to the boss, with the rest of the level turned off so the fight is the only thing on
      the field — and the boss is killed by the player's own shots, because the cue hangs off the
      pool emptying and a boss released by hand would not exercise the collision that empties it.

      ⚠️ **The ship is placed against the NEW camera, and leaving that out is why this test failed
      first time.** `flyShip` clamps the ship into its box, so a camera teleported six thousand units
      forward leaves the ship pinned at the box's LEADING edge — in front of the boss's station, with
      every shot travelling away from it. The fight was unwinnable and nothing said why.
    */
    world.nextWave = world.level.waves.length;
    world.nextPickup = world.level.pickups.length;
    world.cameraAlong = world.level.bossAt;
    world.ship.along = world.cameraAlong + SHIP_START_ALONG;
    world.ship.prevAlong = world.ship.along;
    // The fixture does not respawn, and a ship that dies mid-fight stops firing.
    world.ship.health = 999;
    let steps = 0;
    while (!world.bossBeaten && steps < 60 * 60) {
      // A boss carries 150 health against a base weapon; hold it at one rather than flying a
      // two-minute fight, and let the collision be the thing that empties the pool.
      if (world.bossPool.size > 0) world.bossPool.at(0).health = 1;
      frame.step();
      steps++;
    }
    expect(world.bossBeaten, 'the boss never died, so nothing here was measured').toBe(true);
    expect(cues, 'the frame never even asked for the boss cue').toContain('bossDown');
    expect(heard, 'the boss died and the voice cap ate the sound of it').toContain(indexOf('bossDown'));
    /*
      ⚠️ **And the ordinary kill cue is NOT what the boss got.** Nothing else died in this fight, so
      a `kill` here would mean the boss death was announced twice — which is what would push the
      boss's own cue past the voice cap on the one step it matters.
    */
    expect(cues, 'the boss death also fired the ordinary kill cue, which is what the cap then eats').not.toContain('kill');
  });

  it('and a death is heard, which is the other event nothing may swallow', () => {
    const { world, cues } = playableWorld(LEVELS.approach);
    const frame = new GameFrame(world);
    world.ship.health = 1;
    // Something to fly into, put exactly where the ship is.
    const enemy = world.enemies.spawn()!;
    enemy.along = world.ship.along;
    enemy.across = world.ship.across;
    enemy.prevAlong = world.ship.along;
    enemy.prevAcross = world.ship.across;
    enemy.damage = 5;
    enemy.radius = 4;
    for (let i = 0; i < 4 && !cues.includes('death'); i++) frame.step();
    expect(cues, 'the ship was destroyed and the picture said so in silence').toContain('death');
  });
});
