# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.

"""FastAPI application for the Monopoly OpenEnv environment."""

from functools import lru_cache
from pathlib import Path

try:
    from openenv.core.env_server.http_server import create_app
except Exception as e:  # pragma: no cover
    raise ImportError(
        "openenv is required for the web interface. Install dependencies with '\n    uv sync\n'"
    ) from e

from fastapi.middleware.cors import CORSMiddleware

try:
    from ..models import MonopolyAction, MonopolyObservation
    from ..training import build_showcase_bundle
    from .monopoly_env_environment import MonopolyEnvironment
except ModuleNotFoundError:
    from models import MonopolyAction, MonopolyObservation
    from training import build_showcase_bundle
    from server.monopoly_env_environment import MonopolyEnvironment


app = create_app(
    MonopolyEnvironment,
    MonopolyAction,
    MonopolyObservation,
    env_name="monopoly_env",
    max_concurrent_envs=6,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz")
def healthz() -> dict[str, bool]:
    return {"ok": True}


@lru_cache(maxsize=1)
def cached_demo_bundle() -> dict:
    demo_dir = Path(__file__).resolve().parents[1] / "outputs" / "demo"
    rollout_path = demo_dir / "best_rollout.json"
    metrics_path = demo_dir / "training_metrics.json"
    if rollout_path.exists() and metrics_path.exists():
        import json

        return {
            "best_rollout": json.loads(rollout_path.read_text(encoding="utf-8")),
            "training_metrics": json.loads(metrics_path.read_text(encoding="utf-8")),
        }
    return build_showcase_bundle()


@app.get("/demo/rollout")
def demo_rollout():
    return cached_demo_bundle()["best_rollout"]


@app.get("/demo/metrics")
def demo_metrics():
    return cached_demo_bundle()["training_metrics"]


def main() -> None:
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)


if __name__ == "__main__":
    main()
