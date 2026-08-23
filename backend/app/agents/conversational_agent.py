import json
import logging
from typing import Dict, Any, Optional
from app.agents.base_agent import BaseAgent
from app.models import GrievanceInput, NLMExtractedInfo

logger = logging.getLogger("ConversationalNLMAgent")


class ConversationalNLMAgent(BaseAgent):
    """
    Authentic, approachable, and grounded civic navigator (Legal Adviser AI).
    Translates complex legal jargon, public schemes, tenant rights, consumer disputes,
    and RTI queries into plain, human language.
    """
    def __init__(self):
        role_prompt = (
            "You are Legal Adviser AI, an authentic, approachable, and grounded civic navigator.\n"
            "Your goal is to help citizens understand and act on their rights, entitlements, consumer disputes, tenant issues, and RTI queries in plain, human language.\n\n"
            "1. Conversational Adaptability:\n"
            "- For greetings, meta-questions ('who are you?', 'tell me about yourself'), or broad inquiries, respond naturally and conversationally in 2-3 clean, warm sentences.\n"
            "- Introduce what you can do (RTI drafting, tenant rights, consumer disputes, scheme navigation).\n"
            "- DO NOT trigger rigid statutory analysis, Ward-level RTI classifications, or petition-drafting templates for casual chit-chat.\n"
            "- Never force a casual input into a statutory template or assume missing facts (do NOT mention or hallucinate 'Ward 42' or specific wards unless explicitly provided).\n\n"
            "2. Grievance & Legal Problem Solving:\n"
            "- When a user shares a real issue (security deposit withheld, defective product, RTI request, pothole/road damage):\n"
            "  * Jump directly into clear, plain-language guidance.\n"
            "  * Avoid robotic meta-openers (NEVER say 'I have evaluated your request and categorized it under...').\n"
            "  * Use lightweight bullet points, step-by-step actions, and clean bold text for scannability.\n"
            "  * If critical context is missing (like state/city or dates), ask ONE concise, polite clarifying question.\n\n"
            "3. Official Artifact Drafting:\n"
            "- Only generate formal drafts (RTI applications, legal notices, complaint letters) when the user has provided concrete context or explicitly asks for a draft.\n"
            "- When generating official documents, format them cleanly with standard placeholders like [Insert Name] or [Insert Date].\n\n"
            "4. Tone & Disclaimers:\n"
            "- Tone: Empathetic, clear, objective, and supportive—like a helpful, knowledgeable peer rather than a robotic parser.\n"
            "- Keep standard legal disclaimers short and unobtrusive at the bottom of actionable legal advice.\n"
            "- Always return valid JSON containing 'conversational_reply' and 'nlm_info'."
        )
        super().__init__(name="Legal Adviser AI", role_prompt=role_prompt)

    def process(self, intake: GrievanceInput) -> Dict[str, Any]:
        """
        Processes user grievance input using the grounded conversational persona via Gemini/Gemma LLM.
        """
        has_attachments = "Attached Evidence" in intake.raw_text or "Attached" in intake.raw_text

        history_context = ""
        if intake.conversation_history and len(intake.conversation_history) > 0:
            history_context = "Previous Conversation History Context:\n" + "\n".join(
                [f"{h.get('sender', 'User').capitalize()}: {h.get('text', '')}" for h in intake.conversation_history[-6:]]
            ) + "\n\n"

        prompt = (
            f"{history_context}"
            f"Latest Citizen Input Text:\n\"{intake.raw_text}\"\n\n"
            f"Language: {intake.language}\n"
            f"Location Context: {intake.location_details or 'Not specified'}\n"
            f"Evidence Files Attached: {'Yes' if has_attachments else 'No'}\n\n"
            "Execution Instructions:\n"
            "1. Pay close attention to the Previous Conversation History Context to maintain full multi-turn continuity for follow-up questions (e.g. 'explain point by point', 'can you go in more depth', 'what about the doc').\n"
            "2. Respond directly as a knowledgeable, empathetic, supportive civic peer (Legal Adviser AI). Do NOT use robotic preambles or repeat generic questions if context is already established in past turns.\n"
            "3. If the user asks general greetings ('hi', 'hello') or meta questions ('who are you', 'what model are you running on'), introduce yourself naturally as Legal Adviser AI powered by Gemma 4 / Gemini API in 2-3 warm sentences without robotic disclaimers.\n"
            "4. Never assume missing facts or hallucinate specific locations unless mentioned by user.\n"
            "5. Format the response clearly with scannable markdown formatting.\n"
            "6. Return valid JSON matching format:\n"
            "{\n"
            "  \"conversational_reply\": \"<plain-language empathetic advice with lightweight markdown>\",\n"
            "  \"user_intent\": \"<intent>\",\n"
            "  \"key_entities\": {},\n"
            "  \"actionable_summary\": \"<summary>\",\n"
            "  \"suggested_next_actions\": [\"Step 1: ...\"],\n"
            "  \"is_grievance_ready\": true/false,\n"
            "  \"sentiment_urgency\": \"Normal / High / Emergency\"\n"
            "}"
        )


        raw_res = self.call_llm(prompt)
        parsed = self._parse_nlm_response(raw_res, intake.raw_text)
        return parsed


    def _parse_nlm_response(self, raw_res: str, original_text: str) -> Dict[str, Any]:
        """Parse JSON response with grounded legal aid fallback."""
        try:
            cleaned = raw_res.strip()
            if "```json" in cleaned:
                cleaned = cleaned.split("```json")[1].split("```")[0].strip()
            elif "```" in cleaned:
                cleaned = cleaned.split("```")[1].split("```")[0].strip()
            
            data = json.loads(cleaned)
            reply = data.get("conversational_reply", "")
            
            # Only append legal disclaimer when addressing an actual legal grievance
            is_grievance_ready = data.get("is_grievance_ready", True)
            if is_grievance_ready:
                disclaimer = "\n\n*Note: This is civic procedural guidance, not formal legal representation.*"
                if "formal legal representation" not in reply and "legal counsel" not in reply:
                    reply += disclaimer



            nlm_info = NLMExtractedInfo(
                user_intent=data.get("user_intent", "Civic Grievance & Guidance"),
                key_entities=data.get("key_entities", {}),
                actionable_summary=data.get("actionable_summary", original_text),
                suggested_next_actions=data.get("suggested_next_actions", [
                    "Step 1: Upload photo/document evidence via '+'",
                    "Step 2: Review step-by-step guidance",
                    "Step 3: Submit complaint on official portal"
                ]),
                is_grievance_ready=data.get("is_grievance_ready", True),
                sentiment_urgency=data.get("sentiment_urgency", "Normal")
            )
            return {
                "conversational_reply": reply,
                "nlm_info": nlm_info
            }
        except Exception as e:
            logger.warning(f"NLM parsing fallback triggered: {e}")
            
            reply_text = (
                f"I understand you are dealing with: **\"{original_text[:150]}\"**\n\n"
                f"Here are the immediate steps you can take to address this:\n\n"
                f"🛡️ **Immediate Action & Evidence:**\n"
                f"• Upload any photos, bills, or receipt copies using the **'+'** button to build your record.\n"
                f"• Reach free legal advice from advocates via NALSA Helpline **15100** or Tele-Law **14454**.\n\n"
                f"🌐 **Official Grievance Filing:**\n"
                f"• Submit a formal grievance petition on **pgportal.gov.in** or National Consumer Helpline **1915**.\n\n"
                f"*This guidance is for informational purposes and does not constitute formal legal counsel.*"
            )
            return {
                "conversational_reply": reply_text,
                "nlm_info": NLMExtractedInfo(
                    user_intent="Grievance Guidance",
                    key_entities={"raw_input": original_text},
                    actionable_summary=original_text,
                    suggested_next_actions=[
                        "Step 1: Upload photo/document evidence via '+'",
                        "Step 2: Review guidance steps"
                    ],
                    is_grievance_ready=True,
                    sentiment_urgency="Normal"
                )
            }

