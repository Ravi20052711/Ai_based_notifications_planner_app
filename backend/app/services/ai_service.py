from abc import ABC, abstractmethod
from typing import List, Dict, Any
from datetime import date
import json
import httpx
import logging
import asyncio
from ..config import settings
from ..schemas.ai import AIReminderExtraction, DailyPlanResponse, GoalBreakdownResponse
from ..core.exceptions import AIProviderError

logger = logging.getLogger(__name__)

class IAIService(ABC):
    @abstractmethod
    async def extract_reminder(self, text: str) -> AIReminderExtraction:
        pass

    @abstractmethod
    async def generate_daily_plan(self, tasks: List[Dict[str, Any]]) -> DailyPlanResponse:
        pass

    @abstractmethod
    async def breakdown_goal(self, goal: str, days: int) -> GoalBreakdownResponse:
        pass

    @abstractmethod
    async def generate_smart_notification(self, title: str, description: str, user_name: str) -> str:
        pass

class OllamaAIService(IAIService):
    def __init__(self):
        # Ensure no trailing slash in base URL to avoid //api/generate 404
        self.base_url = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/generate"
        self.model = settings.OLLAMA_MODEL
        logger.info(f"AI Service initialized with URL: {self.base_url} and model: {self.model}")

    async def _generate(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        # Explicit instruction to only return JSON to help the model
        full_system = f"{system_prompt}. Return ONLY the JSON object, no conversation, no markdown blocks."
        
        payload = {
            "model": self.model,
            "prompt": f"System: {full_system}\nUser: {user_prompt}",
            "stream": False,
            "format": "json"
        }
        
        try:
            async with httpx.AsyncClient(timeout=90.0) as client:
                logger.info(f"Calling AI: {self.model} ...")
                response = await client.post(self.base_url, json=payload)
                
                if response.status_code == 404:
                    logger.error(f"Ollama Endpoint NOT FOUND (404): {self.base_url}. Check settings.")
                    raise AIProviderError(f"Endpoint not found: {self.base_url}")
                
                response.raise_for_status()
                result = response.json()
                
                raw_response = result.get("response", "")
                if not raw_response:
                    raise AIProviderError("Empty response from AI")
                
                # Clean markdown blocks if model ignored instructions
                json_str = raw_response.strip()
                if json_str.startswith("```json"):
                    json_str = json_str.replace("```json", "", 1).replace("```", "", 1).strip()
                elif json_str.startswith("```"):
                    json_str = json_str.replace("```", "", 2).strip()
                
                # Robust JSON extraction fallback
                import re
                match = re.search(r'\{.*\}', json_str, re.DOTALL)
                if match:
                    json_str = match.group(0)
                
                return json.loads(json_str)
        except (httpx.HTTPError, json.JSONDecodeError) as e:
            logger.error(f"AI Service failure: {e}")
            raise AIProviderError(f"AI Logic Error: {str(e)}")

    async def extract_reminder(self, text: str) -> AIReminderExtraction:
        system_prompt = (
            f"You are a precise data extractor. Today is {date.today().isoformat()}. "
            "Convert user text into a structured reminder JSON. "
            "Example Input: 'Remind me to buy milk tomorrow at 5pm' "
            "Example Output: {'title': 'Buy milk', 'date': '2026-06-08', 'time': '17:00', 'repeat_type': 'none', 'priority': 'medium', 'category': 'shopping'} "
            "Rules: 1. Use 24h format for time. 2. Use YYYY-MM-DD for date. 3. Return ONLY valid JSON."
        )
        data = await self._generate(system_prompt, f"Extract this: {text}")
        return AIReminderExtraction(**data)

    async def generate_daily_plan(self, tasks: List[Dict[str, Any]]) -> DailyPlanResponse:
        system_prompt = (
            "You are a professional productivity coach. Create an optimized time-blocked schedule. "
            "Example Output: {'summary': 'A focused morning with high-priority tasks...', 'plan': [{'time': '09:00', 'title': 'Deep Work', 'duration_minutes': 60, 'priority': 'high'}]} "
            "Rules: 1. Start from 08:00 AM. 2. Distribute tasks based on priority. 3. Return ONLY valid JSON."
        )
        user_prompt = f"Tasks to schedule: {json.dumps(tasks)}"
        data = await self._generate(system_prompt, user_prompt)
        return DailyPlanResponse(**data)

    async def breakdown_goal(self, goal: str, days: int) -> GoalBreakdownResponse:
        system_prompt = (
            f"You are an expert project manager. Break down the goal into {days} distinct daily phases. "
            "Example Output: {'goal': 'Learn SQL', 'total_days': 2, 'tasks': [{'day': 1, 'title': 'Basics', 'description': 'Install Postgres and learn SELECT', 'estimated_minutes': 45}]} "
            "Rules: 1. Each day must have exactly one title and description. 2. Return ONLY valid JSON."
        )
        user_prompt = f"Goal: {goal} in {days} days."
        data = await self._generate(system_prompt, user_prompt)
        return GoalBreakdownResponse(**data)

    async def generate_smart_notification(self, title: str, description: str, user_name: str) -> str:
        system_prompt = f"Friendly assistant. Short notification for {user_name}. JSON with 'message'."
        try:
            data = await self._generate(system_prompt, f"Task: {title}")
            return data.get("message", f"Time for: {title}")
        except Exception:
            return f"Time for: {title}"

# Factory-like instantiation
ai_service: IAIService = OllamaAIService()
