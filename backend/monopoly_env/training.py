# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.

"""Training and showcase-rollout generation for OpenMonopoly India."""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

import matplotlib.pyplot as plt
import numpy as np

from .models import PendingTurnView, PlayerView
from .simulator import STRATEGIES, MonopolySimulator, default_policy, simulate_policy_match


@dataclass
class Transition:
    player_id: str
    features: np.ndarray
    action_index: int
    reward: float


class LinearPolicy:
    """Compact softmax policy trained with a simple policy-gradient update."""

    def __init__(self, seed: int = 0):
        self.rng = np.random.default_rng(seed)
        self.weights = self.rng.normal(0, 0.05, size=(11, len(STRATEGIES)))

    def featurize(self, pending: PendingTurnView, player: PlayerView) -> np.ndarray:
        tile_flags = {
            "property": 1.0 if pending.projected_tile_kind == "property" else 0.0,
            "railroad": 1.0 if pending.projected_tile_kind == "railroad" else 0.0,
            "utility": 1.0 if pending.projected_tile_kind == "utility" else 0.0,
            "chance_or_community": 1.0 if pending.projected_tile_kind in {"chance", "community"} else 0.0,
            "tax_or_jail": 1.0 if pending.projected_tile_kind in {"tax", "go_to_jail", "jail"} else 0.0,
        }
        return np.array(
            [
                1.0,
                min(player.cash / 2200.0, 2.0),
                min(player.net_worth / 3200.0, 2.0),
                min(len(player.owned_tiles) / 12.0, 1.5),
                min(len(player.monopolies) / 4.0, 1.0),
                sum(pending.dice) / 12.0 if pending.dice else 0.0,
                tile_flags["property"],
                tile_flags["railroad"] + tile_flags["utility"],
                tile_flags["chance_or_community"],
                tile_flags["tax_or_jail"],
                1.0 if player.jail_turns > 0 else 0.0,
            ],
            dtype=np.float64,
        )

    def probs(self, features: np.ndarray) -> np.ndarray:
        logits = features @ self.weights
        logits = logits - logits.max()
        exp = np.exp(logits)
        return exp / exp.sum()

    def sample_action(self, features: np.ndarray) -> tuple[int, np.ndarray]:
        probs = self.probs(features)
        index = int(self.rng.choice(len(STRATEGIES), p=probs))
        return index, probs

    def greedy_action(self, features: np.ndarray) -> int:
        return int(np.argmax(self.probs(features)))

    def update(self, transitions: list[Transition], gamma: float = 0.97, lr: float = 0.03) -> float:
        gradients = np.zeros_like(self.weights)
        policy_loss = 0.0
        grouped: dict[str, list[Transition]] = {}
        for transition in transitions:
            grouped.setdefault(transition.player_id, []).append(transition)
        for player_steps in grouped.values():
            returns: list[float] = []
            running = 0.0
            for transition in reversed(player_steps):
                running = transition.reward + gamma * running
                returns.append(running)
            returns.reverse()
            returns_arr = np.array(returns, dtype=np.float64)
            if len(returns_arr) > 1 and returns_arr.std() > 1e-8:
                returns_arr = (returns_arr - returns_arr.mean()) / (returns_arr.std() + 1e-8)
            for transition, ret in zip(player_steps, returns_arr):
                probs = self.probs(transition.features)
                one_hot = np.zeros(len(STRATEGIES))
                one_hot[transition.action_index] = 1.0
                gradients += np.outer(transition.features, one_hot - probs) * ret
                policy_loss += -np.log(max(probs[transition.action_index], 1e-8)) * ret
        self.weights += lr * gradients / max(len(transitions), 1)
        return float(policy_loss / max(len(transitions), 1))


def rank_bonus_by_player(players: list[PlayerView]) -> dict[str, float]:
    bonuses = [2.6, 0.6, -1.7]
    return {
        player.id: bonuses[index] if index < len(bonuses) else -1.0
        for index, player in enumerate(players)
    }


def run_training_episode(policy: LinearPolicy, seed: int, max_turns: int) -> tuple[dict, list[Transition], MonopolySimulator]:
    env = MonopolySimulator(seed=seed, max_turns=max_turns)
    transitions: list[Transition] = []
    action_counts = np.zeros(len(STRATEGIES))
    while not env.is_done():
        pending = env.pending_turn_view()
        if pending is None:
            break
        players = {view.id: view for view in env.player_views()}
        player = players[pending.active_player_id]
        features = policy.featurize(pending, player)
        action_index, probs = policy.sample_action(features)
        outcome = env.play_turn(STRATEGIES[action_index])
        action_counts[action_index] += 1
        transitions.append(
            Transition(
                player_id=player.id,
                features=features,
                action_index=action_index,
                reward=outcome.reward - float(np.log(max(probs[action_index], 1e-8))) * 0.02,
            )
        )
    leaderboard = env.leaderboard()
    bonuses = rank_bonus_by_player(leaderboard)
    for transition in transitions:
        transition.reward += bonuses[transition.player_id]
    metrics = {
        "winner": leaderboard[0].name,
        "winner_id": leaderboard[0].id,
        "top_net_worth": leaderboard[0].net_worth,
        "mean_net_worth": float(np.mean([player.net_worth for player in leaderboard])),
        "action_counts": action_counts.tolist(),
        "turns": env.turn_index,
        "termination_reason": env.termination_reason(),
    }
    return metrics, transitions, env


def train_policy(
    label: str,
    episodes: int = 40,
    max_turns: int = 90,
    seed: int = 17,
    lr: float = 0.03,
) -> tuple[dict, LinearPolicy]:
    policy = LinearPolicy(seed=seed)
    episode_rewards: list[float] = []
    mean_net_worths: list[float] = []
    losses: list[float] = []
    winner_history: list[str] = []
    best_net_worth = float("-inf")
    for episode in range(episodes):
        metrics, transitions, _ = run_training_episode(policy, seed + episode, max_turns)
        loss = policy.update(transitions, lr=lr)
        episode_rewards.append(float(sum(transition.reward for transition in transitions) / max(len(transitions), 1)))
        mean_net_worths.append(metrics["mean_net_worth"])
        losses.append(loss)
        winner_history.append(metrics["winner"])
        best_net_worth = max(best_net_worth, metrics["top_net_worth"])
    summary = {
        "label": label,
        "episodes": episodes,
        "training_max_turns": max_turns,
        "seed": seed,
        "learning_rate": lr,
        "avg_reward_first_10": float(np.mean(episode_rewards[:10])),
        "avg_reward_last_10": float(np.mean(episode_rewards[-10:])),
        "best_net_worth": best_net_worth,
        "winner_histogram": {name: winner_history.count(name) for name in sorted(set(winner_history))},
        "episode_rewards": episode_rewards,
        "mean_net_worths": mean_net_worths,
        "losses": losses,
        "weights": policy.weights.tolist(),
    }
    return summary, policy


def policy_callable(policy: LinearPolicy) -> Callable[[PendingTurnView, PlayerView], str]:
    def choose_action(pending: PendingTurnView, player: PlayerView) -> str:
        features = policy.featurize(pending, player)
        return STRATEGIES[policy.greedy_action(features)]

    return choose_action


def build_showcase_bundle(
    train_episodes: int = 40,
    train_turns: int = 90,
    showcase_turns: int = 260,
    alpha_seed: int = 17,
    beta_seed: int = 71,
    showcase_seed: int = 31,
    lr: float = 0.03,
) -> dict:
    alpha_summary, alpha_policy = train_policy(
        label="RL Policy Alpha",
        episodes=train_episodes,
        max_turns=train_turns,
        seed=alpha_seed,
        lr=lr,
    )
    beta_summary, beta_policy = train_policy(
        label="RL Policy Beta",
        episodes=train_episodes,
        max_turns=train_turns,
        seed=beta_seed,
        lr=lr,
    )

    policy_map = {
        "aarya": default_policy,
        "kabir": policy_callable(alpha_policy),
        "meera": policy_callable(beta_policy),
    }

    rollout = None
    selected_seed = showcase_seed
    for offset in range(18):
        candidate_seed = showcase_seed + offset
        candidate = simulate_policy_match(policy_map=policy_map, seed=candidate_seed, max_turns=showcase_turns)
        rollout = candidate
        selected_seed = candidate_seed
        if candidate.termination_reason == "bankruptcy":
            break
    assert rollout is not None

    trained_agents = [
        {
            "id": "kabir",
            "name": "Kabir",
            "policy_label": alpha_summary["label"],
            "avg_reward_first_10": alpha_summary["avg_reward_first_10"],
            "avg_reward_last_10": alpha_summary["avg_reward_last_10"],
            "best_net_worth": alpha_summary["best_net_worth"],
        },
        {
            "id": "meera",
            "name": "Meera",
            "policy_label": beta_summary["label"],
            "avg_reward_first_10": beta_summary["avg_reward_first_10"],
            "avg_reward_last_10": beta_summary["avg_reward_last_10"],
            "best_net_worth": beta_summary["best_net_worth"],
        },
    ]

    return {
        "episodes_per_trained_agent": train_episodes,
        "training_max_turns": train_turns,
        "showcase_seed": selected_seed,
        "showcase_turns": rollout.turns_played,
        "showcase_termination_reason": rollout.termination_reason,
        "avg_reward_first_10": float(np.mean([alpha_summary["avg_reward_first_10"], beta_summary["avg_reward_first_10"]])),
        "avg_reward_last_10": float(np.mean([alpha_summary["avg_reward_last_10"], beta_summary["avg_reward_last_10"]])),
        "best_net_worth": max(alpha_summary["best_net_worth"], beta_summary["best_net_worth"]),
        "trained_agents": trained_agents,
        "reward_curves": {
            "kabir": alpha_summary["episode_rewards"],
            "meera": beta_summary["episode_rewards"],
        },
        "loss_curves": {
            "kabir": alpha_summary["losses"],
            "meera": beta_summary["losses"],
        },
        "winner_histogram": {
            "Kabir": alpha_summary["winner_histogram"].get("Kabir", 0),
            "Meera": beta_summary["winner_histogram"].get("Meera", 0),
        },
        "agent_profiles": [
            {"id": "aarya", "name": "Aarya", "policy_type": "baseline", "policy_label": "Heuristic Baseline"},
            {"id": "kabir", "name": "Kabir", "policy_type": "trained", "policy_label": alpha_summary["label"]},
            {"id": "meera", "name": "Meera", "policy_type": "trained", "policy_label": beta_summary["label"]},
        ],
        "best_rollout": rollout.model_dump(),
        "policy_weights": {
            "kabir": alpha_summary["weights"],
            "meera": beta_summary["weights"],
        },
    }


def save_training_artifacts(
    output_dir: str | Path,
    train_episodes: int = 40,
    train_turns: int = 90,
    showcase_turns: int = 260,
    showcase_seed: int = 31,
    lr: float = 0.03,
) -> dict:
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    summary = build_showcase_bundle(
        train_episodes=train_episodes,
        train_turns=train_turns,
        showcase_turns=showcase_turns,
        showcase_seed=showcase_seed,
        lr=lr,
    )
    with (output_path / "training_metrics.json").open("w", encoding="utf-8") as handle:
        json.dump(summary, handle, indent=2)
    with (output_path / "best_rollout.json").open("w", encoding="utf-8") as handle:
        json.dump(summary["best_rollout"], handle, indent=2)
    x = np.arange(1, train_episodes + 1)
    plt.figure(figsize=(11, 5.5))
    plt.plot(x, summary["reward_curves"]["kabir"], color="#06b6d4", linewidth=2.2, label="Kabir RL reward")
    plt.plot(x, summary["reward_curves"]["meera"], color="#22c55e", linewidth=2.2, label="Meera RL reward")
    plt.xlabel("Training episode")
    plt.ylabel("Mean episode return")
    plt.title("OpenMonopoly India RL training curves")
    plt.legend()
    plt.grid(alpha=0.16)
    plt.tight_layout()
    plt.savefig(output_path / "training_curve.png", dpi=190)
    plt.close()
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description="Train two RL Monopoly agents and export a showcase rollout.")
    parser.add_argument("--train-episodes", type=int, default=40)
    parser.add_argument("--train-turns", type=int, default=90)
    parser.add_argument("--showcase-turns", type=int, default=260)
    parser.add_argument("--showcase-seed", type=int, default=31)
    parser.add_argument("--lr", type=float, default=0.03)
    parser.add_argument("--output-dir", type=str, default="outputs/demo")
    args = parser.parse_args()
    summary = save_training_artifacts(
        output_dir=args.output_dir,
        train_episodes=args.train_episodes,
        train_turns=args.train_turns,
        showcase_turns=args.showcase_turns,
        showcase_seed=args.showcase_seed,
        lr=args.lr,
    )
    print(
        json.dumps(
            {
                "showcase_termination_reason": summary["showcase_termination_reason"],
                "showcase_turns": summary["showcase_turns"],
                "avg_reward_first_10": summary["avg_reward_first_10"],
                "avg_reward_last_10": summary["avg_reward_last_10"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
