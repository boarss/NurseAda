"""
Visualisation tools: symptom heatmaps (feature importance) and saliency-style output for radiology.
"""
import base64
import io
import numpy as np
from app.models import FEATURE_NAMES, SEVERITY_CLASSES


def symptom_heatmap_data(feature_importance: dict | list) -> dict:
    """
    Build heatmap data for symptom/feature importance (for frontend or PNG).
    feature_importance: list of values per FEATURE_NAMES, or dict name -> value.
    """
    if isinstance(feature_importance, dict):
        values = [float(feature_importance.get(n, 0)) for n in FEATURE_NAMES]
    else:
        values = [float(x) for x in feature_importance[: len(FEATURE_NAMES)]]
    values = values + [0] * (len(FEATURE_NAMES) - len(values))
    return {
        "type": "symptom_heatmap",
        "feature_names": FEATURE_NAMES,
        "values": values,
        "description": "Feature contribution to the prediction (higher = more influence).",
    }


def symptom_heatmap_png(feature_importance: dict | list) -> str:
    """Render a simple horizontal bar heatmap as PNG; return base64."""
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except ImportError:
        return ""
    data = symptom_heatmap_data(feature_importance)
    vals = np.array(data["values"])
    names = data["feature_names"]
    fig, ax = plt.subplots(figsize=(6, max(3, len(names) * 0.35)))
    colors = plt.cm.RdYlGn_r((vals - vals.min()) / (vals.max() - vals.min() + 1e-8))
    ax.barh(names, vals, color=colors)
    ax.set_xlabel("Importance / contribution")
    ax.set_title("Symptom / feature importance (XAI)")
    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format="png", dpi=100, bbox_inches="tight")
    plt.close()
    buf.seek(0)
    return base64.b64encode(buf.read()).decode("utf-8")


def saliency_map_tabular(feature_importance: dict | list) -> dict:
    """
    Saliency-style map for tabular/clinical data (same as heatmap; for API consistency).
    For radiology images, a future endpoint would accept image and return pixel-wise saliency.
    """
    return {
        **symptom_heatmap_data(feature_importance),
        "type": "saliency_tabular",
        "description": "Saliency-style feature importance for this prediction.",
    }


def saliency_map_radiology_placeholder(image_url: str | None = None, shape: tuple = (64, 64)) -> dict:
    """
    Placeholder for radiology saliency: return a dummy grid or message.
    In production, wire to a vision model (e.g. Grad-CAM) for real saliency maps.
    """
    h, w = shape
    return {
        "type": "saliency_radiology",
        "status": "placeholder",
        "message": "Radiology saliency requires an image and a trained vision model (e.g. Grad-CAM). Use symptom_heatmap for tabular triage.",
        "shape": [h, w],
        "image_url_provided": bool(image_url),
    }
