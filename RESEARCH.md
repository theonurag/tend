# Research synthesis

This document records product rationale and historical comparisons. It is not
an implementation specification; `README.md` and `src/` describe shipped
behavior.

## What the evidence supports

| Finding | Product implication | Confidence / caveat |
|---|---|---|
| Repeating a behavior in a stable context builds automatic cue–response associations. | Creation asks for a contextual cue (“After I…”) and displays it on every habit. | Strong theoretical and repeated empirical support; formation speed varies greatly by person and behavior. |
| Smaller, self-chosen actions are easier to repeat and support autonomy and self-efficacy. | The user names their own action; starters are intentionally tiny. | Direction is well supported; “tiny” has no universal threshold. |
| The often-repeated 21-day rule is misleading. A frequently cited real-world study averaged 66 days, with substantial variation. | No countdown claims that a habit will be “formed” on a fixed day. | The 66-day estimate came from one study/sample and should not become a new magic number. |
| One missed opportunity did not materially derail automaticity in the cited study. | No health loss, broken-chain alarm, shame copy, or XP subtraction for yesterday’s miss. | This does not mean frequency is irrelevant; consistent repetition still matters. |
| Self-monitoring and feedback are common effective behavior-change components. | One-tap completion, immediate visual feedback, daily progress, and retained history. | Effects vary by intervention and behavior; tracking can become burdensome if overbuilt. |
| Autonomy and competence support higher-quality motivation. Controlling rewards can undermine intrinsic motivation. | XP is informational feedback. Rewards do not unlock essential features and there is no monetary or social coercion. | SDT is broad; game mechanics should be evaluated with actual users, not assumed effective. |
| Implementation intentions connect a situation with an action (“If/when X, then Y”). | The optional cue field encourages concrete event-based planning. | Effects vary and planning alone cannot remove environmental barriers. |

## Product comparison

| Product | Strong pattern | Risk / mismatch for this brief | Decision |
|---|---|---|---|
| Habitica | Clear RPG metaphor, immediate rewards, character progression. | HP loss punishes failure; equipment, parties, quests, currencies, and tasks add heavy cognitive load. | Borrow only lightweight XP and levels. |
| Loop Habit Tracker | Fast check-offs, offline/privacy stance, flexible scheduling, gradual habit-strength model that survives a few misses. | Primarily analytical rather than playful; Android-native rather than a web SPA. | Borrow speed, privacy, and forgiving progress. |
| Habitify | Organized daily routine, polished check-ins, progress metrics. | Timers, notes, moods, calendar, challenges, health sync, and integrations violate “only habits.” | Borrow clarity; reject breadth. |
| Everyday | Highly legible “don’t break the chain” visual grid. | Chain framing can produce all-or-nothing thinking after a lapse. | A future history view may borrow the visual density, not the shame framing. |
| Finch | Warm emotional tone and nurturing progression. | Self-care pet and reflections broaden the job beyond habit tracking. | Borrow supportive language, not the virtual-pet dependency. |
| SuperBetter | Reframes actions as quests and uses strengths/resilience language. | Broader mental-health challenge system and paid hosted programs are out of scope. | Borrow “quest” framing sparingly. |

## Deliberate exclusions

- No to-do list, notes, mood journal, calendar, or life dashboard.
- No leaderboards, social comparison, punishment, health loss, or loss aversion.
- No variable-ratio loot rewards, artificial scarcity, or monetized currencies.
- No claim that gamification or a fixed streak causes lasting behavior change.
- Production uses passwordless accounts so private practice data can be
  synchronized through Supabase. Local development uses browser storage
  through a repository adapter.

## Sources

1. Gardner B, Lally P, Wardle J. *Making health habitual: the psychology of habit-formation and general practice.* British Journal of General Practice (2012). <https://pmc.ncbi.nlm.nih.gov/articles/PMC3505409/>
2. Lally P, van Jaarsveld CHM, Potts HWW, Wardle J. *How are habits formed: Modelling habit formation in the real world.* European Journal of Social Psychology (2010). <https://doi.org/10.1002/ejsp.674>
3. Gollwitzer PM, Sheeran P. *Implementation intentions and goal achievement: A meta-analysis of effects and processes.* Advances in Experimental Social Psychology (2006). <https://doi.org/10.1016/S0065-2601(06)38002-1>
4. Ryan RM, Deci EL. *Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being.* American Psychologist (2000). <https://doi.org/10.1037/0003-066X.55.1.68>
5. Michie S et al. *A refined taxonomy of behaviour change techniques to help people change their physical activity and healthy eating behaviours.* Psychology & Health (2011). <https://doi.org/10.1080/08870446.2010.540664>
6. Loop Habit Tracker project documentation. <https://github.com/iSoron/uhabits>
7. Habitica project documentation. <https://github.com/HabitRPG/habitica>
8. Habitify product documentation. <https://habitify.me/>
9. SuperBetter product documentation. <https://superbetter.com/>

Product pages describe their own products and are not independent evidence of effectiveness. This synthesis uses them only for feature and interaction comparison.
