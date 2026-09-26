# 0379 — The specials are seen

**Accepted 2026-09-26.** Four changes, all from one play of the specials:
- **The thrown specials are slower and bigger.** The bomb, the storm's ball and the void fly at 1.5 a
  step, where they flew at 2.2. They draw bigger, and the two balls trail their own light.
- **The storm and the whirlpool last half a second longer.**
- **A tube special fires two missiles of its own.** A surge used to charge whatever tubes were
  fitted. Now two pods on the ship's flanks fire the surge's own kind, charged, beside the tubes.
- **The circle round the ship is gone.** The pods are the picture of the surge.

This follows [0378](0378-the-specials-are-heard.md), and it corrects [0373](0373-a-special-is-the-guns-own.md)'s
surge the way [0376](0376-a-trigger-for-the-gun-and-one-for-the-tubes.md) corrected its stack.

## The ask

> *"all the bomb launch effects need to be more visible as well, they're all slightly too faster and
> not visible enough. The shuriken and lightning need to last just a .5 sec longer or so, they're too
> fast atm. The missiles need a rework on the special, same problem exists when activating a special
> with the other equipped. Let's change that special so that it fires out two additional missiles of
> the special bomb variety, so you could have any combo of 4 or 2/2 depending on your equipped missile
> and the special. The ship aura is a basic circle now as well, it looks terrible."*

## The throws

**Speed.** 1.5 a step, from 2.2, on the same reach. A thrown special goes off where it did, nine
tenths of a second after the press where it was six. It is the same speed in all three rows, as it
always was.

**Size.** Each row's radius follows its drawing, to stay inside the hurtbox band:

| body | drawn at, before | drawn at, now | radius |
|---|---|---|---|
| bomb | 9 | 12 | 3.2 |
| storm's ball | 4.4 | 10 | 2.5 |
| void | 4.4 | 10 | 2.5 |

**The balls trail their own light.** Each hull is about four units across now. Behind it, the way it
came, the storm trails two jagged streaks and the void a wake of its purple. The trails are
translucent, because they are where it has been and not the body, under 0227's paint-on-hull rule.
`tests/accents.test.ts` caught the first drawing twice:
- the trail was drawn before the hull, and the first fill *is* the hull;
- the void's glow was solid enough over the edge to count as a second silhouette.

## Half a second longer

- **The storm.** Its flicker renews for 64 steps, where it ran 32. Its cue's after-flickers (0378)
  run as long.
- **The whirlpool.** It ends when none of it is on the screen, so it lasts longer by growing slower:
  0.6 a step, where it grew 0.7. Measured, it lived 3.07 s before and lives 3.57 s now.
- **The guard.** `tests/storm.test.ts` holds both in seconds, the unit the play was in, and as the
  player sees them: a whirlpool on the screen, bolts in the air.
- **More damage, as a result.** A slower whirlpool turns over a boss longer, so it lands more often.
  Nothing was taken back to pay for that: the ask was to see it longer, and this is what that costs.

## The tube special

A surge charged the tubes that were fitted, so hunt thrown with straight missiles fitted gave
straight missiles a seeker's charge. That is the same flaw 0376 fixed for the stack: a charge used
through a weapon it was not earned from.

**Now a surge adds two missiles of its own.** `Surge.pods` names:
- which missile they fire: seekers for hunt, straight missiles for overdrive;
- how many a volley: two;
- the charge 0373 and 0375 gave the tubes: damage, fuse and pierce.

The fitted tubes fire as they are. Every pairing therefore gives four of one kind or two and two, as
asked. A ship with no tubes still fires the pair, because the pods are tubes of their own.

**Where the pods are.** At `POD_ACROSS`, 4.5 units out from the centreline: outside the hull and
outside the fitted tubes. That one number is where the frame launches them from and where the bake
draws them.

**The pool had to grow.** Two pods double what a volley puts in the air. At the strongest tubes on
the widest screen, 36 missiles were in flight at once, measured, against a pool of 24 that had been
dropping volleys silently. The pool is now 40, the same tenth of headroom the shots keep, and 0286's
worst case is 632. `tests/surge.test.ts` flies that case.

## The picture

The aura was a halo and a rim. *"It looks terrible,"* and it was also a picture of the wrong thing
once the surge stopped charging the tubes. It is now the two pods it adds:
- a capsule each side of the hull at `POD_ACROSS`, on a strut, in the surge's ink;
- lit at the nose and warm behind;
- nothing round the ship, so nothing hides a bullet beside it.

It still blinks for its last second and a half (0373).

## Confirmed, not assumed

`scripts/probes/0379-the-specials-are-seen.mjs` breaks each change back to what it was, and each
break turned its guard red.

Re-anchored where the lines they hang on moved: 0286 (the worst case).

## Owed

- A play on the branch preview. Two of these numbers are the play's own words turned into steps,
  and the other two are a first guess at *"more visible"*.
