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
        Processes user grievance input using the grounded conversational persona.
        """
        text_clean = intake.raw_text.strip().lower()
        is_greeting = text_clean in ["hi", "hello", "hey", "namaste", "good morning", "good evening", "hi there", "hello there", "who are you", "what can you do", "tell me about yourself", "help"] or (len(text_clean) <= 6 and not any(w in text_clean for w in ["rti", "pwd", "tax", "fir", "bns", "road", "pothole", "rent", "landlord"]))

        if is_greeting:
            greeting_reply = (
                "Namaste! 🙏 I am your **Legal Adviser AI**, here to help you navigate Indian laws, civic rights, and public services in simple, human language.\n\n"
                "I can assist you with drafting RTI applications, resolving tenant & security deposit disputes, filing consumer complaints, or reporting civic grievances.\n\n"
                "How can I help you today? Feel free to describe your issue, or click the **'+'** button to share photo, video, or document evidence."
            )
            return {
                "conversational_reply": greeting_reply,
                "nlm_info": NLMExtractedInfo(
                    user_intent="General Greeting & Capability Overview",
                    key_entities={},
                    actionable_summary="User asked for introduction or greeting.",
                    suggested_next_actions=["Describe your specific issue or grievance", "Upload photo/video evidence via '+'"],
                    is_grievance_ready=False,
                    sentiment_urgency="Low"
                )
            }

        has_attachments = "Attached Evidence" in intake.raw_text or "Attached" in intake.raw_text

        prompt = (
            f"Citizen Input Text:\n\"{intake.raw_text}\"\n\n"
            f"Language: {intake.language}\n"
            f"Location Context: {intake.location_details or 'Not specified'}\n"
            f"Evidence Files Attached: {'Yes' if has_attachments else 'No'}\n\n"
            "Execution Instructions:\n"
            "1. Jump directly into clear, plain-language guidance as a helpful, knowledgeable peer. Do NOT use robotic meta-openers.\n"
            "2. Never assume missing facts (do NOT invent 'Ward 42' or specific locations unless mentioned by user).\n"
            "3. If critical context is missing (such as city, state, or dates), include ONE concise, polite clarifying question.\n"
            "4. Use lightweight bullet points, step-by-step actions, and clean bold text for scannability:\n"
            "   - 🛡️ Immediate Steps & Evidence Preservation\n"
            "   - 📞 Helplines & Free Legal Aid (e.g. NALSA 15100, Tele-Law 14454, Cyber Crime 1930)\n"
            "   - 🌐 Official Complaint Filing (e.g. pgportal.gov.in, Consumer Helpline 1915)\n"
            "   - ⚖️ Applicable Statutory Rights (in plain English/Hindi without legal jargon bloat)\n"
            "5. Include a short, unobtrusive disclaimer at the bottom: \"*This guidance is for informational purposes and does not constitute formal legal counsel.*\"\n"
            "6. Return valid JSON matching format:\n"
            "{\n"
            "  \"conversational_reply\": \"<plain-language empathetic advice with lightweight bullets & unobtrusive disclaimer>\",\n"
            "  \"user_intent\": \"<grievance intent>\",\n"
            "  \"key_entities\": {\"location\": \"...\", \"category\": \"...\", \"opposing_party\": \"...\"},\n"
            "  \"actionable_summary\": \"<1 sentence summary>\",\n"
            "  \"suggested_next_actions\": [\"Step 1: ...\", \"Step 2: ...\"],\n"
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
            
            # Ensure mandatory short disclaimer is present
            disclaimer = "\n\n*Note: This is civic procedural guidance, not formal legal representation.*"
            if "formal legal representation" not in reply:
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

