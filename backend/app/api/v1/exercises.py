from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
from typing import Optional
from bson import ObjectId
from app.dependencies import get_db, get_current_user_id
from app.models.exercise import (
    ExerciseResponse,
    ExerciseSubmit,
    ExerciseResultResponse,
    ExerciseAttemptInDB
)
from app.services.grading_service import grade_exercise

router = APIRouter(prefix="/exercises", tags=["Exercises"])


@router.get("/{exercise_id}", response_model=dict)
async def get_exercise(
    exercise_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get exercise details"""

    exercise = await db.exercises.find_one({"exercise_id": exercise_id})
    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found"
        )

    # Get user's attempt history
    attempts = await db.exercise_attempts.find({
        "user_id": user_id,
        "exercise_id": exercise_id
    }).to_list(length=100)

    best_score = 0
    if attempts:
        best_score = max(att.get("score", 0) for att in attempts)

    return {
        "exercise": {
            "exercise_id": exercise["exercise_id"],
            "title": exercise["title"],
            "description": exercise["description"],
            "prompt": exercise["prompt"],
            "starter_code": exercise.get("starter_code", ""),
            "type": exercise["type"],
            "difficulty": exercise["difficulty"]
        },
        "user_progress": {
            "attempts": len(attempts),
            "best_score": best_score,
            "completed": best_score >= 70
        }
    }


@router.post("/{exercise_id}/submit", response_model=dict)
async def submit_exercise(
    exercise_id: str,
    submission: ExerciseSubmit,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Submit exercise code for grading"""

    # Verify exercise exists
    exercise = await db.exercises.find_one({"exercise_id": exercise_id})
    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found"
        )

    # Count attempts
    attempt_count = await db.exercise_attempts.count_documents({
        "user_id": user_id,
        "exercise_id": exercise_id
    })

    # Create attempt record
    attempt = {
        "_id": str(ObjectId()),
        "user_id": user_id,
        "exercise_id": exercise_id,
        "attempt_number": attempt_count + 1,
        "submitted_code": submission.code,
        "execution_result": None,
        "test_results": [],
        "score": 0,
        "feedback": "Grading in progress...",
        "ai_comments": "",
        "submitted_at": datetime.utcnow(),
        "graded_at": None
    }

    result = await db.exercise_attempts.insert_one(attempt)
    submission_id = str(result.inserted_id)

    # Queue grading job in background
    background_tasks.add_task(
        grade_exercise,
        db,
        submission_id,
        exercise_id,
        submission.code,
        submission.language
    )

    return {
        "submission_id": submission_id,
        "status": "grading",
        "message": "Code submitted for grading"
    }


@router.get("/{exercise_id}/result/{submission_id}", response_model=dict)
async def get_exercise_result(
    exercise_id: str,
    submission_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get exercise grading result"""

    attempt = await db.exercise_attempts.find_one({
        "_id": submission_id,
        "user_id": user_id,
        "exercise_id": exercise_id
    })

    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )

    # Determine status
    status_value = "completed" if attempt.get("graded_at") else "grading"

    # Get exercise for hints
    exercise = await db.exercises.find_one({"exercise_id": exercise_id})
    hints_available = len(exercise.get("hints", [])) if exercise else 0

    return {
        "submission_id": str(attempt["_id"]),
        "status": status_value,
        "score": attempt.get("score", 0),
        "passed": attempt.get("score", 0) >= 70,
        "test_results": attempt.get("test_results", []),
        "feedback": attempt.get("feedback", ""),
        "next_step": "Continue to next exercise" if attempt.get("score", 0) >= 70 else "Review feedback and try again",
        "hints_available": hints_available
    }


@router.post("/{exercise_id}/hint", response_model=dict)
async def get_hint(
    exercise_id: str,
    hint_number: int,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get a hint for an exercise"""

    exercise = await db.exercises.find_one({"exercise_id": exercise_id})
    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found"
        )

    hints = exercise.get("hints", [])
    if hint_number < 1 or hint_number > len(hints):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid hint number"
        )

    hint = hints[hint_number - 1]

    return {
        "hint": hint["text"],
        "hints_remaining": len(hints) - hint_number
    }
