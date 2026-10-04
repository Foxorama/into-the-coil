# 0491 — The glow is its health

**Accepted 2026-10-04.** Item 10 of [`the-bosses-look-planned`](../../reports/the-bosses-look-planned-2026-10-04.md),
its 7.4: a glow by health, *green, yellow, amber, red, and back*. The player had said of the feeding
([0404](0404-the-rain-feeds-it.md)): *"as it gets healed its glow will change."* Nothing on any boss tinted
by health. The nearest was a hull per phase ([0402](0402-the-jellyfish-is-glass.md)'s open bell), which a heal
already reverts.

## The rule

**The bell's light is the tint its health is at**: green whole, then lime, yellow, amber, and the open bell.
That is the plan's four with the open bell as the fifth. Each is a bell of its own, worn by its phase
(`BossPhase.hull`), so a feed that crosses a line back steps the glow back through the mechanism that already did
that for the open bell. The whole bell (`boss14`) is the green, and the three between are `boss14Lime`, `boss14Yellow`
and `boss14Amber`, with their hurt twins. **The tint is the glass's light**: the glass the bell is sealed in, the lamp
inside it, the rim and the beads on its lappets. The tentacles keep the lord's ice.

**The halo is in the bell, not behind it.** The plan proposed a halo sprite in the aura layer. The glow baked into the
bell's own tile says the same thing with no entity and no slot, and swaps with the hull on the same step.

**The red is pale, and 0459's floor is why.** The Black Heart is a red-mauve, and a red glass over it is the colour of
the place. `#ff5a68` laid at the glass's half came to 2.46 against the gameplay floor of three, and 0459 answered
exactly this animal being *"almost exactly the same colours as the level background."* The open bell's tint is the
palest red that clears the floor (`#ffa898`, 3.13). Its rim and beads carry the light at full strength, which is where
red reads. The first amber was 2.996 and is lifted for the same floor. The guard that found both is 0459's own, now
asked of every tint.

## Consider the screen

The bell is the same size and shape in every phase but the open one, so nothing about where the player may be moves.
What changes is a colour the player reads as *how far through the fight am I*, and when a feed undoes their work they
see it.

## Guards

`tests/medusa.test.ts`:

- **THE ASK, DRIVEN, IN THE INK** (*0491 — the glow is its health*): driven through every phase, the bell wears five
  different looks, and its glass is five different colours read off each trace. Fed back over a line, it wears the
  phase's look again on that step.
- 0459's *THE JELLYFISH: its glass … over the gameplay floor* is now asked of every tint, because what it held was the
  glass that is drawn.
- 0402's *THE ASK* heals the open bell back to its first phase, which authors no bell, so it still asks whether the
  row's own body comes back. At 0.4 it now wears amber.

`tests/foes.test.ts` holds the jellyfish sealed in its glass lit green.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `node scripts/prove-guard.mjs 0491`:

| broken on purpose | went red |
|---|---|
| the second phase wearing the whole bell's glow | `THE ASK, DRIVEN, IN THE INK` |
| the lime bell lit green | `THE ASK, DRIVEN, IN THE INK` |
| the amber bell under the gameplay floor | `THE JELLYFISH: its glass` |

0255's probe is re-anchored on the phase line that now carries a bell. 0402's two probes are red as before.

## Owed

- **A play of the Black Heart**: do the steps read as health, and does the pale red read as the end? The tints are one
  array, `MEDUSA_GLOW`, under the floor's constraint.
- The continuous version the plan costed, a halo crossfaded by health with an `alpha` on `Entity`, is not built. It
  waits on whether five steps read as steps.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). Art and content; nothing persisted.
