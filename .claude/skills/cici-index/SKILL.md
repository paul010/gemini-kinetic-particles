---
name: cici-index
description: >-
  Rank cities by the CICI method — find the places that are FAR LESS famous than
  their population would suggest. Use when the user asks to find "underrated by
  population" cities, "comparatively insignificant" cities, run "the CICI
  method/index/leaderboard", or score a country/province/region for cities that
  are big but unheard-of. Produces a ranked list with a household-population
  score, a fame penalty broken down by halo factors, and a final CICI score.
---

# CICI — the Comparatively-Insignificant City Index

CICI finds the cities that are **far less famous than their population implies**.
Not just small or obscure places (those are obvious) — specifically the *big*
ones almost nobody outside the region can place on a map or say a single fact
about. Origin: the "CICI method" popularized by @pretentiouswhat on X. The name
is read here as **C**omparatively **I**nsignificant **C**ity **I**ndex — a
friendly, subjective, for-fun ranking, not an insult to anyone's hometown.

## The core formula

```
CICI = popScore(household population)  −  famePenalty(all the halo factors)
```

The city with the **highest CICI after subtraction** is the CICI leader: a large
registered population, minus almost nothing famous to subtract.

## Step 1 — Start from HOUSEHOLD population, not resident population

Use **registered household population (户籍人口 hùjí)**, NOT resident population
(常住人口 chángzhù). Rationale: count the *whole prefecture-level city* (地级市),
not just the metro core — anyone, and any part of the prefecture, can contribute
to a city's reputation. (Household population also strips out the migration-in
fame that big magnet cities enjoy, which is exactly what we want to ignore.)

Normalize the household population across your candidate set to a 0–100
`popScore` (linear: the largest population in the set = 100).

## Step 2 — Subtract every source of fame (the halo)

`famePenalty` sums the halo factors. Score each on how much national name-
recognition it actually buys the city (0 = none, up to the weight cap below).
Any factor that makes people *think of the city* counts — good or bad.

| Halo factor | What it is | Typical weight |
|---|---|---|
| `capital` | Provincial capital / sub-provincial / municipality | 0–25 |
| `scenic` | Famous tourist site, esp. a 5A-rated attraction | 0–20 |
| `brandHQ` | HQ of a nationally-known brand/company | 0–15 |
| `history` | Historical or cultural weight (ancient capital, idioms, famous figures) | 0–20 |
| `cuisine` | A dish/cuisine people associate with the city | 0–15 |
| `meme` | Any meme, running joke, or viral moment tied to the name | 0–15 |
| `disaster` | Site of a major disaster or scandal (negative fame is still fame) | 0–15 |
| `other` | Anything else that pops into people's heads | 0–10 |

Cap the total `famePenalty` at 100. Be honest about *national* awareness — a site
locals love but nobody 800 km away has heard of scores near 0.

## Step 3 — Rank and read the result

Sort by `CICI = popScore − famePenalty`, descending. The top of the list is
"big population, almost nothing famous to subtract." Report, per city:

- name (local + romanized), province/region
- household population (户籍) and, for context, resident population (常住)
- `popScore`, the itemized `famePenalty` (which halo factors fired, and why), `CICI`
- one honest line: *what, if anything, the city is actually known for*

## Output format

Return a JSON array sorted by `cici` desc:

```json
[
  {
    "rank": 1,
    "name": "Zhoukou 周口",
    "region": "Henan 河南",
    "huji": 1130, "changzhu": 880,
    "popScore": 100, "famePenalty": 8, "cici": 92,
    "halo": [{"factor":"history","weight":6,"note":"太昊陵/伏羲, low national awareness"}],
    "knownFor": "Honestly, very little outside Henan."
  }
]
```

## Rules of the road

- **It's subjective and for fun.** Say so. Invite friendly disagreement.
- **Data is AI-assisted estimation.** Household-population figures are approximate;
  label them as such and never present the fame scores as objective fact.
- **Every city has *something*** — or it wouldn't be a city. A high CICI score is
  not a put-down; it means "under-known relative to its size," nothing more.
- **Be respectful.** No mockery of a place or its people; keep the halo notes
  factual and light.
