# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.

"""Core Monopoly simulation and lightweight self-play helpers."""

from __future__ import annotations

from dataclasses import dataclass, field
from random import Random
from typing import Callable

from .game_data import BOARD_TEMPLATES, CHANCE_CARDS, COMMUNITY_CARDS, PLAYER_PROFILES, TileTemplate
from .models import (
    AgentStrategy,
    BoardTileView,
    PendingTurnView,
    PlayerView,
    RolloutView,
    TurnFrameView,
)


INITIAL_CASH = 900
GO_SALARY = 100
JAIL_FINE = 60
MAX_HOUSES = 5
STRATEGIES: list[AgentStrategy] = ["expand", "value_invest", "defensive", "upgrade"]

STRATEGY_CONFIG = {
    "expand": {"reserve": 160, "buy_threshold": 0.11, "upgrade_bias": 1.1},
    "value_invest": {"reserve": 240, "buy_threshold": 0.14, "upgrade_bias": 1.0},
    "defensive": {"reserve": 360, "buy_threshold": 0.18, "upgrade_bias": 0.5},
    "upgrade": {"reserve": 180, "buy_threshold": 0.12, "upgrade_bias": 1.5},
}


@dataclass
class BoardSpace:
    template: TileTemplate
    owner_id: str | None = None
    houses: int = 0

    @property
    def index(self) -> int:
        return self.template.index

    @property
    def name(self) -> str:
        return self.template.name

    @property
    def kind(self) -> str:
        return self.template.kind

    @property
    def group(self) -> str | None:
        return self.template.group

    @property
    def price(self) -> int:
        return self.template.price

    @property
    def base_rent(self) -> int:
        return self.template.base_rent

    @property
    def color(self) -> str | None:
        return self.template.color

    @property
    def upgrade_cost(self) -> int:
        return self.template.upgrade_cost


@dataclass
class PlayerState:
    id: str
    name: str
    token: str
    color: str
    policy_type: str = "baseline"
    policy_label: str = "Baseline"
    cash: int = INITIAL_CASH
    position: int = 0
    bankrupt: bool = False
    jail_turns: int = 0
    owned_tiles: list[int] = field(default_factory=list)


@dataclass
class PendingTurn:
    active_player_id: str
    active_player_name: str
    dice: list[int]
    projected_position: int
    projected_tile: str
    projected_tile_kind: str
    start_position: int
    passed_go: bool = False
    in_jail: bool = False


@dataclass
class TurnOutcome:
    reward: float
    reward_breakdown: dict[str, float]
    events: list[str]
    frame: TurnFrameView
    done: bool
    winner_id: str | None
    winner_name: str | None


class MonopolySimulator:
    """Simplified Monopoly simulator with stable rollout serialization."""

    def __init__(self, seed: int = 7, max_turns: int = 220):
        self.seed = seed
        self.max_turns = max_turns
        self.rng = Random(seed)
        self.board: list[BoardSpace] = []
        self.players: list[PlayerState] = []
        self.active_index = 0
        self.turn_index = 0
        self.free_parking_pool = 0
        self.pending_turn: PendingTurn | None = None
        self.chance_index = 0
        self.community_index = 0
        self.history: list[TurnFrameView] = []
        self.event_log: list[str] = []
        self.reset(seed=seed, max_turns=max_turns)

    def reset(self, seed: int | None = None, max_turns: int | None = None) -> None:
        if seed is not None:
            self.seed = seed
        if max_turns is not None:
            self.max_turns = max_turns
        self.rng = Random(self.seed)
        self.board = [BoardSpace(template=template) for template in BOARD_TEMPLATES]
        self.players = [PlayerState(**profile) for profile in PLAYER_PROFILES]
        self.active_index = 0
        self.turn_index = 0
        self.free_parking_pool = 0
        self.pending_turn = None
        self.chance_index = 0
        self.community_index = 0
        self.history = []
        self.event_log = ["OpenMonopoly India booted. Three agents enter the arena."]
        self._prepare_pending_turn()

    def legal_actions(self) -> list[AgentStrategy]:
        return STRATEGIES.copy()

    def _alive_players(self) -> list[PlayerState]:
        return [player for player in self.players if not player.bankrupt]

    def _player(self, player_id: str) -> PlayerState:
        return next(player for player in self.players if player.id == player_id)

    def _space(self, index: int) -> BoardSpace:
        return self.board[index]

    def _group_spaces(self, group: str | None) -> list[BoardSpace]:
        if group is None:
            return []
        return [space for space in self.board if space.group == group and space.kind == "property"]

    def _monopolies_for(self, player: PlayerState) -> list[str]:
        monopolies: list[str] = []
        for group in {space.group for space in self.board if space.kind == "property" and space.group}:
            spaces = self._group_spaces(group)
            if spaces and all(space.owner_id == player.id for space in spaces):
                monopolies.append(group)
        return sorted(monopolies)

    def _net_worth(self, player: PlayerState) -> int:
        total = player.cash
        for tile_index in player.owned_tiles:
            space = self._space(tile_index)
            total += space.price + (space.houses * max(space.upgrade_cost, 50))
        return total

    def _rent_for(self, space: BoardSpace) -> int:
        if space.kind == "railroad":
            owner = self._player(space.owner_id) if space.owner_id else None
            owned = len([tile for tile in owner.owned_tiles if self._space(tile).kind == "railroad"]) if owner else 0
            return 40 * max(1, owned)
        if space.kind == "utility":
            owner = self._player(space.owner_id) if space.owner_id else None
            owned = len([tile for tile in owner.owned_tiles if self._space(tile).kind == "utility"]) if owner else 0
            return 45 if owned == 1 else 90
        monopoly_multiplier = 2.2 if space.group and self._group_spaces(space.group) and all(
            grouped.owner_id == space.owner_id for grouped in self._group_spaces(space.group)
        ) and space.houses == 0 else 1
        improved = int(space.base_rent * (1 + (space.houses * 1.25)))
        return int(improved * monopoly_multiplier)

    def _advance_to_next_player(self) -> None:
        if not self._alive_players():
            return
        for _ in range(len(self.players)):
            self.active_index = (self.active_index + 1) % len(self.players)
            if not self.players[self.active_index].bankrupt:
                return

    def _next_index_of_kind(self, start: int, kind: str) -> int:
        index = start
        while True:
            index = (index + 1) % len(self.board)
            if self.board[index].kind == kind:
                return index

    def _move_player_to(self, player: PlayerState, target: int) -> tuple[int, bool]:
        passed_go = target < player.position
        player.position = target
        if passed_go:
            player.cash += GO_SALARY
        return target, passed_go

    def _preview_prompt(self, player: PlayerState, pending: PendingTurn) -> str:
        tile = self._space(pending.projected_position)
        if pending.in_jail:
            return f"{player.name} is in jail. Pick a risk posture for the turn."
        if tile.kind in {"property", "railroad", "utility"} and tile.owner_id is None:
            return (
                f"{player.name} rolled {pending.dice[0]} + {pending.dice[1]} and will land on "
                f"{tile.name}. It is available for Rs {tile.price}. Choose a strategy."
            )
        return (
            f"{player.name} rolled {pending.dice[0]} + {pending.dice[1]} and will land on "
            f"{tile.name}. Choose the turn strategy."
        )

    def _prepare_pending_turn(self) -> None:
        if self.is_done():
            self.pending_turn = None
            return
        active = self.players[self.active_index]
        if active.bankrupt:
            self._advance_to_next_player()
            active = self.players[self.active_index]
        if active.jail_turns > 0:
            self.pending_turn = PendingTurn(
                active_player_id=active.id,
                active_player_name=active.name,
                dice=[0, 0],
                projected_position=active.position,
                projected_tile=self._space(active.position).name,
                projected_tile_kind=self._space(active.position).kind,
                start_position=active.position,
                in_jail=True,
            )
            return
        dice = [self.rng.randint(1, 6), self.rng.randint(1, 6)]
        total = sum(dice)
        start_position = active.position
        projected = (active.position + total) % len(self.board)
        self.pending_turn = PendingTurn(
            active_player_id=active.id,
            active_player_name=active.name,
            dice=dice,
            projected_position=projected,
            projected_tile=self._space(projected).name,
            projected_tile_kind=self._space(projected).kind,
            start_position=start_position,
            passed_go=(active.position + total) >= len(self.board),
        )

    def _strategy_wants_purchase(self, player: PlayerState, space: BoardSpace, strategy: AgentStrategy) -> bool:
        config = STRATEGY_CONFIG[strategy]
        if player.cash - space.price < config["reserve"]:
            return False
        if space.kind == "property":
            group_spaces = self._group_spaces(space.group)
            owns_group = len([tile for tile in group_spaces if tile.owner_id == player.id])
            completion_bonus = 0.04 if group_spaces and owns_group == len(group_spaces) - 1 else 0
            roi = space.base_rent / max(space.price, 1)
            if strategy == "defensive" and completion_bonus == 0 and roi < config["buy_threshold"]:
                return False
            return roi + completion_bonus >= config["buy_threshold"]
        if space.kind == "railroad":
            return player.cash >= space.price + 120
        if space.kind == "utility":
            return strategy != "defensive" or player.cash >= space.price + 300
        return False

    def _maybe_upgrade(self, player: PlayerState, strategy: AgentStrategy, reward_breakdown: dict[str, float], events: list[str]) -> None:
        if strategy not in {"expand", "upgrade", "value_invest"}:
            return
        config = STRATEGY_CONFIG[strategy]
        upgrade_limit = 2 if strategy == "upgrade" else 1
        for _ in range(upgrade_limit):
            candidates: list[BoardSpace] = []
            for group in self._monopolies_for(player):
                for space in self._group_spaces(group):
                    if space.houses < MAX_HOUSES and player.cash - space.upgrade_cost >= config["reserve"]:
                        candidates.append(space)
            if not candidates:
                return
            target = max(candidates, key=lambda space: (space.base_rent * config["upgrade_bias"]) - (space.houses * 2))
            player.cash -= target.upgrade_cost
            target.houses += 1
            reward_breakdown["upgrade"] = reward_breakdown.get("upgrade", 0.0) + 0.35
            events.append(f"{player.name} upgrades {target.name} to level {target.houses}.")

    def _apply_upkeep(self, player: PlayerState, reward_breakdown: dict[str, float], events: list[str]) -> None:
        total_houses = sum(self._space(tile_index).houses for tile_index in player.owned_tiles)
        upkeep = (len(player.owned_tiles) * 6) + (total_houses * 18)
        if upkeep <= 0:
            return
        player.cash -= upkeep
        reward_breakdown["upkeep"] = reward_breakdown.get("upkeep", 0.0) - (upkeep / 140)
        events.append(f"{player.name} pays Rs {upkeep} in portfolio upkeep.")
        if player.cash < 0:
            self._apply_bankruptcy(player, None, events)
            reward_breakdown["bankruptcy"] = -3.0

    def _apply_bankruptcy(self, player: PlayerState, creditor_id: str | None, events: list[str]) -> None:
        player.bankrupt = True
        player.cash = 0
        if creditor_id:
            creditor = self._player(creditor_id)
            for tile_index in player.owned_tiles:
                space = self._space(tile_index)
                space.owner_id = creditor_id
                creditor.owned_tiles.append(tile_index)
            creditor.owned_tiles = sorted(set(creditor.owned_tiles))
        else:
            for tile_index in player.owned_tiles:
                space = self._space(tile_index)
                space.owner_id = None
                space.houses = 0
        player.owned_tiles = []
        events.append(f"{player.name} goes bankrupt.")

    def _resolve_property(self, player: PlayerState, strategy: AgentStrategy, space: BoardSpace, reward_breakdown: dict[str, float], events: list[str]) -> None:
        if space.owner_id is None:
            if self._strategy_wants_purchase(player, space, strategy):
                player.cash -= space.price
                player.owned_tiles.append(space.index)
                player.owned_tiles.sort()
                space.owner_id = player.id
                reward_breakdown["acquisition"] = reward_breakdown.get("acquisition", 0.0) + 0.75
                events.append(f"{player.name} buys {space.name} for Rs {space.price}.")
                if space.kind == "property" and space.group and len(
                    [tile for tile in self._group_spaces(space.group) if tile.owner_id == player.id]
                ) == len(self._group_spaces(space.group)):
                    reward_breakdown["monopoly"] = reward_breakdown.get("monopoly", 0.0) + 1.2
                    events.append(f"{player.name} completes the {space.group} set.")
            else:
                reward_breakdown["cash_discipline"] = reward_breakdown.get("cash_discipline", 0.0) + 0.1
                events.append(f"{player.name} skips buying {space.name}.")
            return
        if space.owner_id == player.id:
            reward_breakdown["owned_tile"] = reward_breakdown.get("owned_tile", 0.0) + 0.05
            events.append(f"{player.name} lands on owned territory at {space.name}.")
            return
        rent = self._rent_for(space)
        player.cash -= rent
        owner = self._player(space.owner_id)
        owner.cash += rent
        reward_breakdown["rent_paid"] = reward_breakdown.get("rent_paid", 0.0) - (rent / 120)
        events.append(f"{player.name} pays Rs {rent} rent to {owner.name} at {space.name}.")
        if player.cash < 0:
            self._apply_bankruptcy(player, owner.id, events)
            reward_breakdown["bankruptcy"] = -3.0

    def _resolve_card(
        self,
        player: PlayerState,
        strategy: AgentStrategy,
        deck: str,
        reward_breakdown: dict[str, float],
        events: list[str],
        turn_context: dict[str, str | int | None],
    ) -> None:
        if deck == "chance":
            card = CHANCE_CARDS[self.chance_index % len(CHANCE_CARDS)]
            self.chance_index += 1
        else:
            card = COMMUNITY_CARDS[self.community_index % len(COMMUNITY_CARDS)]
            self.community_index += 1
        turn_context["drawn_card_deck"] = deck
        turn_context["drawn_card_label"] = str(card["label"])
        events.append(card["label"])
        if card.get("cash"):
            player.cash += int(card["cash"])
            reward_breakdown["card_cash"] = reward_breakdown.get("card_cash", 0.0) + (int(card["cash"]) / 150)
            if card["cash"] < 0:
                self.free_parking_pool += abs(int(card["cash"]))
        if card.get("goto_jail"):
            player.position = 10
            player.jail_turns = 1
            reward_breakdown["jail"] = reward_breakdown.get("jail", 0.0) - 0.8
            events.append(f"{player.name} is sent to Jail.")
            return
        move_to = card.get("move_to")
        if card.get("move_to_next") == "railroad":
            move_to = self._next_index_of_kind(player.position, "railroad")
        if move_to is not None:
            _, passed_go = self._move_player_to(player, int(move_to))
            if passed_go:
                reward_breakdown["pass_go"] = reward_breakdown.get("pass_go", 0.0) + 0.4
                events.append(f"{player.name} collects Rs {GO_SALARY} for passing Go.")
            self._resolve_tile(player, strategy, self._space(player.position), reward_breakdown, events, turn_context)

    def _resolve_tile(
        self,
        player: PlayerState,
        strategy: AgentStrategy,
        space: BoardSpace,
        reward_breakdown: dict[str, float],
        events: list[str],
        turn_context: dict[str, str | int | None],
    ) -> None:
        if player.bankrupt:
            return
        if space.kind in {"property", "railroad", "utility"}:
            self._resolve_property(player, strategy, space, reward_breakdown, events)
            return
        if space.kind == "tax":
            tax = space.price
            player.cash -= tax
            self.free_parking_pool += tax
            reward_breakdown["tax"] = reward_breakdown.get("tax", 0.0) - (tax / 150)
            events.append(f"{player.name} pays Rs {tax} in tax.")
            if player.cash < 0:
                self._apply_bankruptcy(player, None, events)
                reward_breakdown["bankruptcy"] = -3.0
            return
        if space.kind == "chance":
            self._resolve_card(player, strategy, "chance", reward_breakdown, events, turn_context)
            return
        if space.kind == "community":
            self._resolve_card(player, strategy, "community", reward_breakdown, events, turn_context)
            return
        if space.kind == "go_to_jail":
            player.position = 10
            player.jail_turns = 1
            reward_breakdown["jail"] = reward_breakdown.get("jail", 0.0) - 0.8
            events.append(f"{player.name} is sent directly to Jail.")
            return
        if space.kind == "free_parking" and self.free_parking_pool > 0:
            jackpot = self.free_parking_pool
            self.free_parking_pool = 0
            player.cash += jackpot
            reward_breakdown["free_parking"] = reward_breakdown.get("free_parking", 0.0) + (jackpot / 160)
            events.append(f"{player.name} collects the Rs {jackpot} free parking pool.")

    def is_done(self) -> bool:
        return self.turn_index >= self.max_turns or len(self._alive_players()) <= 1

    def termination_reason(self) -> str:
        if len(self._alive_players()) <= 1:
            return "bankruptcy"
        return "safety_limit"

    def _winner(self) -> tuple[str | None, str | None]:
        if not self.players:
            return None, None
        ranking = self.leaderboard()
        if not ranking:
            return None, None
        winner = ranking[0]
        return winner.id, winner.name

    def leaderboard(self) -> list[PlayerView]:
        return sorted(self.player_views(), key=lambda player: player.net_worth, reverse=True)

    def player_views(self) -> list[PlayerView]:
        return [
            PlayerView(
                id=player.id,
                name=player.name,
                token=player.token,
                color=player.color,
                policy_type=player.policy_type,
                policy_label=player.policy_label,
                cash=player.cash,
                net_worth=self._net_worth(player),
                position=player.position,
                bankrupt=player.bankrupt,
                jail_turns=player.jail_turns,
                owned_tiles=player.owned_tiles.copy(),
                monopolies=self._monopolies_for(player),
            )
            for player in self.players
        ]

    def board_views(self) -> list[BoardTileView]:
        return [
            BoardTileView(
                index=space.index,
                name=space.name,
                kind=space.kind,
                group=space.group,
                color=space.color,
                price=space.price,
                base_rent=space.base_rent,
                upgrade_cost=space.upgrade_cost,
                owner_id=space.owner_id,
                houses=space.houses,
            )
            for space in self.board
        ]

    def pending_turn_view(self) -> PendingTurnView | None:
        if self.pending_turn is None:
            return None
        player = self._player(self.pending_turn.active_player_id)
        return PendingTurnView(
            active_player_id=self.pending_turn.active_player_id,
            active_player_name=self.pending_turn.active_player_name,
            dice=self.pending_turn.dice.copy(),
            projected_position=self.pending_turn.projected_position,
            projected_tile=self.pending_turn.projected_tile,
            projected_tile_kind=self.pending_turn.projected_tile_kind,
            prompt=self._preview_prompt(player, self.pending_turn),
        )

    def play_turn(self, strategy: AgentStrategy) -> TurnOutcome:
        if self.pending_turn is None:
            self._prepare_pending_turn()
        if self.pending_turn is None:
            winner_id, winner_name = self._winner()
            empty_frame = TurnFrameView(
                turn_index=self.turn_index,
                active_player_id="",
                active_player_name="",
                active_player_policy_type="baseline",
                active_player_policy_label="",
                strategy=strategy,
                dice=[],
                start_position=0,
                end_position=0,
                landing_tile_index=0,
                landing_tile_name="",
                landing_tile_kind="",
                reward=0.0,
            )
            return TurnOutcome(0.0, {}, [], empty_frame, True, winner_id, winner_name)
        player = self._player(self.pending_turn.active_player_id)
        start_cash = player.cash
        start_net_worth = self._net_worth(player)
        reward_breakdown: dict[str, float] = {}
        events: list[str] = []
        turn_context: dict[str, str | int | None] = {
            "drawn_card_deck": None,
            "drawn_card_label": None,
        }
        pending = self.pending_turn
        landing_index = player.position
        if pending.in_jail:
            if strategy in {"expand", "upgrade"} and player.cash > 220:
                player.cash -= JAIL_FINE
                player.jail_turns = 0
                reward_breakdown["jail_fine"] = -0.2
                events.append(f"{player.name} pays Rs {JAIL_FINE} to leave Jail.")
            else:
                player.jail_turns = max(0, player.jail_turns - 1)
                reward_breakdown["wait_jail"] = -0.15
                events.append(f"{player.name} waits out the turn in Jail.")
        else:
            player.position = pending.projected_position
            landing_index = pending.projected_position
            if pending.passed_go:
                player.cash += GO_SALARY
                reward_breakdown["pass_go"] = 0.4
                events.append(f"{player.name} passes Go and collects Rs {GO_SALARY}.")
            landing_space = self._space(landing_index)
            events.append(f"{player.name} lands on {landing_space.name}.")
            self._resolve_tile(player, strategy, landing_space, reward_breakdown, events, turn_context)
            self._maybe_upgrade(player, strategy, reward_breakdown, events)
        if not player.bankrupt:
            self._apply_upkeep(player, reward_breakdown, events)
        end_net_worth = self._net_worth(player)
        cash_delta = player.cash - start_cash
        wealth_delta = self._net_worth(player) - start_net_worth
        reward_breakdown["wealth_delta"] = round(wealth_delta / 120.0, 3)
        reward = round(sum(reward_breakdown.values()), 3)
        self.event_log.extend(events)
        frame = TurnFrameView(
            turn_index=self.turn_index + 1,
            active_player_id=player.id,
            active_player_name=player.name,
            active_player_policy_type=player.policy_type,  # type: ignore[arg-type]
            active_player_policy_label=player.policy_label,
            strategy=strategy,
            dice=pending.dice.copy(),
            start_position=pending.start_position,
            end_position=player.position,
            landing_tile_index=landing_index,
            landing_tile_name=self._space(landing_index).name,
            landing_tile_kind=self._space(landing_index).kind,
            reward=reward,
            cash_delta=cash_delta,
            net_worth_delta=end_net_worth - start_net_worth,
            drawn_card_deck=turn_context["drawn_card_deck"],  # type: ignore[arg-type]
            drawn_card_label=turn_context["drawn_card_label"],  # type: ignore[arg-type]
            reward_breakdown=reward_breakdown.copy(),
            events=events.copy(),
            players=self.player_views(),
            board=self.board_views(),
        )
        self.history.append(frame)
        self.turn_index += 1
        done = self.is_done()
        winner_id, winner_name = self._winner() if done else (None, None)
        if done and winner_id == player.id:
            reward += 2.0
            frame.reward = reward
            frame.reward_breakdown["winner_bonus"] = 2.0
        self._advance_to_next_player()
        self._prepare_pending_turn()
        return TurnOutcome(
            reward=reward,
            reward_breakdown=frame.reward_breakdown.copy(),
            events=events,
            frame=frame,
            done=done,
            winner_id=winner_id,
            winner_name=winner_name,
        )

    def rollout_view(self) -> RolloutView:
        winner_id, winner_name = self._winner()
        ranking = self.leaderboard()
        return RolloutView(
            seed=self.seed,
            winner_id=winner_id or "",
            winner_name=winner_name or "",
            max_turns=self.max_turns,
            turns_played=self.turn_index,
            termination_reason=self.termination_reason(),
            players=self.player_views(),
            frames=self.history.copy(),
            leaderboard=ranking,
            summary=[
                f"{ranking[0].name} wins with net worth Rs {ranking[0].net_worth}." if ranking else "",
                f"{ranking[1].name} exits with net worth Rs {ranking[1].net_worth}." if len(ranking) > 1 else "",
                f"{ranking[2].name} is eliminated at Rs {ranking[2].net_worth}." if len(ranking) > 2 else "",
            ],
        )


def default_policy(observation: PendingTurnView, player: PlayerView) -> AgentStrategy:
    tile_kind = observation.projected_tile_kind
    if player.cash < 220:
        return "defensive"
    if tile_kind in {"property", "railroad", "utility"} and len(player.monopolies) > 0:
        return "upgrade"
    if tile_kind in {"chance", "community"}:
        return "value_invest"
    if len(player.owned_tiles) < 2:
        return "expand"
    return "value_invest"


def simulate_policy_match(
    policy_map: dict[str, Callable[[PendingTurnView, PlayerView], AgentStrategy]],
    seed: int = 11,
    max_turns: int = 220,
) -> RolloutView:
    env = MonopolySimulator(seed=seed, max_turns=max_turns)
    while not env.is_done():
        pending = env.pending_turn_view()
        if pending is None:
            break
        player = next(view for view in env.player_views() if view.id == pending.active_player_id)
        policy_fn = policy_map.get(player.id, default_policy)
        action = policy_fn(pending, player)
        env.play_turn(action)
    return env.rollout_view()


def simulate_policy_game(
    seed: int = 11,
    max_turns: int = 220,
    policy_fn: Callable[[PendingTurnView, PlayerView], AgentStrategy] = default_policy,
) -> RolloutView:
    policy_map = {profile["id"]: policy_fn for profile in PLAYER_PROFILES}
    return simulate_policy_match(policy_map=policy_map, seed=seed, max_turns=max_turns)
