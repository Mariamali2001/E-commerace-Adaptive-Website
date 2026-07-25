"""Adaptive decision engine — layered UI configuration assembly."""

from src.adaptive_engine.adaptive_engine import (
    AdaptationResult,
    UserContext,
    export_results,
    generate_random_contexts,
    run_adaptive_engine,
    run_batch_simulation,
)
from src.adaptive_engine.repository_loader import RepositoryBundle, load_repositories

__all__ = [
    "AdaptationResult",
    "RepositoryBundle",
    "UserContext",
    "export_results",
    "generate_random_contexts",
    "load_repositories",
    "run_adaptive_engine",
    "run_batch_simulation",
]
