"""
Chat service for managing AI conversations with Claude
"""
from typing import List, Dict, Optional
from anthropic import AsyncAnthropic
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime

from app.config import get_settings
from app.models.chat import ChatMessage, ChatSession

settings = get_settings()


class ChatService:
    """Service for handling AI chat interactions"""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = "claude-3-5-sonnet-20241022"

    async def get_or_create_session(
        self, user_id: str, context_type: str, context_id: Optional[str] = None
    ) -> str:
        """Get existing session or create new one"""
        # Try to find active session
        query = {
            "user_id": user_id,
            "context_type": context_type,
            "is_active": True,
        }
        if context_id:
            query["context_id"] = context_id

        session = await self.db.chat_sessions.find_one(query)

        if session:
            return str(session["_id"])

        # Create new session
        new_session = {
            "user_id": user_id,
            "context_type": context_type,
            "context_id": context_id,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        result = await self.db.chat_sessions.insert_one(new_session)
        return str(result.inserted_id)

    async def get_session_history(
        self, session_id: str, limit: int = 50
    ) -> List[Dict]:
        """Get chat history for a session"""
        messages = (
            await self.db.chat_messages.find({"session_id": session_id})
            .sort("created_at", -1)
            .limit(limit)
            .to_list(length=limit)
        )
        # Reverse to get chronological order
        return list(reversed(messages))

    async def send_message(
        self,
        user_id: str,
        session_id: str,
        message: str,
        system_prompt: str,
        context_data: Optional[Dict] = None,
    ) -> Dict:
        """Send message and get AI response"""
        # Save user message
        user_msg = {
            "session_id": session_id,
            "role": "user",
            "content": message,
            "created_at": datetime.utcnow(),
        }
        await self.db.chat_messages.insert_one(user_msg)

        # Get conversation history
        history = await self.get_session_history(session_id, limit=20)

        # Build messages for Claude
        messages = []
        for msg in history:
            messages.append({"role": msg["role"], "content": msg["content"]})

        # Add context to system prompt if provided
        enhanced_system = system_prompt
        if context_data:
            context_str = self._format_context(context_data)
            enhanced_system = f"{system_prompt}\n\n{context_str}"

        # Call Claude API
        response = await self.client.messages.create(
            model=self.model,
            max_tokens=2048,
            system=enhanced_system,
            messages=messages,
        )

        assistant_content = response.content[0].text

        # Save assistant response
        assistant_msg = {
            "session_id": session_id,
            "role": "assistant",
            "content": assistant_content,
            "created_at": datetime.utcnow(),
        }
        await self.db.chat_messages.insert_one(assistant_msg)

        # Update session timestamp
        await self.db.chat_sessions.update_one(
            {"_id": ObjectId(session_id)}, {"$set": {"updated_at": datetime.utcnow()}}
        )

        return {
            "message": assistant_content,
            "session_id": session_id,
            "timestamp": datetime.utcnow().isoformat(),
        }

    def _format_context(self, context_data: Dict) -> str:
        """Format context data for system prompt"""
        context_parts = ["CURRENT CONTEXT:"]

        if "exercise" in context_data:
            ex = context_data["exercise"]
            context_parts.append(f"Exercise: {ex.get('title', 'N/A')}")
            context_parts.append(f"Description: {ex.get('description', 'N/A')}")
            if "difficulty" in ex:
                context_parts.append(f"Difficulty: {ex['difficulty']}")

        if "node" in context_data:
            node = context_data["node"]
            context_parts.append(f"Topic: {node.get('title', 'N/A')}")

        if "user_code" in context_data:
            context_parts.append(f"\nUser's current code:\n```\n{context_data['user_code']}\n```")

        if "test_results" in context_data:
            results = context_data["test_results"]
            context_parts.append(f"\nTest Results: {results.get('passed', 0)}/{results.get('total', 0)} passed")

        if "progress" in context_data:
            prog = context_data["progress"]
            context_parts.append(f"User Progress: {prog.get('nodes_completed', 0)} nodes completed")

        return "\n".join(context_parts)

    async def close_session(self, session_id: str):
        """Mark session as inactive"""
        await self.db.chat_sessions.update_one(
            {"_id": ObjectId(session_id)}, {"$set": {"is_active": False}}
        )
