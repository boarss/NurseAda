"""
Explain agent: XAI - model transparency, SHAP/LIME, heatmaps/saliency.
Handles "why", "explain", "how did you decide", "show reasoning" and fetches explanations from XAI service.
"""
import httpx
from app.agents.base import BaseAgent, AgentResult
from app.config import GATEWAY_XAI_URL
from app.services.verification import get_standard_disclaimer


def _symptoms_from_context(context: dict) -> dict:
    """Build symptom feature dict from conversation or last prediction context."""
    # Prefer resolved_codes or xai_features from context (set by triage when it called XAI)
    features = context.get("xai_features") or context.get("resolved_codes")
    if isinstance(features, list):
        return {f.get("display", f.get("name", str(i))): 1 for i, f in enumerate(features) if isinstance(f, dict)}
    if isinstance(features, dict):
        return features
    # Default: generic symptom vector for demo
    return {"fever": 1, "cough": 0, "pain": 1, "breathing_difficulty": 0, "bleeding": 0, "consciousness": 1, "duration_days": 1, "severity_self_report": 1}


class ExplainAgent(BaseAgent):
    @property
    def agent_id(self) -> str:
        return "explain"

    @property
    def description(self) -> str:
        return "Explainability: why a recommendation was made (SHAP, LIME, heatmaps)"

    async def execute(
        self,
        user_message: str,
        context: dict | None = None,
    ) -> AgentResult:
        context = context or {}
        features = _symptoms_from_context(context)

        if not GATEWAY_XAI_URL:
            return AgentResult(
                content="Explainability (XAI) is not configured. I can't show model transparency or SHAP/LIME explanations right now. You can ask your care provider to explain how a recommendation was reached."
                + get_standard_disclaimer(),
                agent_id=self.agent_id,
            )

        base = GATEWAY_XAI_URL.rstrip("/")
        parts = []

        try:
            async with httpx.AsyncClient() as client:
                # 1) Transparent model prediction
                r_pred = await client.post(
                    f"{base}/predict/transparent",
                    json={"features": features},
                    timeout=10.0,
                )
                if r_pred.status_code == 200:
                    pred = r_pred.json()
                    parts.append(
                        f"**Transparent model:** Our interpretable model (decision tree) predicts **{pred.get('prediction', 'N/A')}** for these symptoms. "
                        f"Probabilities: {pred.get('probabilities', {})}."
                    )

                # 2) SHAP (feature contribution)
                r_shap = await client.post(
                    f"{base}/explain/shap",
                    json={"features": features, "model_type": "tree"},
                    timeout=15.0,
                )
                if r_shap.status_code == 200:
                    sh = r_shap.json()
                    vals = sh.get("shap_values", [])
                    names = sh.get("feature_names", [])
                    if vals and names:
                        top = sorted(zip(names, vals), key=lambda x: abs(x[1]), reverse=True)[:5]
                        parts.append(
                            "**SHAP (feature contribution):** " + "; ".join(f"{n}={v:.2f}" for n, v in top) + "."
                        )

                # 3) LIME (local explanation)
                r_lime = await client.post(
                    f"{base}/explain/lime",
                    json={"features": features, "model_type": "tree"},
                    timeout=15.0,
                )
                if r_lime.status_code == 200:
                    lm = r_lime.json()
                    local = lm.get("local_importance", [])[:5]
                    if local:
                        parts.append(
                            "**LIME (local explanation):** " + ", ".join(f"{f.get('feature')} (weight {f.get('weight', 0):.2f})" for f in local) + "."
                        )

                # 4) Heatmap available via API
                parts.append("Symptom heatmap data is available from the XAI service (GET /visualize/symptom-heatmap with SHAP values). For radiology, saliency maps require an image and a vision model.")
        except Exception as e:
            return AgentResult(
                content="I couldn't reach the explainability service. Please try again or ask your provider for an explanation of your recommendation."
                + get_standard_disclaimer(),
                agent_id=self.agent_id,
            )

        content = " ".join(parts) if parts else "No explanation data could be retrieved."
        content += get_standard_disclaimer()
        return AgentResult(
            content=content,
            agent_id=self.agent_id,
            sources=["XAI"],
        )
