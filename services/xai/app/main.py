"""
NurseAda XAI service: model transparency (DT, LR), post-hoc explanations (SHAP, LIME), visualisation (heatmaps, saliency).
"""
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import numpy as np

from app.models import (
    FEATURE_NAMES,
    SEVERITY_CLASSES,
    decision_tree,
    logistic_regression,
    tree_structure,
    lr_coefficients,
)
from app.explainers import shap_values_dt, lime_explanation, feature_vector_from_symptoms
from app.visualize import symptom_heatmap_data, symptom_heatmap_png, saliency_map_tabular, saliency_map_radiology_placeholder

app = FastAPI(
    title="NurseAda XAI",
    description="Explainable AI: transparent models, SHAP/LIME, heatmaps and saliency",
    version="0.1.0",
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "xai"}


# ---------- Model transparency ----------

class PredictTransparentRequest(BaseModel):
    features: dict = {}  # symptom name -> value (0-2 or float)


@app.get("/model/decision-tree/structure")
def get_decision_tree_structure():
    """Expose decision tree structure for model transparency."""
    clf = decision_tree()
    return tree_structure(clf)


@app.get("/model/logistic-regression/coefficients")
def get_lr_coefficients():
    """Expose logistic regression coefficients for model transparency."""
    clf, scaler = logistic_regression()
    return lr_coefficients(clf, scaler)


@app.post("/predict/transparent")
def predict_transparent(req: PredictTransparentRequest):
    """Predict severity using interpretable model; return prediction and short explanation."""
    vec = feature_vector_from_symptoms(req.features)
    vec = np.asarray(vec, dtype=np.float64).flatten()
    if len(vec) != len(FEATURE_NAMES):
        vec = np.zeros(len(FEATURE_NAMES))
        for i, name in enumerate(FEATURE_NAMES):
            vec[i] = req.features.get(name, req.features.get(name.replace("_", " "), 0))
    vec = vec.reshape(1, -1)
    clf = decision_tree()
    pred = int(clf.predict(vec)[0])
    proba = clf.predict_proba(vec)[0].tolist()
    return {
        "prediction": SEVERITY_CLASSES[pred],
        "prediction_index": pred,
        "probabilities": {SEVERITY_CLASSES[i]: proba[i] for i in range(len(SEVERITY_CLASSES))},
        "model": "decision_tree",
        "explanation": f"Decision tree prediction: {SEVERITY_CLASSES[pred]} (interpretable path available via GET /model/decision-tree/structure).",
    }


# ---------- Post-hoc explanations ----------

class ExplainRequest(BaseModel):
    features: dict = {}
    model_type: str = "tree"  # tree | logistic


@app.post("/explain/shap")
def explain_shap(req: ExplainRequest):
    """SHAP values for the given instance (feature contribution to prediction)."""
    vec = feature_vector_from_symptoms(req.features)
    if vec.ndim == 1:
        vec = vec.reshape(1, -1)
    try:
        out = shap_values_dt(vec[0])
        return out
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/explain/lime")
def explain_lime(req: ExplainRequest):
    """LIME local explanation for the given instance."""
    vec = feature_vector_from_symptoms(req.features)
    try:
        out = lime_explanation(vec, model_type=req.model_type)
        return out
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------- Visualisation ----------

class HeatmapRequest(BaseModel):
    feature_importance: dict | list  # dict name->value or list of values
    format: str = "json"  # json | png_base64


@app.post("/visualize/symptom-heatmap")
def visualize_symptom_heatmap(req: HeatmapRequest):
    """Symptom/feature importance as heatmap data or PNG (base64)."""
    if req.format == "png_base64":
        b64 = symptom_heatmap_png(req.feature_importance)
        return {"format": "png_base64", "image": b64}
    return symptom_heatmap_data(req.feature_importance)


class SaliencyRequest(BaseModel):
    image_url: str | None = None
    features: dict | None = None


@app.post("/visualize/saliency")
def visualize_saliency(req: SaliencyRequest):
    """Saliency-style map: tabular (from features) or placeholder for radiology."""
    features = req.features
    image_url = req.image_url
    if features:
        vec = feature_vector_from_symptoms(features or {})
        try:
            sh = shap_values_dt(vec)
            return saliency_map_tabular(sh["shap_values"])
        except Exception:
            return saliency_map_tabular(features)
    return saliency_map_radiology_placeholder(image_url)


@app.get("/")
def root():
    return {"service": "nurseada-xai", "docs": "/docs"}
