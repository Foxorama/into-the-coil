import { describe, expect, it } from 'vitest';

import {
  MENU_CONFIRM_BUTTONS,
  MENU_DPAD_BUTTONS,
  MENU_RELEASE,
  MENU_REVERSE,
  attachMenuPad,
  makeMenuAsk,
  type MenuAsk,
} from '../src/app/menu.ts';
import { PAD_AXIS_X, PAD_AXIS_Y, PAD_DEADZONE } from '../src/app/pad.ts';
import { SCREENS, SCREEN_KINDS, STEPS_PER_SECOND, type Screen } from '../src/state/screens.ts';
import { GameFrame } from '../src/app/frame.ts';
import { NO_LEVEL, playableWorld } from './world.ts';

/**
 * A GAMEPAD ON A SCREEN WITH BUTTONS ON IT.
 *
 * `docs/decisions/0046-a-pad-is-a-first-class-way-to-press-a-button.md`. Reported from play:
 * *"gamepad controls on title screens — currently not working."*
 *
 * ⚠️ **The half tested here is the EDGE, and it is the half a browser test cannot see.** Whether the
 * focus ring moves is visible on a page; whether one push of a stick moves it once or sixty times a
 * second is a property of two numbers held between steps, and it is the property that decides
 * whether a menu is usable at all. `tests/menu.browser.test.ts` has the other half.
 */

/** A pad snapshot, built from plain numbers — no physical device, and no `navigator`. */
function pad(axes: readonly number[], pressed: readonly number[] = []): Gamepad {
  const buttons = Array.from({ length: 17 }, (_, i) => ({
    pressed: pressed.includes(i),
    touched: pressed.includes(i),
    value: pressed.includes(i) ? 1 : 0,
  }));
  return {
    id: 'stub',
    index: 0,
    connected: true,
    mapping: 'standard',
    axes: [...axes],
    buttons,
    timestamp: 0,
    vibrationActuator: null,
  } as unknown as Gamepad;
}

/** Drive a reader over a script of snapshots and collect what it asked for on each step. */
function drive(frames: readonly (Gamepad | null)[][]): MenuAsk[] {
  let frame = 0;
  const source = attachMenuPad({ pads: () => frames[frame] ?? [] });
  const ask = makeMenuAsk();
  const out: MenuAsk[] = [];
  for (frame = 0; frame < frames.length; frame++) {
    source.read(ask);
    out.push({ move: ask.move, confirm: ask.confirm });
  }
  return out;
}

const AXES = (x: number, y: number): number[] => {
  const axes = [0, 0];
  axes[PAD_AXIS_X] = x;
  axes[PAD_AXIS_Y] = y;
  return axes;
};

describe('a held stick asks once, not once per step', () => {
  it('reports one move for a push and holds silent until it comes back', () => {
    /*
      THE BUG THIS EXISTS FOR. A menu that reads the stick as a level moves the focus sixty times a
      second, so a control the player nudged towards is three screens away before their thumb is
      back at centre — and every one of those moves is individually correct.
    */
    const pushed = [pad(AXES(0, 1))];
    const asks = drive([pushed, pushed, pushed, [pad(AXES(0, 0))], pushed]);
    expect(asks.map((a) => a.move), 'a held stick asked more than once').toEqual([1, 0, 0, 0, 1]);
  });

  it('hears the opposite direction without a trip through the centre', () => {
    /*
      ⚠️ **The edge is a DIRECTION and not a boolean, and this is why.** Held as a boolean, a stick
      rolled from up to down without passing centre stays "held" and the second direction is never
      heard — which the player experiences as the menu refusing to go back.
    */
    const asks = drive([[pad(AXES(0, -1))], [pad(AXES(0, 1))]]);
    expect(asks.map((a) => a.move)).toEqual([-1, 1]);
  });

  it('ignores a stick resting off centre', () => {
    // `src/app/pad.ts` has the argument: a worn stick can rest at 0.15, and a menu that scrolls on
    // its own reads as a broken build rather than as a worn pad.
    const resting = PAD_DEADZONE * 0.9;
    const asks = drive([[pad(AXES(resting, -resting))]]);
    expect(asks[0]!.move, 'a resting stick moved the focus').toBe(0);
  });
});

/**
 * THE JERKY FLICK, REPORTED FROM PLAY.
 *
 * *"Gamepad title menu is jerky with a quick flick stick — the stick resetting to center makes the
 * menu move and it's jerky. happens about 50% of the time."*
 * `docs/decisions/0055-a-press-belongs-to-one-screen.md`.
 *
 * ⚠️ **The reading below is a REAL SPRING, not a step function**, and that is what makes this a test
 * of the reported bug rather than of the fix. A stick let go of from full deflection does not walk
 * back to zero — it crosses zero and rings out on the far side. The old rule heard any direction
 * that differed from the one held, so the ring was a perfectly good reversal.
 */
describe('a stick let go of is not a second ask', () => {
  /** One flick and its release: hard over, then the spring ringing past centre and settling. */
  const FLICK: readonly number[] = [1, 0.95, 0.6, 0.15, -0.3, -0.22, -0.08, -0.02, 0];

  it('moves the focus exactly once for one flick of the stick', () => {
    /*
      ⚠️ **ONE, and the number is the whole report.** The old reader answered this with two moves in
      opposite directions — which is precisely what *"jerky"* describes, and why it happened about
      half the time: whether the ring clears `PAD_DEADZONE` depends on how hard the flick was.
    */
    const asks = drive(FLICK.map((v) => [pad(AXES(0, v))]));
    const moves = asks.map((a) => a.move).filter((m) => m !== 0);
    expect(moves, `one flick asked for ${moves.length} moves: ${moves.join(', ')}`).toEqual([1]);
  });

  it('and the ring back through centre is refused however deep it goes, short of a real push', () => {
    // Every overshoot the threshold is meant to survive, driven one at a time from the same hold.
    for (const ring of [-0.2, -0.35, -0.5, -(MENU_REVERSE - 0.01)]) {
      const asks = drive([[pad(AXES(0, 1))], [pad(AXES(0, ring))]]);
      expect(asks[1]!.move, `a spring ringing to ${ring} moved the focus`).toBe(0);
    }
  });

  it('but a deliberate reversal is still heard, with no trip through the centre', () => {
    /*
      ⚠️ **The half that must NOT regress.** This file already refuses the obvious fix — requiring a
      return to neutral — because *"a stick rolled from up to down without passing centre stays held
      and the second direction is never heard"*. A push at the threshold is the boundary case.
    */
    expect(drive([[pad(AXES(0, -1))], [pad(AXES(0, 1))]]).map((a) => a.move)).toEqual([-1, 1]);
    expect(drive([[pad(AXES(0, -1))], [pad(AXES(0, MENU_REVERSE))]])[1]!.move).toBe(1);
  });

  it('does not re-arm on a stick hovering at the deadzone, which is what a worn one rests at', () => {
    /*
      ⚠️ **The other half of *"jerky"*, and a different mechanism.** With one threshold for engaging
      and disengaging, a stick sitting near it re-crosses on noise alone and the focus walks down the
      menu on its own. `src/app/pad.ts` records that a worn stick rests at 0.15 — above `MENU_RELEASE`
      and below nothing.
    */
    const hover = [1, 0.3, 0.19, 0.3, 0.19, 0.3];
    const asks = drive(hover.map((v) => [pad(AXES(0, v))]));
    expect(asks.map((a) => a.move).filter((m) => m !== 0), 'a hovering stick asked more than once').toEqual([1]);
  });

  it('and hears the next push once the stick has genuinely come back', () => {
    // The release threshold has to actually release, or one flick would be the last one ever heard.
    const asks = drive([[pad(AXES(0, 1))], [pad(AXES(0, MENU_RELEASE / 2))], [pad(AXES(0, 1))]]);
    expect(asks.map((a) => a.move)).toEqual([1, 0, 1]);
  });
});

describe('a press belongs to one screen', () => {
  it('hears nothing on the step a screen change spends, and takes what is held as the baseline', () => {
    /*
      ⚠️ **`spend` is not `release`, and the difference is the reported bug.** `release` forgets what
      was held, so a button still under a thumb reads as a fresh press on the very next step — which
      on the game's reader is the bomb that fires itself as a run starts.
    */
    const held = [pad(AXES(0, 1), [MENU_CONFIRM_BUTTONS[0]!])];
    const source = attachMenuPad({ pads: () => held });
    const ask = makeMenuAsk();
    source.spend();
    source.read(ask);
    expect(ask.confirm, 'a spent press was still delivered').toBe(false);
    expect(ask.move, 'a spent push still moved the focus').toBe(0);
    source.read(ask);
    expect(ask.confirm, 'the held button was not taken as the baseline').toBe(false);
    expect(ask.move, 'the held direction was not taken as the baseline').toBe(0);
  });
});

describe('both axes move the focus, and the larger deflection wins', () => {
  it('answers a horizontal push as well as a vertical one', () => {
    // A row of controls and a column of controls are the same list; which way the chrome laid them
    // out is CSS, and a pad that only answered one axis would feel broken on whichever it was not.
    expect(drive([[pad(AXES(1, 0))]])[0]!.move).toBe(1);
    expect(drive([[pad(AXES(-1, 0))]])[0]!.move).toBe(-1);
  });

  it('resolves a diagonal to one answer rather than to both', () => {
    // A diagonal is a real ask while flying — `src/app/pad.ts` reads it radially for that reason —
    // and it is not one here, because there are only two answers and they are opposites.
    expect(drive([[pad(AXES(0.5, -0.9))]])[0]!.move, 'the smaller axis won').toBe(-1);
    expect(drive([[pad(AXES(0.9, 0.5))]])[0]!.move).toBe(1);
  });

  it('takes the d-pad, which is what a hand reaches for in a menu', () => {
    expect(drive([[pad(AXES(0, 0), [MENU_DPAD_BUTTONS.up])]])[0]!.move).toBe(-1);
    expect(drive([[pad(AXES(0, 0), [MENU_DPAD_BUTTONS.down])]])[0]!.move).toBe(1);
    expect(drive([[pad(AXES(0, 0), [MENU_DPAD_BUTTONS.left])]])[0]!.move).toBe(-1);
    expect(drive([[pad(AXES(0, 0), [MENU_DPAD_BUTTONS.right])]])[0]!.move).toBe(1);
  });
});

describe('confirm is a press and never a hold', () => {
  it('fires once for a button held down across many steps', () => {
    /*
      ⚠️ **The one that would be worst in play.** A held confirm re-fires every step, so the button
      that starts a run also presses whatever the next screen puts under the player's thumb — and on
      the run-over screen that is *Again*, which would restart the run they were reading about.
    */
    const held = [pad(AXES(0, 0), [MENU_CONFIRM_BUTTONS[0]!])];
    const asks = drive([held, held, held, [pad(AXES(0, 0))], held]);
    expect(asks.map((a) => a.confirm)).toEqual([true, false, false, false, true]);
  });

  it('takes every button the table names', () => {
    for (const button of MENU_CONFIRM_BUTTONS) {
      expect(drive([[pad(AXES(0, 0), [button])]])[0]!.confirm, `button ${button} does not confirm`).toBe(true);
    }
  });

  it('forgets what was held when the source is released', () => {
    // Re-entering a menu must not inherit a press from the last one.
    let frames: (Gamepad | null)[] = [pad(AXES(0, 0), [MENU_CONFIRM_BUTTONS[0]!])];
    const source = attachMenuPad({ pads: () => frames });
    const ask = makeMenuAsk();
    source.read(ask);
    expect(ask.confirm).toBe(true);
    source.read(ask);
    expect(ask.confirm, 'a hold fired twice').toBe(false);
    source.release();
    frames = [pad(AXES(0, 0), [MENU_CONFIRM_BUTTONS[0]!])];
    source.read(ask);
    expect(ask.confirm, 'release did not clear the held state').toBe(true);
  });
});

describe('a disconnected or absent pad asks for nothing', () => {
  it('survives an empty snapshot and a null entry', () => {
    // Both are real states: no pad plugged in, and a slot the browser has emptied.
    expect(drive([[], [null]]).every((a) => a.move === 0 && !a.confirm)).toBe(true);
  });

  it('ignores a pad that reports itself disconnected', () => {
    const gone = { ...pad(AXES(0, 1), [0]), connected: false } as Gamepad;
    expect(drive([[gone]])[0]).toEqual({ move: 0, confirm: false });
  });
});

describe('a screen that expires presses its own control, and says how long it waits', () => {
  it('gives the run-over screen seven seconds back to the title', () => {
    /*
      Asked for in play: *"this screen should have a 7 second countdown; when it expires, the player
      is returned to the title screen."*

      Held as the number of SECONDS rather than the number of steps, which is the unit the request
      was made in — and `STEPS_PER_SECOND` is the one description of the conversion, so a change to
      the step rate cannot silently make this four seconds.
    */
    const timeout = SCREENS.gameOver.timeout;
    expect(timeout, 'the run-over screen waits forever').not.toBe(null);
    expect(timeout!.steps / STEPS_PER_SECOND).toBe(7);
  });

  it('and `victory` is the only screen left that waits forever', () => {
    /*
      ⚠️ **THIS USED TO SAY *no screen other than the run-over screen expires*, and it was right about
      `victory` and wrong about `cleared`** — decision 0063. The reasoning it carried was that both
      *"sit on top of something the player earned, and timing either out would throw a run away while
      its owner was looking at it."* That is exactly true of `victory`, which ends a run. It is not
      true of a LEVEL break, which does not end anything: expiring there carries the run onward, which
      is what the player was going to press anyway. Reported as *"the current pause/level screen
      interrupts the flow."*

      `playing` timing out would end a run nobody lost, and `title` has nothing to press for the
      player: a run cannot begin without a tier being chosen (0047).
    */
    const waiting = SCREEN_KINDS.filter((s: Screen) => SCREENS[s].timeout === null);
    expect(waiting.sort(), 'a screen that should wait for a hand expires by itself').toEqual(
      ['playing', 'title', 'victory'].sort(),
    );
  });

  it('and a screen that expires has a control for the expiry to press', () => {
    /*
      ⚠️ **THE RULE THAT REPLACED A SECOND DESTINATION.** A timeout used to carry `then: Screen`
      beside its duration, which said a second time what the screen's own control already did — the
      run-over screen's *Again* went to the title and its timeout went to the title, and the two
      agreed only because somebody kept them in step. Expiring now presses the first control, so a
      screen that expires with nothing to press would silently do nothing at all when it ran out.
    */
    for (const screen of SCREEN_KINDS) {
      const timeout = SCREENS[screen].timeout;
      if (timeout === null) continue;
      expect(timeout.steps, `${screen} expires in no time at all`).toBeGreaterThan(0);
      expect(
        SCREENS[screen].actions.length,
        `${screen} expires, and has no control for the expiry to press`,
      ).toBeGreaterThan(0);
    }
  });
});

/**
 * A LEVEL BREAK IS A RESPITE.
 *
 * `docs/decisions/0063-a-level-break-is-a-respite.md`. Reported from play: *"the current pause/level
 * screen interrupts the flow"* — and, in the same breath, that the interruption is what makes the
 * branching chart between levels look like the wrong idea.
 */
describe('a screen says whether it stops the world and whether it hides it', () => {
  it('the level break keeps the world running and does not paint over it', () => {
    expect(SCREENS.cleared.steps, 'the level break stops the world it is meant to fly through').toBe(true);
    expect(SCREENS.cleared.dims, 'the level break paints over the sky it is a banner on').toBe(false);
  });

  it('and it is the only screen with chrome on it that does either', () => {
    /*
      ⚠️ **`steps` and `dims` were one thing until this screen wanted them apart**, and holding that
      here is what stops them quietly becoming one thing again. Every OTHER screen with something to
      say stops the world and hides it; `playing` has nothing to say at all.
    */
    for (const screen of SCREEN_KINDS) {
      const row = SCREENS[screen];
      const hasChrome = row.heading.length > 0 || row.actions.length > 0;
      if (!hasChrome || screen === 'cleared') continue;
      expect(row.steps, `${screen} has chrome on it and leaves the world running`).toBe(false);
      expect(row.dims, `${screen} has chrome on it and does not hide the scene`).toBe(true);
    }
  });

  it('a countdown gets a step whether or not the simulation took it', () => {
    /*
      ⚠️ **THE MECHANISM THE LEVEL BREAK NEEDED, and the reason `onTick` is not a second `onIdle`.**
      A screen's countdown used to be spent inside `onIdle`, which fires only on the steps the
      simulation does NOT take — true of every screen with chrome on it, right up until one of them
      kept the world running. On that screen the timer would simply never have ticked, and the break
      would have waited forever with the game playing underneath it.
    */
    const built = playableWorld(NO_LEVEL);
    let ticks = 0;
    let idles = 0;
    built.world.onTick = (): void => {
      ticks++;
    };
    built.world.onIdle = (): void => {
      idles++;
    };
    const frame = new GameFrame(built.world);

    built.world.stepping = true;
    for (let i = 0; i < 10; i++) frame.step();
    expect(ticks, 'a stepping screen got no ticks at all').toBe(10);
    expect(idles, 'the simulation stepped and the menu reader ran anyway').toBe(0);

    built.world.stepping = false;
    for (let i = 0; i < 10; i++) frame.step();
    expect(ticks, 'a stopped screen stopped counting down').toBe(20);
    expect(idles, 'the menu reader never ran on a screen the simulation is stopped on').toBe(10);
  });

  it('a screen that does not dim never carries a countdown, because it never took anything away', () => {
    // `docs/game.md`'s voice rule: no restating what the screen already shows. A number counting down
    // over a world that never stopped is a fact about nothing the player is waiting for.
    for (const screen of SCREEN_KINDS) {
      if (SCREENS[screen].timeout === null || SCREENS[screen].dims) continue;
      expect(SCREENS[screen].steps, `${screen} shows a countdown over a world it did not stop`).toBe(true);
    }
  });
});
