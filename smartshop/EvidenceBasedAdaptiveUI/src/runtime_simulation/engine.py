"""Backward-compatible wrapper around the adaptive decision engine."""

from src.adaptive_engine.adaptive_engine import UserContext as RuntimeContext
from src.adaptive_engine.adaptive_engine import AdaptationResult as RuntimeSimulationResult
from src.adaptive_engine.adaptive_engine import run_adaptive_engine as simulate_adaptation
from src.adaptive_engine.repository_loader import load_repositories

__all__ = [
    "RuntimeContext",
    "RuntimeSimulationResult",
    "load_runtime_repository",
    "list_available_contexts",
    "run_runtime_simulation",
    "simulate_adaptation",
]


def load_runtime_repository(repository_dir):
    bundle, _ = load_repositories(repository_dir)
    if bundle is None:
        raise FileNotFoundError(f"Could not load repository from {repository_dir}")
    return {
        "global_defaults": bundle.global_defaults,
        "desktop_defaults": bundle.desktop_defaults,
        "mobile_defaults": bundle.mobile_defaults,
        "persona_lookup": bundle.persona_lookup,
        "mood_lookup": bundle.mood_lookup,
        "trait_lookup": bundle.trait_lookup,
        "_survey_path": bundle.survey_path,
    }


def list_available_contexts(repository_dir):
    bundle, _ = load_repositories(repository_dir)
    if bundle is None:
        return {}
    from src.adaptive_engine.override_engine import PERSONA_ALIASES

    return {
        "devices": ["Smartphone", "Desktop"],
        "personas": sorted(bundle.persona_lookup.keys()),
        "moods": sorted(bundle.mood_lookup.keys()),
        "traits": {
            trait: sorted(levels.keys())
            for trait, levels in bundle.trait_lookup.items()
        },
        "persona_aliases": PERSONA_ALIASES,
    }


def run_runtime_simulation(context, repository_dir, output_path=None):
    bundle, _ = load_repositories(repository_dir)
    if bundle is None:
        raise FileNotFoundError(f"Could not load repository from {repository_dir}")
    user_context = RuntimeContext(
        persona=context.persona or "",
        mood=context.mood or "",
        device=context.device,
        personality=context.personality,
    )
    result = simulate_adaptation(user_context, bundle)
    if output_path is not None:
        from src.adaptive_engine.adaptive_engine import export_results
        import json
        from pathlib import Path

        export_results(result, Path(output_path).parent)
        Path(output_path).write_text(
            json.dumps(
                {
                    "context": result.context,
                    "final_ui_configuration": result.raw_ui_configuration,
                    "trace": result.adaptation_log.get("entries", []),
                    "warnings": result.warnings,
                    "metadata": result.metadata,
                },
                indent=2,
                ensure_ascii=False,
            )
            + "\n",
            encoding="utf-8",
        )
    return result
