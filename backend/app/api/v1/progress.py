from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.dependencies import get_db, get_current_user_id
from app.models.progress import ProgressResponse, StatsResponse

router = APIRouter(prefix="/progress", tags=["Progress"])


@router.get("", response_model=dict)
async def get_progress(
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get user progress"""

    progress = await db.progress_state.find_one({"user_id": user_id})

    if not progress:
        # Return empty progress
        return {
            "current_node": None,
            "completed_nodes": [],
            "unlocked_nodes": [],
            "overall_stats": {
                "total_exercises_completed": 0,
                "total_time_spent": 0,
                "success_rate": 0.0,
                "streak_days": 0,
                "last_activity": None
            },
            "node_progress": {}
        }

    return {
        "current_node": progress.get("current_node_id"),
        "completed_nodes": progress.get("completed_nodes", []),
        "unlocked_nodes": progress.get("unlocked_nodes", []),
        "overall_stats": progress.get("overall_stats", {}),
        "node_progress": progress.get("node_progress", {})
    }


@router.get("/stats", response_model=dict)
async def get_stats(
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get detailed user statistics"""

    # Get user memory (weaknesses and strengths)
    memory_cursor = db.user_memory.find({"user_id": user_id})
    memories = await memory_cursor.to_list(length=100)

    strengths = []
    weaknesses = []

    for mem in memories:
        if mem["memory_type"] == "strength":
            strengths.append({
                "concept": mem["concept"],
                "proficiency": 100 - (mem.get("severity", 1) * 10)
            })
        elif mem["memory_type"] in ["weakness", "confusion"]:
            weaknesses.append({
                "concept": mem["concept"],
                "confusion_count": mem.get("frequency", 1)
            })

    # Get learning patterns
    progress = await db.progress_state.find_one({"user_id": user_id})
    settings = {}
    if progress:
        user = await db.users.find_one({"_id": user_id})
        if user:
            settings = user.get("settings", {})

    learning_patterns = {
        "best_time_of_day": None,  # TODO: Calculate from activity logs
        "average_session_length": 45,  # TODO: Calculate from sessions
        "preferred_pace": settings.get("pace_preference", "medium")
    }

    return {
        "strengths": strengths[:10],  # Top 10
        "weaknesses": weaknesses[:10],  # Top 10
        "learning_patterns": learning_patterns
    }
