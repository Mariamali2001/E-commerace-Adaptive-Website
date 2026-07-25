"""Build human-readable adaptation logs for thesis evaluation."""

from __future__ import annotations

from typing import Any


def short_label(value: str | None) -> str:
    """Shorten survey option text for display."""
    if value is None:
        return "Default"
    text = str(value).strip()
    if "(" in text:
        text = text.split("(", maxsplit=1)[0].strip()
    if len(text) > 2 and text[0].isdigit() and ". " in text[:4]:
        text = text.split(". ", maxsplit=1)[-1].strip()
    return text or "Default"


def build_adaptation_log(result: dict[str, Any]) -> dict[str, Any]:
    """Generate structured adaptation log with before/after entries."""
    entries: list[dict[str, Any]] = []

    device = result.get("context", {}).get("device")
    device_key = result.get("context", {}).get("device_defaults", "")
    entries.append(
        {
            "step": "Loaded Global Defaults",
            "layer": "defaults",
            "detail": "Merged global_defaults.json with base survey majority values.",
        }
    )
    entries.append(
        {
            "step": f"Loaded {device} Defaults",
            "layer": "device_defaults",
            "detail": f"Applied {device_key}.json on top of global defaults.",
            "device": device,
        }
    )

    for item in result.get("persona_applied", []):
        entries.append(
            {
                "step": "Applied Persona Override",
                "layer": "persona",
                "property": item.get("ui_element"),
                "before": short_label(item.get("previous")),
                "after": short_label(item.get("value")),
                "arrow": f"{short_label(item.get('previous'))} → {short_label(item.get('value'))}",
            }
        )

    for item in result.get("mood_applied", []):
        entries.append(
            {
                "step": "Applied Mood Override",
                "layer": "mood",
                "property": item.get("ui_element"),
                "before": short_label(item.get("previous")),
                "after": short_label(item.get("value")),
                "arrow": f"{short_label(item.get('previous'))} → {short_label(item.get('value'))}",
            }
        )

    for item in result.get("nudges_applied", []):
        if item.get("status") == "skipped":
            continue
        prop = item.get("property", "").replace("_", " ").title()
        before_idx = item.get("previous_index", 0)
        delta = item.get("delta", 0)
        entries.append(
            {
                "step": "Applied Personality Nudge",
                "layer": "trait_nudge",
                "property": prop,
                "ui_element": item.get("ui_element"),
                "before": str(before_idx),
                "after": f"{delta:+d}" if isinstance(delta, int) else str(delta),
                "arrow": f"{before_idx} → {delta:+d}" if isinstance(delta, int) else None,
                "trait": item.get("trait"),
                "level": item.get("level"),
            }
        )

    return {
        "context": result.get("context", {}),
        "pipeline": [
            "Detect Device",
            "Load Global Defaults",
            "Load Device Defaults",
            "Apply Persona Overrides",
            "Apply Mood Overrides",
            "Apply Personality Nudges",
            "Produce Final UI Configuration",
        ],
        "entries": entries,
        "summary": {
            "n_persona_overrides": len(result.get("persona_applied", [])),
            "n_mood_overrides": len(result.get("mood_applied", [])),
            "n_trait_nudges": len(
                [n for n in result.get("nudges_applied", []) if n.get("status") != "skipped"]
            ),
        },
    }


def format_log_text(adaptation_log: dict[str, Any]) -> str:
    """Render adaptation log as plain text for notebook display."""
    lines: list[str] = []
    for entry in adaptation_log.get("entries", []):
        step = entry.get("step", "")
        if entry.get("layer") in {"defaults", "device_defaults"}:
            lines.append(step)
            continue
        prop = entry.get("property", entry.get("ui_element", ""))
        before = entry.get("before", "")
        after = entry.get("after", "")
        lines.append(step)
        lines.append(f"  {prop}")
        lines.append(f"  {before}")
        lines.append("  ↓")
        lines.append(f"  {after}")
        lines.append("")
    return "\n".join(lines).strip()
