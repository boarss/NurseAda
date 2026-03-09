"""
Imaging agent: medical image analysis via XAI (saliency, heatmaps).
Placeholder for radiology AI; wires to XAI saliency endpoint.
"""
import httpx
from app.agents.base import BaseAgent, AgentResult
from app.config import GATEWAY_XAI_URL
from app.services.verification import get_standard_disclaimer


class ImagingAgent(BaseAgent):
    @property
    def agent_id(self) -> str:
        return "imaging"

    @property
    def description(self) -> str:
        return "Medical image analysis (X-ray, CT, MRI) with saliency/heatmap support"

    async def execute(
        self,
        user_message: str,
        context: dict | None = None,
    ) -> AgentResult:
        context = context or {}
        image_url = context.get("image_url")
        image_base64 = context.get("image_base64")
        if image_base64 and not image_url:
            image_url = f"data:image/png;base64,{image_base64}" if "base64," not in image_base64 else image_base64

        if not GATEWAY_XAI_URL:
            return AgentResult(
                content="Medical imaging analysis is not configured. For image interpretation, please share your scan with a radiologist or healthcare provider."
                + get_standard_disclaimer(),
                agent_id=self.agent_id,
                sources=[],
            )

        # XAI saliency endpoint accepts image_url or features
        try:
            async with httpx.AsyncClient() as client:
                r = await client.post(
                    f"{GATEWAY_XAI_URL.rstrip('/')}/visualize/saliency",
                    json={
                        "image_url": image_url,
                        "features": None,
                    },
                    timeout=15.0,
                )
                if r.status_code == 200:
                    data = r.json()
                    if data.get("type") == "saliency_radiology" and data.get("status") == "placeholder":
                        msg = data.get("message", "Radiology saliency requires a trained vision model.")
                        return AgentResult(
                            content=f"**Imaging analysis**\n\n{msg}\n\nFor X-ray, CT, or MRI interpretation, please consult a radiologist or your healthcare provider. This tool provides symptom heatmaps for triage when you describe symptoms in text."
                            + get_standard_disclaimer(),
                            agent_id=self.agent_id,
                            sources=["XAI"],
                            metadata=data,
                        )
                    # Tabular/symptom heatmap
                    desc = data.get("description", "")
                    return AgentResult(
                        content=f"**Imaging/saliency output**\n\n{desc}\n\nUse the symptom checker to get feature importance for your described symptoms."
                        + get_standard_disclaimer(),
                        agent_id=self.agent_id,
                        sources=["XAI"],
                        metadata=data,
                    )
        except Exception:
            pass

        return AgentResult(
            content="I couldn't complete the imaging analysis right now. For scan interpretation, please consult a radiologist or healthcare provider."
            + get_standard_disclaimer(),
            agent_id=self.agent_id,
            sources=[],
        )
