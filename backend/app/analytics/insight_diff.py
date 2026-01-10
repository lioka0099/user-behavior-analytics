"""
Rule-Based Insight Comparison Engine

This module provides deterministic comparison between two analytics snapshots.
All comparisons are rule-based (no LLM) - we compute factual differences only.
The LLM layer (in generator.py) is used separately to EXPLAIN these differences.

Key principle: Analytics are deterministic and testable.
"""

from typing import Dict, List, Any, Optional


def compare_snapshots(prev_snapshot: dict, curr_snapshot: dict) -> dict:
    """
    Compare two analytics snapshots and return structured diff.
    
    Args:
        prev_snapshot: The older analytics snapshot
        curr_snapshot: The newer analytics snapshot
    
    Returns:
        A dict containing:
        - metrics_changed: Detailed changes for each metric
        - issues: List of detected problems
        - improvements: List of detected improvements
        - overall_trend: "improving", "degrading", or "stable"
    """
    changes = {}
    issues = []
    improvements = []

    # 1. Conversion Rate Comparison
    _compare_conversion_rate(prev_snapshot, curr_snapshot, changes, issues, improvements)
    
    # 2. Drop-off Rates Comparison
    _compare_dropoff_rates(prev_snapshot, curr_snapshot, changes, issues, improvements)
    
    # 3. Time-to-Complete Comparison
    _compare_time_to_complete(prev_snapshot, curr_snapshot, changes, issues, improvements)
    
    # 4. Path Diversity Comparison
    _compare_path_diversity(prev_snapshot, curr_snapshot, changes, issues, improvements)
    
    # 5. Error Frequency Comparison
    _compare_error_count(prev_snapshot, curr_snapshot, changes, issues, improvements)

    return {
        "metrics_changed": changes,
        "issues": issues,
        "improvements": improvements,
        "overall_trend": _determine_trend(issues, improvements)
    }


def _compare_conversion_rate(
    prev: dict, curr: dict, 
    changes: dict, issues: list, improvements: list
) -> None:
    """Compare conversion rates between snapshots."""
    prev_rate = prev.get("conversion_rate")
    curr_rate = curr.get("conversion_rate")
    
    if prev_rate is None or curr_rate is None:
        return
    
    delta = curr_rate - prev_rate
    delta_percent = (delta / prev_rate * 100) if prev_rate > 0 else None
    
    changes["conversion_rate"] = {
        "previous": round(prev_rate, 4),
        "current": round(curr_rate, 4),
        "delta": round(delta, 4),
        "delta_percent": round(delta_percent, 2) if delta_percent else None
    }
    
    # Threshold: 5% change is significant
    if delta < -0.05:
        issues.append(f"Conversion rate dropped by {abs(delta):.1%}")
    elif delta > 0.05:
        improvements.append(f"Conversion rate improved by {delta:.1%}")


def _compare_dropoff_rates(
    prev: dict, curr: dict,
    changes: dict, issues: list, improvements: list
) -> None:
    """Compare drop-off rates at each funnel step."""
    prev_dropoff = prev.get("dropoff_rates", {})
    curr_dropoff = curr.get("dropoff_rates", {})
    
    if not prev_dropoff and not curr_dropoff:
        return
    
    dropoff_changes = {}
    
    # Compare each step that exists in current snapshot
    for step, curr_rate in curr_dropoff.items():
        prev_rate = prev_dropoff.get(step)
        
        if prev_rate is None:
            # New step, skip comparison
            continue
        
        delta = curr_rate - prev_rate
        
        # Only record if change is significant (> 3%)
        if abs(delta) > 0.03:
            dropoff_changes[step] = {
                "previous": round(prev_rate, 4),
                "current": round(curr_rate, 4),
                "delta": round(delta, 4)
            }
            
            # Threshold: 5% change triggers issue/improvement
            if delta > 0.05:
                issues.append(f"Drop-off at '{step}' increased by {delta:.1%}")
            elif delta < -0.05:
                improvements.append(f"Drop-off at '{step}' decreased by {abs(delta):.1%}")
    
    if dropoff_changes:
        changes["dropoff_rates"] = dropoff_changes


def _compare_time_to_complete(
    prev: dict, curr: dict,
    changes: dict, issues: list, improvements: list
) -> None:
    """Compare average time-to-complete metrics."""
    prev_time = prev.get("avg_time_to_complete_ms")
    curr_time = curr.get("avg_time_to_complete_ms")
    
    if prev_time is None or curr_time is None:
        return
    
    delta_ms = curr_time - prev_time
    delta_percent = (delta_ms / prev_time * 100) if prev_time > 0 else None
    
    changes["time_to_complete"] = {
        "previous_ms": prev_time,
        "current_ms": curr_time,
        "delta_ms": delta_ms,
        "delta_percent": round(delta_percent, 2) if delta_percent else None
    }
    
    # Threshold: 5 seconds (5000ms) change is significant
    if delta_ms > 5000:
        issues.append(f"Time-to-complete increased by {delta_ms/1000:.1f}s")
    elif delta_ms < -5000:
        improvements.append(f"Time-to-complete decreased by {abs(delta_ms)/1000:.1f}s")


def _compare_path_diversity(
    prev: dict, curr: dict,
    changes: dict, issues: list, improvements: list
) -> None:
    """Compare path diversity (number of unique paths)."""
    prev_paths = prev.get("unique_paths", 0)
    curr_paths = curr.get("unique_paths", 0)
    
    if prev_paths == 0 and curr_paths == 0:
        return
    
    changes["path_diversity"] = {
        "previous": prev_paths,
        "current": curr_paths
    }
    
    # More paths = more fragmented user behavior (usually bad)
    # Fewer paths = more focused user behavior (usually good)
    if prev_paths > 0:
        if curr_paths > prev_paths * 1.5:
            issues.append("User paths becoming more fragmented")
        elif curr_paths < prev_paths * 0.7:
            improvements.append("User paths becoming more focused")


def _compare_error_count(
    prev: dict, curr: dict,
    changes: dict, issues: list, improvements: list
) -> None:
    """Compare error event counts."""
    prev_errors = prev.get("error_count", 0)
    curr_errors = curr.get("error_count", 0)
    
    if prev_errors == 0 and curr_errors == 0:
        return
    
    changes["error_count"] = {
        "previous": prev_errors,
        "current": curr_errors
    }
    
    if curr_errors > prev_errors:
        issues.append(f"Error events increased from {prev_errors} to {curr_errors}")
    elif curr_errors < prev_errors and prev_errors > 0:
        improvements.append(f"Error events decreased from {prev_errors} to {curr_errors}")


def _determine_trend(issues: list, improvements: list) -> str:
    """
    Determine overall behavior trend based on issues vs improvements.
    
    Logic:
    - If improvements outnumber issues by 2+: "improving"
    - If issues outnumber improvements by 2+: "degrading"
    - Otherwise: "stable"
    """
    improvement_count = len(improvements)
    issue_count = len(issues)
    
    if improvement_count > issue_count + 1:
        return "improving"
    elif issue_count > improvement_count + 1:
        return "degrading"
    else:
        return "stable"