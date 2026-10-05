# The hangar, planned — 2026-10-05

One ask, ten changes, landed in order, each from `main` and each played on its own branch preview.
This file holds the plan and the answers the player gave while it was being made. What each change
decided lives in its decision once it lands; this is the queue.

## The ask

> *"so need a plan for adding in a customisation 'mod-shop' style option from the main menu or
> somewhere like that. Will you to chop and change anything about your ship and/or pilot as you
> unlock things and/or buy things - part of this work will be a cosmetic store as well where you can
> buy additional cool things to trick out your ride.*
>
> *'Hangin` Out' - the spaceship hangar, allows you to select your pilot, then choose their
> spaceship, choose their weapon, choose what is hanging from the dashboard in the novelty dice slot
> and customise anything else about the ship based on that particular spaceship - like the station
> wagon and firebird can have customisable wheels.*
>
> *The way it works is that when you beat the jellyfish with a pilot and ship you unlock that ship to
> do with as you want. Each additionally ship you finish a run with with provides all that ship's
> customisation options for you to chop and change.*
>
> *The Cosmo's Cosmetics shop will let you buy additional things that will be equippable onto your
> spaceship, starting items to buy will be some other fun things to hang from the dashboard - like a
> eucalyptus potpurri tree, a picture of the alien's family in a little frame, a golf ball.*
>
> *Star Shards are how you'll be able to buy things in the shop and you earn Star Shards based on
> your points total in a run — the highest points you earned in a continue run grant you 1 Star Shard
> per 10,000 pts. in a non-continue run, you'll only have highest score for that run, so it's just
> based on your sore for that run."*

Then, while it was being planned:

> *"We can keep the pilot locked to the ship and have that kept so you can't change the main ship,
> but each spaceship will have a set series of cosmetics you change"*
>
> *"also in the cosmetic shop Ion Thrusters - blue flame thrusters for your spaceship"*

And once the plan was written:

> *"I do want guns to be interchangable per ship as well, it's expensive, but it makes the modding a
> lot more fun and a lot higher quality"*
>
> *"the specials should be separate as well and let you pair the shuriken special with the lightning
> gun once you've unlocked both"*

## What was already true

- **The novelty dice slot exists, on one ship.** The estate's `walnut` HUD plate hangs fuzzy dice
  that swing on a burst and a brake (`DICE` in `src/content/ships.ts`, the swing in `stepJolt` in
  `src/app/frame.ts`, the plate in `src/app/chrome.ts`). The fighter's `bracket`, the saucer's
  `orbit` and the Firebird's `checker` have nothing to hang from. **The dashboard is the HUD plate.**
  No cockpit is drawn anywhere, and at the 9.4-unit `SHIP_BOX` a dangle in the world would be under
  the smallest mark the bake allows.
- **The cars' wheels are visible in play.** Both cars are drawn side-on since 0441's first play.
  Each wheel's detail is its own loop in `src/render/bake.ts` (the Firebird's snowflakes, the
  estate's whitewall and gilt hubcap), so it takes a parameter; the tyre's silhouette is part of
  each car's one outline path and does not.
- **The gun is the ship's in three places, and only one of them is how it flies.** `ShipRow.weapon`
  fixes it (0441), and `shipCarrying` maps a gun back to its one ship. The frame already switches on
  `w.weapon.flight` and never on the ship, so the *behaviour* is free. Two things are not: the
  **drawing** — each car's one outline path takes in its hood gun, and every gun is painted inside
  its ship's draw function — and the **shot's starting point**: the row's `muzzle` (0448), which
  `tests/mounts.test.ts` holds to the bake's `carMounts`.
- **A special is already free of its gun everywhere but the opening.** `WeaponRow.special` is read
  by one function, `startingArsenal` in `src/state/slices/run.ts`, for the two charges a run opens
  on. Every special can be thrown from every ship (0441), each knows its own trigger
  (`SPECIALS[kind].side`), and Burn's opening void already asks the *opening special's* side —
  so a run opened on the nova from any ship gets no void on top, by the code as it stands.
- **A gun flown from a different ship is a different fight.** The shuriken's helix width is the
  ship's `wingtip`, and the arc's first link leaves from the ship's muzzle. So 0260's forty-second
  floor, which `tests/level.test.ts` flies in every ship today, has four fights per boss now and
  sixteen once guns swap.
- **Nothing persists between visits except the table and the settings** — `itc_scores` and
  `itc_settings`. The unlock pool in `docs/game.md` was never built. There is no meta-progression
  store, and `tests/privacy.test.ts` fails a key that `PRIVACY.md` does not list.
- **A run ends in five places** in `src/app/mount.ts`, all through `recordRun`: the game-over
  screen with no quarters, the victory, the run-over offer running out, the pause's quit, and a
  continue — which ends a credit, not the run.
- **No run's total has ever been measured.** `docs/game.md`'s Score section: *"Every number in it
  is a play number, and none has been played."* An estimate from the point tables (unverified, owed
  a play): a poor credit at 50–250k, a strong one-credit clear at 2–3M. **That is 5 to 300 shards a
  run** — two orders of magnitude, because the streak's ×8 dominates.

## Pressure-tested

- **It reverses two lines, and both reversals are sound.** `docs/game.md` says *"No shop, no
  currency, no economy. Re-adding one is an argued reversal, not a drift"*, and
  [0428](../docs/decisions/0428-the-score-is-kept.md) adds *"The score is not a currency."* No
  decision ever argued the first; it came in as a premise with the product definition, and the
  sentence it rests on is about power *in a run* — *"everything is found in the level and applied
  the instant you touch it."* A shop that sells only what the sim never reads leaves that intact. So
  the line is replaced rather than deleted: **the shop never sells anything the sim reads**, and
  that is the argued reversal the file asks for.
- **A swappable gun is the expensive part of the ask, and it was asked for knowing that.** It
  reverses 0441's *"a weapon will be keyed to that ship only"*, which was also the player's. What it
  costs: every gun drawn twice, side-on for the cars and top-down for the fighter and the saucer; the
  guns taken out of the cars' outlines; the forty-second boss floor flown sixteen ways rather than
  four, at four times that guard's cost in CI; and the sheet holding each ship once per gun it may
  carry. Done as the gun's own layer, it is eight drawings, not twelve bespoke combinations, and a
  fifth gun costs two drawings rather than four.
- **Shards from the best credit cannot be farmed by continuing.** Freeplay's unlimited continues
  each start the score again (0438), and only the best one pays.
- **The price list cannot be set yet.** At 5–300 shards a run, any price written now is a guess by a
  factor of ten. Prices are provisional on their rows until a played run gives a real number.

## The answers

| question | answer |
|---|---|
| what does beating the jellyfish in a ship unlock? | that ship's own set of cosmetics and its gun slot, and its gun for the other ships' gun slots. The pilot keeps their ship |
| can the guns be swapped? | **yes** — *"it's expensive, but it makes the modding a lot more fun and a lot higher quality"* |
| is the special its own slot? | **yes**, apart from the gun — *"pair the shuriken special with the lightning gun once you've unlocked both"*: the whirlpool on the estate, after a win in the Firebird and a win in the estate |
| where can a won gun go? | **only onto ships that have been won in.** A ship's gun slot is one of its own options, like its wheels: the shuriken goes on the fighter after a win in the Firebird **and** a win in the fighter |
| does a win on continues count? | yes — any win, any difficulty, Freeplay included. It unlocks looks, not power |
| which slots does a ship have? | wheels on both cars; hood or nose art; a livery; the HUD plate's motif |
| a livery from palette roles, or any colour? | **any colour** — *"if someone wants to make something monstrous on their own game they can do that"* |
| what is in the shop first? | dangles — a eucalyptus potpourri tree, the alien's family in a little frame, a golf ball — and **Ion Thrusters**, a blue flame |

## Read, and decided without asking — each can be vetoed

- **Shop items fit any ship from the moment they are bought.** A dangle or the ion thrusters are
  not gated by a win; the player paid for them. A ship's **own** slots — wheels, nose art, livery,
  plate — are what its win unlocks.
- **The loadout is kept per ship**, so each pilot flies as they were left. Picking the pilot stays
  on the title (0513's one tap to fly), and the pilot card shows the loadout they will fly.
- **The hangar is a door off the title, and Cosmo's is a tab inside it**, using the `tabs` a screen
  row already has. Buying and fitting are one place.
- **Shards are paid at every true run end, including a quit from the pause.** Otherwise a player
  who has earned a credit's score is pushed to fly a lost run out to keep it. Nothing is paid at a
  continue, because a continue does not end the run. The run-over, game-over and victory screens
  show what was earned.
- **Under any livery, the running lights stay the player's cyan.** 0441: *"every ship carries the
  player's cyan as running lights, so the player can always find themselves."* That is hard because
  of what it is about. The monstrous livery is the body; the lights that say *this one is you* are
  not paint.
- **The high-contrast look ignores the livery and draws the ship's roles.** An accessibility knob
  that a cosmetic can defeat is not a knob
  ([0024](../docs/decisions/0024-the-accessibility-floor-is-settings.md)), and 0441 rejected fixed
  hexes because that palette could not answer them. The livery is kept, and shows again when the
  look is switched back.
- **Only the fitted loadout is baked for a run.** The atlas bakes every ship at every stage today.
  Baking every option would multiply it by every slot. The hangar bakes its one preview ship when a
  slot changes, and the cost of each lands against the press-to-HUD second as a budget, sized under
  load.
- **The dice stay the estate's default dangle**, and the other three ships open with nothing hung.
- **A run carries the fitted gun and the fitted special, not the ship's.** A run opens on two
  charges of the *fitted* special, and the pilot card names both. A special unlocks exactly as a gun
  does: with its ship's win, onto ships that have themselves been won in. The ship's
  own gun is its default, on its row, and the fallback when nothing is fitted.
- **The HUD plate, the shell, the tubes and the engines stay the ship's.** Only the gun moves.

## Raised for the screen, not answered by a rule

- **A blue plume and the frost shot.** `frost` is a saturated cyan that means *this will slow you*,
  and the player's own cyan sits beside it. A blue exhaust trails behind the ship, the one place a
  shot arriving from behind is read. It is weighed on the frost ship's level, beside its shots and
  photographed at the shipped camera, before it ships — per
  [0295](../docs/decisions/0295-a-ranking-guard-is-a-content-limiter.md), argued for this case, with
  no guard. 0295's *"a flame is the same red everywhere"* is about hostile fire, not the ship's
  exhaust, so it does not decide this.
- **A dangle swinging on the plate** sits in the HUD's corner, not on the lane. Its motion is
  already authored to a burst and a brake, so a new item reuses the swing rather than adding motion
  to the screen's edge.

## The queue

1. **The hangar and the unlocks.** A third storage key, `itc_hangar`, versioned from v1: wins per
   ship, the shard balance, what is owned, each ship's loadout — in `PRIVACY.md`, with a rollback
   note because the key is irreversible (0001). A victory records its ship. *Hangin' Out* on the
   title: the ships in the pilot band's order, each with its gun shown and not changeable, its slots
   locked behind *beat the jellyfish in this ship* until it is. The first slot is **the HUD plate's
   motif**, because all four motifs are already drawn. **Built as
   [0521](../docs/decisions/0521-the-hangar-opens.md).**
2. **Star Shards.** The best credit of a run, `floor(score / 10 000)`, paid at the true run ends
   and shown on their screens; the balance on the hangar. 0428's *not a currency* is reversed in
   the decision, and `docs/game.md`'s *no shop* line is rewritten in the same PR — moved here from
   item 1 while it was built, because a currency is what first makes that line untrue. **Built as
   [0522](../docs/decisions/0522-the-score-pays-in-shards.md).**
3. **The dangle slot, and Cosmo's Cosmetics.** Every plate gets a place to hang from; a dangle is a
   row with its own drawing and its own swing weights on the existing swing. The dice, the
   eucalyptus tree, the family in the frame and the golf ball. The shop tab, a provisional price on
   each row, and buying. **Built as [0523](../docs/decisions/0523-cosmo-opens.md)**, at 250 each and
   on the one swing the dice already had, rather than swing weights of their own.
4. **The special slot.** The run carries a fitted special and `startingArsenal` reads it, with the
   gun row's `special` as the default. No art, no new fight: every special is already thrown from
   every ship. First of the loadout slots because it is the cheapest, and it puts the unlock rule
   that guns will share in front of a player before the guns cost anything. **Built as
   [0524](../docs/decisions/0524-the-special-is-fitted.md).**
5. **The gun is its own layer** — and nothing the player sees changes. Each ship authors a
   hardpoint, in the view it is drawn in, and may override it for one gun. Each gun authors its
   mount's drawing from the side and from above, and where its shot leaves that drawing. The
   muzzle is the hardpoint plus the gun's own offset. The guns come out of the cars' outlines and
   the hit twins, the run carries a fitted gun, and `shipCarrying` goes. **Proved by the sheet
   baking byte-identical** with every ship on its own gun, so a refactor that moved a pixel is
   found before any new drawing hides it. **Built as [0525](../docs/decisions/0525-the-gun-is-a-layer.md)**,
   and the premise moved while it was built: cutting a car's gun out of its one outline would not have
   baked byte-identical (an anti-aliased join), so the own-gun drawing was not cut at all — a borrowed
   gun takes a second branch, and the own-gun traces were proved identical to `main`'s, call for call.
   The twelve pairings' mounts were drawn here too, and are owed a design pass.
6. **The gun slot.** The hangar's gun band, on the special's rule; the run's six ship sprites re-baked
   with the fitted gun in place in the atlas at a run's start and after every full bake, and the lives
   icon, the pilot card and the intro's hangar with them; the boss floor flown in all sixteen, with
   any pairing under forty seconds answered on its boss's or its gun's row as 0441 answered the
   pterodactyl. **Built as [0526](../docs/decisions/0526-the-gun-is-fitted.md).** One of the twelve
   was under: the ray on the estate cleared the serpent's first phase in 7.8 volleys, answered on the
   serpent's row (the ray at 0.93). The hangar was laid out again for a fourth band.
7. **Wheels.** Each car authors its own set of rims — the Firebird's gold snowflakes and the
   estate's whitewall are each one entry of its set — with the tyre's outline untouched.
8. **Hood and nose art.** Each ship authors its own: the Firebird's phoenix and its alternatives, a
   nose art for the fighter, a crest on the estate's bonnet and the saucer's dome.
9. **The livery.** A free colour for each ship's body, through a picker a pad, a mouse and a thumb
   can all work. The running lights stay cyan and the high-contrast look stays on roles, as above.
10. **Ion Thrusters.** The exhaust's ink becomes a slot; the blue flame is the first thing it sells,
   weighed against the frost shot on the frost ship's level before it ships.

The order is the save first, because every later item writes to it; then shards, so the very next
run already earns; then the shop, the first thing there is to buy. **The guns come before the
wheels and the nose art** because all three open the same car drawings: the gun's layer is cut
first, so the wheels and the art are drawn onto the layering they will keep, rather than cut
apart a second time. The gun is two PRs because the first can be proved byte-identical and the
second cannot. A senior-design pass is owed on each before it is handed over, photographed at the
camera the game ships.

## The prices, set from a played run

The first measured run, 2026-10-05: *"I did a single clear of legendary difficulty and got 1579750
pts which at 1/10,000 would be around 157 shards."* So a clean one-credit clear on the gentlest tier
pays 157 shards. Set on that:

| tier | price | what |
|---|---|---|
| base | **250** | the cheaper things — the first dangles: the eucalyptus tree, the family in the frame, the golf ball |
| next | **400** | Ion Thrusters |

*"let's set the cheaper stuff at 250 shards for a base level and then Ion Thursters being 400 shards
at the next tier."* About two clears for a dangle and three for the thrusters.

## Owed
- **Who Cosmo is.** A name on a screen, or a face with a line, like the pilots have.
- **Whether losing the device's storage losing the purchases needs saying in the shop.** The game
  makes no network requests after load, so there is nowhere else to keep them.
- **What sixteen boss fights cost in CI**, measured on the gun slot's own run before it merges —
  that guard is already among the suite's slow ones.
- A play of each change on its branch preview, before the next is built.
