# 0572 — The dock is dressed

**Accepted 2026-10-07.** A play of [0571](0571-the-dock.md): *"alright looking good, now we can do things
to improve the quality — kick back on any bad UX things"*, then ten items. This decision amends three
earlier ones:

- [0562](0562-the-plate-grows.md): the balance leaves the foot, and on a desktop the foot's card stands
  down.
- [0542](0542-cosmos-counter.md) and [0550](0550-every-tab-has-a-keeper.md): the keeper's card is a
  bubble in the picture.
- [0560](0560-the-bios-fly.md): no bio on a screen that stands.

## The rule

| # | asked | done |
|---|---|---|
| 1 | *"need a hover-elevator or ladder or something leading up to the shops"* | A hover-lift at the catwalk's near end. It has a shaft on the wall and a platform that floats between the deck and the walk on its own field, waiting at each end. The shops close up a little toward the bay to make room. The camera keeps the lift whole, as it keeps the shops. |
| 2 | *"cockpit display should be centered under the car"* | The monitor is centred under the ship's foot. The shell reads the ship's place off the stand's view (`standMarksInto`), and the chrome keeps the monitor inside the stand. |
| 3 | *"Starshards should be top right of the screen and easy to see"* | In the stand's top right corner, in the score's gold, the figure about 1.7 rem. |
| 4 | *"move the planet more into the background and change its colour … rings and a moon"* | A warm ringed giant, the fire's ink toward the sky's, with cream bands. It is smaller, under a haze, and stands behind the bay's edge, with a grey moon. Nothing on the screen is that colour, and it is not the gold the balance is counted in. |
| 5 | *"Tradie quote is now super separated from the tradie"* | A speech bubble in the stand, with its tail on the keeper's head wherever they are this visit (0569). When they are out, the tail is on their shopfront. The bubble has no face: the keeper it points at is the face. |
| 6 | *"the bio is cut off … it can probs just get removed"* | Gone from a screen that stands. The name, pronouns and home stay. The title's card, where a pilot is chosen, keeps the bio. |
| 7 | *"the detail for the equipped gun on the bottom left of the menu feels out of place"* | On a desktop, each band says its own thing in a caption under itself: the option under the cursor or the fitted one, what it is, and *Fitted* or how to fit it. The foot is the actions and the keys. A phone's foot keeps the card, because a phone's band is one chip a line. |
| 8 | *"move the car slightly higher and hover it a bit more"* | Five units higher, and it bobs twice as deep. The cradle throws a column of light up to it, and rings of its field rise up the column to the ship. |
| 9 | *"get his eyes adjusted so he's looking straight at the player"* | On an eye with no white, the glint is the pupil. Both glints sat left of their eye, so he looked aside. Each is in its eye's middle now, with a fleck under it. |
| 10 | *"you can't actually see the graphic when you select the card and the cards are still mostly text"* | A fitted card is dark glass with a lit rim and a glow. It was the run's violet-into-cyan fill, the inks every picture is drawn in. Every Hangin' Out card has a picture over its name: the shot a gun fires, the face a special is thrown under, the readout's plate in that ship's dressing, and the dangle the dash hangs. Paint's wheels and art pictures are as large as a card's, and its flames are drawn as Cosmo draws them. |

## Asked on the first build

| asked | done |
|---|---|
| *"the speech bubbles should decay and disappear"* | A bubble comes up, holds about five seconds, and fades out. Opening its tab again, or a new line from the keeper, says it again. |
| *"the menu items change size when the descriptions are too long, it makes the menu do the weird up and down thing"* | A caption is always the same height: two lines on a tall screen and one line below 900 px, with a longer description cut at the end. Stepping along a band moves nothing under it. |
| *"can we click/tap on a shop to select that shop rather than having to go to the menu tab?"* | Each other shop in the picture is a button that opens its tab, and it lights up under the pointer. The open tab's own shop is not a button. The strip's tabs stay as the way across for the keyboard and the pad. |
| *"the planet and moon are a bit too close still, and they're very static, they don't feel like part of the background starfield"* | Both are smaller and further into the haze. The planet drifts the way the stars do, slowly: one pass across the bay takes eight minutes, coming out of the haze at the start and going back into it at the end. The moon goes round it in the ring's plane every minute and a half, passing behind it and in front. |

## Kicked back

Three items were taken differently from how they were asked. Each was the user's call to veto.

- **7 is moved, not deleted.** The card was the one place that says what a gun does, and whether a
  pressed Enter is still owed: trying on does not fit (0561). Deleting it would leave a cursor that
  changes the ship with nothing saying the change is not kept. So it is said where the eye already is,
  under the row being stepped.
- **6 keeps the name.** Faces alone do not say who a pilot is (0513). The bio goes. The name, pronouns
  and home are one line.
- **3 undoes 0562's reason, and that is fine.** 0562 stood the balance beside Buy because Buy spends it.
  0564's sheet now asks before Buy does, with the balance before and after. That says it where the
  spending happens, and the corner can be where the player looks for what they have.

## What it cost, and the guards it moved

- **`tests/dressed.browser.test.ts`**, every assertion in screen pixels:
  - the balance is in the stand's top right corner and its figure is 24 px or taller;
  - each keeper's bubble is drawn inside the stand, and the tails run left to right as the shops do;
  - the monitor's middle is in the stand's middle;
  - a band's caption sits under its options and names the gun stepped onto;
  - every Hangin' Out card has a picture, and no fitted card is opaque over it.
- **[0562](0562-the-plate-grows.md)'s foot guard** asked for the balance beside Back, which this turns
  round. Its card now stands only on a phone, so the card guard is asked at 667×375, where the player
  sees it.
- **0567's probe** moved to the dock's deeper bob.

## What CI found, and was fixed

- **A bob is a whole 105 steps.** It was 0.06 radians a step, which is 104.7 steps. The stand's guards
  read the picture one bob apart (`samePhase`, 0540), and that came to 104 steps one time and 105 the next.
  The dock's deeper bob and rising rings made that one step big enough to pass for a fitting. So 0541's
  flame probe stayed green on CI. The hover rings and the lift run on whole bobs too.
- **0550's greeting-card probe and its rule are deleted.** No keeper is on a phone's plate any more, so
  the rule hid nothing and the probe stayed green on CI.
- **0566's upright guard waits for the room to turn, rather than for 800 ms.** It failed only under the
  browser suites' own load, and passed alone every time (0044).
- **0539's one-line probe is deleted.** The centred monitor may take most of the stand, and on one line
  the readout fits at every size the guard holds. The probe stayed green here and on CI (0019).
- **Under 900 px tall, the cards are a size shorter, and each caption is one line.** On CI's wider letters,
  Hangin' Out's four bands ran about 170 px past a 1024×768's plate. A 1920×1080 keeps the full cards and
  two-line captions.

## What is owed

- A look at 1920, 1280 and an iPad.
- Whether the lift should ever carry a keeper. It does not: a keeper's spot is still a place, not a
  path.
- The bubble on a phone held sideways, where it is small.
- On the iPad, the plate's bands now scroll by one band at the foot. The pictures cost a line each.
