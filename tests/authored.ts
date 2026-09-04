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
