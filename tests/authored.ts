/**
 * THE ADVISORY REGISTER — what this project WANTS to be true, measured on every run and unable to
 * fail one.
 *
 * `docs/decisions/0192-a-guard-holds-an-invariant.md`.
 *
 * ⚠️ **A GUARD HOLDS AN INVARIANT; A TASTE IS ADVISORY.** The test that separates them is one
 * question — *name a change to the content that would redden this and be CORRECT.* If no such change
 * exists, it is an invariant and it fails hard. If one exists and costs only an opinion, it is a
 * taste and it belongs here.
 *
 * ⚠️ **NOTHING IN THIS MODULE CAN THROW**, and that is the property rather than an implementation
 * detail. `observe` records and returns. `tests/authored.test.ts` asserts it over a deliberately
 * unmet claim, because a mechanism whose whole purpose is *never red* has to be seen not to be.
 *
 * ⚠️ **THE MECHANISM ITSELF IS AN INVARIANT AND IS GUARDED HARD.** A dead register entry, an
 * observation nobody registered, a claim measured twice, a report that does not name what it found —
 * all of those are defects in this file and all of them redden `tests/authored.test.ts`. What is
 * advisory is the CLAIMS, never the plumbing under them.
 */

import type { ThemeKind } from '../src/content/themes.ts';

/**
 * Every advisory claim, closed — `docs/decisions/0016-a-hub-enumerates-kinds.md`.
 *
 * ⚠️ **THE LIST IS THE ACCOUNTING.** An advisory that nobody counts becomes wallpaper, which is the
 * failure `.github/workflows/hotspots.yml` names about a weekly report. One register, printed in
 * full on every run, met and unmet together, is what stops this from being a place guards go to die.
 */
export const AUTHORED_IDS = [
  '0148-notes',
  '0155-lead',
  '0167-duck',
  '0172-four',
  '0198-aa-space',
  '0198-aa-backdrop',
  '0198-aa-clouds',
  '0236-cycle',
  '0237-blade',
  '0285-throw',
  '0288-lean',
  '0304-pair',
  '0308-loud',
] as const;

export type AuthoredId = (typeof AUTHORED_IDS)[number];

export interface AuthoredClaim {
  /** What the project wants to be true, in the words the printout uses. */
  claim: string;
  /**
   * ⚠️ **THE CHANGE THAT WOULD BREAK THIS AND BE CORRECT.** Required, and it is the whole admission
   * test: an entry that cannot name one is an invariant in the wrong file and belongs back in a
   * suite that fails.
   */
  correctly: string;
  /** The decision the claim came from. */
  decision: string;
}

export const AUTHORED: Record<AuthoredId, AuthoredClaim> = {
  '0148-notes': {
    claim: 'no two places play the same notes — stated over all seven, which the hard guard could not be',
    correctly: 'two places written as halves of one region, deliberately sharing a mode',
    decision: '0148-a-place-has-its-own-notes',
  },
  '0155-lead': {
    claim: 'no two places follow the same instrument at every rung',
    correctly: 'a place written as a reprise of another, tracking the same part throughout',
    decision: '0155-a-place-follows-its-own-instrument',
  },
  '0167-duck': {
    claim: 'nothing already sounding gets audibly quieter when a section opens',
    correctly: 'a breakdown before a drop, which is a duck and is the genre move Saurian Belt has now asked for twice',
    decision: '0167-a-build-does-not-duck',
  },
  /*
    ── THE THREE WCAG FLOORS 0198 DEFERS ─────────────────────────────────────────────────────────

    ⚠️ **DEMOTED RATHER THAN DELETED, WHICH IS WHAT MAKES THE PASS POSSIBLE.**
    `docs/decisions/0198-the-accessibility-pass-comes-after-the-game.md` moves the accessibility pass
    after the game — and a deferral that stops measuring is a cancellation with better manners. These
    keep being read on every run, so the pass starts from a list rather than from a fresh audit.

    ⚠️ **WHAT STAYED HARD IS THE GAMEPLAY FLOOR, AND IT IS A DIFFERENT NUMBER FOR A DIFFERENT REASON.**
    An ink the player genuinely cannot pick out is a bug for everybody; 4.5:1 is WCAG AA, which is a
    bar about *every* player. The suites hold the first at `GAMEPLAY_FLOOR` and report the second here.
  */
  '0198-aa-space': {
    claim: 'every ink clears WCAG AA against the void',
    correctly: 'a bold place authored before the accessibility pass, which 0198 explicitly permits until it runs',
    decision: '0198-the-accessibility-pass-comes-after-the-game',
  },
  '0198-aa-backdrop': {
    claim: "every ink clears WCAG AA against every place's backdrop",
    correctly: 'a backdrop authored for character first, with the contrast pass still to come',
    decision: '0198-the-accessibility-pass-comes-after-the-game',
  },
  '0198-aa-clouds': {
    claim: 'every ink clears WCAG AA against a backdrop with its weather on it',
    correctly: 'weather thick enough to read as weather, which is the whole of what 0196 measured and could not spend',
    decision: '0198-the-accessibility-pass-comes-after-the-game',
  },
  '0172-four': {
    claim: 'no two places open on the same four sounds at `run`',
    correctly: 'two places that open alike and diverge later, which is a legal shape for a level to have',
    decision: '0172-a-place-opens-with-its-own-four',
  },
  '0236-cycle': {
    claim: 'a cycling pickup shows each face for at least three seconds',
    correctly: 'a shorter turn a later play-test prefers, once more faces make a long wait too long',
    decision: '0236-the-guns-answer-the-first-play-test',
  },
  '0237-blade': {
    claim: 'a blade is drawn as big as the ship that threw it',
    correctly: 'a smaller star, once a dozen of them at the cap are judged to bury the lane',
    decision: '0237-the-blades-answer-the-first-play-test',
  },
  /*
    ⚠️ **THE DIRECTION IS AN INVARIANT AND THE DISTANCE IS NOT**, which is the split 0192 asks for and
    the reason this entry exists at all. *The snap and the strike throw the jaw opposite ways* has no
    correct counter-example — a snap that opens the mouth is a bug however the skull is drawn — and
    `tests/accents.test.ts` fails hard on it. *Each throw moves a twentieth of the skull* has an
    obvious one: the swing is a rotation about a hinge, so where the hinge sits decides how much area
    a readable throw moves, and a skull redrawn with a lower hinge would redden this while looking
    better. It was a hard floor for one commit, measured 2.9% against a 5% that had been reasoned
    rather than measured, and the photograph said the snap was plainly visible.
  */
  '0285-throw': {
    claim: 'the serpent’s snap and its strike each move a twentieth of the skull’s own area',
    correctly: 'a skull redrawn with a lower jaw hinge, where a mouth that plainly opens sweeps less of the box',
    decision: '0285-the-mouth-is-alive',
  },
  /*
    ⚠️ **A HEAD TALLER THAN IT IS LONG IS A FROG AND THAT IS THE INVARIANT; HOW MUCH LONGER IS TASTE.**
    `tests/accents.test.ts` fails hard at a ratio of 1, which 0276 put there and which no redrawing of
    a serpent could correctly break. *Half again as long as it is tall* is the thing the report asked
    for — *"slightly bigger and also slightly longer"* — and a later pass that shortened the snout to
    make room for a bigger jaw would redden it and be right.
  */
  '0288-lean': {
    claim: 'the serpent’s skull is half again as long as it is tall, which is what reads as a snake',
    correctly: 'a shorter snout traded for a deeper jaw, once the mouth is the thing being drawn for',
    decision: '0288-the-skull-is-longer',
  },
  /*
    ⚠️ **THE MID-BOSSES' HALF STAYED HARD AND THIS HALF DID NOT, AND 0258 IS WHY THEY DIFFER.** A
    mid-boss IS its pair — the old seven, one idea each — so two sharing one is two skins on one
    fight, and no correct row can do it. A real boss is told apart by what only it throws, which
    `tests/level.test.ts` still holds hard as the *mark* guard; its flight and its opening fan are the
    small part of it. 0304 is the correct change: *"for phase 1 can we have it shoot a forward arc of
    5 globes"* made the serpent a bob and a spray, which is the hydra's pair — on a chain that rears,
    that turns into a spray and then the lightning.
  */
  '0304-pair': {
    claim: 'no two real bosses both fly the same way and open with the same fan',
    correctly: 'a real boss asked to open simply, whose own attacks come later in the fight',
    decision: '0304-the-serpent-sprays',
  },
  /*
    ⚠️ **A TASTE AND NOT A GUARD, AND `docs/decisions/0295-a-ranking-guard-is-a-content-limiter.md` IS
    WHY.** A floor under how loud a boss's attack may be is a limiter on what a boss may be: a stealthy
    one whose attack is a whisper is a fight somebody is entitled to write, and a guard here would
    refuse it before it was proposed. What the report was about is that three attacks were **7 to 9 dB**
    under the things that explode while being the loudest events in the game, and the value of holding
    it as a claim is that the next boss's attacks are measured against the same reference rather than
    against nothing.
  */
  '0308-loud': {
    claim: 'a boss’s attack is as loud as the things that explode',
    correctly: 'a boss whose attack is meant to be quiet — a hiss, a whisper, something that sneaks up',
    decision: '0308-the-attacks-are-heard',
  },
};

export interface Observation {
  id: AuthoredId;
  met: boolean;
  /** What was found. Empty when the claim is met; the offenders when it is not. */
  found: readonly string[];
}

const seen: Observation[] = [];

/**
 * Record what a claim measured. **Never throws, never asserts, never fails a suite.**
 *
 * ⚠️ **AN UNREGISTERED ID IS RECORDED RATHER THAN REFUSED HERE**, and refused by the guard in
 * `tests/authored.test.ts` instead. Throwing would put a failure path back into the one function
 * this decision exists to keep free of them.
 */
export function observe(id: AuthoredId, met: boolean, found: readonly string[] = []): void {
  seen.push({ id, met, found: [...found] });
}

/** Everything recorded since the last `reset`, in the order it was measured. */
export function observations(): readonly Observation[] {
  return seen;
}

/** Empty the register. For the guard, which measures the same claims twice on purpose. */
export function reset(): void {
  seen.length = 0;
}

/** The ids that were measured and not met. */
export function unmet(): AuthoredId[] {
  return seen.filter((o) => !o.met).map((o) => o.id);
}

/**
 * The printout.
 *
 * ⚠️ **MET AND UNMET TOGETHER, ALWAYS.** A report that prints only problems cannot be read as a
 * statement about the whole register, and the number that matters — *how many opinions is this
 * project holding as claims* — is only legible when everything is on the page.
 */
export function report(): string {
  const lines = [`── AUTHORED CLAIMS — advisory, ${seen.length} measured, ${unmet().length} unmet ──`];
  for (const o of seen) {
    const row = AUTHORED[o.id];
    const head = `  ${o.met ? '·' : '!'} ${o.id.padEnd(11)} ${row.claim}`;
    lines.push(head);
    if (!o.met) {
      for (const f of o.found.slice(0, 8)) lines.push(`      ${f}`);
      if (o.found.length > 8) lines.push(`      … and ${o.found.length - 8} more`);
      lines.push(`      correct reason to be here: ${row.correctly}`);
    }
  }
  lines.push('  these cannot fail this suite — docs/decisions/0192-a-guard-holds-an-invariant.md');
  return lines.join('\n');
}

/** A pair of places, ordered, for a claim that reports clashes. */
export function pairKey(a: ThemeKind, b: ThemeKind): string {
  return `${a} and ${b}`;
}
