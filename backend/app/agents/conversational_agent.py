import json
import logging
from typing import Dict, Any, Optional
from app.agents.base_agent import BaseAgent
from app.models import GrievanceInput, NLMExtractedInfo

logger = logging.getLogger("ConversationalNLMAgent")


class ConversationalNLMAgent(BaseAgent):
    """
    Empathetic Civic & Legal Empowerment AI Agent.
    Role: Civic Advisor, RTI Drafter, and Entitlement Navigator.
    
    Workflow & Interaction Principles:
    1. Listening First: Listens to citizen grievances and media evidence before introducing heavy legal jargon.
    2. Plain-Language Guidance: Uses clear 8th-grade reading level explanations.
    3. Self-Protection & Filing Guide: Moves to the filing section explaining step-by-step how citizens can protect themselves.
    4. Mandatory Disclaimer: Includes concise legal disclaimer.
    """
    def __init__(self):
        role_prompt = (
            "You are the Civic and Legal Empowerment AI Agent (Legal Adviser AI).\n"
            "Your mission is to translate complex legal, civic, and bureaucratic processes into plain, actionable assistance for citizens.\n\n"
            "Core Guidelines:\n"
            "1. Listening First & Tone: Use clear, empathetic, jargon-free language for initial explanations. Listen to the citizen's grievance carefully first before jumping into heavy legal jargon.\n"
            "2. Missing Details: If key context is missing (location, dates, department), ask brief, single-step clarifying questions instead of overwhelming the user.\n"
            "3. Self-Protection & Filing Steps: After understanding the grievance, move to the filing section. Explain step-by-step how citizens can save and protect themselves:\n"
            "   - Step 1: Immediate Self-Protection & Evidence Preservation (photos/videos via '+' button).\n"
            "   - Step 2: Emergency & Free Legal Aid Helplines (e.g. NALSA 15100, Tele-Law 14454, Cyber Crime 1930, Women Helpline 181).\n"
            "   - Step 3: Official Government Portal Filing (e.g. pgportal.gov.in, State Jan Sunwai, Consumer Helpline).\n"
            "   - Step 4: Statutory Legal Petition Draft.\n"
            "4. Disclaimer: Always include: 'This information provides civic and procedural guidance and does not constitute formal legal counsel.'\n"
            "5. JSON Format: Always produce output in valid JSON containing 'conversational_reply' and 'nlm_info'."
        )
        super().__init__(name="Civic & Legal Empowerment AI Agent", role_prompt=role_prompt)

    def process(self, intake: GrievanceInput) -> Dict[str, Any]:
        """
        Processes user grievance input using the Grounded Interactions API persona.
        """
        text_clean = intake.raw_text.strip().lower()
        is_greeting = text_clean in ["hi", "hello", "hey", "namaste", "good morning", "good evening", "hi there", "hello there", "who are you", "what can you do"] or (len(text_clean) <= 5 and not any(w in text_clean for w in ["rti", "pwd", "tax", "fir", "bns", "road", "pothole"]))

        if is_greeting:
            greeting_reply = (
                "Namaste! 🙏 I am your **Legal Adviser AI**, here to listen to your civic and legal concerns.\n\n"
                "I am here to help you solve problems with public authorities, consumer disputes, tenant issues, and government schemes in simple, clear terms.\n\n"
                "Please tell me what issue or grievance you are facing today, or click the **'+'** button to share photo, video, audio, or document evidence so I can guide you!"
            )
            return {
                "conversational_reply": greeting_reply,
                "nlm_info": NLMExtractedInfo(
                    user_intent="General Greeting",
                    key_entities={},
                    actionable_summary="User initiated conversation.",
                    suggested_next_actions=["Describe your specific grievance", "Attach photo/video evidence via '+'"],
                    is_grievance_ready=False,
                    sentiment_urgency="Low"
                )
            }

        has_attachments = "Attached Evidence" in intake.raw_text or "Attached" in intake.raw_text

        prompt = (
            f"User Grievance Text:\n\"{intake.raw_text}\"\n\n"
            f"Language: {intake.language}\n"
            f"Location Context: {intake.location_details or 'Not specified'}\n"
            f"Evidence Files Attached: {'Yes' if has_attachments else 'No'}\n\n"
            "Execution Instructions:\n"
            "1. First, warmly acknowledge and validate the citizen's distress in simple, plain language without rushing into heavy legal jargon.\n"
            "2. If critical information (such as exact location, authority name, or dates) is missing, include brief single-step follow-up questions.\n"
            "3. Next, move to the filing and self-protection section. Explain step-by-step how the user can save and protect themselves:\n"
            "   - 🛡️ How to Protect Yourself & Preserve Evidence\n"
            "   - 📞 Free Legal Aid & Emergency Helplines (e.g., NALSA 15100, Tele-Law 14454)\n"
            "   - 🌐 Step-by-Step Official Portal Filing (e.g., pgportal.gov.in, State Jan Sunwai)\n"
            "   - ⚖️ Applicable Statutory Rights (cite BNS 2023, RTI Act 2005, Consumer Protection Act in plain terms)\n"
            "4. Include disclaimer: \"This information provides civic and procedural guidance and does not constitute formal legal counsel.\"\n"
            "5. Return valid JSON matching format:\n"
            "{\n"
            "  \"conversational_reply\": \"<plain-language empathetic response with self-protection steps and disclaimer>\",\n"
            "  \"user_intent\": \"<grievance intent>\",\n"
            "  \"key_entities\": {\"location\": \"...\", \"category\": \"...\", \"opposing_party\": \"...\"},\n"
            "  \"actionable_summary\": \"<1 sentence summary>\",\n"
            "  \"suggested_next_actions\": [\"Step 1: ...\", \"Step 2: ...\", \"Step 3: ...\"],\n"
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
            
            # Ensure mandatory disclaimer is present
            disclaimer = "\n\n*Disclaimer: This information provides civic and procedural guidance and does not constitute formal legal counsel.*"
            if "does not constitute formal legal counsel" not in reply:
                reply += disclaimer

            nlm_info = NLMExtractedInfo(
                user_intent=data.get("user_intent", "Civic Grievance & Protection"),
                key_entities=data.get("key_entities", {}),
                actionable_summary=data.get("actionable_summary", original_text),
                suggested_next_actions=data.get("suggested_next_actions", [
                    "Step 1: Document evidence & upload photo via '+' button",
                    "Step 2: Contact Free Legal Aid (NALSA 15100 / Tele-Law 14454)",
                    "Step 3: Submit complaint on official government portal",
                    "Step 4: Click 'Draft Statutory Legal Petition' to generate petition"
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
            lower_text = original_text.lower()
            is_grievance = any(w in lower_text for w in ["rti", "pothole", "road", "pension", "police", "refund", "tax", "mcd", "bbmp", "nhai", "attached", "photo", "video", "doc"])
            
            reply_text = (
                f"I hear your concern regarding: *\"{original_text[:150]}\"*\n\n"
                f"Let us take this step-by-step so you can protect yourself and resolve this issue effectively:\n\n"
                f"🛡️ **HOW TO PROTECT YOURSELF:**\n"
                f"1. **Preserve Evidence**: Upload photos, videos, or documents using the **'+'** button to create a verified record.\n"
                f"2. **Know Your Rights**: Under statutory laws (such as Article 21 and the Municipalities/Consumer Protection Act), public authorities are accountable for public safety and service quality.\n"
                f"3. **Free Legal Advice**: You can reach free legal advocates at **15100 (NALSA)** or **14454 (Tele-Law)**.\n\n"
                f"📋 **FILING & NEXT STEPS:**\n"
                f"• Submit an official complaint on **pgportal.gov.in** or your State Jan Sunwai portal.\n"
                f"• Click **'Draft Statutory Legal Petition'** below to auto-generate your official legal petition.\n\n"
                f"*Disclaimer: This information provides civic and procedural guidance and does not constitute formal legal counsel.*"
            )
            return {
                "conversational_reply": reply_text,
                "nlm_info": NLMExtractedInfo(
                    user_intent="Statutory Grievance & Guidance" if is_grievance else "General Conversation",
                    key_entities={"raw_input": original_text},
                    actionable_summary=original_text,
                    suggested_next_actions=[
                        "Step 1: Upload evidence photo/video via '+' button",
                        "Step 2: Review step-by-step protection guide",
                        "Step 3: Click 'Draft Statutory Legal Petition'"
                    ],
                    is_grievance_ready=is_grievance,
                    sentiment_urgency="High" if is_grievance else "Normal"
                )
            }
