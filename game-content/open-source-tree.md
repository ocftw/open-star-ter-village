# Open Source Tree

Transcription of the Open Source Tree printed on page 1, side A, of the
[English game-board PDF](https://drive.google.com/file/d/1zAntW39NYx1JeCKokqgeAKTjnIHB4ihr/view?usp=sharing).
The PDF title is `（英）星源樹`. Page 2 is side B for Simplified Mode and does
not contain the tree.

## How to Grow the Tree

- The Open Source Tree is used only in Standard Mode.
- Growing the tree costs **1 action point**.
- Place an Open Source Tree token in a connected heart-shaped node, gain its
  influence points, and activate its collective ability immediately.
- Growth starts at tier 1 and can only move upward along a printed connection.
- At most **two tokens** may be placed in each horizontal tier across all three
  branches.
- The numbered project-card symbol on a node is its prerequisite: the required
  number of completed projects matching that branch. Tiers 1 and 2 require 0;
  tiers 3, 4, and 5 require 1, 2, and 3 respectively.

The prerequisite interpretation combines the branch labels and symbols on the
board with the rulebook statement that the upper three tiers require specific
amounts and types of project cards.

## Branch Connections

Each branch connects vertically to itself. Diagonal connections allow movement
between adjacent branches at every tier transition:

| Current branch at tier N | Connected branches at tier N+1 |
| --- | --- |
| Open Source | Open Source or Open Data |
| Open Data | Open Source, Open Data, or Open Government |
| Open Government | Open Data or Open Government |

This connection table applies from tiers 1 through 4. There is no direct
connection between Open Source and Open Government.

## Open Source Branch

| Tier | Required Open Source projects | Influence points | Collective ability |
| ---: | ---: | ---: | --- |
| 1 | 0 | +1 | Place 8 cards at labor card section instead of 6. |
| 2 | 0 | +1 | The contribution points from Facilitator Contribution become 5 instead of 4. |
| 3 | 1 | +2 | If an engineer is the initiator, the starting contribution points become 3 instead of 1. |
| 4 | 2 | +2 | If the finished project has an engineer, the player who finishes the project can allocate an extra contribution point to an engineer in another project. |
| 5 | 3 | +4 | When a project is initiated, spend 1 action point instead of 2 when initiating a project. |

## Open Data Branch

| Tier | Required Open Data projects | Influence points | Collective ability |
| ---: | ---: | ---: | --- |
| 1 | 0 | +1 | The maximum hand size of project cards is now 3 instead of 2. |
| 2 | 0 | +1 | The contribution points from Recruit Talents start from 2 instead of 1. |
| 3 | 1 | +2 | Gain 4 action points each round instead of 3. |
| 4 | 2 | +2 | The contribution points come from Initiator Contribution become 4 instead of 3. |
| 5 | 3 | +4 | Use any labor card from the labor card section as the initiator when initiating a project. |

## Open Government Branch

| Tier | Required Open Government projects | Influence points | Collective ability |
| ---: | ---: | ---: | --- |
| 1 | 0 | +1 | When the round is finished, players can discard a project card they have to the corresponding card pile and fill it up afterwards. |
| 2 | 0 | +1 | Place the first event card on the top of the pile facing up instead of facing down. |
| 3 | 1 | +2 | The maximum of projects on the board is now 8 instead of 6. |
| 4 | 2 | +2 | Use one labor card on the Open Government Project when initiating an Open Source Project. |
| 5 | 3 | +4 | The initiator of a project can contribute half of their contribution points to other projects when the project is finished. |

## Collective Performance

The number of unplaced Open Source Tree tokens at the end of the game determines
the village's collective outcome:

| Remaining tokens | Outcome |
| ---: | --- |
| 0 | Our efforts led to the trends of open source, open data, and open government. The Open Source Tree has flourished! |
| 1–3 | Little aliens learned plenty of open-source concepts and are trying to open up all kinds of knowledge. The tree was glowing! |
| 4–6 | Some aliens grasped the spirit of openness. The tree is gradually recovering from its dormant period. |
| 7+ | The little aliens forgot their original intention. The Open Source Tree began to wither! |

## Transcription Notes

- Collective-ability wording is preserved from the printed English board,
  including apparent grammar errors.
- Formatting and whitespace are normalized for Markdown.
- The source has two pages: page 1 is `Player Actions & The Open Source Tree &
  Score Track (A)`; page 2 is `Player Actions & Labor Card Section & Score
  Track (B)`.
- Source PDF SHA-256:
  `5bef0d24282e8612d6b01896fc8a787930e99778358f1f09e863724aca2a7077`.
