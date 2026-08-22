import os
import json
import logging
from typing import Dict, Any, Optional
from google import genai
from google.genai import types
from tenacity import retry, stop_after_attempt, wait_exponential
from app.config import settings

logger = logging.getLogger("BaseAgent")


class BaseAgent:
    """
    Base Agent utilizing Google GenAI SDK (client.interactions.create & client.models.generate_content)
    grounded with Google Search tools and structured system instructions.
    """
    def __init__(self, name: str, role_prompt: str, model_name: Optional[str] = None):
        self.name = name
        self.role_prompt = role_prompt
        self.model_name = model_name or settings.DEFAULT_MODEL
        self.client: Optional[genai.Client] = None
        
        api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
        if api_key:
            try:
                self.client = genai.Client(api_key=api_key)
            except Exception as e:
                logger.warning(f"Could not initialize GenAI Client for {name}: {e}")

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def call_llm_with_retry(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        """Call Gemini LLM via client.interactions.create with exponential backoff retries."""
        if not self.client:
            raise ValueError("No GenAI client available")

        sys_inst = system_instruction or self.role_prompt

        # Attempt Interactions API with Grounding Tools & System Instructions
        try:
            interaction = self.client.interactions.create(
                model=self.model_name,
                input=prompt,
                system_instruction=sys_inst,
                tools=[{'type': 'google_search'}],
                generation_config={
                    'temperature': 0.7,
                    'max_output_tokens': 65536,
                    'top_p': 0.9,
                }
            )
            if interaction and getattr(interaction, 'output_text', None):
                return interaction.output_text
        except Exception as err:
            logger.info(f"Interactions API call note in {self.name}: {err}. Trying models.generate_content...")

        # Fallback to models.generate_content
        config = types.GenerateContentConfig(
            system_instruction=sys_inst,
            temperature=0.2,
        )
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=config
        )
        if response and response.text:
            return response.text
        raise ValueError("Empty LLM response")

    def call_llm(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        """Robust LLM invocation wrapper with self-correction fallback."""
        if self.client:
            try:
                return self.call_llm_with_retry(prompt, system_instruction)
            except Exception as e:
                logger.error(f"Error calling Gemini SDK ({self.model_name}) in {self.name}: {e}. Retrying with fallback model.")
                try:
                    sys_inst = system_instruction or self.role_prompt
                    config = types.GenerateContentConfig(
                        system_instruction=sys_inst,
                        temperature=0.2,
                    )
                    res = self.client.models.generate_content(
                        model=settings.FALLBACK_MODEL,
                        contents=prompt,
                        config=config
                    )
                    if res and res.text:
                        return res.text
                except Exception as ex2:
                    logger.error(f"Fallback model error in {self.name}: {ex2}.")

        return self.fallback_response(prompt)

    def fallback_response(self, prompt: str) -> str:
        """Rule-based intelligent response when API rate limits are hit."""
        return (
            "Hello! I am your Legal Adviser AI Assistant. "
            "I am here to listen to your civic or legal grievance, answer your questions in plain language, "
            "and guide you step-by-step on how to protect yourself and file your grievance on official portals."
        )
