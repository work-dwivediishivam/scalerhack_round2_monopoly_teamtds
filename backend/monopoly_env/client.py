# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.

"""OpenEnv client for the Monopoly environment."""

from typing import Any

from openenv.core import EnvClient
from openenv.core.client_types import StepResult
from openenv.core.env_server.types import State

from .models import MonopolyAction, MonopolyObservation


class MonopolyEnv(EnvClient[MonopolyAction, MonopolyObservation, State]):
    """Typed client for the OpenMonopoly India environment."""

    def _step_payload(self, action: MonopolyAction) -> dict[str, Any]:
        return {
            "strategy": action.strategy,
            "note": action.note,
        }

    def _parse_result(self, payload: dict[str, Any]) -> StepResult[MonopolyObservation]:
        observation_payload = payload.get("observation", {}) or {}
        observation = MonopolyObservation.model_validate(
            {
                **observation_payload,
                "reward": payload.get("reward", observation_payload.get("reward", 0.0)),
                "done": payload.get("done", observation_payload.get("done", False)),
            }
        )
        return StepResult(
            observation=observation,
            reward=payload.get("reward", observation.reward),
            done=payload.get("done", observation.done),
        )

    def _parse_state(self, payload: dict[str, Any]) -> State:
        return State(
            episode_id=payload.get("episode_id"),
            step_count=payload.get("step_count", 0),
        )
