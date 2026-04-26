# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.

"""Static board and card data for the Monopoly environment."""

from dataclasses import dataclass


@dataclass(frozen=True)
class TileTemplate:
    index: int
    name: str
    kind: str
    price: int = 0
    base_rent: int = 0
    group: str | None = None
    color: str | None = None
    upgrade_cost: int = 0


PLAYER_PROFILES = [
    {
        "id": "aarya",
        "name": "Aarya",
        "token": "elephant",
        "color": "#f97316",
        "policy_type": "baseline",
        "policy_label": "Heuristic Baseline",
    },
    {
        "id": "kabir",
        "name": "Kabir",
        "token": "tiger",
        "color": "#06b6d4",
        "policy_type": "trained",
        "policy_label": "RL Policy Alpha",
    },
    {
        "id": "meera",
        "name": "Meera",
        "token": "peacock",
        "color": "#22c55e",
        "policy_type": "trained",
        "policy_label": "RL Policy Beta",
    },
]


BOARD_TEMPLATES = [
    TileTemplate(0, "Go", "go"),
    TileTemplate(1, "Mumbai", "property", 60, 8, "coastal", "#8b5cf6", 50),
    TileTemplate(2, "Community Chest", "community"),
    TileTemplate(3, "Delhi", "property", 70, 10, "coastal", "#8b5cf6", 50),
    TileTemplate(4, "Income Tax", "tax", price=120),
    TileTemplate(5, "Konkan Railway", "railroad", 200, 25, "railroad", "#111827"),
    TileTemplate(6, "Bengaluru", "property", 100, 12, "tech", "#3b82f6", 50),
    TileTemplate(7, "Chance", "chance"),
    TileTemplate(8, "Hyderabad", "property", 100, 12, "tech", "#3b82f6", 50),
    TileTemplate(9, "Chennai", "property", 120, 14, "tech", "#3b82f6", 50),
    TileTemplate(10, "Jail", "jail"),
    TileTemplate(11, "Jaipur", "property", 140, 16, "heritage", "#ec4899", 100),
    TileTemplate(12, "National Grid", "utility", 150, 30, "utility", "#f59e0b"),
    TileTemplate(13, "Ahmedabad", "property", 140, 16, "heritage", "#ec4899", 100),
    TileTemplate(14, "Pune", "property", 160, 18, "heritage", "#ec4899", 100),
    TileTemplate(15, "Rajdhani Express", "railroad", 200, 25, "railroad", "#111827"),
    TileTemplate(16, "Kochi", "property", 180, 20, "coastline", "#f97316", 100),
    TileTemplate(17, "Community Chest", "community"),
    TileTemplate(18, "Kolkata", "property", 180, 20, "coastline", "#f97316", 100),
    TileTemplate(19, "Lucknow", "property", 200, 22, "coastline", "#f97316", 100),
    TileTemplate(20, "Free Parking", "free_parking"),
    TileTemplate(21, "Goa", "property", 220, 24, "tourism", "#ef4444", 150),
    TileTemplate(22, "Chance", "chance"),
    TileTemplate(23, "Chandigarh", "property", 220, 24, "tourism", "#ef4444", 150),
    TileTemplate(24, "Surat", "property", 240, 26, "tourism", "#ef4444", 150),
    TileTemplate(25, "Deccan Queen", "railroad", 200, 25, "railroad", "#111827"),
    TileTemplate(26, "Bhopal", "property", 260, 28, "capital", "#eab308", 150),
    TileTemplate(27, "Indore", "property", 260, 28, "capital", "#eab308", 150),
    TileTemplate(28, "Cauvery Water Works", "utility", 150, 30, "utility", "#f59e0b"),
    TileTemplate(29, "Patna", "property", 280, 30, "capital", "#eab308", 150),
    TileTemplate(30, "Go To Jail", "go_to_jail"),
    TileTemplate(31, "Bhubaneswar", "property", 300, 32, "frontier", "#10b981", 200),
    TileTemplate(32, "Ranchi", "property", 300, 32, "frontier", "#10b981", 200),
    TileTemplate(33, "Community Chest", "community"),
    TileTemplate(34, "Guwahati", "property", 320, 34, "frontier", "#10b981", 200),
    TileTemplate(35, "Shatabdi Express", "railroad", 200, 25, "railroad", "#111827"),
    TileTemplate(36, "Chance", "chance"),
    TileTemplate(37, "Srinagar", "property", 350, 38, "summit", "#0ea5e9", 200),
    TileTemplate(38, "Luxury Tax", "tax", price=150),
    TileTemplate(39, "Leh", "property", 400, 45, "summit", "#0ea5e9", 200),
]


CHANCE_CARDS = [
    {"label": "IPL sponsorship lands. Collect Rs 140.", "cash": 140},
    {"label": "Audit penalty. Pay Rs 90.", "cash": -90},
    {"label": "Metro expansion moves you to Delhi.", "move_to": 3},
    {"label": "Weekend in Goa. Advance to Goa.", "move_to": 21},
    {"label": "Cyber fraud alert. Go to Jail.", "goto_jail": True},
    {"label": "High-speed corridor bonus. Move to next railroad.", "move_to_next": "railroad"},
]


COMMUNITY_CARDS = [
    {"label": "Festival bonus. Collect Rs 100.", "cash": 100},
    {"label": "Emergency repairs. Pay Rs 70.", "cash": -70},
    {"label": "Property tax rebate. Collect Rs 80.", "cash": 80},
    {"label": "Family trip to Chennai. Advance to Chennai.", "move_to": 9},
    {"label": "Jail visit paperwork. Go to Jail.", "goto_jail": True},
    {"label": "Infrastructure grant. Collect Rs 150.", "cash": 150},
]
