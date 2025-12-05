"""
Chat API endpoints for AI tutor interactions
"""
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from typing import Optional, List

from app.dependencies import get_db, get_current_user_id
from app.ai.agents.tutor_agent import TutorAgent
from app.ai.agents.hint_agent import HintAgent
from app.ai.chat_service import ChatService

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatMessageRequest(BaseModel):
    message: str
    context_type: Optional[str] = "general"  # "exercise", "node", "general"
    context_id: Optional[str] = None
    user_code: Optional[str] = None


class HintRequest(BaseModel):
    exercise_id: str
    hint_level: int
    user_code: Optional[str] = ""


@router.post("/message")
async def send_chat_message(
    request: ChatMessageRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Send a message to the AI tutor"""
    tutor = TutorAgent(db)

    # Build context data if provided
    context_data = None
    if request.user_code:
        context_data = {"user_code": request.user_code}

    # If we have a context_id, fetch relevant details
    if request.context_id:
        if request.context_type == "exercise":
            exercise = await db.exercises.find_one({"_id": request.context_id})
            if exercise:
                context_data = context_data or {}
                context_data["exercise"] = exercise
        elif request.context_type == "node":
            node = await db.nodes.find_one({"_id": request.context_id})
            if node:
                context_data = context_data or {}
                context_data["node"] = node

    response = await tutor.ask_question(
        user_id=user_id,
        question=request.message,
        context_type=request.context_type,
        context_id=request.context_id,
        context_data=context_data,
    )

    return response


@router.post("/hint")
async def get_hint(
    request: HintRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get a progressive hint for an exercise"""
    hint_agent = HintAgent(db)

    # Get user's attempt count for this exercise
    attempts = await db.attempts.count_documents(
        {"user_id": user_id, "exercise_id": request.exercise_id}
    )

    try:
        hint = await hint_agent.generate_hint(
            user_id=user_id,
            exercise_id=request.exercise_id,
            hint_level=request.hint_level,
            user_code=request.user_code,
            previous_attempts=attempts,
        )
        return hint
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/history/{session_id}")
async def get_chat_history(
    session_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get chat history for a session"""
    chat_service = ChatService(db)

    # Verify session belongs to user
    session = await db.chat_sessions.find_one({"_id": session_id})
    if not session or session["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Session not found")

    history = await chat_service.get_session_history(session_id)

    # Convert ObjectIds to strings for JSON serialization
    for msg in history:
        if "_id" in msg:
            msg["_id"] = str(msg["_id"])

    return {"session_id": session_id, "messages": history}


@router.get("/sessions")
async def get_user_sessions(
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
    limit: int = 10,
):
    """Get user's recent chat sessions"""
    sessions = (
        await db.chat_sessions.find({"user_id": user_id})
        .sort("updated_at", -1)
        .limit(limit)
        .to_list(length=limit)
    )

    # Convert ObjectIds to strings
    for session in sessions:
        session["_id"] = str(session["_id"])

    return {"sessions": sessions}


@router.post("/sessions/{session_id}/close")
async def close_session(
    session_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Close a chat session"""
    # Verify session belongs to user
    session = await db.chat_sessions.find_one({"_id": session_id})
    if not session or session["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Session not found")

    chat_service = ChatService(db)
    await chat_service.close_session(session_id)

    return {"message": "Session closed", "session_id": session_id}
