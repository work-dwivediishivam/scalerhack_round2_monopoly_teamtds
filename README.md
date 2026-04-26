# OpenMonopoly India

**Theme:** Theme 1 - Multi-Agent Interactions  
**Hackathon:** Meta PyTorch OpenEnv Hackathon x Scaler School of Technology  
**One-line pitch:** a Monopoly-style Indian city market where one heuristic baseline competes against two trained reinforcement-learning agents, and every move is replayed on a cinematic board for judges and viewers.

## Submission Links

| Item | Link |
| --- | --- |
| Live demo | https://frontend-one-beta-84.vercel.app |
| Hugging Face Space | https://huggingface.co/spaces/work-dwivediishivam/openmonopoly-india |
| Code repository | https://github.com/work-dwivediishivam/scalerhack_round2_monopoly_teamtds |
| Colab-compatible training notebook | https://colab.research.google.com/github/work-dwivediishivam/scalerhack_round2_monopoly_teamtds/blob/main/notebooks/openmonopoly_training_colab.ipynb |
| Short pitch deck/writeup | https://github.com/work-dwivediishivam/scalerhack_round2_monopoly_teamtds/blob/main/docs/pitch_deck.md |
| Training plot | [backend/monopoly_env/outputs/demo/training_curve.png](backend/monopoly_env/outputs/demo/training_curve.png) |

## Why This Fits The Hackathon

The hackathon asks for OpenEnv environments where agents act, receive verifiable rewards, and improve through reinforcement learning. OpenMonopoly India is built for the **Multi-Agent Interactions** theme: three agents compete over scarce city assets, rent pressure, upgrades, liquidity, and bankruptcy risk.

The environment is not just a UI. The backend exposes an OpenEnv-compatible environment with `reset`, `step`, structured observations, legal actions, reward breakdowns, and replay artifacts. The frontend is the screen-capture layer for storytelling.

## Product Pitch

Most RL demos are either too abstract for a non-technical judge or too small to show strategy. Monopoly is immediately legible: buy assets, collect rent, avoid bankruptcy, and win by managing cash and property value. OpenMonopoly India turns that familiar structure into an RL environment with Indian city names and multi-agent pressure.

The demo shows a complete game replay until bankruptcy. Aarya is the heuristic baseline. Kabir and Meera are separately trained policy-gradient agents. The board shows dice rolls, agent pieces, cash in hand, total net worth, board value, chance/community decks, and the current strategic event. This makes the learning story visible instead of hidden in logs.

## Environment

### Observation

Each step exposes:

- active player and legal strategies
- projected dice and landing tile
- board ownership, prices, rents, houses, and hotels
- all player cash, net worth, owned tiles, monopolies, position, jail status, and bankruptcy status
- recent event log and reward breakdown
- final rollout payload when the episode ends

### Actions

Agents choose one strategic action per turn:

- `expand`: buy aggressively when landing on ownable assets
- `value_invest`: buy selectively with a value threshold
- `defensive`: preserve liquidity and avoid risky purchases
- `upgrade`: prioritize improving owned properties

### Episode Termination

The showcase replay is configured to end on bankruptcy where possible. A safety turn limit exists only to prevent infinite runs.

## Reward Design

The reward is programmatic and decomposed. It combines:

- positive reward for valuable acquisitions
- positive reward for monopoly formation and upgrades
- positive reward for net-worth growth
- penalties for taxes, jail, rent paid, insolvency, and weak liquidity
- rank bonuses at episode end to reward survival and market dominance

This gives dense feedback during a long-horizon game while still aligning with the final objective: survive and finish with the strongest balance sheet.

## Training Method And Model

The current shipped agents use a custom **LinearPolicy policy-gradient** trainer in [backend/monopoly_env/training.py](backend/monopoly_env/training.py). This is not Qwen, Gemma, or GPT-OSS. It is a compact softmax policy trained through self-play rollouts against the environment.

Why this choice: it produced a complete end-to-end RL loop inside the hackathon timebox while preserving the OpenEnv interface, reward decomposition, rollout artifacts, and replayability. The `.env` contains candidate hosted LLM identifiers for future Qwen/Gemma/GPT-OSS work, but those checkpoints are not used by the current game policy.

## Results

Training run:

- two trained agents
- 28 episodes per trained agent
- max 90 training turns
- showcase replay: 128 turns
- termination: bankruptcy
- winner: Meera, RL Policy Beta

Reward improvement:

| Agent | First 10 Avg Reward | Last 10 Avg Reward | Best Net Worth |
| --- | ---: | ---: | ---: |
| Kabir, RL Policy Alpha | 0.6321 | 0.6414 | INR 1,858 |
| Meera, RL Policy Beta | 0.5681 | 0.6201 | INR 1,887 |
| Combined trained agents | 0.6001 | 0.6308 | INR 1,887 |

The plot is stored at [backend/monopoly_env/outputs/demo/training_curve.png](backend/monopoly_env/outputs/demo/training_curve.png) and is rendered in the live frontend.

## Repository Map

| Path | Purpose |
| --- | --- |
| [backend/monopoly_env](backend/monopoly_env) | OpenEnv-compatible Monopoly environment and FastAPI server |
| [backend/monopoly_env/server/monopoly_env_environment.py](backend/monopoly_env/server/monopoly_env_environment.py) | OpenEnv `Environment` wrapper with `reset`, `step`, and state |
| [backend/monopoly_env/simulator.py](backend/monopoly_env/simulator.py) | Game engine, rewards, bankruptcy, rent, ownership, and rollout generation |
| [backend/monopoly_env/training.py](backend/monopoly_env/training.py) | Self-play policy-gradient trainer and saved showcase generator |
| [backend/monopoly_env/outputs/demo](backend/monopoly_env/outputs/demo) | Training metrics, reward plot, and best replay JSON |
| [frontend](frontend) | Next.js/Vercel cinematic replay app |
| [frontend/src/components/monopoly-dashboard.tsx](frontend/src/components/monopoly-dashboard.tsx) | Main board, HUD, replay controls, dice/deck animations, and agent cards |
| [frontend/public/demo](frontend/public/demo) | Bundled replay artifacts used by the deployed frontend |
| [notebooks/openmonopoly_training_colab.ipynb](notebooks/openmonopoly_training_colab.ipynb) | Colab-compatible rerun notebook |
| [docs/pitch_deck.md](docs/pitch_deck.md) | Short pitch deck/writeup |

## Run Locally

### Backend

```bash
cd backend/monopoly_env
uv sync
uv run python -m monopoly_env.server.app --port 8000
```

Useful endpoints:

- `GET /healthz`
- `GET /demo/rollout`
- `GET /demo/metrics`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Optional live backend hookup:

```bash
NEXT_PUBLIC_MONOPOLY_API_URL=http://localhost:8000 npm run dev
```

## Hugging Face Space

The Hugging Face Space contains the OpenEnv backend files, Docker build file, README card, environment code, training script, and demo artifacts. The Space is intended as the judge-facing environment endpoint; the Vercel demo is the cinematic replay layer.

## Anti-Cheat And Safety

- rewards are computed from simulator state, not from free-form agent claims
- legal actions are enumerated by the environment
- bankruptcy and net worth are derived from cash and board ownership
- event logs are generated by the simulator
- the frontend consumes saved JSON artifacts and does not fabricate training metrics

## Limitations

- current trained policies are compact policy-gradient agents, not LLM checkpoints
- the action space is strategic and discrete rather than free-form natural language
- the game is Monopoly-inspired and not an exact commercial Monopoly rules clone
- the current video/blog artifact is represented by the markdown pitch deck until a recorded video is added

## Next Steps

- replace the compact policy with a TRL/GRPO or Unsloth LLM training loop
- add a natural-language policy adapter over the same OpenEnv observations
- run longer self-play tournaments and publish W&B traces
- record a sub-2-minute narrated demo from the Vercel replay

