# 0449 — The wings are trimmed

**Accepted 2026-10-02.** Built on 2026-10-01 as a decision numbered 0430 on the branch
`the-wings-are-trimmed`, which never merged. That number went to
[0430](0430-the-readout-counts-ships-and-shields.md). This carries the change onto
[0441](0441-a-pilot-flies-their-own-ship.md)'s roster under a number of its own.

## The ask

> *"make the wingtips of the ship 18% smaller than they are now, they jut out a bit too much and make
> the ship just a bit too big to get through a few holes in bullet walls."*

And, playing the roster: *"I think we changed an early modification I made to the OG ship as well
where I had the wingtips reduced … they look like they're back to the large wingtip size and it looks
like its hitbox is pretty large compared the other ships."*

## The rule

**The fighter's wingtip is at 0.78 of its hull's radius across, where it was 0.95**, which makes the
span 18% narrower. The tip keeps its chord and its place along the hull, so the wing sweeps harder.
The capped pods, the wing panel, the livery's stripe and wingtip light, and the pods' dark bands all
move in by the same 0.17 of `r` (`src/render/bake.ts`). The fighter's `wingtip` on its row goes from
4.35 to 3.85, so the intro's contrails follow the pods.

## Why it is built the way it is

**It was not undone by the roster; it never landed.** The branch was pushed and photographed, and its
number collided with the readout's 0430, which merged first. The roster then flew every run at the
fighter's capped kit, so the pods 0430 had pulled in now stand at the old span on every run.

**The hurtbox did not move, and it is the same on all four ships.** Every ship collides as a disc of
radius 2 (`src/content/ships.ts`), which 0441 kept so no ship is easier to thread. What looked like a
large hitbox is the drawn span. The old pod tips stood 4.35 units out, past the disc, so a gap the
picture said was too tight was one the ship already fit through. Trimming the wings brings the
picture closer to the disc. Shrinking the disc would make every fight easier, and that call is the
player's.

**Only the fighter's parts moved.** The arc and shuriken parts the original also trimmed were removed
by 0441, and the tier boxes it narrowed are gone too: every ship now draws inside one 9.4-unit box.

## Guards

No new guard, on the original's terms: the span is a taste, and its one right answer is the play.
The existing guards ran against it: every mark above the [0106](0106-a-mark-thinner-than-a-pixel-is-not-drawn.md)
floor and on the hull (`tests/accents.test.ts`).

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). Nothing is persisted.

## Owed

- **The play**, and whether 18% is the amount. The play report remembers it as a quarter. 18% is the
  number that was asked for at the time, so it is the one built.
