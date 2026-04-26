# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.

"""Data models for the Monopoly OpenEnv environment."""

from typing import Literal

from openenv.core.env_server.types import Action, Observation
from pydantic import BaseModel, Field


AgentStrategy = Literal["expand", "value_invest", "defensive", "upgrade"]


class BoardTileView(BaseModel):
    index: int
    name: str
    kind: str
    group: str | None = None
    color: str | None = None
    price: int = 0
    base_rent: int = 0
    upgrade_cost: int = 0
    owner_id: str | None = None
    houses: int = 0


class PlayerView(BaseModel):
    id: str
    name: str
    token: str
    color: str
    policy_type: Literal["baseline", "trained"] = "baseline"
    policy_label: str = ""
    cash: int
    net_worth: int
    position: int
    bankrupt: bool = False
    jail_turns: int = 0
    owned_tiles: list[int] = Field(default_factory=list)
    monopolies: list[str] = Field(default_factory=list)


class PendingTurnView(BaseModel):
    active_player_id: str
    active_player_name: str
    dice: list[int] = Field(default_factory=list)
    projected_position: int
    projected_tile: str
    projected_tile_kind: str
    prompt: str


class TurnFrameView(BaseModel):
    turn_index: int
    active_player_id: str
    active_player_name: str
    active_player_policy_type: Literal["baseline", "trained"] = "baseline"
    active_player_policy_label: str = ""
    strategy: AgentStrategy
    dice: list[int] = Field(default_factory=list)
    start_position: int
    end_position: int
    landing_tile_index: int
    landing_tile_name: str
    landing_tile_kind: str = ""
    reward: float
    cash_delta: int = 0
    net_worth_delta: int = 0
    drawn_card_deck: Literal["chance", "community"] | None = None
    drawn_card_label: str | None = None
    reward_breakdown: dict[str, float] = Field(default_factory=dict)
    events: list[str] = Field(default_factory=list)
    players: list[PlayerView] = Field(default_factory=list)
    board: list[BoardTileView] = Field(default_factory=list)


class RolloutView(BaseModel):
    seed: int
    winner_id: str
    winner_name: str
    max_turns: int
    turns_played: int
    termination_reason: Literal["bankruptcy", "safety_limit"] = "bankruptcy"
    players: list[PlayerView] = Field(default_factory=list)
    frames: list[TurnFrameView] = Field(default_factory=list)
    leaderboard: list[PlayerView] = Field(default_factory=list)
    summary: list[str] = Field(default_factory=list)


class MonopolyAction(Action):
    """High-level strategy selected by the active agent for the turn."""

    strategy: AgentStrategy = Field(
        ...,
        description="Turn strategy: expand, value_invest, defensive, or upgrade.",
    )
    note: str = Field(
        default="",
        description="Optional free-form rationale for logging or future LLM policies.",
    )


class MonopolyObservation(Observation):
    """Full observation returned to an OpenEnv client after reset or step."""

    title: str = Field(default="OpenMonopoly India")
    subtitle: str = Field(default="Three-agent self-play on an Indian city board")
    turn_index: int = 0
    max_turns: int = 0
    active_player_id: str = ""
    active_player_name: str = ""
    legal_actions: list[AgentStrategy] = Field(default_factory=list)
    pending_turn: PendingTurnView | None = None
    board: list[BoardTileView] = Field(default_factory=list)
    players: list[PlayerView] = Field(default_factory=list)
    recent_events: list[str] = Field(default_factory=list)
    last_frame: TurnFrameView | None = None
    rollout: RolloutView | None = None
    winner_id: str | None = None
    winner_name: str | None = None
