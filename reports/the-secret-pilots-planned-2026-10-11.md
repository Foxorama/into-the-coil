# The secret pilots, planned — 2026-10-11

One handwritten page, two secret pilots on it and two smaller asks beside them. This file is the page
read into the game's terms, checked against what the code already does, and queued. What each change
decides lives in its decision once it lands; this is the queue — the shape
[`the-thunderbolt-planned`](the-thunderbolt-planned-2026-10-05.md) gave the Marmot.

**What is built is in *Landed*, and it is the decisions'.** The two questions that changed what gets built are
answered, in *Answered*.

## The ask

> *"Can you translate the notes on this page to add these two as secret characters?"*

## The page, as read

A photograph of a lined notebook page. The transcription is a reading of handwriting; a word marked
*(read as)* is a guess, and the guess is said.

| line on the page | read as |
|---|---|
| a heading, scribbled out | **not read** — crossed through by hand; the second line under it may be *"to 3"*. Treated as withdrawn |
| *Least Weasel Pilot* | a pilot who is a least weasel |
| *Hamster ball* | their ship is a hamster ball |
| *flies into things to kill them* | the ball is the weapon: it kills by contact |
| *how to die? / challenge* | the question that raises: if bodies are the weapon, what is the danger? |
| *Unlock – 10 non-bullet deaths* | they unlock after ten deaths that were not from hostile fire |
| *"overheat" → need to let shields recharge* | the answer to *how to die*: ramming overheats, and the ball has to be left to recharge |
| *Hamster ball break + recharge* | an overheated ball breaks, and comes back after a recharge |
| *Yellow submarine hangy* | *(read as)* a yellow submarine to **hang** from the dash — a dangle |
| *Aqua duck for Space duck* | a ship, the Aqua Duck, for a Space Duck pilot |
| *→ bubble jets / water guns?* | its engines blow bubbles; *water guns* is asked, not settled |
| *→ x customisations to unlock?* | it unlocks after some number of customisations — the number left as *x* |
| *→ paint ball gun weapon* | its gun fires paintballs |
| *title → menu music* | *(read as)* the title track carried on into the menu |

## What was already true

- **A least weasel and a space duck are already in the port.** Unity, the Aussie trader mechanic on
  *Hangin' Out*, is *"androgynous based on a Least Weasel"*; MMXXVI, the space duck on *Paint & Parts*,
  is a painter whose apron is splashed in the shop's inks —
  [0550](../docs/decisions/0550-every-tab-has-a-keeper.md), [0555](../docs/decisions/0555-the-duck-has-a-bill.md),
  `src/content/keepers.ts`. `docs/game.md` also names an unbuilt Space Duck caddy, Lord Pembleforth the 5th.
- **A secret pilot has a precedent, and it is the Marmot** — [0546](../docs/decisions/0546-the-marmot-rides.md).
  A pilot row carries `opensAfter`; `pilotOpen` reads it; a shut pilot is a silhouette on the pilot band
  with a sentence saying what is left; `rescuable` walks every pilot, so a new one is in the Viper's
  rescue pool **from the first run** and needs `saved` and `saving` lines the moment it is a row.
- **But `opensAfter` can only say *won in these ships*.** Neither unlock on the page is a win. Each needs
  its own condition on the row, with the Marmot's the default — 0282: the row authors its lock.
- **Nothing counts deaths, or what caused one.** `onDeath` in `src/app/frame.ts` is reported without a
  cause. A ship is wounded by enemy shots, bolts (beams and rain), enemy bodies, the boss, a serpent's
  flank and stone (`stoneStrikesShip`) — all in one block that lets one hit land per step.
- **Flying into an enemy hurts the ship and leaves the enemy whole, on purpose** — 0034:
  `a body is not consumed by being flown into`, *"or ramming would be the cheapest way to clear the
  screen."* `tests/combat.test.ts` holds it.
- **`itc_hangar` takes a new field on version 1** and reads its absence as none — 0522, 0523, 0578 and
  0584 each did (`src/save/hangar.ts`). What the player has bought is already stored, in `owned`.
- **Every ship authors a long row** — `src/content/ships.ts`'s `ShipRow`: its gun, hulls bare and with
  one and two tubes, muzzle and hardpoint, nozzles, cockpit, intro, readout motif, dash, wheels or none,
  three arts, a shield shell and lamps — and every gun is drawn on every ship (0525).
- **A flame is two inks** (`src/content/flames.ts`). Bubbles are not an ink, so bubble jets are a new way
  of drawing a flame, not a new row of colours.
- **The title track exists as a whole piece but does not play in the game.** `src/content/title-track.ts`:
  *"the title screen in the game still loops its two bars, and walking this score there is its own change."*

## Pressure-tested

**The ram is sound, and it does not reverse 0034.** 0034 forbade a body being *consumed* by contact,
because then every ship clears the screen by flying into it at no cost. The ball's ram leaves that true:
a body it hits is damaged like any shot's target and dies when its health does. And the page names the
cost itself — heat. What 0034 feared was a free clear; this one is paid for.

**The ram is a damage source per target, gated, as the blades are** —
[0391](../docs/decisions/0391-a-target-takes-a-blade-so-often.md). A ball resting on a body would otherwise
bill it sixty times a second. The gate also sets the heat: one ram, one charge of heat.

**The page's own question is the right one, and its answer needs one more half.** *How to die?* — while
the ball is whole, bodies cannot hurt the weasel. If enemy fire cannot either, the ship cannot die and
the game's skill (*surviving the onslaught*, `docs/game.md`) is gone. So the reading below is: **the ball
turns bodies from a hazard into the weapon, and enemy fire hurts the weasel exactly as it hurts every
ship.** Overheat is then the second danger, and the one the weasel makes for themself.

**The ball against the bosses is the expensive half, and it is measured, not guessed.** Every ship has to
beat every boss inside the boss floor (`tests/serpent.test.ts`), and a boss's body is what the ball has to
reach — under its fire, through its arrival, its phases and its windows (0282). Ram damage on a boss is
weighed by its row, as every gun's is
([0372](../docs/decisions/0372-a-death-keeps-the-ladders.md)), and set on the instruments.

**Ten non-bullet deaths is a count the game does not keep, and the cause has to be read at the hit that
killed.** It is a new field on `itc_hangar` and a cause on `onDeath`. Which hits are *non-bullet* is
decided below. It is reachable on every tier, but not on every assist setting: with the stone at
`solid` the wall only pushes. That is correct — an assist makes the game easier, never the unlock harder —
and the shut card says what is left either way.

**The duck's unlock needs no new key.** *x customisations* can be read straight off `owned`: wares bought
at Cosmo's. Rollback costs nothing.

**Two more ships is a large change, and that is the ask, not a reason to cut it.** Each is a full ship row,
drawn with every gun, and the hangar's ship grids went to five a row for the Thunderbolt (0546); at seven
they are rethought, and the pilot band at seven cards is checked on the smallest phone — 0566. Each is a
pilot with a runner and a portrait drawn in a body that is not a person's (`figure`, as the Marmot's is).

**Paintballs are player fire in many colours, and that is raised here, not ruled** —
[0295](../docs/decisions/0295-a-ranking-guard-is-a-content-limiter.md). A hostile bullet takes its place's
colour. A paintball in that colour, in that place, could be read as hostile fire. The shape and the motion
are what separate them — the Catherine wheel's embers settled it that way — and each place is looked at.

## Read, and decided without asking — each can be vetoed

- **The weasel is Unity**, and **the duck is MMXXVI** — the two characters the port already has. MMXXVI
  is a painter, so a paintball gun is theirs; and *x customisations* are bought from the shops their tab
  sits beside. Both keep their counters; the Marmot tends the bar and flies. Unity is *they*, as 0550 has
  them; MMXXVI has no pronouns written anywhere and is *they* until the player says otherwise.
- **The Hamster Ball** — a clear ball with a running wheel inside it and Unity running in it, drawn from
  above. It rolls as it moves.
- **The ram.** Every enemy, boss and serpent the ball touches takes ram damage, once per touch, gated per
  target. Bodies never wound the ship while the ball is whole. Enemy shots and bolts wound it as they wound
  every ship.
- **The heat.** Every ram adds heat, and so does scraping stone. Heat drains while the ball touches
  nothing. At full heat the ball **breaks**: the shell shatters off, Unity is a small bare weasel on screen,
  bodies hurt again, and nothing rams. The ball **recharges** after a fixed wait and comes back whole and
  cool. The heat is a gauge on the ball itself — a glow through the plastic — because a death the model
  resolves and the picture never mentions is reported as a different bug
  ([0036](../docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md)).
- **The ball carries tubes**, in a cradle on its axle. The missile pickup has to be worth taking on every
  ship (`docs/game.md`, *Upgrades*).
- **Its special is the War Dance** — named for the frenzied hopping weasels are known for: for a few
  seconds the ball bounces round the screen on its own, ramming everything it crosses, with no heat.
  **Every ship can pick it up once the weasel is unlocked** (answered, below), so every ship has a War
  Dance of its own: the same bounce and the same ram for its length, drawn as that ship — the fighter
  tumbling, the saucer skipping like a stone, the cars and the Thunderbolt bouncing on their wheels, the
  Aqua Duck bobbing — with the ram's impact on whatever it crosses.
- **A non-bullet death** is a life lost to a body — an enemy, a boss, a serpent's flank — or to stone.
  A death to an enemy shot or a bolt is a bullet death. Counted across every run, every pilot and every
  tier, and never taken back.
- **The Aqua Duck** — a little submarine shaped like a bath duck, drawn from the side as the cars are, with
  a periscope. Its engines are **Bubble Jets**: a flame drawn as a stream of bubbles. Bubble Jets go on
  sale at Cosmo's for any ship once the duck has flown.
- **The paintball gun** — a hopper-fed marker that fires a quick string of paintballs in the paint
  shop's inks, a little scattered; each bursts into a splat on whatever it hits.
- **Its special is the Water Cannon** — the page's *water guns?*: a jet of water swept across the lane for
  two seconds.
- **The duck opens after five wares bought at Cosmo's**, of any kind. Five is a play number, the *x* on the
  page.
- **Both are secret in the Marmot's way** (answered, below): a dark silhouette on the pilot band with a
  hint saying what is left (*"Crash 7 more times"*, *"Buy 3 more things at Cosmo's"*), and both in the
  Viper's rescue pool with their own lines from the first run, as 0546 did.
- **Their voices**: Unity's blip low and quick with the Aussie in the lines; MMXXVI's a squeaky, bright
  blip, higher than the Marmot's.

## Answered — 2026-10-11

| asked | why it matters | answered |
|---|---|---|
| **Can the ram be fitted to other ships, and the ball fly other guns?** Since [0525](../docs/decisions/0525-the-gun-is-a-layer.md) any ship flies any gun it has won. A fighter that rams, or a ball with a pulse gun, each loses what makes it itself. The default above was **neither** | it decides whether the ram is a `WeaponKind` in every grid or a property of one ship's row | ***"No weapon change for hamster ball, other ships can pick up the special once the hamster ball is unlocked tho so we'll need animations for all ships for that special"*** |
| **Does a secret pilot say how to open it?** The Marmot's card names who is left to clear. *Secret* could mean that, or a card that says nothing until it opens, or no card at all | it decides the band's line and whether the teaser in the rescue pool stays | ***"hints for unlocks is good"*** |

**What the first answer builds.** The ram is the ball's row and no other ship's, and the ball's gun slot
is shut — it flies nothing but the ram, and no ship flies the ram. The War Dance is a special like any
other, so it reaches other ships, and each needs its own animation. Two things in it are new:

- **A special that waits for an unlock.** The bomb pickup draws its face from every gun special today,
  unconditionally (`drawFace` in `src/content/pickups.ts`). *"Once the hamster ball is unlocked"* makes
  the War Dance's face depend on the hangar, so the draw takes the unlocked set as an argument. Leaving
  a face out changes how many faces there are, which changes what a seeded run draws. That is expected,
  and the pickup's guards are re-read against it rather than raised to fit.
- **A ram on every ship, for the length of the dance.** The ram's damage, its per-target gate and the
  bodies-do-not-wound rule live on the special while it runs, not on the ball's row. On the ball they
  are the same thing with the heat switched off.

Read without asking, and can be vetoed: in the hangar, fitting the War Dance as another ship's opening
special follows 0524's rule like every other special — open once the ball has won — because the answer
was about picking it up in a run.

### The dance on every ship — planned 2026-10-11, after 0593 landed the ball's

**Drawn frames, because the ask is animation.** The frame can already turn and scale any blit, so the
cheap version is every ship spinning or pulsing on its own picture. That is
[0280](../docs/decisions/0280-a-cheap-mechanism-does-not-rename-the-ask.md)'s case exactly: *"a pulsing
sprite is still one picture. Animation is a body whose parts move relative to each other."* So each ship's
dance is two drawn poses either side of its still one, cycled while it dances — its own parts moving, in
its own drawing — at each of its three tube stages: thirty-six new bitmaps.

| ship | its dance | what moves |
|---|---|---|
| the Hamster Ball | the weasel war dance itself, inside the ball | Unity: back arched, body twisted left then right, legs gathered; the ball's glint rolls round |
| the Little Green Caddie | a saucer spinning up | the vents and running lights turn round the disc; the dome leans |
| the fighter | its canards flapping | one canard swept forward and the other back, then the other way about. A roll was drawn first: foreshortened, its nose's look and half its paint fell under 0106's floor at the shipped camera |
| the Firebird | a launch and a stop | the body lifts its nose and then its tail on its springs, the tyres where they were |
| the estate | the lowrider hop | the body lifts to one side and then the other on its wheels |
| the Thunderbolt | leaning into it | the rider and the bars lean one way and then the other over the frame |

**What the poses may not move:** the wheels, the tubes and the flame, because the frame draws those over
the hull where the still drawing puts them (`stepWheels`, `stepLoaded`, the exhaust). A pose that moved
one would split the ship from its own wheel. The cars' bodies move on their wheels for that reason.

**The ram on a ship that is not the ball is not drawn.** Its body rides every dancing ship and lands as it
does on the ball; the ball's heat sheen under a fighter would be a disc round it, over the bullets beside
it — 0373's reason. What it lands is said where it lands, as every blade's is.

## The queue

1. **The count and the cause.** `onDeath` reports what killed the ship; `itc_hangar` gains a count of
   non-bullet deaths; a pilot row's lock can name *a count of non-bullet deaths* and *a count of wares
   bought* beside 0546's wins. No pilot uses them yet: it lands first, so a player's crashes are being
   counted before the weasel arrives. **Rollback note owed**: an older build rewriting `itc_hangar` drops
   the count.
2. **Unity and the Hamster Ball** — the pilot, runner and portrait, lines both ways; the ball and its
   ram, heat, break and recharge; its tubes; its gun slot shut; the War Dance, its face on the bomb
   pickup once the weasel is unlocked, and its animation on every ship; the unlock hint on the shut card;
   cues for the ram, the overheat, the break and the recharge; the boss floor flown in the ball; the
   ram's numbers set on the instruments; the hangar's grids at six.
3. **MMXXVI and the Aqua Duck** — the pilot, runner and portrait, lines both ways; the sub, the paintball
   gun and the Water Cannon; Bubble Jets; drawn with every gun; the boss floor; the grids at seven and the
   pilot band on the smallest phone.

Also on the page, and not characters — each one PR, in any order after item 1:

4. **The Yellow Submarine**, a dangle at Cosmo's (`src/content/dangles.ts`), priced with the others.
5. **The title track in the menu** — the score in `src/content/title-track.ts` walked on the title screen
   in place of its two-bar loop. Read for exactly what *title → menu* means before it is built; the album
   decisions own the mix.

## Landed

- **Item 1** — [0592](../docs/decisions/0592-the-crashes-are-counted.md). The page's *non-bullet* is read
  as *a body or the stone*: a wall is not a bullet. The lock replaced `opensAfter` with `opens`, three
  parts every row states.
- **Item 2, the first half** — [0593](../docs/decisions/0593-the-hamster-ball-rolls.md): Unity, the ball,
  the ram and its heat, break and recharge, the War Dance on the ball alone, the hints on every shut card.
  The ram is weighed on bosses at eight, and the floors fly it against the hull.
- **Item 2, the second half** — [0594](../docs/decisions/0594-every-ship-dances.md): every ship's dance drawn
  in poses of its own at every stage, and the War Dance on the bomb pickup and in How to play's key once Unity
  is open. Item 2 is done. The fighter's dance is its canards and not the roll planned above, and the decision
  says why.
- **Item 3** — [0595](../docs/decisions/0595-the-aqua-duck-paints.md): MMXXVI, the Aqua Duck, the paintball
  marker and its splats, the Water Cannon on the bomb pickup once MMXXVI is open, the duck's dance, and Bubble
  Jets. Two readings above are replaced, and the decision says why: Bubble Jets are the duck's own and
  borrowed on the shells' rule, not sold at Cosmo's; and the duck bobs by dabbling its head and kicking its
  tail rather than bobbing whole. The paintball is weighed on bosses at 1.1, and 1.6 on the jellyfish.
- **Item 4** — [0596](../docs/decisions/0596-the-yellow-submarine-hangs.md): the Yellow Submarine, a dangle at
  Cosmo's for 300, priced with the mirror ball and the bobblehead.
- **Item 5** — [0597](../docs/decisions/0597-the-title-track-plays-in-the-menu.md): the title track plays round
  on every screen that is not part of a run, from the album's own parts; a run hands it back at a bar and lets it
  go. *Title → menu* is read as the title track carried on into the menu, and the decision says what the menu
  does not do that the album does — the coda. The page is done.
- **The review** — [0598](../docs/decisions/0598-the-secret-pilots-reviewed.md): items 1–3 read again as a designer
  and as a quality analyst. A dance now lands on its own terms and leaves the gun its own; the Water Cannon lands
  where it is drawn, ends at the wreck, and is the player's own water under the bullets; the paint leaves out each
  place's bullet colour; the crash hint says what is counted. On the way, the pad's guards stopped reading a
  slipped step as a look arriving.
- **The sounds, asked after** — [0599](../docs/decisions/0599-the-water-and-the-paint-are-heard.md): the review
  had not covered them. The Water Cannon was silent for 1.38 s of its 2, and its landings were heard on two ships
  of seven; a splat had no sound. The jet sprays for its whole length and douses what it lands on, and a splat is
  heard.

## Owed

A play of each pilot on its branch preview; the ear on every new cue; the ball's heat and recharge and the
duck's unlock count, which are play numbers; paintballs looked at in every place for 0295's question;
the submarine seen swinging on the dash; and the title track heard in the menu — its take-over, its hand-back
into a run, and the join where the score goes round.
