# OpenMonopoly India Pitch Deck

## Slide 1 - Product

OpenMonopoly India is a multi-agent reinforcement-learning environment where agents compete on a Monopoly-style Indian city board. The goal is simple to understand and hard to master: survive bankruptcy pressure, build assets, collect rent, and finish with the highest net worth.

## Slide 2 - Hackathon Fit

Theme 1 is Multi-Agent Interactions. This environment is competitive, long-horizon, and strategic. Agents must reason about scarce properties, other players' liquidity, rent exposure, and whether buying now creates future pressure or immediate bankruptcy risk.

## Slide 3 - Environment

The OpenEnv backend exposes structured observations, legal strategic actions, reward breakdowns, and terminal rollouts. Each turn includes projected dice, landing tile, board state, bankrolls, ownership, monopolies, and recent events.

## Slide 4 - Actions

Agents choose one of four strategic policies each turn:

- expand
- value_invest
- defensive
- upgrade

These are intentionally compact so training can run quickly while still showing meaningful tradeoffs.

## Slide 5 - Reward

The reward combines acquisition quality, monopoly formation, upgrades, liquidity, rent paid or earned, taxes, jail, bankruptcy pressure, and final ranking. It is programmatic, reproducible, and attached to simulator state rather than generated text.

## Slide 6 - Training

The current shipped run trains two compact LinearPolicy policy-gradient agents through self-play. Aarya is the heuristic baseline. Kabir and Meera are trained separately and then evaluated in a three-player showcase replay.

## Slide 7 - Results

The saved run trained 28 episodes per RL agent and produced a 128-turn bankruptcy-ending showcase. Meera, RL Policy Beta, wins the replay. Average reward improves from 0.6001 in the first 10 episodes to 0.6308 in the final 10 episodes across the trained agents.

## Slide 8 - Demo

The Vercel app turns the rollout into a screen-capture-ready replay: animated tokens on the board, dice chamber, chance/community deck reveals, cash and net-worth HUD, ranked agent cards, training plot, and playback speeds from 1 turn/sec to 4.5 turns/sec.

## Slide 9 - Why It Matters

Strategic economic games are useful RL environments because they combine planning, delayed reward, opponent modeling, and resource management. Judges can understand the scenario immediately, while the backend still exposes verifiable rewards and reproducible training artifacts.

## Slide 10 - Next Step

The next technical upgrade is swapping the compact policy for a TRL/GRPO or Unsloth-trained language-model policy over the same OpenEnv interface. The environment, reward, artifacts, and visualization are already in place.

