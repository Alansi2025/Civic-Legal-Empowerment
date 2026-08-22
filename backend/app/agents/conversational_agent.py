import json
import logging
from typing import Dict, Any, Optional
from app.agents.base_agent import BaseAgent
from app.models import GrievanceInput, NLMExtractedInfo

logger = logging.getLogger("ConversationalNLMAgent")


class ConversationalNLMAgent(BaseAgent):
    """
    Hybrid Friendly Conversational Legal Adviser AI & NLM Feature Extractor.
    Gathers citizen grievances, performs multimodal photo/video/doc evidence analysis,
    provides legal aid (rights, laws, helplines), and tells the user step-by-step
    'what to do' and 'how to do things' before drafting statutory petitions.
    """
    def __init__(self):
        role_prompt = (
            "You are Legal Adviser AI, a expert Indian Legal & Civic Empowerment Assistant.\n"
            "Your duties:\n"
            "1. Hear Citizen Grievance & Media Evidence: Listen carefully to user grievances, including photos, videos, audio, and documents.\n"
            "2. Provide Comprehensive Legal Aid: Explain applicable laws (BNS 2023, RTI Act 2005, Consumer Protection Act 2019, State Municipalities Acts) and Constitutional rights (Article 21).\n"
            "3. Tell the User 'What to Do' & 'How to Do Things': Provide clear, numbered step-by-step instructions:\n"
            "   - Step 1: Immediate Action & Helplines (e.g. NALSA 15100, Cyber Crime 1930, Women Helpline 181, Police 112).\n"
            "   - Step 2: Official Government Portal Filing (e.g. pgportal.gov.in, cmjansunwai.delhi.gov.in, consumerhelpline.gov.in, gmdaharyana.gov.in).\n"
            "   - Step 3: Statutory Draft & Evidence Submission (Instruct user to click 'Draft Statutory Legal Petition').\n"
            "4. Ask Clarifying Questions: Ask friendly follow-up questions if location, dates, or department details are missing.\n"
            "5. Extract NLM Info: Output valid JSON containing conversational_reply and nlm_info."
        )
        super().__init__(name="Legal Adviser AI & NLM Information Extractor Agent", role_prompt=role_prompt)

    def process(self, intake: GrievanceInput) -> Dict[str, Any]:
        """
        Processes user input & media attachments, providing step-by-step legal guidance.
        """
        text_clean = intake.raw_text.strip().lower()
        is_greeting = text_clean in ["hi", "hello", "hey", "namaste", "good morning", "good evening", "hi there", "hello there", "who are you", "what can you do"] or (len(text_clean) <= 5 and not any(w in text_clean for w in ["rti", "pwd", "tax", "fir", "bns", "road"]))

        if is_greeting:
            greeting_reply = (
                "Namaste! 🙏 I am your **Legal Adviser AI** assistant.\n\n"
                "I am here to help you resolve civic problems, consumer disputes, RTI applications, and legal issues step-by-step.\n\n"
                "Please tell me what issue or grievance you are facing today, or click the **'+'** button to attach a photo, video, audio, or document evidence!"
            )
            return {
                "conversational_reply": greeting_reply,
                "nlm_info": NLMExtractedInfo(
                    user_intent="General Greeting",
                    key_entities={},
                    actionable_summary="User sent greeting.",
                    suggested_next_actions=["Describe your civic or legal grievance", "Upload photo/video/document evidence via '+'"],
                    is_grievance_ready=False,
                    sentiment_urgency="Low"
                )
            }

        has_attachments = "Attached Evidence" in intake.raw_text or "Attached" in intake.raw_text

        prompt = (
            f"Citizen Input Text:\n\"{intake.raw_text}\"\n\n"
            f"Input Language: {intake.language}\n"
            f"Location Details: {intake.location_details or 'Not specified'}\n"
            f"Media Attachments Included: {'Yes (Photo/Video/Audio/Doc)' if has_attachments else 'None'}\n\n"
            "Instructions:\n"
            "1. Generate a thorough, warm, and highly structured 'conversational_reply' that includes:\n"
            "   - Empathetic acknowledgment of the citizen's grievance & media evidence attached.\n"
            "   - ⚖️ Applicable Statutory Laws & Constitutional Rights (cite BNS 2023, RTI Act 2005, Consumer Act, Municipal Acts).\n"
            "   - 🎯 WHAT TO DO & HOW TO DO THINGS (Step-by-step action guide: Official portals, emergency/legal aid helplines like 15100, and petition drafting).\n"
            "   - ❓ Friendly follow-up questions if location, dates, or incident details are incomplete.\n"
            "2. Perform NLM structural analysis matching exact JSON format:\n"
            "{\n"
            "  \"conversational_reply\": \"<detailed step-by-step legal guidance & response text>\",\n"
            "  \"user_intent\": \"<intent summary>\",\n"
            "  \"key_entities\": {\"location\": \"...\", \"department\": \"...\", \"category\": \"...\", \"evidence_attached\": \"...\"},\n"
            "  \"actionable_summary\": \"<1 sentence summary>\",\n"
            "  \"suggested_next_actions\": [\"Step 1: ...\", \"Step 2: ...\", \"Step 3: ...\"],\n"
            "  \"is_grievance_ready\": true/false,\n"
            "  \"sentiment_urgency\": \"Low / Normal / High / Emergency\"\n"
            "}"
        )


        raw_res = self.call_llm(prompt)
        parsed = self._parse_nlm_response(raw_res, intake.raw_text)
        return parsed

    def _parse_nlm_response(self, raw_res: str, original_text: str) -> Dict[str, Any]:
        """Parse JSON response with rule-based legal aid fallback."""
        try:
            cleaned = raw_res.strip()
            if "```json" in cleaned:
                cleaned = cleaned.split("```json")[1].split("```")[0].strip()
            elif "```" in cleaned:
                cleaned = cleaned.split("```")[1].split("```")[0].strip()
            
            data = json.loads(cleaned)
            nlm_info = NLMExtractedInfo(
                user_intent=data.get("user_intent", "Legal & Civic Grievance"),
                key_entities=data.get("key_entities", {}),
                actionable_summary=data.get("actionable_summary", original_text),
                suggested_next_actions=data.get("suggested_next_actions", [
                    "Step 1: Contact Free Legal Aid Helpline (15100 NALSA)",
                    "Step 2: Submit complaint on official government portal",
                    "Step 3: Click 'Draft Statutory Legal Petition' to generate formal legal document"
                ]),
                is_grievance_ready=data.get("is_grievance_ready", True),
                sentiment_urgency=data.get("sentiment_urgency", "Normal")
            )
            return {
                "conversational_reply": data.get("conversational_reply", "Hello! I am your Legal Adviser AI. I have analyzed your grievance. Here is what to do and how to proceed step-by-step."),
                "nlm_info": nlm_info
            }
        except Exception as e:
            logger.warning(f"NLM parsing fallback triggered: {e}")
            lower_text = original_text.lower()
            is_grievance = any(w in lower_text for w in ["rti", "pothole", "road", "pension", "police", "refund", "tax", "mcd", "bbmp", "nhai", "attached", "photo", "video", "doc"])
            
            reply_text = (
                f"🛡️ **Legal Adviser AI Analysis & Guidance**\n\n"
                f"I have received and evaluated your grievance: *\"{original_text[:150]}\"*\n\n"
                f"⚖️ **Applicable Laws & Rights:**\n"
                f"• Article 21 (Right to Safe Infrastructure & Life)\n"
                f"• State Municipalities Act & RTI Act 2005 / BNS 2023\n\n"
                f"🎯 **WHAT TO DO & HOW TO DO THINGS:**\n"
                f"1. **Document Evidence**: Ensure any photos, videos, or documents are uploaded using the '+' button.\n"
                f"2. **Official Portal**: Submit on the official portal (e.g. pgportal.gov.in or State Jan Sunwai portal).\n"
                f"3. **Free Legal Aid**: Call NALSA Helpline **15100** or Tele-Law **14454** for free advocate assistance.\n"
                f"4. **Draft Statutory Petition**: Click **'Draft Statutory Legal Petition'** below to auto-generate your formal petition."
            )
            return {
                "conversational_reply": reply_text,
                "nlm_info": NLMExtractedInfo(
                    user_intent="Statutory Grievance & Legal Guidance" if is_grievance else "General Conversation",
                    key_entities={"raw_input": original_text},
                    actionable_summary=original_text,
                    suggested_next_actions=[
                        "Step 1: Attach photo/video evidence via '+' button",
                        "Step 2: Review statutory legal advice",
                        "Step 3: Click 'Draft Statutory Legal Petition'"
                    ],
                    is_grievance_ready=is_grievance,
                    sentiment_urgency="High" if is_grievance else "Normal"
                )
            }

