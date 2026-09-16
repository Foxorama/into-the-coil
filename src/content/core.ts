/**
 * THE BLACK HEART'S OWN COMPOSITION — melodic death metal, played by a hole in the sky.
 *
 * `docs/decisions/0146-three-more-places-and-two-after-them.md`.
 *
 * ── WHAT WAS ASKED FOR ──────────────────────────────────────────────────────────────────────────
 *
 * > *"The last will be the black hole heart of the galaxy, so something heavy on the Scandinavian
 * > death metal side I'm thinking for that."*
 *
 * ⚠️ **THE GENRE IS THREE TECHNIQUES AND THIS SYNTHESISER CAN DO ALL THREE.** Melodic death metal is
 * not distortion — every place in this game already has drive on something. What actually identifies
 * it is:
 *
 * **1. TREMOLO PICKING.** The same note repeated on every sixteenth while the LINE moves underneath
 * it. `arp` and `frenzy` are built out of it, and nothing else in this project has ever repeated a
 * pitch that fast on purpose.
 *
 * **2. THE HARMONISED TWIN LEAD.** Two guitars playing one melody a diatonic third apart. `counter`
 * is `lead` in thirds — derived from it, not written twice — which is the single most recognisable
 * sound the genre has and costs one array.
 *
 * **3. THE PALM MUTE.** A chugging low string that is short, dead and on the beat, against a wide
 * open chord above it. `groove` is the mute; `chords` is the open.
 *
 * | the brief | the rung | the layers that carry it |
 * |---|---|---|
 * | the last thing in the sky | `run` | `drone`, `sub`, `engine`, `perc`, `chords`, `groove`, `call` |
 * | the riff | `push` | `arp`, `ride`, `hook`, `lead` |
 * | the twin lead | `surge` | `counter`, `crash`, `drive` |
 * | the horizon | `approach` | `toll`, `dread` |
 * | inside it | `boss` | `stomp`, `frenzy`, `wraith`, and the aura's two |
 *
 * ── WHY THE LAST LEVEL IS THE ONE THAT GETS THIS ────────────────────────────────────────────────
 *
 * ⚠️ **IT IS THE ONLY PLACE IN THE RUN THAT CAN SPEND EVERYTHING.** Every other place holds something
 * back so the one after it has somewhere to go — that is what
 * `docs/decisions/0107-a-level-is-a-place.md`'s ladder of seven is for. This is level seven; there is
 * nothing after it, so it opens at the density the others reach at `surge` and its fight is the
 * loudest thing the game contains.
 *
 * ⚠️ **AND THE BLACK HOLE IS THE ONE IMAGE THAT MAKES THE DRONE THE POINT.** `THEMES.core.mix` has
 * leant on `drone` since the theme table existed, for a reason nobody wrote down; here it is the
 * subject. Everything falls towards the bottom of this piece and nothing comes back out.
 *
 * ⚠️ **EVERY NOTE IS A TONE OF A NATURAL MINOR** — `docs/decisions/0099-the-cues-are-in-the-key.md`.
 * That is not a compromise for this genre either: melodic death metal is written in the natural minor
 * and the Aeolian sixth is most of what makes it *melodic* rather than merely fast.
 */

import { BEAT_SECONDS, type MusicLayer, type MusicVoice } from './music.ts';

/** A rest, written out so a pattern reads as a rhythm rather than as a list of nulls. */
const _ = null;

/**
 * THE PROGRESSION — sixteen bars, and it pedals on the tonic for half of them.
 *
 * ⚠️ **`Am Am F G · Am Am Dm Em · F G Am Am · Dm F Em G`.** Six of the sixteen bars are A minor and
 * they arrive in PAIRS, which is what a riff needs: two bars of one chord is a riff's home and one
 * bar of each is a progression's. The base composition changes chord every bar and Ember Nebula
 * changes every bar; this is the first place here that sits still long enough for a line to be
 * played over it rather than through it.
 *
 * ⚠️ **Hoisted, because eight voices spell the same sixteen chords**, on `src/content/nebula.ts`'s
 * terms.
 */
const ROOT: readonly number[] = [0, 0, -4, -2, 0, 0, 5, -5, -4, -2, 0, 0, 5, -4, -5, -2];
const FIFTH: readonly number[] = [7, 7, 3, 5, 7, 7, 12, 2, 3, 5, 7, 7, 12, 3, 2, 5];

/**
 * THE ROOT, FOLDED SO IT NEVER SITS UNDER THE DRONE — what `sub`'s held note plays.
 *
 * ⚠️ **`docs/decisions/0331-the-heart-beats-under-it.md`.** Reported of the driven level: *"at 13,
 * 14, 15 seconds there's some heavy bass that just makes the speakers pulse without sound and it
 * sounds like something isn't tuned correctly."* Measured on the render, the 35–45 Hz band rises about
 * **13 dB** over its own floor in exactly the bars where `ROOT` goes below the tonic — E and F, 41 and
 * 44 Hz at octave 0 — and nowhere else. That is two faults in one note: a sustained sine at 41 Hz moves
 * a desktop speaker's cone without much sound coming out of it, and against the drone's A at 55 Hz it
 * beats at 11 to 14 Hz, which is what out of tune sounds like when there is no pitch to hear.
 *
 * ⚠️ **SO A ROOT BELOW THE TONIC GOES UP AN OCTAVE, AND ONLY IN THE HELD NOTE.** The chord is the same
 * chord — an octave is the same pitch class, and every voice that spells the progression still spells
 * it — and the floor of this place is the drone's A, which is what the place is about. The chug keeps
 * `ROOT` because a palm mute a sixteenth long is a thud rather than a tone, and the driven saw above it
 * is what a speaker actually plays.
 */
const HELD_ROOT: readonly number[] = ROOT.map((root) => (root < 0 ? root + 12 : root));



/**
 * THE HEART, QUICKENED — a beat every two beats of the level, 75 a minute.
 *
 * ⚠️ **`docs/decisions/0331-the-heart-beats-under-it.md`, the seventh listen.** The story asked for:
 * *"this is the end so there's sadness → then higher bpm → shifting into a fast past tense trying to
 * power through it → and then the sombre acceptance, underscored with the heart beat."* The heart is
 * the one thing that plays through all four, so it is the one thing that can carry the story's pulse:
 * `HEART` above for the first two, and this from the twist on — through the ballad, the acceptance and
 * the fight. **It lands on the first and third beat of every bar**, which is where the ballad's drums
 * strike, so from 1:04 the heart IS the kick; and the fight's double kick plays it, so the fight is in
 * step with the heart the level ended on.
 */
const HEART_QUICK: readonly (number | null)[] = (() => {
  const steps: (number | null)[] = Array.from({ length: 64 }, () => _);
  for (let i = 0; i < 8; i++) {
    steps[i * 8] = i % 2 === 0 ? 1 : 0.94;
    steps[i * 8 + 2] = i % 2 === 0 ? 0.7 : 0.66;
  }
  return steps;
})();

/**
 * THE HEART AFTER THE TWIST — seven beats in four bars, about 66 a minute.
 *
 * ⚠️ **0331's tenth listen**: *"the heartbeat needs to be just a touch slower, it's slightly too fast
 * for the music now — it's good speed around 2 mins+ into the boss music, but earlier it needs to be
 * just a shade lower between beats."* So `HEART_QUICK` stays the fight's, where it was liked, and the
 * ballad and the acceptance beat between it and the opening's 56: gaps of nine sixteenths and one of
 * ten, which is as even as seven beats can sit on this grid. It no longer lands on the drums, and the
 * ballad's kick stopped imitating it.
 */
const HEART_SLOWED: readonly (number | null)[] = (() => {
  const steps: (number | null)[] = Array.from({ length: 64 }, () => _);
  [0, 9, 18, 27, 37, 46, 55].forEach((at, i) => {
    steps[at] = i % 2 === 0 ? 1 : 0.94;
    steps[at + 2] = i % 2 === 0 ? 0.7 : 0.66;
  });
  return steps;
})();

/**
 * THE FOUR MOVEMENTS — 0331's seventh listen, which is a story and not a mix note.
 *
 * > *"Instead of being 4 separate sections that work together, it's mostly the same music throughout
 * > the entire track so it's not giving a sense of scale and story… slow, sombre, melancholy intro →
 * > higher faster but similar tone → almost power ballad tale of loss, but with the focus on the
 * > symphonic orchestral parts → fading back into the sombre melancholy with a faster beat."*
 *
 * ⚠️ **IT WAS THE SAME MUSIC BECAUSE IT WAS ONE TUNE.** Every section was `THEME`, its harmony, or the
 * harmony held, over one progression — re-orchestrated four times, which a listener hears as one piece
 * getting louder. Each movement now has material of its own, in layers of its own, because a layer
 * plays the same notes at every rung it is open:
 *
 * | movement | rung | what plays | layers |
 * |---|---|---|---|
 * | the end | `run`, 0:00 | a piano lament in half and whole notes, a pad, the slow heart | `call`, `chords`, `drone`, `ownC` |
 * | higher, faster | `push`, 0:26 | the lament's shape on a flute in eighths an octave up, the guitar picking eighths, high strings | `hook`, `arp`, `ownB`, `chords`, `ownC` |
 * | the tale of loss | `surge`, 1:04 | a new progression, a string-and-horn melody, driving low strings, timpani and a half-time drum | `counter`, `groove`, `ownD`, `ownA` |
 * | acceptance | `approach`, 1:36 | the piano lament again, a bell, the heart quickened | `call`, `chords`, `ownB`, `toll`, `ownA` |
 *
 * ⚠️ **"HIGHER BPM" IS NOTE RATE, AND THE GRID IS WHY.** The tempo is 150 and the player's gun is on it
 * (`docs/decisions/0093-the-gun-is-on-the-grid.md`), so the lament moves in halves and wholes — 37 to
 * 75 a minute to the ear — the second movement in eighths, and the ballad in eighths under a half-time
 * drum, which is what a power ballad is.
 */

/**
 * THE LAMENT'S PROGRESSION — a chord every two bars, which is what makes the opening slow before a note
 * is played. `Am · F · C · Em · Dm · F · G · Am`. The first and second movements and the acceptance
 * stand on it, so the flute is recognisably the piano's song sped up, and the end is the beginning.
 */
const L_ROOT: readonly number[] = [0, 0, -4, -4, 3, 3, -5, -5, 5, 5, -4, -4, -2, -2, 0, 0];
const L_THIRD: readonly number[] = [3, 3, 0, 0, 7, 7, -2, -2, 8, 8, 0, 0, 2, 2, 3, 3];
const L_FIFTH: readonly number[] = [7, 7, 3, 3, 10, 10, 2, 2, 12, 12, 3, 3, 5, 5, 7, 7];

/**
 * THE LAMENT — the piano's song, one note a beat at most, and mostly falling.
 *
 * ⚠️ **FOUR PHRASES OF FOUR BARS, AND THE LAST ONE RESOLVES.** The acceptance enters on the last of them
 * (`approach` opens on the sixtieth bar, the twelfth of the loop), so the first thing heard of the song
 * coming back is its cadence, and then the song from its top.
 */
const LAMENT: readonly (number | null)[] = [
  19, _, _, 17, 15, _, _, _, 12, _, 15, _, 20, _, 19, _,
  19, _, _, _, 17, _, 15, _, 14, _, _, _, _, _, 12, 14,
  15, _, 17, _, 20, _, _, _, 19, _, 17, _, 15, _, _, _,
  14, _, _, _, 17, _, 15, 14, 12, _, _, _, _, _, _, _,
];

/**
 * THE FLUTE — the lament's shape an octave up and in eighths: *"higher faster but similar tone."*
 * Every phrase opens where the piano's did and runs where the piano held.
 */
const FLUTE: readonly (number | null)[] = [
  7, _, 8, 7, 5, _, 3, _, 3, _, 2, _, 0, _, _, _,
  0, _, 3, _, 5, _, 8, _, 7, _, 5, _, 3, _, 0, _,
  7, _, _, _, 5, 7, 10, _, 12, _, 10, _, 7, _, 5, _,
  2, _, _, _, 3, 2, 0, _, 2, _, _, _, _, _, 5, 7,
  8, _, 7, 5, 8, _, 12, _, 10, _, 8, _, 5, _, _, _,
  12, _, 10, 8, 7, _, 8, _, 12, _, _, _, 15, _, 12, _,
  14, _, 12, 10, _, _, 7, _, 5, _, 7, _, 10, _, 14, _,
  12, _, _, _, 7, _, 3, _, 0, _, _, _, _, _, _, _,
];

/** The guitar, walking the lament's chords in eighths — the second movement's motor. */
const PICKING: readonly (number | null)[] = L_ROOT.flatMap((root, bar) => {
  const third = L_THIRD[bar]!;
  const fifth = L_FIFTH[bar]!;
  return bar % 2 === 0
    ? [root, fifth, root + 12, third + 12, fifth + 12, third + 12, root + 12, fifth]
    : [root, fifth, third + 12, root + 12, fifth, third + 12, root + 12, fifth];
});

/**
 * THE TWIST — the ballad's progression, and it opens on the one chord the lament never starts on.
 *
 * ⚠️ **`F · G · Am · Am · F · G · C · Em · Dm · Em · F · C · Dm · Em · F · G`.** The rise of a sixth and
 * seventh into the tonic is the minor key's most heroic cadence, and it is major chords doing the
 * climbing — the sound of trying to power through it. It never settles: the last bar is G, which
 * leans back into F at the top of the loop and into the lament's A minor when the acceptance comes.
 *
 * ⚠️ **WRITTEN FROM ITS OWN FIRST BAR AND TURNED A HALF LOOP**, because `surge` opens on the fortieth bar
 * — the eighth of a sixteen-bar loop that has been running since the level started — and a ballad heard
 * from its ninth bar is a ballad joined halfway.
 */
const B_ROOT: readonly number[] = [-4, -2, 0, 0, -4, -2, 3, -5, -7, -5, -4, 3, -7, -5, -4, -2];
const B_THIRD: readonly number[] = [0, 2, 3, 3, 0, 2, 7, -2, -4, -2, 0, 7, -4, -2, 0, 2];
const B_FIFTH: readonly number[] = [3, 5, 7, 7, 3, 5, 10, 2, 0, 2, 3, 10, 0, 2, 3, 5];

/** A sixteen-bar line turned by half a loop, so its first bar plays at the loop's ninth. */
const turned = <T>(line: readonly T[]): T[] => [...line.slice(line.length / 2), ...line.slice(0, line.length / 2)];

/**
 * THE TALE OF LOSS — the ballad's melody, for strings with a horn under them. It climbs for twelve bars
 * to the A an octave over where it began, and falls back without resolving.
 */
const BALLAD: readonly (number | null)[] = [
  12, _, _, 15, 14, _, _, 12, 15, _, _, _, 15, 17, 19, _,
  20, _, _, 19, 17, _, _, 14, 19, _, _, _, 19, _, 22, _,
  24, _, _, 22, 22, _, _, 19, 20, _, 19, 17, 19, _, _, _,
  17, _, _, 20, 19, _, _, 22, 24, _, 22, 20, 19, _, 17, 14,
];

/**
 * THE SLOW FLUTE — a melody answering the piano, from the first bar.
 *
 * ⚠️ **0331's eighth listen asked for it and the ninth said what it was not**: *"it's just a sharp
 * flute note, it's not a melody that blends into the music, there's no tail, the note just ends."*
 * The first pass was single notes dropped into the piano's rests. This is a line: every phrase starts
 * where the piano holds, climbs or falls by step through the chord, and lands on a long note that
 * rings until the piano speaks again — so the two instruments hand the song back and forth.
 */
const FLUTE_SLOW: readonly (number | null)[] = [
  _, _, _, _, _, 12, 14, 15, 17, _, _, 15, 12, _, _, _,
  _, 10, 12, 14, 15, _, _, _, _, 14, 12, 10, 7, _, _, _,
  _, _, _, _, _, 17, 15, 14, 12, _, _, _, _, 12, 14, 15,
  17, _, _, 19, 17, _, _, _, _, 19, 17, 15, 14, _, 12, _,
];

/**
 * A line split by how long each note has before the next — the ones followed by three beats or more of
 * rest, and the rest. A voice has one length, and a flute holds its landing notes and moves through
 * its passing ones, so the two halves are played as two voices of one instrument.
 */
const splitByRoom = (line: readonly (number | null)[], room: number): [(number | null)[], (number | null)[]] => {
  const roomAt = (i: number): number => {
    let gap = 1;
    while (gap < line.length && line[(i + gap) % line.length] === null) gap++;
    return gap;
  };
  const passing = line.map((note, i) => (note !== null && roomAt(i) < room ? note : _));
  const landing = line.map((note, i) => (note !== null && roomAt(i) >= room ? note : _));
  return [passing, landing];
};
const [FLUTE_PASSING, FLUTE_LANDING] = splitByRoom(FLUTE_SLOW, 3);

/**
 * THE HEART, MOVEMENT BY MOVEMENT — 0331's eleventh listen.
 *
 * > *"The heartbeat is too fast at the start still, needs to be something like every 4 seconds for the
 * > first segment, then every 3 secs for the next segment, then every 2, then the pace it has now for
 * > the last segment. It needs to be subtle at first and then be a noticeable heartbeat at the end."*
 *
 * ⚠️ **A HEART THAT SPEEDS UP ACROSS THE LEVEL IS THE STORY TOLD IN ONE SOUND**, and each rate is a
 * pattern of its own because a layer plays one rhythm. On the sixteenth grid: six beats in sixteen bars
 * (4.27 s, `ownC`), two in four (3.2 s, `ownB`), three in four (2.13 s, inside the ballad's drums in
 * `ownD`), then `HEART_SLOWED` (0.91 s, `ownA`) for the acceptance and `HEART_QUICK` for the fight.
 * The slower the heart, the later its second sound, as a resting one's is.
 */
const heartAt = (length: number, lubs: readonly number[], dub: number): (number | null)[] => {
  const steps: (number | null)[] = Array.from({ length }, () => _);
  lubs.forEach((at, i) => {
    steps[at] = i % 2 === 0 ? 1 : 0.94;
    steps[at + dub] = i % 2 === 0 ? 0.7 : 0.66;
  });
  return steps;
};
const HEART_DISTANT = heartAt(256, [0, 43, 86, 128, 171, 214], 3);
const HEART_PUSH = heartAt(64, [0, 32], 3);
const HEART_BALLAD = heartAt(64, [0, 21, 42], 2);

/**
 * The heart's three voices on `steps` — the chest, its upper body and the knock — scaled by `level`.
 * Written once, because five layers now beat it at five speeds and they must stay one heart.
 */
const heartVoices = (steps: readonly (number | null)[], level: number): MusicVoice[] => [
  {
    steps,
    pitched: false,
    perBeat: 4,
    octave: 0,
    note: { wave: 'sine', from: 100, to: 40, seconds: 0.6, gain: 0.5 * level, attack: 0.002, curve: 2, drive: 0.4 },
  },
  {
    steps,
    pitched: false,
    perBeat: 4,
    octave: 0,
    note: { wave: 'sine', from: 220, to: 100, seconds: 0.24, gain: 0.1 * level, attack: 0.002, curve: 3, drive: 0.3 },
  },
  {
    steps,
    pitched: false,
    perBeat: 4,
    octave: 0,
    note: { wave: 'noise', from: 0, to: 0, seconds: 0.07, gain: 0.05 * level, attack: 0.001, curve: 5, lowFrom: 900, lowTo: 400, highFrom: 120 },
  },
];

/**
 * THE SAX — the ballad's soul, answering the violins. 0331's eleventh listen: *"it's good at the moment,
 * but just a bit soulless… sax? does it need a bit of the good ole sax blues… maybe it needs to be
 * symphonic orchestral blues instead of symphonic orchestral metal."*
 *
 * ⚠️ **IT SPEAKS WHERE THE VIOLINS HOLD**, in eighths on the minor pentatonic — A, C, D, E, G, the blues
 * scale's five notes that A minor already owns, so the player's gun stays in key — and lands on long
 * notes the violins climb over. The blue note itself is the scoop: every note leans up into its pitch.
 */
const SAX: readonly (number | null)[] = turned([
  _, _, _, _, _, _, _, _, _, _, _, _, _, _, 7, 10,
  12, _, 15, 17, 15, _, 12, _, _, _, _, _, _, _, _, _,
  _, _, _, _, _, _, 17, 15, 12, _, _, _, _, _, _, _,
  19, _, 17, 15, _, 12, 15, _, 19, _, _, _, _, _, _, _,
  _, _, _, _, _, _, 17, 19, _, _, _, _, 22, _, 19, 17,
  15, _, _, _, _, _, _, _, 15, _, 17, 19, _, 22, 19, _,
  17, _, _, _, _, _, _, _, _, _, _, _, _, _, 12, 15,
  17, _, 15, _, 12, _, _, _, _, _, _, _, 10, _, 12, _,
]);

/**
 * A tenor sax on `line`, in eighths, each note held `beats`: a reedy saw and a hollow square, a body, and
 * breath — scooped into every note from below, with a wide vibrato as it is held.
 */
const saxVoices = (line: readonly (number | null)[], beats: number, level: number): MusicVoice[] => [
  {
    steps: line,
    pitched: true,
    perBeat: 2,
    octave: 1,
    note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * beats, gain: 0.055 * level, attack: 0.025, curve: 0.45, lowFrom: 2600, lowTo: 1700, q: 0.7, highFrom: 160, drive: 0.22, release: BEAT_SECONDS * beats * 0.35, vibrato: 18, scoop: -90 },
  },
  {
    steps: line,
    pitched: true,
    perBeat: 2,
    octave: 1,
    note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * beats, gain: 0.022 * level, attack: 0.03, curve: 0.45, lowFrom: 1600, lowTo: 1200, q: 0.6, release: BEAT_SECONDS * beats * 0.35, vibrato: 18, scoop: -90 },
  },
  {
    steps: line,
    pitched: true,
    perBeat: 2,
    octave: 1,
    note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * beats, gain: 0.05 * level, attack: 0.03, curve: 0.45, release: BEAT_SECONDS * beats * 0.4, vibrato: 18, scoop: -90 },
  },
  {
    steps: line.map((note) => (note === null ? _ : 1)),
    pitched: false,
    perBeat: 2,
    octave: 0,
    note: { wave: 'noise', from: 0, to: 0, seconds: BEAT_SECONDS * beats * 0.8, gain: 0.012 * level, attack: 0.02, curve: 1, lowFrom: 4500, lowTo: 3000, highFrom: 1100, release: BEAT_SECONDS * beats * 0.3 },
  },
];

/**
 * THE BASS AND THE ORGAN — 0331's eleventh listen: *"it also needs something with a bit more bass,
 * it's not quite hitting me in the feels."* A soul ballad's bottom is a bass player leaning on the root
 * and an organ holding the chord under everything; both on `B_*`. The bass plays the root on one and
 * three and walks to the fifth on four, 73–196 Hz — above the heart's thump rather than on it.
 */
const BASS_LINE: readonly (number | null)[] = turned(B_ROOT.flatMap((root, bar) => [root, _, root, B_FIFTH[bar]!]));
const [SAX_PASSING, SAX_LANDING] = splitByRoom(SAX, 4);

/**
 * A pan pipe on `line`, one step every `1 / perBeat` beats, each note held `beats` long.
 *
 * ⚠️ **ONE INSTRUMENT, THREE LINES** — the slow flute under the lament, the running flute of the second
 * movement and the descant over the ballad's violins — so the voice is written once and cannot drift
 * into three different pipes. `level` scales every voice together; `attack` is the breath before the
 * note speaks; `chiff` scales the consonant the note is blown with, which a slow line wants soft.
 *
 * ⚠️ **AND IT DIES NOW, INSTEAD OF STOPPING** — 0331's ninth listen: *"there's no tail, the note just
 * ends."* The decay curve left every held note near half its level when its time ran out, and the
 * six-millisecond guard cut it there. The tone sustains, then spends its last 45% dying away, with a
 * flautist's vibrato easing in as it is held.
 */
const pipeVoices = (
  line: readonly (number | null)[],
  perBeat: number,
  beats: number,
  level: number,
  attack: number,
  chiff = 1,
): MusicVoice[] => [
  {
    steps: line,
    pitched: true,
    perBeat,
    octave: 3,
    note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * beats, gain: 0.17 * level, attack, curve: 0.4, lowFrom: 7000, lowTo: 4200, q: 0.8, release: BEAT_SECONDS * beats * 0.45, vibrato: 11 },
  },
  {
    steps: line,
    pitched: true,
    perBeat,
    octave: 3,
    note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * beats * 0.9, gain: 0.025 * level, attack: attack * 1.3, curve: 0.8, lowFrom: 5000, lowTo: 3000, q: 0.8, release: BEAT_SECONDS * beats * 0.45, vibrato: 11 },
  },
  {
    steps: line,
    pitched: true,
    perBeat,
    octave: 3,
    note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * beats, gain: 0.06 * level, attack: attack * 1.5, curve: 0.4, release: BEAT_SECONDS * beats * 0.5, vibrato: 11 },
  },
  {
    // The chiff: the consonant the note is blown with.
    steps: line.map((note) => (note === null ? _ : 1)),
    pitched: false,
    perBeat,
    octave: 0,
    note: { wave: 'noise', from: 0, to: 0, seconds: 0.06, gain: 0.04 * level * chiff, attack: 0.006, curve: 4, lowFrom: 8000, lowTo: 4000, highFrom: 2500 },
  },
  {
    // The breath under the held note, which is what stops a pure tone reading as a synthesiser.
    steps: line.map((note) => (note === null ? _ : 1)),
    pitched: false,
    perBeat,
    octave: 0,
    note: { wave: 'noise', from: 0, to: 0, seconds: BEAT_SECONDS * beats * 0.8, gain: 0.016 * level, attack: attack * 3, curve: 0.8, lowFrom: 8000, lowTo: 5000, highFrom: 3500, q: 0.6, release: BEAT_SECONDS * beats * 0.4 },
  },
];


/**
 * Everything The Black Heart plays instead of the base composition.
 *
 * ⚠️ **TWENTY-ONE OF THE TWENTY-THREE, and the two left out are `bass` and `beat`**, which
 * `docs/decisions/0095-the-level-has-its-own-music.md` closes everywhere except the title.
 */
export const CORE_VOICES: Partial<Record<MusicLayer, readonly MusicVoice[]>> = {
  /*
    ── THE HOLE: the lowest sustained thing in the game, and a ring around it ───────────────────────

    ⚠️ **THE DRONE IS THE SUBJECT HERE AND EVERYWHERE ELSE IT IS THE FLOOR.** `THEMES.core.mix` has
    leant on this layer since the theme table was written; what this composition adds is a reason —
    the place is an object that everything falls into, and the only way a piece of music can say that
    is to have something at the bottom of it that never resolves and never stops.
  */
  drone: [
    /*
      ⚠️ **THE 55 Hz SINE IS A QUARTER OF WHAT IT WAS, AND ITS BODY MOVED UP AN OCTAVE** — 0331.
      *"This new version has the basic subsonic beat right from the start, I feel the speakers vibrate
      in my earbuds, but there's no actual music."* Measured on the render, the first minute carried 5–6
      dB more energy under 60 Hz than between 200 Hz and 5 kHz, and **64–70% of what sat under 45 Hz
      was this sine** — swelling once a bar, at a pitch earbuds reproduce as pressure rather than note.
      The desk had driven the drone to nearly three times its old level, which is what made it the
      opening. The weight stays, quietly; what an earbud can play is the octave above it.
    */
    {
      steps: [0, 0],
      pitched: true,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.07, attack: 0.4, curve: 0.86 },
    },
    {
      steps: [0, 0],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.18, attack: 0.5, curve: 0.86 },
    },
    {
      steps: [0, 0],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.14, attack: 0.5, curve: 0.9, lowFrom: 300, lowTo: 200, q: 1.5, drive: 0.2 },
    },
    {
      steps: [7, 7],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.09, attack: 0.62, curve: 0.9, lowFrom: 290, lowTo: 195, q: 1.6 },
    },
    {
      // The accretion disc: broadband, very slow, and it is the only thing in the piece that is
      // brighter at its end than at its start.
      steps: [1, 1],
      pitched: false,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.06, attack: 1.25, curve: 1.2, lowFrom: 600, lowTo: 2600, highFrom: 200, q: 0.7 },
    },
  ],

  /*
    ── THE BOTTOM: a double kick, and the mass it is played on ─────────────────────────────────────

    ⚠️ **`sub` IS WHERE THIS PLACE PUTS EVERYTHING BELOW 130 Hz** — `tests/themes.test.ts` refuses a
    low-heavy layer at any pan but centre.
  */
  sub: [
    {
      steps: HELD_ROOT,
      pitched: true,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.15, gain: 0.32, attack: 0.1, curve: 0.95 },
    },
    {
      /*
        THE DOUBLE KICK. Two feet: a pair of sixteenths under every beat, with the fourth bar of each
        phrase filling in. It is the one drum figure in this game that is genuinely a technique rather
        than a pattern, and it is what makes the bottom of this place feel like it is being driven
        rather than laid down.

        ⚠️ **AND IT WAS A SECOND HEARTBEAT, AT 150 A MINUTE, SO IT PLAYS THE HEART'S NOW** — 0331's sixth
        listen: *"the boss music part needs the slightly slower heartbeat though as it's now out of sync
        with the music level heartbeat."* A hit and a softer hit a sixteenth later, on every beat, is a
        lub-dub; under a heart beating 56 a minute it read as the same heart running at three times the
        speed. `sub` sounds only in the fight here, so this kick now lands on `HEART`'s own beats and the
        fight's heaviest low pulse IS the heart. The blast beat above it keeps the fight fast. The sweep
        stops at 45 Hz rather than 30, for the same reason the heart's does.
      */
      steps: [...HEART_QUICK, ...HEART_QUICK, ...HEART_QUICK, ...HEART_QUICK],
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'sine', from: 120, to: 45, seconds: 0.34, gain: 0.38, attack: 0.001, curve: 2.4, drive: 0.34 },
    },
    {
      // The mass: the fifth under the root, held, so the bottom is a chord and not a pedal.
      steps: FIFTH.flatMap((fifth) => [fifth, _, _, _]),
      pitched: true,
      perBeat: 1,
      octave: 0,
      accents: [1, 0.86, 0.9, 0.82],
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 3.4, gain: 0.28, attack: 0.16, curve: 1.1 },
    },
  ],

  /*
    ── THE KIT ──────────────────────────────────────────────────────────────────────────────────────

    ⚠️ **A SNARE ON EVERY OFFBEAT AND A CRASH-RIDE OVER IT.** The genre's opening tempo feel is the
    *d-beat*: the snare answers the kick eight times a bar rather than twice, so the pulse is double
    what the harmony's rate says it is. It costs nothing here — the tempo is fixed at 150 BPM by
    `docs/decisions/0093-the-gun-is-on-the-grid.md` — and it is why this place opens at a density the
    others reach two rungs in.
  */
  engine: [
    {
      // The snare, on every offbeat eighth. Bright, cracking and short.
      steps: [
        _, 0.94, _, 0.72, _, 0.9, _, 0.76, _, 0.96, _, 0.74, _, 0.92, _, 0.8,
        _, 0.94, _, 0.74, _, 0.92, _, 0.72, _, 1, _, 0.78, _, 0.94, 0.8, 0.86,
      ],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.13, gain: 0.088, attack: 0.0008, curve: 4.4, lowFrom: 6200, lowTo: 1800, highFrom: 900 },
    },
    {
      // The body under the snare — the drum, rather than the wires. Without it the layer is a hiss.
      steps: [
        _, 0.86, _, 0.66, _, 0.82, _, 0.7, _, 0.88, _, 0.68, _, 0.84, _, 0.74,
        _, 0.86, _, 0.68, _, 0.84, _, 0.66, _, 0.92, _, 0.72, _, 0.86, 0.74, 0.8,
      ],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'sine', from: 210, to: 132, seconds: 0.2, gain: 0.58, attack: 0.001, curve: 5, drive: 0.3 },
    },
    {
      // The ride, on sixteenths, played on the bell so it cuts. Nothing in this place is quiet.
      steps: [
        0.6, 0.28, 0.42, 0.3, 0.52, 0.28, 0.4, 0.3, 0.62, 0.28, 0.42, 0.3, 0.5, 0.3, 0.4, 0.32,
        0.6, 0.28, 0.42, 0.32, 0.52, 0.3, 0.4, 0.28, 0.62, 0.3, 0.42, 0.32, 0.5, 0.32, 0.42, 0.36,
        0.6, 0.28, 0.44, 0.3, 0.52, 0.28, 0.42, 0.3, 0.62, 0.28, 0.42, 0.32, 0.5, 0.3, 0.4, 0.32,
        0.62, 0.3, 0.44, 0.32, 0.54, 0.3, 0.42, 0.32, 0.64, 0.32, 0.46, 0.34, 0.54, 0.36, 0.48, 0.44,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.045, gain: 0.036, attack: 0.0005, curve: 6, lowFrom: 12000, highFrom: 5200 },
    },
    /*
      ⚠️ **A CHINA STOOD HERE, ONCE EVERY FOUR BARS, AND IT IS GONE** —
      `docs/decisions/0331-the-heart-beats-under-it.md`. The first listen asked for *"the cymbal crash
      louder and more prominent"* in the opening, and it was moved to a slot of its own and raised; the
      second listen, having heard it: *"the cymbal crash needs to be removed."* The `crash` layer is
      closed at every rung in `THEMES.core.ladder` for the same sentence, so no cymbal of either kind is
      left in this place.
    */
  ],

  /*
    ── THE SMALL METAL ─────────────────────────────────────────────────────────────────────────────

    ⚠️ **`perc` sits at −0.45 and therefore may not be low** — `tests/themes.test.ts`. What lives up
    there in this genre is the hi-hat, the rim and the bell of the ride, so the constraint costs
    nothing at all here.
  */
  perc: [
    {
      // A closed hat under everything, sixteenths, tight.
      steps: [
        0.46, 0.26, 0.36, 0.28, 0.42, 0.26, 0.34, 0.28, 0.48, 0.26, 0.36, 0.28, 0.4, 0.28, 0.34, 0.3,
        0.46, 0.26, 0.36, 0.3, 0.42, 0.28, 0.34, 0.26, 0.48, 0.28, 0.36, 0.3, 0.4, 0.3, 0.36, 0.32,
        0.46, 0.26, 0.38, 0.28, 0.42, 0.26, 0.36, 0.28, 0.48, 0.26, 0.36, 0.3, 0.4, 0.28, 0.34, 0.3,
        0.48, 0.28, 0.38, 0.3, 0.44, 0.28, 0.36, 0.3, 0.5, 0.3, 0.4, 0.32, 0.44, 0.34, 0.42, 0.4,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.026, gain: 0.065, attack: 0.0004, curve: 8.5, lowFrom: 13000, highFrom: 6800 },
    },
    {
      // The rim, on a figure that crosses the bar rather than sitting in it.
      steps: [
        1, _, _, 0.7, _, _, 0.82, _, _, 0.66, _, _, 0.9, _, 0.62, _,
        _, _, 0.86, _, _, 0.68, _, _, 0.94, _, _, 0.64, _, 0.72, _, 0.7,
      ],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'tri', from: 2200, to: 1700, seconds: 0.05, gain: 0.1, attack: 0.0006, curve: 7, highFrom: 1000 },
    },
    {
      /*
        THE TOM. 196 Hz falling to 112 — the low-mid a place made of cymbals and snare wires would
        otherwise have nothing in, which `src/content/nebula.ts` found by measurement after the fact
        and every place since has taken before it.
      */
      steps: [1, _, 0.62, _, 0.72, _, _, 0.66, 0.88, _, 0.6, _, 0.74, _, 0.64, 0.66],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'sine', from: 196, to: 112, seconds: 0.2, gain: 0.3, attack: 0.001, curve: 4.2, drive: 0.24 },
    },
    /*
      ⚠️ **THE BELL OF THE RIDE STOOD HERE AND WAS THE SEAGULL** — 0331. *"The 'seagull' percussion
      noise doesn't fit."* It was the one pitched thing in the kit: a triangle falling 3200 → 2600 Hz
      over a fifth of a second, struck four times a phrase off the beat — which is the shape of a gull's
      cry more than of a bell. Every other pitched glide in this place is under 220 Hz.
    */
  ],

  /*
    ── THE PAD: the lament's chords, held, under the first, second and last movements ─────────────

    ⚠️ **0331.** The whole minor triad, a chord every two bars, nothing struck. It closes for the ballad,
    whose chords are not these, and comes back with the acceptance.
  */
  chords: [
    {
      steps: L_THIRD,
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.15, attack: 0.5, curve: 1, lowFrom: 1400, lowTo: 900, q: 0.8 },
    },
    {
      steps: L_ROOT,
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      accents: [1, 0.86],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.09, attack: 0.55, curve: 1.2, lowFrom: 700, lowTo: 460, q: 1.3 },
    },
    {
      steps: L_FIFTH,
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      accents: [1, 0.86],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.06, attack: 0.7, curve: 1.2, lowFrom: 660, lowTo: 430, q: 1.4 },
    },
    {
      steps: L_ROOT,
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 4.2, gain: 0.2, attack: 0.3, curve: 1.1, lowFrom: 1300, lowTo: 860, q: 0.9 },
    },
  ],

  /*
    ── THE LAMENT: a piano, alone with the pad — *"this is the end, so there's sadness"* ──────────────

    ⚠️ **0331's seventh listen.** The first movement and the last. A struck string out of a synthesiser:
    a saw whose lowpass closes as the note rings and a triangle body, a faint octave over the strike,
    the hammer, and a left hand that sounds each chord's root once a bar. Every note rings three
    beats and more, so the line is held together by its own decay rather than by anything under it.
  */
  call: [
    {
      steps: LAMENT,
      pitched: true,
      perBeat: 1,
      octave: 2,
      accents: [1, 0.8, 0.88, 0.8],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 3.4, gain: 0.06, attack: 0.002, curve: 2.4, lowFrom: 2800, lowTo: 600, q: 0.7 },
    },
    {
      steps: LAMENT,
      pitched: true,
      perBeat: 1,
      octave: 2,
      accents: [1, 0.8, 0.88, 0.8],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 3.8, gain: 0.15, attack: 0.002, curve: 2, lowFrom: 3200, lowTo: 1300, q: 0.7 },
    },
    {
      steps: LAMENT,
      pitched: true,
      perBeat: 1,
      octave: 3,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 1.4, gain: 0.025, attack: 0.002, curve: 3 },
    },
    {
      steps: LAMENT.map((note) => (note === null ? _ : 1)),
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.03, gain: 0.018, attack: 0.001, curve: 6, lowFrom: 2600, lowTo: 1000, highFrom: 400 },
    },
    {
      // The left hand: the chord's root and fifth, low and soft, once a bar.
      steps: L_ROOT,
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.08, attack: 0.002, curve: 1.8, lowFrom: 1600, lowTo: 500, q: 0.7 },
    },
    {
      steps: L_FIFTH,
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 4.2, gain: 0.045, attack: 0.004, curve: 1.9, lowFrom: 1800, lowTo: 600, q: 0.7 },
    },
    // The slow flute, answering the piano — 0331's eighth listen.
    ...pipeVoices(FLUTE_PASSING, 1, 1.6, 0.75, 0.06, 0.3),
    ...pipeVoices(FLUTE_LANDING, 1, 4.6, 0.8, 0.08, 0.3),
  ],

  /*
    ── THE FLUTE: the lament, higher and faster — the second movement ─────────────────────────────

    ⚠️ **0331's seventh listen**: *"higher faster but similar tone."* The pan pipe the earlier listens
    liked, playing `FLUTE` — the piano's song an octave up and in eighths — with each note held just
    past the next, so the eighths are a line rather than a pattern.
  */
  hook: pipeVoices(FLUTE, 2, 1.4, 1, 0.02, 0.7),

  /*
    ── THE SECOND HEART, AND THE HIGH STRINGS THAT STOOD HERE ARE `lead` NOW ───────────────────────

    ⚠️ **0331.** *"High harmonies."* Two notes that belong to every chord of the lament or sit a step
    off it — the fifth and the root over A minor, the major seventh and third over F — held over four
    bars by two bows a few cents apart, 660 and 880 Hz with a faint octave above.
  */
  ownB: heartVoices(HEART_PUSH, 1),

  /*
    ── THE GUITAR: fingerpicked eighths, the second movement's motor ────────────────────────────────

    ⚠️ **0331.** The clean guitar of the fourth listen on the lament's chords. It is what turns the
    opening's half notes into eighths while the harmony stays where it was — the same song, faster.
  */
  arp: [
    {
      steps: PICKING,
      pitched: true,
      perBeat: 2,
      octave: 2 + 6 / 1200,
      accents: [1, 0.72, 0.84, 0.7, 0.9, 0.7, 0.82, 0.68],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 1.3, gain: 0.07, attack: 0.008, curve: 2.2, lowFrom: 3200, lowTo: 1000, q: 0.9 },
    },
    {
      steps: PICKING,
      pitched: true,
      perBeat: 2,
      octave: 2 - 6 / 1200,
      accents: [1, 0.72, 0.84, 0.7, 0.9, 0.7, 0.82, 0.68],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 1.2, gain: 0.05, attack: 0.009, curve: 2.4, lowFrom: 3000, lowTo: 950, q: 0.9 },
    },
    {
      steps: PICKING,
      pitched: true,
      perBeat: 2,
      octave: 2,
      accents: [1, 0.72, 0.84, 0.7, 0.9, 0.7, 0.82, 0.68],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 1.4, gain: 0.08, attack: 0.008, curve: 2, lowFrom: 2000, lowTo: 900, q: 0.7 },
    },
    {
      steps: PICKING.map((note) => (note === null ? _ : 1)),
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.02, gain: 0.012, attack: 0.003, curve: 6, lowFrom: 4000, highFrom: 1500 },
    },
  ],

  /*
    ── THE ORCHESTRA: the ballad's body — *"trying to power through it"* ─────────────────────────────

    ⚠️ **0331's seventh listen**: *"almost power ballad tale of loss, but with the focus on the symphonic
    orchestral parts."* Centred, because it carries the ballad's bottom: a string section holding each
    chord, the cellos and basses driving eighths under it — the fast past tense — a double bass on the
    root, and a horn on the melody an octave under the violins in `counter`. All of it on `B_*`, turned
    half a loop so the ballad's first bar lands on the bar `surge` opens.
  */
  groove: [
    {
      steps: turned(B_ROOT.map((root) => root + 12)),
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.3, gain: 0.05, attack: 0.3, curve: 0.8, lowFrom: 1800, lowTo: 1300, q: 0.6, release: BEAT_SECONDS * 1.5, vibrato: 9 },
    },
    {
      steps: turned(B_THIRD.map((third) => third + 12)),
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.3, gain: 0.045, attack: 0.36, curve: 0.8, lowFrom: 2000, lowTo: 1500, q: 0.6, release: BEAT_SECONDS * 1.5, vibrato: 8 },
    },
    {
      steps: turned(B_FIFTH.map((fifth) => fifth + 12)),
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.3, gain: 0.04, attack: 0.42, curve: 0.8, lowFrom: 2000, lowTo: 1500, q: 0.6, release: BEAT_SECONDS * 1.5, vibrato: 8 },
    },
    {
      // The violas' warmth under the section: the third and fifth again, as triangles, an octave up.
      steps: turned(B_THIRD.map((third) => third + 12)),
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 4.3, gain: 0.05, attack: 0.4, curve: 0.8, lowFrom: 2400, lowTo: 1800, q: 0.7, release: BEAT_SECONDS * 1.5 },
    },
    {
      // The cellos and basses, spiccato: root, fifth and octave in eighths, accented on the beat.
      steps: turned(B_ROOT.flatMap((root, bar) => {
        const fifth = B_FIFTH[bar]!;
        return [root, fifth, root + 12, fifth, root, fifth, root + 12, fifth + 12];
      })),
      pitched: true,
      perBeat: 2,
      octave: 1,
      accents: [1, 0.66, 0.84, 0.66, 0.94, 0.66, 0.84, 0.72],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.46, gain: 0.065, attack: 0.01, curve: 2.4, lowFrom: 1800, lowTo: 700, q: 0.6 },
    },
    {
      // The double bass: the root, held, at 73–131 Hz — above the heart's floor and under everything else.
      steps: turned(B_ROOT),
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.2, gain: 0.055, attack: 0.12, curve: 0.6, lowFrom: 520, lowTo: 420, q: 0.6, release: BEAT_SECONDS * 1.5, vibrato: 7 },
    },
    {
      // The horn: the ballad's melody an octave under the violins, round and a little late to speak.
      steps: turned(BALLAD),
      pitched: true,
      perBeat: 1,
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 2.6, gain: 0.06, attack: 0.06, curve: 0.9, lowFrom: 1100, lowTo: 800, q: 0.7, release: BEAT_SECONDS * 1.5 },
    },
    {
      steps: turned(BALLAD),
      pitched: true,
      perBeat: 1,
      octave: 1,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 2.6, gain: 0.08, attack: 0.05, curve: 0.9, release: BEAT_SECONDS * 1.5 },
    },
    /*
      ⚠️ **THE METAL GUITARS STOOD HERE, AND THE BAND IS A SOUL BAND NOW** — 0331's eleventh listen:
      *"maybe it needs to be symphonic orchestral blues instead of symphonic orchestral metal."* Two
      power-chord guitars and a palm-muted chug went; what replaced them is the three things a soul
      ballad stands on — a bass, an organ, and a tenor sax singing over the strings.
    */
    {
      // The bass: a round plucked tone, the finger on the string and the body under it.
      steps: BASS_LINE,
      pitched: true,
      perBeat: 1,
      octave: 1,
      accents: [1, 0.8, 0.9, 0.78],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 1.9, gain: 0.2, attack: 0.006, curve: 1.2, lowFrom: 900, lowTo: 500, q: 0.6, release: BEAT_SECONDS * 0.6 },
    },
    {
      steps: BASS_LINE,
      pitched: true,
      perBeat: 1,
      octave: 1,
      accents: [1, 0.8, 0.9, 0.78],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 1.7, gain: 0.05, attack: 0.006, curve: 1.6, lowFrom: 1400, lowTo: 380, q: 0.6, release: BEAT_SECONDS * 0.5 },
    },
    {
      // The organ's drawbars: the root an octave down, the chord, and the root an octave up — sines, held,
      // with the slow waver of a rotating speaker.
      steps: turned(B_ROOT.map((root) => root + 12)),
      pitched: true,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.1, gain: 0.09, attack: 0.03, curve: 0.15, release: BEAT_SECONDS * 0.7, vibrato: 5 },
    },
    {
      steps: turned(B_ROOT.map((root) => root + 12)),
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.1, gain: 0.07, attack: 0.03, curve: 0.15, release: BEAT_SECONDS * 0.7, vibrato: 6 },
    },
    {
      steps: turned(B_THIRD.map((third) => third + 12)),
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.1, gain: 0.06, attack: 0.03, curve: 0.15, release: BEAT_SECONDS * 0.7, vibrato: 6 },
    },
    {
      steps: turned(B_FIFTH.map((fifth) => fifth + 12)),
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.1, gain: 0.06, attack: 0.03, curve: 0.15, release: BEAT_SECONDS * 0.7, vibrato: 6 },
    },
    {
      steps: turned(B_ROOT.map((root) => root + 12)),
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.1, gain: 0.03, attack: 0.03, curve: 0.15, release: BEAT_SECONDS * 0.7, vibrato: 7 },
    },
    // The sax: its running notes, and the notes it lands on and holds.
    ...saxVoices(SAX_PASSING, 1, 1),
    ...saxVoices(SAX_LANDING, 3.2, 1.1),
    {
      // The choir: an "aah" is a round tone with its upper partials soft — triangles and sines, slow.
      steps: turned(B_THIRD.map((third) => third + 12)),
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.05, attack: 0.6, curve: 0.8, lowFrom: 1600, lowTo: 1400, q: 0.6, release: BEAT_SECONDS * 1.5 },
    },
    {
      steps: turned(B_FIFTH.map((fifth) => fifth + 12)),
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.045, attack: 0.7, curve: 0.8, lowFrom: 1600, lowTo: 1400, q: 0.6, release: BEAT_SECONDS * 1.5 },
    },
    {
      steps: turned(B_ROOT.map((root) => root + 24)),
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.04, attack: 0.8, curve: 0.8, release: BEAT_SECONDS * 1.5 },
    },
    /*
      ⚠️ **THE BRASS — 0331's ninth listen**: *"it needs a bit of brass."* Trombones and horns swelling
      into each chord — a saw whose lowpass OPENS across the note, which is what a brass player leaning
      into a held note sounds like — and trumpets joining the melody for its second half, where it climbs
      to its top A.
    */
    {
      steps: turned(B_ROOT.map((root) => root + 12)),
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 3.9, gain: 0.06, attack: 0.16, curve: 0.3, lowFrom: 400, lowTo: 1700, q: 0.7, release: BEAT_SECONDS * 1.4, vibrato: 4 },
    },
    {
      steps: turned(B_THIRD.map((third) => third + 12)),
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 3.9, gain: 0.045, attack: 0.2, curve: 0.3, lowFrom: 420, lowTo: 1600, q: 0.7, release: BEAT_SECONDS * 1.4, vibrato: 4 },
    },
    {
      steps: turned(B_FIFTH.map((fifth) => fifth + 12)),
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 3.9, gain: 0.045, attack: 0.22, curve: 0.3, lowFrom: 420, lowTo: 1600, q: 0.7, release: BEAT_SECONDS * 1.4, vibrato: 4 },
    },
    {
      // The trumpets, on the melody's second half only.
      steps: turned(BALLAD.map((note, i) => (i >= 32 ? note : _))),
      pitched: true,
      perBeat: 1,
      octave: 2,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 2.6, gain: 0.045, attack: 0.05, curve: 0.5, lowFrom: 1100, lowTo: 2600, q: 0.7, release: BEAT_SECONDS * 1.1, vibrato: 6 },
    },
    /*
      ⚠️ **AND THE PIANO FROM THE OPENING, INSIDE IT** — 0331's tenth listen: *"feels like a copy paste
      fit in, rather than properly being part of the track."* The ballad shared no instrument with the
      movements either side of it. The lament's piano walks each of its chords in quarter notes, so the
      instrument the story began on is still playing when it swells.
    */
    {
      steps: turned(B_ROOT.flatMap((root, bar) => [root + 12, B_FIFTH[bar]! + 12, B_THIRD[bar]! + 24, B_FIFTH[bar]! + 12])),
      pitched: true,
      perBeat: 1,
      octave: 1,
      accents: [1, 0.72, 0.84, 0.7],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 2.4, gain: 0.1, attack: 0.002, curve: 2.2, lowFrom: 3000, lowTo: 1200, q: 0.7 },
    },
    {
      steps: turned(B_ROOT.flatMap((root, bar) => [root + 12, B_FIFTH[bar]! + 12, B_THIRD[bar]! + 24, B_FIFTH[bar]! + 12])),
      pitched: true,
      perBeat: 1,
      octave: 1,
      accents: [1, 0.72, 0.84, 0.7],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 2.2, gain: 0.04, attack: 0.002, curve: 2.6, lowFrom: 2600, lowTo: 600, q: 0.7 },
    },
  ],

  /*
    ── THE RIDE: the bell, hammered ────────────────────────────────────────────────────────────────
  */
  ride: [
    {
      steps: [
        0.74, 0.32, 0.48, 0.3, 0.62, 0.32, 0.44, 0.28, 0.76, 0.32, 0.46, 0.3, 0.6, 0.32, 0.46, 0.52,
        0.72, 0.3, 0.46, 0.28, 0.64, 0.32, 0.42, 0.3, 0.78, 0.32, 0.48, 0.32, 0.62, 0.34, 0.46, 0.54,
        0.74, 0.32, 0.48, 0.28, 0.62, 0.3, 0.44, 0.32, 0.76, 0.3, 0.46, 0.32, 0.6, 0.32, 0.46, 0.5,
        0.7, 0.32, 0.44, 0.3, 0.66, 0.32, 0.44, 0.28, 0.8, 0.36, 0.5, 0.34, 0.64, 0.38, 0.5, 0.58,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      /*
        ⚠️ **17 ms WAS STILL A TICK, AND THIS PLACE STATES ITS OWN.** The line this replaces is the
        base composition's, raised once by `docs/decisions/0152-a-layer-is-heard-in-the-sum.md` from
        `curve: 8` over 0.03 s — 4 ms — to `curve: 4` over 0.07 s. Six places carry that one; The
        Black Heart now carries its own, because it is the only place whose ride is *hammered on the
        bell on every sixteenth* and it measured **−33.7 peak / −56.5 dBFS rms at `approach`** and
        **the worst `down` of any layer at every one of the five rungs that open it** — 23 to 31 dB
        under the loudest thing playing beside it.

        ⚠️ **THE ENVELOPE AND NOT THE GAIN, WHICH IS THE MISTAKE 0152 CAUGHT BEING MADE TWICE.**
        `seconds / curve` is the real length, so 0.16 s at 2.8 is **57 ms** where 0.07 at 4 was 17 —
        3.3× the energy, +5.1 dB, and **the peak does not move by a decibel**. That matters here and
        nowhere else in the file: `scripts/weigh-mix.mjs` has this place at 96% of the clipping
        ceiling at `approach`, where the ride is open, so a gain that bought the same 5.1 dB would
        have spent most of the remaining headroom on the one layer that needed it least.

        ⚠️ **AND THE GAIN STILL MOVES, BECAUSE 0140 CONVICTS ON BOTH MEASURES.** A 57 ms ring at
        −33.7 peak reads better on rms and is still a whisper on the transient a cymbal is mostly
        made of, so 0.1 → 0.125 carries about 2 dB of peak with it. At 100 ms between sixteenths the
        ring now overlaps the next stroke, which is a bell being hammered rather than a hat being
        closed; the attack and the band are untouched for 0152's reason.

        ⚠️ **AND IT IS DELIBERATELY SHORT OF WHAT THE SOLVE WOULD TAKE.** `weigh-solve` asked 3.83×
        at `surge` and now asks 1.75, because a first pass at 0.2 s / 2.4 / 0.15 answered it at 1.21
        and cost **0.5 points of the `under 300Hz` share at `push` and `approach`**, where the floor
        is 28%. Broadband noise in the widest band there is buys margin cheaply and spends the band
        balance dearly; this layer had the most room of the three to give back, so it gave it.
      */
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.16, gain: 0.125, attack: 0.0004, curve: 2.8, lowFrom: 11000, highFrom: 4800 },
    },
  ],

  /*
    ── THE HIGH STRINGS: an E and an A, held — 0331's high harmonies, moved from `ownB` so that slot
    could beat the second movement's heart ─────────────────────────────────────────────────────────
  */
  lead: [
    {
      steps: [7, 7, 12, 12],
      pitched: true,
      perBeat: 0.25,
      octave: 3 + 7 / 1200,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.03, attack: 1.1, curve: 0.8, lowFrom: 3000, lowTo: 2200, q: 0.7 },
    },
    {
      steps: [7, 7, 12, 12],
      pitched: true,
      perBeat: 0.25,
      octave: 3 - 7 / 1200,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.03, attack: 1.3, curve: 0.8, lowFrom: 2900, lowTo: 2100, q: 0.7 },
    },
    {
      steps: [7, 7, 12, 12],
      pitched: true,
      perBeat: 0.25,
      octave: 3,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.05, attack: 1.2, curve: 0.8 },
    },
    {
      steps: [7, 7, 12, 12],
      pitched: true,
      perBeat: 0.25,
      octave: 4,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.015, attack: 1.5, curve: 0.8 },
    },
  ],

  /*
    ── THE VIOLINS: the tale of loss ────────────────────────────────────────────────────────────────

    ⚠️ **0331's seventh listen.** The ballad's melody, the thing the third movement is: two bowed saws a
    few cents apart and a sine for the section's body, slow to speak and held past the next note, so
    the line swells rather than steps. The horn in `groove` doubles it an octave down.
  */
  counter: [
    {
      steps: turned(BALLAD),
      pitched: true,
      perBeat: 1,
      octave: 2 + 6 / 1200,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 3.4, gain: 0.07, attack: 0.1, curve: 0.4, lowFrom: 3200, lowTo: 2300, q: 0.6, release: BEAT_SECONDS * 1.6, vibrato: 14 },
    },
    {
      steps: turned(BALLAD),
      pitched: true,
      perBeat: 1,
      octave: 2 - 6 / 1200,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 3.4, gain: 0.07, attack: 0.13, curve: 0.4, lowFrom: 3100, lowTo: 2200, q: 0.6, release: BEAT_SECONDS * 1.6, vibrato: 12 },
    },
    {
      steps: turned(BALLAD),
      pitched: true,
      perBeat: 1,
      octave: 2,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 3.4, gain: 0.06, attack: 0.12, curve: 0.4, release: BEAT_SECONDS * 1.6, vibrato: 13 },
    },
    /*
      ⚠️ **AND THE FIRST VIOLINS AN OCTAVE HIGHER** — 0331's ninth listen: *"a slightly higher high pitch
      at the top."* The same line at 880–1760 Hz, thin and bright, so the climb reaches over everything.
    */
    {
      steps: turned(BALLAD),
      pitched: true,
      perBeat: 1,
      octave: 3 + 4 / 1200,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 3.2, gain: 0.034, attack: 0.14, curve: 0.4, lowFrom: 6000, lowTo: 4400, q: 0.8, release: BEAT_SECONDS * 1.6, vibrato: 16 },
    },
    {
      steps: turned(BALLAD),
      pitched: true,
      perBeat: 1,
      octave: 3 - 4 / 1200,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 3.2, gain: 0.03, attack: 0.17, curve: 0.4, lowFrom: 5800, lowTo: 4200, q: 0.8, release: BEAT_SECONDS * 1.6, vibrato: 15 },
    },
    // The flute an octave over the violins — 0331's eighth listen, the high touch of sadness at the top.
    ...pipeVoices(turned(BALLAD), 1, 2.8, 0.5, 0.06, 0.4),
  ],

  /*
    ── THE CRASH ────────────────────────────────────────────────────────────────────────────────────
  */
  crash: [
    {
      steps: [1, _, _, _, _, _, _, _, 0.86, _, _, _, _, _, _, _],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 1.2, gain: 0.16, attack: 0.001, curve: 2.6, lowFrom: 15000, lowTo: 4200, highFrom: 2200 },
    },
    {
      // The gong under it: a black hole's crash is not a cymbal, it is a mass being struck.
      steps: [0, _, _, _, _, _, _, _, -5, _, _, _, _, _, _, _],
      pitched: true,
      perBeat: 1,
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 2.6, gain: 0.15, attack: 0.02, curve: 1.3, lowFrom: 900, lowTo: 400, q: 2.2, drive: 0.4 },
    },
  ],

  /*
    ── THE DRIVE: two bars, and it is the blast the boss will take over ───────────────────────────
  */
  drive: [
    {
      /*
        ⚠️ **THIRTY-SECONDS, AND IT IS THE ANSWER TO *HIGHER TEMPO* THAT THE GRID ALLOWS** — reported
        2026-08-14: *"the rest of the level was really nice, just needed to be more intense with
        higher tempo."* `docs/decisions/0093-the-gun-is-on-the-grid.md` fixes a beat at 24 sim steps
        and the player's gun, every enemy cadence and 0094's phase-lock all ride it, so the BPM cannot
        move — what rises is the subdivision, which is 0102's finding and is what a listener calls
        faster.

        ⚠️ **THE SAME FIGURE AT TWICE THE PICKING RATE, which is what a guitarist would actually do.**
        Every note is doubled rather than the line being rewritten, so the riff is recognisably the
        one the level has been playing and the hand behind it has sped up. It arrives at `surge` and
        the fight's `stomp` is already at this rate, so the last two rungs are the fastest the game
        gets.
      */
      steps: [
        0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 3, 3, 3, 3,
        0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 7, 7, 5, 5, 5, 5,
        0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 3, 3, 3, 3,
        0, 0, 0, 0, 7, 7, 7, 7, 5, 5, 5, 5, 3, 3, 3, 3,
      ],
      pitched: true,
      perBeat: 8,
      octave: 1,
      accents: [1, 0.62, 0.84, 0.6],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.16, gain: 0.07, attack: 0.002, curve: 4.6, lowFrom: 2400, lowTo: 1100, q: 1.8, drive: 0.44 },
    },
    {
      // The mass under it, on every other beat — 0331: a thud on the beat with a softer one an eighth
      // after it was a third lub-dub at 150 a minute, against the heart's 56.
      steps: [1, _, _, _, 0.88, _, _, _, 1, _, _, _, 0.86, _, _, _],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'sine', from: 148, to: 50, seconds: 0.34, gain: 0.66, attack: 0.001, curve: 3.2, drive: 0.28 },
    },
  ],

  /*
    ── THE HORIZON: a funeral bell, and the interval under it ──────────────────────────────────────

    ⚠️ **`toll` SITS AT −0.5 AND MAY NOT BE LOW**, so this bell is voiced as its partials — the strike
    note high, the hum quiet, and a great deal of metal in between. `src/content/nebula.ts` learned it
    from a first cathedral bell that was 49% under 130 Hz and passed every guard in the repository.
  */
  toll: [
    {
      steps: [0, _, -5, _],
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 4.9, gain: 0.32, attack: 0.006, curve: 1.25, lowFrom: 1600, lowTo: 860, q: 1.8 },
    },
    {
      steps: [3, _, -2, _],
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.5, gain: 0.15, attack: 0.02, curve: 1.7 },
    },
    {
      steps: [7, _, 2, _],
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.3, gain: 0.07, attack: 0.5, curve: 1.2, lowFrom: 1800, lowTo: 4200, q: 1.4 },
    },
    {
      steps: [1, _, 0.86, _],
      pitched: false,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: BEAT_SECONDS * 4.2, gain: 0.11, attack: 1, curve: 1.3, lowFrom: 800, lowTo: 3400, highFrom: 340, q: 0.8 },
    },
  ],

  /*
    ── THE DREAD: the tritone, held, and it is the last thing before the fight ─────────────────────
  */
  dread: [
    {
      steps: [2, 8, 2, 8],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      accents: [1, 0.92, 0.98, 1],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.2, gain: 0.11, attack: 0.5, curve: 1.05, lowFrom: 300, lowTo: 800, q: 2.6 },
    },
    {
      steps: [8, 2, 8, 2],
      pitched: true,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.3, attack: 0.46, curve: 1 },
    },
  ],

  /*
    ── INSIDE IT ────────────────────────────────────────────────────────────────────────────────────

    ⚠️ **THE LOUDEST FIGHT IN THE GAME, AND IT IS THE LAST ONE ON PURPOSE.** A blast beat, tremolo at
    double speed and a voice that is not a voice — `LEVEL_ONLY` closes the wall, the chug, the picking,
    the riff and the clean lead all at once (`src/content/music.ts`), and what replaces them is faster
    than any of them.
  */
  stomp: [
    {
      /*
        THE BLAST BEAT. Kick and snare alternating on thirty-seconds is the real technique and it is
        not available here — the kick lives in `sub` and this is one layer — so what this plays is the
        SNARE half at thirty-seconds and lets `sub`'s double kick underneath be the other. Between them
        the fight is at twice the rate of anything before it.
      */
      steps: [
        1, 0.42, 0.66, 0.44, 0.9, 0.42, 0.64, 0.46, 0.96, 0.42, 0.66, 0.44, 0.88, 0.46, 0.66, 0.5,
        1, 0.42, 0.66, 0.46, 0.9, 0.44, 0.64, 0.42, 0.96, 0.44, 0.68, 0.46, 0.88, 0.48, 0.68, 0.54,
        1, 0.42, 0.68, 0.44, 0.9, 0.42, 0.66, 0.44, 0.96, 0.42, 0.66, 0.46, 0.88, 0.46, 0.66, 0.5,
        1, 0.44, 0.68, 0.46, 0.92, 0.44, 0.66, 0.46, 0.98, 0.46, 0.7, 0.48, 0.92, 0.52, 0.74, 0.62,
      ],
      pitched: false,
      perBeat: 8,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.035, gain: 0.085, attack: 0.0005, curve: 6.5, lowFrom: 7600, lowTo: 2600, highFrom: 1100 },
    },
    /*
      ⚠️ **THE HEART STOOD HERE, AND IT IS `ownA` NOW** — `docs/decisions/0331-the-heart-beats-under-it.md`.
      A layer has one fader, so while the heart lived in `stomp` it could only rise and fall with the
      blast beat — and the ask is a heart that is faint for the opening, arrives with `push`, and
      climbs through every section after, while the blast beat does what it was driven to do.
    */
    {
      steps: [
        0.4, _, 0.32, _, 0.36, _, 0.3, _, 0.4, _, 0.32, _, 0.36, _, 0.32, 0.34,
        0.4, _, 0.32, _, 0.38, _, 0.3, _, 0.42, _, 0.34, _, 0.38, _, 0.34, 0.36,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.022, gain: 0.05, attack: 0.0004, curve: 8.5, lowFrom: 14000, highFrom: 7200 },
    },
    /*
      ⚠️ **AND THE FIGHT'S HEART IS BACK HERE, AT 75** — 0331's tenth listen. `ownA` slowed for the level
      and the fight's speed was the one liked, so the fight plays the quick heart in its own layer: the
      same three voices, the first two bars of `HEART_QUICK` (which repeats every two), with their gains
      scaled by the 1.2 between this layer's fader and `ownA`'s in the fight.
    */
    {
      steps: HEART_QUICK.slice(0, 32),
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'sine', from: 100, to: 40, seconds: 0.6, gain: 0.6, attack: 0.002, curve: 2, drive: 0.4 },
    },
    {
      steps: HEART_QUICK.slice(0, 32),
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'sine', from: 220, to: 100, seconds: 0.24, gain: 0.12, attack: 0.002, curve: 3, drive: 0.3 },
    },
    {
      steps: HEART_QUICK.slice(0, 32),
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.07, gain: 0.06, attack: 0.001, curve: 5, lowFrom: 900, lowTo: 400, highFrom: 120 },
    },
  ],

  /*
    ── THE HEART: the thing the level is named after, and the backing for all four sections ───────

    ⚠️ **`docs/decisions/0331-the-heart-beats-under-it.md`.** Asked for, of the driven level: *"I want
    the heartbeat to be clearly heard, but to be the background backing for the track… fainter for the
    first 25 seconds, then kick in where it does, then get slightly louder throughout the following
    sections… That heart beat and its pacing is the very core of what makes this the sound track for
    the 'black heart' level."* It was the second voice of `stomp`, which is one fader shared with the
    blast beat; an own slot is the one layer that can climb on a curve of its own — 0188's mechanism,
    and the first time a place has opened one in every rung.

    ⚠️ **THE VOICE IS MOVED, NOT REWRITTEN.** 2026-08-14 asked for *"a pulsing heartbeat rhythm for the
    boss if we're calling the level the black heart"*, and this is that figure note for note: two
    thumps and a gap, the second softer and closer, because that is what a heart does and why it reads
    as a body rather than as a drum. **What was liked is left alone**; the ladder is what changes.

    ⚠️ **FOUR BARS, WRITTEN OUT TWICE, BECAUSE A PATTERN SHORTER THAN ITS LAYER DOES NOT REPEAT.**
    `layerNotes` in `src/app/music.ts` renders `steps` once and stops; the figure was two bars in
    `stomp`'s two-bar loop and an own slot is four. Copied with the pickup on the last sixteenth of
    each pair, so the loop point and the half-way point breathe the same way.

    ⚠️ **THE FIRST PASS KEPT ITS 96 → 24 Hz SWEEP ON THE ARGUMENT THAT A THUMP SPENDS ITS ENERGY HIGH,
    AND THE EAR SAID OTHERWISE.** Turned up through the fight, it made 84% of that rung's energy under
    45 Hz and was reported as *"speaker distortion… most noticeable 2.10 onwards"*. The figure and the
    envelope are untouched; only the sweep's floor moved — see the voice.
  */
  ownA: [
    {
      steps: HEART_SLOWED,
      pitched: false,
      perBeat: 4,
      octave: 0,
      /*
        ⚠️ **110 → 48 Hz, WHERE IT WAS 96 → 24** — 0331's second listen: *"there's still speaker
        distortion noise, most noticeable 2.10 onwards."* The fight is where this heart is loudest, and
        measured there it made **84% of everything under 45 Hz** in the rung. The new floor takes 8.7 dB
        off that band and leaves 45–150 Hz, where a thump is actually heard, where it was.

        ⚠️ **AND BACK DOWN TO 100 → 40, LONGER AND FULLER, ON THE FIFTH** — *"just a bit deeper at the
        start… it's not deep enough now so it might just be my headphones causing drama there."* The
        listener's own playback was part of the earlier report. 40 Hz keeps the floor clear of the 24
        that was measured doing the damage, and the upper body and knock below it are quieter, since
        they were what made the heart read as a knock rather than a chest.
      */
      note: { wave: 'sine', from: 100, to: 40, seconds: 0.6, gain: 0.5, attack: 0.002, curve: 2, drive: 0.4 },
    },
    /*
      ⚠️ **AND WHAT AN EARBUD CAN HEAR OF IT** — 0331's third listen: *"then the speaker bit kicks in
      around 1:55 again."* From the `approach` on the heart is the largest thing under 45 Hz, and a
      sine that falls to 48 Hz is felt on a small driver rather than heard. A heart through a chest is
      heard as its upper body and its knock, so both are here — the same beats, an octave up and short,
      and a muffled thud — and the low sine stays for a speaker that can play it.
    */
    {
      steps: HEART_SLOWED,
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'sine', from: 220, to: 100, seconds: 0.24, gain: 0.1, attack: 0.002, curve: 3, drive: 0.3 },
    },
    {
      steps: HEART_SLOWED,
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.07, gain: 0.05, attack: 0.001, curve: 5, lowFrom: 900, lowTo: 400, highFrom: 120 },
    },
  ],

  /*
    ── THE SLOW HEART: the first two movements ─────────────────────────────────────────────────────

    ⚠️ **0331's seventh listen.** `ownA`'s voice on `HEART`, at 56 a minute: *"the v6 heartbeat at the
    start was better as it was a bit more subdued."* It hands over to `ownA`, quickened, at the twist.
  */
  ownC: heartVoices(HEART_DISTANT, 1),

  /*
    ── THE BALLAD'S DRUMS: timpani on the one, a deep half-time drum on the three ──────────────────

    ⚠️ **0331's seventh listen.** A power ballad's beat is half-time — the backbeat on three — and an
    orchestra plays it on timpani and a bass drum. Both land where the quickened heart does, so the heart
    is inside the beat rather than beside it; a timpani roll in the last beat of every fourth bar pulls
    each phrase into the next. **No cymbal**, which two listens asked to be taken out of this place.
  */
  ownD: [
    /*
      ⚠️ **0331's tenth listen**: *"some part of the orchestral section sounds a bit too synthy and not
      instrumentally… not sure if it's the drums/bass."* It was: four drums built as falling sine sweeps
      with drive on them — a timpani gliding a fourth, a bass drum on three, a kick sweeping from 160 and
      a snare body from 230 — which is the recipe for an electronic kit, stacked on a sine double bass and
      the heart. An acoustic drum rings near ONE pitch and lets the skin and the shell carry the attack,
      so each drum below is a short, barely-moving tone under a louder noise, and the bass drum on three
      is gone: the snare on two and four is the backbeat.
    */
    {
      // The timpani: a tuned drum rings at its pitch and an overtone, and the stick is the noise.
      steps: [
        1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
        0.86, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
        0.94, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
        0.86, _, _, _, _, _, _, _, _, _, _, _, 0.4, 0.5, 0.62, 0.78,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'sine', from: 104, to: 98, seconds: 0.9, gain: 0.22, attack: 0.004, curve: 3.4 },
    },
    {
      steps: [
        1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
        0.86, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
        0.94, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
        0.86, _, _, _, _, _, _, _, _, _, _, _, 0.4, 0.5, 0.62, 0.78,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'sine', from: 158, to: 155, seconds: 0.5, gain: 0.07, attack: 0.004, curve: 4 },
    },
    {
      steps: [
        1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
        0.86, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
        0.94, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
        0.86, _, _, _, _, _, _, _, _, _, _, _, 0.4, 0.5, 0.62, 0.78,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.2, gain: 0.06, attack: 0.002, curve: 5, lowFrom: 1800, lowTo: 600, highFrom: 80 },
    },
    {
      // The kick: one and three, a push after three, a double-kick run to close every fourth bar.
      steps: [
        1, _, _, _, _, _, _, _, 0.9, _, 0.62, _, _, _, _, _,
        1, _, _, _, _, _, _, _, 0.9, _, 0.62, _, _, _, _, _,
        1, _, _, _, _, _, _, _, 0.9, _, 0.62, _, _, _, _, _,
        1, _, _, _, _, _, _, _, 0.86, _, 0.6, _, _, _, _, _,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'sine', from: 88, to: 56, seconds: 0.16, gain: 0.3, attack: 0.001, curve: 5 },
    },
    {
      // The beater and the shell, which is most of what a kick through a band actually is.
      steps: [
        1, _, _, _, _, _, _, _, 0.9, _, 0.62, _, _, _, _, _,
        1, _, _, _, _, _, _, _, 0.9, _, 0.62, _, _, _, _, _,
        1, _, _, _, _, _, _, _, 0.9, _, 0.62, _, _, _, _, _,
        1, _, _, _, _, _, _, _, 0.86, _, 0.6, _, _, _, _, _,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.05, gain: 0.07, attack: 0.0005, curve: 5, lowFrom: 3000, lowTo: 900, highFrom: 60 },
    },
    {
      // The snare on two and four: the wires are the sound, the shell only a little under them.
      steps: [_, 1, _, 0.92, _, 1, _, 0.94, _, 1, _, 0.92, _, 1, _, 0.98],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.3, gain: 0.075, attack: 0.004, curve: 4, lowFrom: 5200, lowTo: 2400, highFrom: 300 },
    },
    {
      steps: [_, 1, _, 0.92, _, 1, _, 0.94, _, 1, _, 0.92, _, 1, _, 0.98],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'sine', from: 196, to: 184, seconds: 0.1, gain: 0.1, attack: 0.001, curve: 5 },
    },
    // The ballad's heart, every 2.13 s — 0331's eleventh listen.
    ...heartVoices(HEART_BALLAD, 0.37),
  ],

  frenzy: [
    {
      /*
        THE TREMOLO, AT THE FIGHT'S OWN SPEED. Two repetitions per note instead of four, so the LINE
        moves twice as fast while the picking rate is unchanged — which is exactly what the genre does
        going into a chorus, and is a real escalation rather than a louder one. Eight bars, so the
        figure is longer than the four-bar phrase the listener has been counting in.
      */
      steps: [
        0, 0, 3, 3, 2, 2, 3, 3, 0, 0, 3, 3, 5, 5, 3, 3,
        8, 8, 7, 7, 8, 8, 7, 7, 3, 3, 2, 2, 3, 3, 2, 2,
        0, 0, 3, 3, 2, 2, 3, 3, 0, 0, 3, 3, 7, 7, 5, 5,
        8, 8, 7, 7, 5, 5, 3, 3, 2, 2, 3, 3, 5, 5, 7, 7,
        0, 0, 3, 3, 2, 2, 3, 3, 0, 0, 3, 3, 5, 5, 3, 3,
        10, 10, 8, 8, 7, 7, 8, 8, 5, 5, 3, 3, 2, 2, 3, 3,
        0, 0, 2, 2, 3, 3, 5, 5, 7, 7, 8, 8, 7, 7, 5, 5,
        3, 3, 2, 2, 3, 3, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2,
      ],
      pitched: true,
      perBeat: 4,
      octave: 1,
      accents: [1, 0.64, 0.86, 0.62],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.18, gain: 0.27, attack: 0.002, curve: 4.4, lowFrom: 2600, lowTo: 1000, q: 2, drive: 0.55 },
    },
    {
      // The octave over it, thinner and brighter, which is how two guitars playing one riff sound.
      steps: [
        0, 0, 3, 3, 2, 2, 3, 3, 0, 0, 3, 3, 5, 5, 3, 3,
        8, 8, 7, 7, 8, 8, 7, 7, 3, 3, 2, 2, 3, 3, 2, 2,
        0, 0, 3, 3, 2, 2, 3, 3, 0, 0, 3, 3, 7, 7, 5, 5,
        8, 8, 7, 7, 5, 5, 3, 3, 2, 2, 3, 3, 5, 5, 7, 7,
        0, 0, 3, 3, 2, 2, 3, 3, 0, 0, 3, 3, 5, 5, 3, 3,
        10, 10, 8, 8, 7, 7, 8, 8, 5, 5, 3, 3, 2, 2, 3, 3,
        0, 0, 2, 2, 3, 3, 5, 5, 7, 7, 8, 8, 7, 7, 5, 5,
        3, 3, 2, 2, 3, 3, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2,
      ],
      pitched: true,
      perBeat: 4,
      octave: 2,
      accents: [1, 0.62, 0.84, 0.6],
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 0.15, gain: 0.15, attack: 0.002, curve: 5, lowFrom: 5200, lowTo: 2400, q: 1.6, drive: 0.4 },
    },
  ],

  wraith: [
    {
      /*
        THE VOICE. Held notes a minor second apart — E against F, then B against C — driven until the
        tone comes apart, which is the same construction Ember Nebula's screaming choir uses and is
        here because a growl and a scream fail identically: the fundamental survives and everything
        above it turns to noise.

        ⚠️ **IT IS AN OCTAVE LOWER THAN EVERY OTHER PLACE'S**, which is the one thing that makes it a
        growl rather than a shriek, and it is the reason this layer carries the fight's whole bottom
        register when `groove` and `chords` have closed.
      */
      steps: [
        8, _, 7, _, 8, _, 7, _,
        3, _, 2, _, 3, _, 2, _,
        8, _, 7, _, 8, _, 7, 8,
        2, _, 3, _, 2, _, 3, _,
      ],
      pitched: true,
      perBeat: 1,
      octave: 0,
      accents: [1, 0.7, 0.88, 0.66],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 1, gain: 0.23, attack: 0.03, curve: 1.9, lowFrom: 1100, lowTo: 420, q: 2.4, drive: 0.85 },
    },
    {
      steps: [
        7, _, 8, _, 7, _, 8, _,
        2, _, 3, _, 2, _, 3, _,
        7, _, 8, _, 7, _, 8, 7,
        3, _, 2, _, 3, _, 2, _,
      ],
      pitched: true,
      perBeat: 1,
      octave: 1,
      accents: [1, 0.7, 0.88, 0.66],
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 1.05, gain: 0.17, attack: 0.04, curve: 1.8, lowFrom: 1800, lowTo: 700, q: 2.2, drive: 0.75 },
    },
  ],

  /*
    ── THE AURA: how far in you are ─────────────────────────────────────────────────────────────────

    ⚠️ **These two are the only layers in the game whose gain is a DISTANCE** —
    `docs/decisions/0091-the-boss-has-an-aura.md`. Here the distance is to the hole itself: the slow
    one is the pull, and the fast one is what the disc is doing to whatever is falling through it.
  */
  auraSlow: [
    {
      steps: [2, _, 8, _, 2, _, 8, _],
      pitched: true,
      perBeat: 1,
      octave: 0,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 2.4, gain: 0.3, attack: 0.3, curve: 1.5, lowFrom: 260, lowTo: 640, q: 1.7 },
    },
    {
      steps: [8, _, 2, _, 8, _, 2, _],
      pitched: true,
      perBeat: 1,
      octave: 0,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 2.5, gain: 0.27, attack: 0.34, curve: 1.35 },
    },
    {
      steps: [1, _, 1, _, 1, _, 1, _],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: BEAT_SECONDS * 2.3, gain: 0.115, attack: 0.36, curve: 1.4, lowFrom: 420, lowTo: 1800, highFrom: 140, q: 0.7 },
    },
  ],

  auraFast: [
    {
      steps: [8, 8, 8, 8, 8, 8, 8, 8, 2, 2, 2, 2, 2, 2, 2, 2],
      pitched: true,
      perBeat: 2,
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.28, gain: 0.16, attack: 0.004, curve: 5, lowFrom: 2200, lowTo: 700, q: 2, drive: 0.4 },
    },
    {
      steps: [_, 2, _, 2, _, 2, _, 2, _, 8, _, 8, _, 8, _, 8],
      pitched: true,
      perBeat: 2,
      octave: 2,
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 0.24, gain: 0.115, attack: 0.003, curve: 5.5, lowFrom: 4200, lowTo: 1600, q: 1.7 },
    },
    {
      // The disc: sample-and-hold noise rising in period, which is matter being torn rather than
      // wind blowing.
      steps: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'noise', from: 2600, to: 6800, seconds: BEAT_SECONDS * 0.3, gain: 0.095, attack: 0.004, curve: 3.6, lowFrom: 4200, lowTo: 1400, highFrom: 500 },
    },
  ],
};
