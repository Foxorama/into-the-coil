# 0198 — The accessibility pass comes after the game, and it was decided a while ago

**Accepted 2026-08-25.** Amends [0024](0024-the-accessibility-floor-is-settings.md) on its timing and
on nothing else.

> *"I thought I changed the accessibility rules so that we're going to make the game first and then
> run the accessibility pass afterwards. The accessibility pass has been as restrictive as the other
> guards and not in a good way."*

## ⚠️ The decision was made and never written down, which is why it was never followed

It is not in `docs/game.md`, not in 0024, and not in `docs/state-of-play.md`. **So every session since
has gone on enforcing the old rule**, and that is
[0029](0029-the-tracked-record-is-the-record.md) exactly: *chat evaporates between sessions.* A rule
that lives only in a conversation did not happen.

⚠️ **AND IT COST THREE ART DECISIONS.** [0194](0194-a-hull-has-a-livery.md) flattened every decorative
ink to void on the high-contrast palette and held the three new ones to a separation floor;
[0195](0195-a-place-has-its-own-sky.md) clamped a place's mark size; and
[0196](0196-the-backdrop-is-rounded-out.md) chose its three axes **explicitly because they were the
ones that cost no contrast** — and then the backdrops were reported as *"not actually really any
different visually."* **The floor picked the axes, and the axes were the ones nobody can see.**

## The rule

**The accessibility pass is a phase, and it runs after the game is built.** Until it does:

| deferred | still enforced |
|---|---|
| the WCAG contrast floors — every ink against space, against a backdrop, against a backdrop with weather on it | **gameplay legibility** — a sky mark must not be a bullet's size, an enemy must not read as a pickup, a flash must not hide the field |
| the second palette as a *constraint on authoring* | the second palette as a *thing that exists* — it is not deleted, it stops deciding what the first one may do |
| a decorative ink held apart from a meaningful one | a hurtbox matching the silhouette it is drawn from |

⚠️ **THE LINE IS NOT *ACCESSIBILITY VS ART*, IT IS *CAN THE PLAYER PLAY* VS *CAN EVERY PLAYER PLAY*.**
A star the size of a bullet is a bug for everybody — [0069](0069-the-sky-is-behind-the-game.md) stays,
and it stays at full strength. A cloud that takes `enemy` from 6.0:1 to 5.0:1 against its backdrop is a
question about *some* players and it waits for the pass.

⚠️ **NOTHING IS DELETED.** Every floor this defers is **demoted, not removed** —
[0192](0192-a-guard-holds-an-invariant.md)'s own mechanism, which is what makes the pass possible
rather than a rewrite: the claims keep being measured and printed on every run, so the pass starts from
a list rather than from a fresh audit. **`tests/authored.ts` is where they go and `npm test` prints
them.**

## ⚠️ What this is not

**Not a decision that accessibility is optional.** 0024's unconditional tier — colour never carries
meaning alone, every cue has a visual twin, a flash-intensity cap, actions-not-keys input — is about
the *architecture*, and none of it is deferred. What is deferred is the *numbers*, and numbers are what
a pass is for.

**Not a licence to make the game unreadable.** The gameplay-legibility column above is enforced exactly
as it was, and it is the column that has actually been catching things: 0195's clamp fired on a sky
mark at 40% of a bullet, which is a defect on every palette.

**Not retroactive.** 0194's liveries and 0195's clamps stay as authored. What changes is what the NEXT
pass is allowed to do — and the next pass is big background objects, which
[0069](0069-the-sky-is-behind-the-game.md) and [0112](0112-the-sky-has-weather.md) currently forbid.

## ⚠️ The debt this creates, named rather than left

**The pass has to actually happen.** A deferral with no trigger is a cancellation with better manners.
The trigger is the one `docs/game.md` already names: **the itch tag is not claimed until it has been
played** — and the pass runs before that claim, not after. Its input is whatever
`tests/authored.ts` is printing by then.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Documents and a demotion.

## Confirmed, not assumed

⚠️ **No probe, and the reason is [0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md)'s
own shape.** What this decision changes is *when a pass happens* and *which column a rule sits in* —
there is no file to break that would make a suite refuse a sequencing choice. What backs it instead is
that every deferred floor is now a measured claim in `tests/authored.ts`, printed on every run, and
those have their own probes under 0192.
