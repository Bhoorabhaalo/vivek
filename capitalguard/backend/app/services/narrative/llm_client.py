from anthropic import Anthropic
import json
from typing import Dict, List, Any
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


class NarrativeService:
    def __init__(self):
        self.api_key = settings.ANTHROPIC_API_KEY
        self.client = Anthropic(api_key=self.api_key) if self.api_key else None
        # Using the latest standard Sonnet identifier
        self.model = "claude-3-5-sonnet-20241022"

    def _generate(self, prompt: str,
                  system: str = "You are a financial risk analyst AI.") -> str:
        if not self.client:
            logger.warning(
                "Anthropic API key not set. Returning simulated narrative.")
            return "[SIMULATED AI COMMENTARY - NO API KEY] Analysis complete based on provided data."

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1000,
                system=system,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.content[0].text
        except Exception as e:
            logger.error(f"LLM API Error: {e}")
            return "[AI NARRATIVE ERROR] Failed to generate commentary."

    def generate_decision_narrative(
            self, metric: str, value: float, threshold: float, tier: int, action: str) -> str:
        """Use Case 1: Decision narrative generation"""
        sys_prompt = "You are the CapitalGuard Risk Engine Explainer. Be concise, direct, and explain the 'why' and 'what happens next' to a CFO. Label as AI-generated."
        prompt = f"""
        A rule has been triggered in the risk engine:
        Metric: {metric}
        Current Value: {value}
        Threshold: {threshold}
        Tier: {tier} (1=Watch, 2=Warn, 3=Auto-Act, 4=Halt)
        Action Taken/Proposed: {action}

        Write a 1-2 sentence explanation of this event and its implication.
        """
        return self._generate(prompt, sys_prompt)

    def generate_stress_test_summary(
            self, scenario_name: str, baseline_value: float, shocked_value: float, impact_pct: float) -> str:
        """Use Case 2: Post-stress-test summary"""
        sys_prompt = "You are a risk manager. Provide a 3-4 sentence executive summary. Must be labeled 'AI-generated commentary, not financial advice'."
        prompt = f"""
        Scenario run: {scenario_name}
        Baseline Portfolio Value: ${baseline_value:,.2f}
        Shocked Portfolio Value: ${shocked_value:,.2f}
        Impact: {impact_pct * 100:.2f}%

        Summarize the portfolio vulnerability shown by this test.
        """
        return self._generate(prompt, sys_prompt)

    def translate_qualitative_view(
            self, user_view: str, assets: List[str]) -> Dict[str, float]:
        """Use Case 4: View to Vector translation for Black-Litterman"""
        if not self.client:
            # Fallback mock for demo without key
            return {a: 0.05 for a in assets}

        sys_prompt = """
        You translate qualitative market views into quantitative expected return vectors.
        Output ONLY a JSON object mapping asset IDs to their expected annual return decimal (e.g. {"AAPL": 0.08, "BOND": 0.04}).
        No markdown, no explanation.
        """
        prompt = f"Assets available: {assets}\nUser View: {user_view}"

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=300,
                system=sys_prompt,
                messages=[{"role": "user", "content": prompt}]
            )
            text = response.content[0].text
            return json.loads(text)
        except Exception as e:
            logger.error(f"View translation failed: {e}")
            return {a: 0.0 for a in assets}

    def synthesize_audit_query(self, query: str,
                               retrieved_decisions: List[Dict]) -> str:
        """Use Case 3: Natural-language query over audit log"""
        sys_prompt = "You are an audit assistant. Answer the user's question based strictly on the provided decision logs. Do not invent details."
        prompt = f"User Query: {query}\n\nDecision Logs:\n{
            json.dumps(
                retrieved_decisions,
                indent=2)}"
        return self._generate(prompt, sys_prompt)

    def draft_anomaly_hypothesis(self, recent_metrics: Dict[str, Any]) -> str:
        """Use Case 5: Anomaly hypothesis drafting"""
        sys_prompt = "You are a quant analyst. Draft a brief hypothesis for what market regime shift might be occurring based on these metrics. Start with 'Hypothesis, not fact:'."
        prompt = f"Recent Metrics:\n{json.dumps(recent_metrics, indent=2)}"
        return self._generate(prompt, sys_prompt)

    def generate_triage_digest(self, alerts: List[Dict]) -> str:
        """Use Case 6: Alert-triage digest"""
        sys_prompt = "You are an alert triage system. Group and prioritize these alerts into a natural-language summary for the portfolio manager."
        prompt = f"Alerts:\n{json.dumps(alerts, indent=2)}"
        return self._generate(prompt, sys_prompt)


narrative_service = NarrativeService()
