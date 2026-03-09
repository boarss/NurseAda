"""
Post-hoc explanations: SHAP and LIME for individual predictions.
"""
import numpy as np
from app.models import (
    FEATURE_NAMES,
    SEVERITY_CLASSES,
    decision_tree,
    logistic_regression,
    _synthetic_data,
    N_FEATURES,
)

# Lazy init
_shap_explainer_dt = None
_lime_explainer = None
_X_background = None


def _get_background():
    global _X_background
    if _X_background is None:
        X, _ = _synthetic_data(50)
        _X_background = X
    return _X_background


def shap_values_dt(instance: np.ndarray) -> dict:
    """SHAP values for decision tree prediction (exact)."""
    import shap
    global _shap_explainer_dt
    if _shap_explainer_dt is None:
        clf = decision_tree()
        _shap_explainer_dt = shap.TreeExplainer(clf)
    X_bg = _get_background()
    instance_2d = instance.reshape(1, -1) if instance.ndim == 1 else instance
    sv = _shap_explainer_dt.shap_values(instance_2d)
    # TreeExplainer returns list per class for multi-class
    if isinstance(sv, list):
        pred_class = decision_tree().predict(instance_2d)[0]
        values = sv[pred_class][0].tolist()
    else:
        values = sv[0].tolist()
    return {
        "feature_names": FEATURE_NAMES,
        "shap_values": values,
        "prediction_class": int(decision_tree().predict(instance_2d)[0]),
        "prediction_label": SEVERITY_CLASSES[int(decision_tree().predict(instance_2d)[0])],
    }


def lime_explanation(instance: np.ndarray, model_type: str = "tree") -> dict:
    """LIME local explanation for one instance."""
    from lime import lime_tabular
    X_bg = _get_background()
    if model_type == "tree":
        clf = decision_tree()
        predict_fn = clf.predict_proba
    else:
        clf, scaler = logistic_regression()
        predict_fn = lambda x: clf.predict_proba(scaler.transform(x))
    global _lime_explainer
    if _lime_explainer is None:
        _lime_explainer = lime_tabular.LimeTabularExplainer(
            X_bg,
            feature_names=FEATURE_NAMES,
            class_names=SEVERITY_CLASSES,
            mode="classification",
        )
    instance_2d = instance.reshape(1, -1) if instance.ndim == 1 else instance
    exp = _lime_explainer.explain_instance(instance_2d[0], predict_fn, num_features=min(8, N_FEATURES))
    # Export as list of (feature, weight) for positive class (predicted)
    pred = clf.predict(instance_2d)[0]
    feats = exp.as_list(label=int(pred))
    return {
        "feature_names": FEATURE_NAMES,
        "prediction_class": int(pred),
        "prediction_label": SEVERITY_CLASSES[int(pred)],
        "local_importance": [{"feature": f[0], "weight": float(f[1])} for f in feats],
    }


def feature_vector_from_symptoms(symptom_flags: dict) -> np.ndarray:
    """Map symptom keys to fixed-length feature vector for FEATURE_NAMES."""
    vec = np.zeros(len(FEATURE_NAMES))
    name_lower = {n.lower(): i for i, n in enumerate(FEATURE_NAMES)}
    for name, val in (symptom_flags or {}).items():
        idx = name_lower.get(str(name).lower().replace(" ", "_"))
        if idx is not None:
            vec[idx] = float(val) if isinstance(val, (int, float)) else 1.0
    return vec
