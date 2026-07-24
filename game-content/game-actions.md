# Game Actions

Transcription of the player-action spaces printed on both sides of the
[English game-board PDF](https://drive.google.com/file/d/1zAntW39NYx1JeCKokqgeAKTjnIHB4ihr/view?usp=sharing).
The PDF title is `（英）星源樹`.

- Page 1: `Player Actions & The Open Source Tree & Score Track (A)` for
  **Standard Mode**
- Page 2: `Player Actions & Labor Card Section & Score Track (B)` for
  **Simplified Mode**

## Board Symbol Key

| Printed symbol | Meaning |
| --- | --- |
| Gray action token above an action | Action-point cost |
| Multicolored card marked `X` | Choose or remove labor card(s), as described by the action |
| Multicolored card marked `+` | Refill the labor card section |
| Gray cube | Contribution point |
| `+N points` | Gain N influence points immediately |
| Heart | Place an Open Source Tree token |
| Gray action token below Doin' Overtime | Repeat an eligible one-action-point action |

The decoded effects below combine the compact board symbols with the action
instructions in the English rulebook and player-aid cards.

## Simplified Mode - Side B

Players begin each turn with **4 action points**. The same action type normally
cannot be taken twice in one turn; Doin' Overtime is the exception.

| Action | Cost | Printed effect | Decoded effect |
| --- | ---: | --- | --- |
| Initiate a Project | 2 action points | Labor card `X` + 1 contribution point + 2 points | Play a project card. Use and discard a matching labor card, place a founder token, begin the matching talent at **2 contribution points**, refill the labor card section, and gain **2 influence points**. |
| Recruit Talents | 1 action point | Labor card `X` + 2 contribution points | Use and discard a matching labor card for a project, begin that talent at **2 contribution points**, and refill the labor card section. |
| Talent Scouting | 1 action point | Labor card `X` + labor card `+` + 1 point | Remove any number of labor cards from the section, refill it immediately, and gain **1 influence point**. |
| Initiator Contribution | 1 action point | 4 contribution points | Allocate **4 contribution points** among your own projects without exceeding their requirements. |
| Facilitator Contribution | 1 action point | 5 contribution points | Allocate **5 contribution points** among other players' projects without exceeding their requirements. |
| Doin' Overtime | 1 action point | 1 action token | Repeat one action costing 1 action point that you already completed this turn. |

The B-side does not contain a Grow the Open Source Tree action.

## Standard Mode - Side A

Players begin each turn with **3 usable action points**. A fourth action-point
token is placed on the Open Source Tree during setup and can be unlocked by the
Open Data tier-3 upgrade.

| Action | Cost | Printed effect | Decoded effect |
| --- | ---: | --- | --- |
| Initiate a Project | 2 action points | Labor card `X` + 1 contribution point + 2 points | Play a project card. Use and discard a matching labor card, place a founder token, begin the matching talent at **1 contribution point**, refill the labor card section, and gain **2 influence points**. |
| Recruit Talents | 1 action point | Labor card `X` + 1 contribution point | Use and discard a matching labor card for a project, begin that talent at **1 contribution point**, and refill the labor card section. |
| Talent Scouting | 1 action point | Labor card `X` + labor card `+` + 1 point | Remove any number of labor cards from the section, refill it immediately, and gain **1 influence point**. |
| Growing the Open Source Tree | 1 action point | Heart | Place an Open Source Tree token on an eligible connected node, gain its influence reward, and activate its collective ability immediately. |
| Initiator Contribution | 1 action point | 3 contribution points | Allocate **3 contribution points** among your own projects without exceeding their requirements. |
| Facilitator Contribution | 1 action point | 4 contribution points | Allocate **4 contribution points** among other players' projects without exceeding their requirements. |
| Doin' Overtime | 1 action point | 1 action token | Repeat one action costing 1 action point that you already completed this turn. |

Standard Mode action values can change when the group grows the tree. See the
[Open Source Tree transcription](./open-source-tree.md) for every upgrade.

## Mode Comparison

| Rule or action | Simplified Mode (B) | Standard Mode (A), before tree upgrades |
| --- | ---: | ---: |
| Usable action points per turn | 4 | 3 |
| Initiate a Project cost | 2 | 2 |
| Initial contribution from the matching labor card | 2 | 1 |
| Recruit Talents contribution | 2 | 1 |
| Talent Scouting influence reward | +1 | +1 |
| Initiator Contribution | 4 | 3 |
| Facilitator Contribution | 5 | 4 |
| Doin' Overtime cost | 1 | 1 |
| Grow the Open Source Tree | Not available | 1 action point |

## Transcription Notes

- Action names follow the printed English board. Formatting and whitespace are
  normalized for Markdown.
- The board communicates effects mostly through symbols; the `Decoded effect`
  column uses the English rulebook and player-aid wording to make those symbols
  explicit.
- Both PDF pages were rendered and visually checked against the extracted text.
- Source PDF SHA-256:
  `5bef0d24282e8612d6b01896fc8a787930e99778358f1f09e863724aca2a7077`.
