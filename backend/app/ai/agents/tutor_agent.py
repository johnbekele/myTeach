"""
AI Tutor Agent for personalized learning assistance
"""
from typing import Dict, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.ai.chat_service import ChatService
from app.ai.prompts.system_prompts import get_system_prompt


class TutorAgent:
    """AI tutor that helps students learn through conversation"""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.chat_service = ChatService(db)

    async def ask_question(
        self,
        user_id: str,
        question: str,
        context_type: str = "general",
        context_id: Optional[str] = None,
        context_data: Optional[Dict] = None,
    ) -> Dict:
        """
        Student asks the tutor a question

        Args:
            user_id: Student's user ID
            question: The question they're asking
            context_type: "exercise", "node", "general"
            context_id: ID of exercise or node if applicable
            context_data: Additional context (exercise details, code, etc.)
        """
        # Get or create chat session
        session_id = await self.chat_service.get_or_create_session(
            user_id=user_id, context_type=context_type, context_id=context_id
        )

        # Get tutor system prompt
        system_prompt = get_system_prompt("tutor")

        # Send message and get response
        response = await self.chat_service.send_message(
            user_id=user_id,
            session_id=session_id,
            message=question,
            system_prompt=system_prompt,
            context_data=context_data,
        )

        return response

    async def explain_concept(
        self, user_id: str, concept: str, difficulty_level: str = "beginner"
    ) -> Dict:
        """
        Explain a DevOps concept to the student

        Args:
            user_id: Student's user ID
            concept: The concept to explain
            difficulty_level: "beginner", "intermediate", "advanced"
        """
        prompt = f"Can you explain {concept} to me? I'm at a {difficulty_level} level."

        session_id = await self.chat_service.get_or_create_session(
            user_id=user_id, context_type="concept", context_id=concept
        )

        system_prompt = get_system_prompt("tutor")

        response = await self.chat_service.send_message(
            user_id=user_id,
            session_id=session_id,
            message=prompt,
            system_prompt=system_prompt,
        )

        return response

    async def help_debug(
        self, user_id: str, exercise_id: str, code: str, error_message: str
    ) -> Dict:
        """
        Help student debug their code

        Args:
            user_id: Student's user ID
            exercise_id: Current exercise ID
            code: Student's code
            error_message: Error they're encountering
        """
        prompt = f"I'm getting this error: {error_message}\n\nCan you help me understand what's wrong?"

        context_data = {"user_code": code, "error": error_message}

        session_id = await self.chat_service.get_or_create_session(
            user_id=user_id, context_type="exercise", context_id=exercise_id
        )

        system_prompt = get_system_prompt("tutor")

        response = await self.chat_service.send_message(
            user_id=user_id,
            session_id=session_id,
            message=prompt,
            system_prompt=system_prompt,
            context_data=context_data,
        )

        return response

    async def get_encouragement(self, user_id: str, context: str = "") -> Dict:
        """
        Provide encouragement to student

        Args:
            user_id: Student's user ID
            context: What they're working on
        """
        prompt = f"I'm feeling a bit stuck on {context}. Any encouragement?" if context else "I'm feeling a bit stuck. Any encouragement?"

        session_id = await self.chat_service.get_or_create_session(
            user_id=user_id, context_type="encouragement"
        )

        system_prompt = get_system_prompt("tutor")

        response = await self.chat_service.send_message(
            user_id=user_id,
            session_id=session_id,
            message=prompt,
            system_prompt=system_prompt,
        )

        return response
