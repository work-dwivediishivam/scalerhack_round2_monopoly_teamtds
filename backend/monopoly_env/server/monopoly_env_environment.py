# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.

"""OpenEnv environment wrapper around the Monopoly simulator."""

from uuid import uuid4

from openenv.core.env_server.interfaces import Environment
from openenv.core.env_server.types import State

try:
    from ..models import MonopolyAction, MonopolyObservation
    from ..simulator import MonopolySimulator
except ImportError:
    from models import MonopolyAction, MonopolyObservation
    from simulator import MonopolySimulator


class MonopolyEnvironment(Environment):
    """Three-agent Monopoly self-play environment for OpenEnv."""

    SUPPORTS_CONCURRENT_SESSIONS: bool = True

    def __init__(self, seed: int = 7, max_turns: int = 220):
        self.seed = seed
        self.max_turns = max_turns
        self._state = State(episode_id=str(uuid4()), step_count=0)
        self._sim = MonopolySimulator(seed=seed, max_turns=max_turns)

    def _build_observation(
        self,
        reward: float = 0.0,
        done: bool = False,
        include_rollout: bool = False,
    ) -> MonopolyObservation:
        pending = self._sim.pending_turn_view()
        players = self._sim.player_views()
        winner_id = None
        winner_name = None
        if done:
            winner_id = self._sim.rollout_view().winner_id or None
            winner_name = self._sim.rollout_view().winner_name or None
        return MonopolyObservation(
            title="OpenMonopoly India",
            subtitle="One heuristic baseline faces two trained RL agents on an Indian city Monopoly board",
            turn_index=self._sim.turn_index,
            max_turns=self._sim.max_turns,
            active_player_id=pending.active_player_id if pending else "",
            active_player_name=pending.active_player_name if pending else "",
            legal_actions=self._sim.legal_actions(),
            pending_turn=pending,
            board=self._sim.board_views(),
            players=players,
            recent_events=self._sim.event_log[-6:],
            last_frame=self._sim.history[-1] if self._sim.history else None,
            rollout=self._sim.rollout_view() if include_rollout else None,
            winner_id=winner_id,
            winner_name=winner_name,
            done=done,
            reward=reward,
            metadata={
                "episode_id": self._state.episode_id,
                "step_count": self._state.step_count,
                "seed": self._sim.seed,
            },
        )

    def reset(self) -> MonopolyObservation:
        self._state = State(episode_id=str(uuid4()), step_count=0)
        self._sim.reset(seed=self.seed, max_turns=self.max_turns)
        return self._build_observation()

    def step(self, action: MonopolyAction) -> MonopolyObservation:  # type: ignore[override]
        self._state.step_count += 1
        outcome = self._sim.play_turn(action.strategy)
        observation = self._build_observation(
            reward=outcome.reward,
            done=outcome.done,
            include_rollout=outcome.done,
        )
        observation.metadata = {
            **(observation.metadata or {}),
            "reward_breakdown": outcome.reward_breakdown,
            "events": outcome.events,
        }
        return observation

    @property
    def state(self) -> State:
        return self._state
