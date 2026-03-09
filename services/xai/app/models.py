"""
Model transparency: interpretable decision tree and logistic regression for triage-like severity.
Trained on minimal synthetic symptom features so we can expose structure and coefficients.
"""
import numpy as np
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

# Feature names used across XAI (symptom / clinical indicators)
FEATURE_NAMES = [
    "fever", "cough", "pain", "breathing_difficulty", "bleeding",
    "consciousness", "duration_days", "severity_self_report",
]
SEVERITY_CLASSES = ["low", "medium", "high", "emergency"]
N_FEATURES = len(FEATURE_NAMES)
N_CLASSES = len(SEVERITY_CLASSES)


def _synthetic_data(n: int = 200, seed: int = 42):
    """Minimal synthetic data to train interpretable models."""
    rng = np.random.default_rng(seed)
    X = rng.integers(0, 3, size=(n, N_FEATURES)).astype(np.float64)
    # Simple rules: breathing + bleeding -> emergency; fever+cough -> medium; etc.
    y = np.zeros(n, dtype=int)
    for i in range(n):
        if X[i, 3] >= 2 or X[i, 4] >= 2 or X[i, 5] >= 2:
            y[i] = 3  # emergency
        elif X[i, 0] >= 2 and X[i, 1] >= 1:
            y[i] = 2  # high
        elif X[i, 0] >= 1 or X[i, 1] >= 1 or X[i, 2] >= 1:
            y[i] = 1  # medium
        else:
            y[i] = 0  # low
    return X, y


def get_decision_tree():
    """Train and return a small decision tree (max_depth for transparency)."""
    X, y = _synthetic_data()
    clf = DecisionTreeClassifier(max_depth=5, random_state=42)
    clf.fit(X, y)
    return clf


def get_logistic_regression():
    """Train and return logistic regression with scaling."""
    X, y = _synthetic_data()
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    clf = LogisticRegression(max_iter=500, random_state=42)
    clf.fit(X_scaled, y)
    return clf, scaler


# Module-level models (lazy init to avoid import-time sklearn overhead)
_dt = None
_lr = None
_lr_scaler = None


def decision_tree():
    global _dt
    if _dt is None:
        _dt = get_decision_tree()
    return _dt


def logistic_regression():
    global _lr, _lr_scaler
    if _lr is None:
        _lr, _lr_scaler = get_logistic_regression()
    return _lr, _lr_scaler


def tree_structure(clf) -> dict:
    """Export tree structure for transparency (nodes, thresholds, features)."""
    from sklearn.tree import _tree
    tree = clf.tree_
    n_nodes = tree.node_count
    children_left = tree.children_left.tolist()
    children_right = tree.children_right.tolist()
    feature = tree.feature.tolist()
    threshold = tree.threshold.tolist()
    value = tree.value.tolist()
    nodes = []
    for i in range(n_nodes):
        nodes.append({
            "node_id": i,
            "left_child": int(children_left[i]),
            "right_child": int(children_right[i]),
            "feature_index": int(feature[i]),
            "feature_name": FEATURE_NAMES[int(feature[i])] if feature[i] >= 0 else None,
            "threshold": float(threshold[i]) if threshold[i] != _tree.TREE_UNDEFINED else None,
            "value": value[i][0].tolist(),
        })
    return {"n_nodes": n_nodes, "nodes": nodes, "feature_names": FEATURE_NAMES, "classes": SEVERITY_CLASSES}


def lr_coefficients(clf, scaler) -> dict:
    """Logistic regression coefficients and intercept for transparency."""
    coef = clf.coef_.tolist()
    intercept = clf.intercept_.tolist()
    return {
        "feature_names": FEATURE_NAMES,
        "classes": SEVERITY_CLASSES,
        "coefficients": [{"class": SEVERITY_CLASSES[k], "coefs": coef[k], "intercept": intercept[k]} for k in range(len(SEVERITY_CLASSES))],
    }
