import json
import logging
from typing import Dict, Any, Optional
from app.agents.base_agent import BaseAgent
from app.models import GrievanceInput, NLMExtractedInfo

logger = logging.getLogger("ConversationalNLMAgent")


class ConversationalNLMAgent(BaseAgent):
    """
    Hybrid Friendly Conversational AI & Natural Language Model (NLM) Feature Extractor.
    Handles general friendly conversation while simultaneously extracting structured,
    actionable facts & entities from any input for downstream legal processing.
    """
    def __init__(self):
        role_prompt = (
            "You are the Gemini Conversational & NLM Information Extraction Agent. "
            "You have two core functions:\n"
            "1. Friendly Conversation: Warmly chat with citizens, answer general questions, explain rights, and offer friendly assistance.\n"
            "2. NLM Information Extraction: Analyze any user input (casual or legal) and extract key entities, user intent, "
            "actionable summary, suggested next steps, and sentiment urgency into structured JSON."
        )
        super().__init__(name="Conversational & NLM Information Extractor Agent", role_prompt=role_prompt)

    def process(self, intake: GrievanceInput) -> Dict[str, Any]:
        """
        Processes user input, generating a friendly conversational reply AND an NLM structured extraction payload.
        """
        prompt = (
            f"User Input Text:\n\"{intake.raw_text}\"\n\n"
            f"Input Language: {intake.language}\n"
            f"Location Context: {intake.location_details or 'None provided'}\n\n"
            "Instructions:\n"
            "1. Generate a warm, natural, friendly conversational response answering the user's message directly.\n"
            "2. Perform NLM structural analysis to extract actionable information.\n\n"
            "Return JSON matching exact format:\n"
            "{\n"
            "  \"conversational_reply\": \"<friendly response text>\",\n"
            "  \"user_intent\": \"<intent summary, e.g., General Greeting / Report Pothole / RTI Query / Pension Delay>\",\n"
            "  \"key_entities\": {\"location\": \"...\", \"department\": \"...\", \"category\": \"...\", \"dates\": \"...\"},\n"
            "  \"actionable_summary\": \"<1 sentence normalized summary>\",\n"
            "  \"suggested_next_actions\": [\"<action 1>\", \"<action 2>\"],\n"
            "  \"is_grievance_ready\": true/false,\n"
            "  \"sentiment_urgency\": \"Low / Normal / High / Emergency\"\n"
            "}"
        )

        raw_res = self.call_llm(prompt)
        parsed = self._parse_nlm_response(raw_res, intake.raw_text)
        return parsed

    def _parse_nlm_response(self, raw_res: str, original_text: str) -> Dict[str, Any]:
        """Parse JSON response with rule-based fallback."""
        try:
            cleaned = raw_res.strip()
            if "```json" in cleaned:
                cleaned = cleaned.split("```json")[1].split("```")[0].strip()
            elif "```" in cleaned:
                cleaned = cleaned.split("```")[1].split("```")[0].strip()
            
            data = json.loads(cleaned)
            nlm_info = NLMExtractedInfo(
                user_intent=data.get("user_intent", "General Inquiry"),
                key_entities=data.get("key_entities", {}),
                actionable_summary=data.get("actionable_summary", original_text),
                suggested_next_actions=data.get("suggested_next_actions", []),
                is_grievance_ready=data.get("is_grievance_ready", False),
                sentiment_urgency=data.get("sentiment_urgency", "Normal")
            )
            return {
                "conversational_reply": data.get("conversational_reply", "Hello! How can I assist you with your civic rights or legal complaints today?"),
                "nlm_info": nlm_info
            }
        except Exception as e:
            logger.warning(f"NLM parsing fallback triggered: {e}")
            # Heuristic NLM extraction
            lower_text = original_text.lower()
            is_grievance = any(w in lower_text for w in ["rti", "pothole", "road", "pension", "police", "refund", "tax", "mcd", "bbmp", "nhai"])
            return {
                "conversational_reply": f"Hello! I'm your Gemini AI assistant. I parsed your input: '{original_text}'. How can I help you resolve this?",
                "nlm_info": NLMExtractedInfo(
                    user_intent="Statutory Grievance" if is_grievance else "General Conversation",
                    key_entities={"raw_input": original_text},
                    actionable_summary=original_text,
                    suggested_next_actions=["File Statutory Legal Petition", "Explore Civic Pathways"] if is_grievance else ["Ask a question", "File a grievance"],
                    is_grievance_ready=is_grievance,
                    sentiment_urgency="High" if is_grievance else "Normal"
                )
            }
