"""Tests for XAI SHAP explainers."""
import numpy as np

from app.explainers import shap_values_dt, shap_values_lr
from app.models import FEATURE_NAMES, N_FEATURES


def test_shap_values_dt_returns_structure():
    vec = np.zeros(N_FEATURES, dtype=float)
    vec[0] = 2.0
    out = shap_values_dt(vec)
    assert out["feature_names"] == FEATURE_NAMES
    assert len(out["shap_values"]) == N_FEATURES
    assert out["prediction_label"] in ("low", "medium", "high", "emergency")


def test_shap_values_lr_returns_structure():
    vec = np.ones(N_FEATURES, dtype=float)
    out = shap_values_lr(vec)
    assert out["feature_names"] == FEATURE_NAMES
    assert len(out["shap_values"]) == N_FEATURES
    assert out.get("model") == "logistic"
    assert out["prediction_label"] in ("low", "medium", "high", "emergency")
