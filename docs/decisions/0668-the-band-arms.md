# 0668 — The band arms, the hover lifts, the hint breaks, the strip stays

**Accepted 2026-10-24.** Numbered 0668 because [0667](0667-play-asks-of-venoma.md) landed on `main` while this
was in review. Item 1 of [`the-menus-planned`](../../reports/the-menus-planned-2026-10-24.md), from
[`the-menus-reviewed-again`](../../reports/the-menus-reviewed-again-2026-10-24.md)'s first four findings, with the
player's answer: *"Agree with the suggested answers."* It amends [0513](0513-the-pilot-flies.md) (the cursor's
press on the pilot band) and keeps [0458](0458-the-title-is-rows.md) (*Fly* is the one press that always starts
a run) and [0440](0440-every-screen-speaks-with-the-titles-voice.md) (every screen in the title's voice).

## The ask

> *"Menu nav just sucks on gamepad overall … the menus suck pretty hard on desktop as well as mobile."*

The review walked a stubbed pad through the title and the hangar and photographed every menu. Four of its
findings were defects with a one- or two-line cause each.

## The rule

| | was | is |
|---|---|---|
| **A on the pilot band** | flew the pilot the cursor was on (0513's one press for a pad and a keyboard) | **arms** them; a second A or Enter on the same pilot flies. A step along the band arms nothing. This is the thumb's rule (0513: *a tap looks first*), now every device's. *Fly* is unchanged. After a run the pilot flown last is armed, as 0513 has it |
| **an armed pilot** | not drawn | a second ring round the face in the run's other ink, and **Ready** in a pill at the head of the line under the faces |
| **a hovered button** | a flat grey with no rim | the button's own glass, lighter, with the brighter rim |
| **an action's hint** | its own line on four screens named by hand | its own line on every screen (`each('-action-hint')`) |
| **Settings, Controls, How to play, Save** | each panel centred on its own content | anchored at the top with a fixed margin, the content filling down; none on a phone's height |

**And the instrument:** `scripts/shot-menus.mjs --sizes=wide` shoots 1920×1080 and 2560×1080, which every
later item of the plan that touches the hangar family is handed over at.

## Why the cursor's press looks first

The review's walk, recorded: into the hangar, B back to the title (the cursor is remembered on *Hangin' Out*),
down — the rows come round (0607) onto the pilot band — right, A. That was a twenty-second intro from a browse.
0513 gave the phone *tap to see, tap again to fly* because *a thumb lands on the edge of what it aims at*; a pad
coming round a list onto a band of faces is the same case. The armed state is the pointer's (`pilotArmed` in
`src/app/mount.ts`): a press on the pilot the band is on arms; a step stands it down. A pointer's landing still
arms, as before.

## The hover was not what the review named

The review traced the sinking hover to the second rule's 70 % void. Measured on the built page at 1280×720 (mean
luminance of the button's middle, 0–255): resting *Hangin' Out* 64, *Settings* 61, hovered *Hangin' Out* 81 —
lighter, not darker. What won on hover was the earlier `background: rgba(255, 255, 255, 0.12)` shorthand, which
outranks the glass rule and wiped both the glass and the gradient rim: a flat grey box with no rim, which is how a
button that cannot be pressed reads. Deleting it puts the glass and rim back; the hover's own glass (void 70 %,
the run's ink 30 %) measures 77 against the resting 61, with the rim as bright as its neighbour's. The 70 % mix
stays.

## What it cost and the guards it moved

- **`tests/menu.browser.test.ts`**, *0668 — THE WALK*: the review's walk on the stubbed pad. After B, down and
  right, the first A leaves the title up with the second pilot marked and *Ready* shown; the second A begins the
  flight (the intro, or the run for a pilot with no story — the store has Venoma open, 0666). It replaces 0513's
  *A on the pilot band flies*. 0513's, 0415's and 0521's probes are re-pointed at the new line.
- **`tests/layout.browser.test.ts`**: the strip's `top` is one value across the four tabs at all six guard sizes;
  and the hovered *Hangin' Out*'s glass is at least 2 levels brighter than *Settings*' beside it, with its rim
  within 4 of *Settings*', read off a screenshot.
- **`tests/chrome.test.ts`**: every screen whose row gives an action a hint has a rule setting that screen's
  `-action-hint` to `display: block`.
- **The shop's own case went first, on `main`.** [0667](0667-play-asks-of-venoma.md), merged while this was in
  review, took the toggle's hint away (*Owned*, no hint, on the player's word). So the run-on this item named no
  longer exists to be seen; the rule is still kept for every screen, and the style guard holds it for the three
  that give hints today: Controls, Save and the music room. The browser check on Cosmo's toggle is not written.
- **The top margin on a phone.** The first build used `min(2rem, 6cqh)` everywhere, and the layout guard found
  How to play scrolling by 10 px at 480×320 and a touch Settings by 8 px at 667×375. Under 460 px tall the margin
  is 0, where the panel was already at the top.

Probed in `scripts/probes/0668-the-band-arms.mjs`: the one-press rule back, *Ready* never shown, the shorthand
back, the hover's glass as the void, the screens named by hand with Save left out, and the margin taken out.

**Photographed** at the pair, the guard's six, and 1920×1080 and 2560×1080; the walk re-run on the stubbed pad.

## What is owed

- A pad in a hand on the title, since the stub presses and does not spring: whether *Ready* and the second
  ring read as *press again* without a word of coaching.
- Whether a returning player wants the pilot flown last armed after a run (0513's rule, kept): their first A
  on the band flies, which is the trap this answers for a first visit.
- The review's wrap note — *Fly* as the row the cursor lands on from either end — is not built; the plan did
  not take it.

## Rollback

None owed ([0001](0001-revertability-not-risk-rating.md)): no storage key, no save shape.
