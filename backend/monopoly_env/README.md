---
title: OpenMonopoly India
emoji: 🎲
colorFrom: yellow
colorTo: green
sdk: docker
pinned: false
app_port: 8000
base_path: /web
tags:
  - openenv
  - multi-agent
  - rl
---

# OpenMonopoly India

OpenMonopoly India is an OpenEnv-compatible multi-agent environment for the Meta PyTorch OpenEnv Hackathon. Three agents play a Monopoly-inspired strategy game over an Indian city board, with one heuristic baseline player, two separately trained RL players, bankruptcy termination, explicit reward decomposition, and saved rollout artifacts for a demo frontend.

## Links

- Live Vercel replay: https://frontend-one-beta-84.vercel.app
- Code repository: https://github.com/work-dwivediishivam/scalerhack_round2_monopoly_teamtds
- Colab-compatible rerun notebook: https://colab.research.google.com/github/work-dwivediishivam/scalerhack_round2_monopoly_teamtds/blob/main/notebooks/openmonopoly_training_colab.ipynb
- Pitch deck/writeup: https://github.com/work-dwivediishivam/scalerhack_round2_monopoly_teamtds/blob/main/docs/pitch_deck.md

The Space root serves the full replay website. API endpoints such as `/demo/rollout`, `/demo/metrics`, and `/healthz` remain available from the same app.

## Why this fits the hackathon

- Best fit: `Theme 1 - Multi-Agent Interactions`
- Secondary overlap: long-horizon planning and self-play
- Verifiable outcome: final ranking by net worth and bankruptcy state
- Intermediate reward: acquisition, monopoly completion, cash discipline, tax/rent penalties, upgrades, and wealth delta

## Environment interface

### Action

`MonopolyAction`

- `strategy`: one of `expand`, `value_invest`, `defensive`, `upgrade`
- `note`: optional text for logging or future LLM policies

### Observation

`MonopolyObservation`

- pending turn preview with projected tile and dice
- full board ownership state
- all player bankrolls, positions, and monopolies
- last resolved frame with event log and reward breakdown
- optional full rollout payload when an episode ends

## Local usage

Install dependencies:

```bash
uv sync
```

Run the environment locally:

```bash
uv run python -m monopoly_env.server.app --port 8000
```

Validate the package structure:

```bash
uvx --python 3.11 --from 'openenv-core[cli]==0.2.3' openenv validate .
```

Query the demo rollout endpoint:

```bash
curl http://localhost:8000/demo/rollout
```

## Training artifacts

Run the lightweight self-play trainer:

```bash
uv run python -m monopoly_env.training --episodes 24 --max-turns 24 --output-dir outputs/demo
```

This writes:

- `outputs/demo/best_rollout.json`
- `outputs/demo/training_metrics.json`
- `outputs/demo/training_curve.png`

Current shipped model: custom `LinearPolicy` policy-gradient agents. This demo does not use Qwen, Gemma, or GPT-OSS checkpoints yet.

## Project structure

```text
monopoly_env/
├── client.py
├── game_data.py
├── models.py
├── openenv.yaml
├── simulator.py
├── training.py
└── server/
    ├── app.py
    └── monopoly_env_environment.py
```
