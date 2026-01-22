"""
LLM Providers for AI Engine
Supports local models, Gemini (Vertex AI), and OpenRouter.
"""

from __future__ import annotations

import logging
import os
from typing import Dict, Optional

import requests

from models import get_custom_tutor

logger = logging.getLogger(__name__)

PERSONALITY_PROMPTS = {
    "encouraging": (
        "You are an encouraging programming tutor. Be supportive and positive."
    ),
    "analytical": (
        "You are an analytical tutor. Focus on precision and logical reasoning."
    ),
    "creative": "You are a creative tutor. Encourage innovative solutions.",
    "practical": "You are a practical tutor. Focus on real-world applications.",
}


class LLMProviderError(RuntimeError):
    """Raised when an LLM provider fails or is misconfigured."""


class LocalLLMProvider:
    """Local LLM provider backed by custom TinyLlama model."""

    def chat(self, message: str, personality: str, context: Dict) -> Dict:
        tutor = get_custom_tutor()
        return tutor.generate_response(message, context, personality)


class GeminiProvider:
    """Gemini provider using Vertex AI Generative Models."""

    def __init__(self):
        self.project_id = os.getenv("GCP_PROJECT_ID", "")
        self.location = os.getenv("GCP_LOCATION", "us-central1")
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash-001")

    def _client(self):
        if not self.project_id:
            raise LLMProviderError("GCP_PROJECT_ID is not configured")

        try:
            import vertexai
            from vertexai.generative_models import GenerativeModel
        except Exception as exc:
            raise LLMProviderError("Vertex AI SDK is not available") from exc

        vertexai.init(project=self.project_id, location=self.location)
        return GenerativeModel(self.model_name)

    def chat(self, message: str, personality: str, context: Dict) -> Dict:
        model = self._client()
        system_prompt = PERSONALITY_PROMPTS.get(
            personality, PERSONALITY_PROMPTS["encouraging"]
        )
        prompt = f"{system_prompt}\n\nUser: {message}"

        try:
            response = model.generate_content(prompt)
            text = response.text
        except Exception as exc:
            raise LLMProviderError("Gemini request failed") from exc

        return {
            "message": text,
            "suggestions": ["Ask another question", "Request code review"],
            "resources": [],
            "model_used": self.model_name,
        }


class OpenRouterProvider:
    """OpenRouter provider for external LLM access."""

    def __init__(self):
        self.default_model = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")
        self.base_url = os.getenv(
            "OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1/chat/completions"
        )

    def chat(
        self,
        message: str,
        personality: str,
        context: Dict,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
    ) -> Dict:
        api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            raise LLMProviderError("OPENROUTER_API_KEY is not configured")

        system_prompt = PERSONALITY_PROMPTS.get(
            personality, PERSONALITY_PROMPTS["encouraging"]
        )

        payload = {
            "model": model or self.default_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message},
            ],
            "temperature": 0.7,
        }

        response = requests.post(
            self.base_url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": os.getenv(
                    "OPENROUTER_REFERER", "https://codementor.ai"
                ),
            },
            json=payload,
            timeout=30,
        )

        if not response.ok:
            raise LLMProviderError(
                f"OpenRouter request failed: {response.status_code}"
            )

        data = response.json()
        if "error" in data:
            raise LLMProviderError(data["error"].get("message", "Unknown error"))

        content = data["choices"][0]["message"]["content"]

        return {
            "message": content,
            "suggestions": ["Ask another question", "Request code review"],
            "resources": [],
            "model_used": payload["model"],
        }


class LLMManager:
    """Dispatch LLM calls to the appropriate provider."""

    def __init__(self):
        self.providers = {
            "local": LocalLLMProvider(),
            "gemini": GeminiProvider(),
            "openrouter": OpenRouterProvider(),
        }

    def supported_providers(self) -> list[str]:
        return list(self.providers.keys())

    def chat(
        self,
        provider: str,
        message: str,
        personality: str,
        context: Dict,
        model: Optional[str] = None,
        api_key: Optional[str] = None,
    ) -> Dict:
        provider_key = (provider or "local").lower()
        if provider_key not in self.providers:
            raise LLMProviderError(
                f"Unsupported provider: {provider_key}."
            )

        handler = self.providers[provider_key]
        if provider_key == "openrouter":
            return handler.chat(message, personality, context, api_key, model)
        return handler.chat(message, personality, context)
