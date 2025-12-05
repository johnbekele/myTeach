"""
AI Tool Handlers
Implements the actual execution logic for each AI-callable tool
"""
from typing import Dict
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime


class AIToolHandlers:
    """Handlers for AI tool execution"""

    def __init__(self, db: AsyncIOMotorDatabase, user_id: str):
        self.db = db
        self.user_id = user_id

    async def handle_display_learning_content(self, input_data: Dict) -> Dict:
        """
        Store and display AI-generated learning content

        Args:
            input_data: {title, content_type, sections}

        Returns:
            {success, content_id}
        """
        content_id = f"content_{str(ObjectId())}"

        content_doc = {
            "content_id": content_id,
            "title": input_data["title"],
            "content_type": input_data["content_type"],
            "sections": input_data["sections"],
            "created_for_user": self.user_id,
            "generated_by_ai": True,
            "created_at": datetime.utcnow()
        }

        await self.db.learning_content.insert_one(content_doc)

        return {
            "success": True,
            "content_id": content_id,
            "message": f"Content '{input_data['title']}' created and ready to display"
        }

    async def handle_generate_exercise(self, input_data: Dict) -> Dict:
        """
        Generate and store a new exercise

        Args:
            input_data: {title, description, prompt, difficulty, exercise_type, starter_code, solution, test_cases, node_id}

        Returns:
            {success, exercise_id}
        """
        exercise_id = f"ai_ex_{str(ObjectId())}"

        # Prepare test cases
        # Handle both string and list formats
        test_cases_input = input_data.get("test_cases", [])
        if isinstance(test_cases_input, str):
            # Parse JSON string
            import json
            try:
                test_cases_input = json.loads(test_cases_input)
            except json.JSONDecodeError:
                test_cases_input = []

        test_cases = []
        for tc in test_cases_input:
            test_cases.append({
                "test_id": tc["test_id"],
                "description": tc["description"],
                "input": tc.get("input", {}),
                "expected_output": tc.get("expected_output", {"stdout": ""}),
                "validation_script": tc["validation_script"]
            })

        # If no test cases provided, create a basic one using validation_script
        if not test_cases:
            test_cases.append({
                "test_id": "test_1",
                "description": "Basic functionality test",
                "input": {},
                "expected_output": {"stdout": ""},
                "validation_script": "# Test execution"
            })

        exercise_doc = {
            "exercise_id": exercise_id,
            "node_id": input_data.get("node_id", "dynamic"),
            "title": input_data["title"],
            "description": input_data["description"],
            "prompt": input_data["prompt"],
            "type": input_data["exercise_type"],
            "difficulty": input_data["difficulty"],
            "starter_code": input_data.get("starter_code", "# Your code here"),
            "solution": input_data["solution"],
            "test_cases": test_cases,
            "hints": [],
            "grading_rubric": {
                "correctness_weight": 1.0,
                "style_weight": 0.0,
                "efficiency_weight": 0.0
            },
            "generated_by_ai": True,
            "created_for_user": self.user_id,
            "created_at": datetime.utcnow()
        }

        await self.db.exercises.insert_one(exercise_doc)

        return {
            "success": True,
            "exercise_id": exercise_id,
            "message": f"Exercise '{input_data['title']}' created and ready for practice"
        }

    async def handle_navigate_to_next_step(self, input_data: Dict) -> Dict:
        """
        Control learning flow navigation

        Args:
            input_data: {action, message, target_id, auto_navigate_delay}

        Returns:
            {success, navigation}
        """
        navigation = {
            "action": input_data["action"],
            "message": input_data["message"],
            "target_id": input_data.get("target_id"),
            "auto_navigate_delay": input_data.get("auto_navigate_delay", 3)
        }

        return {
            "success": True,
            "navigation": navigation
        }

    async def handle_provide_feedback(self, input_data: Dict) -> Dict:
        """
        Provide personalized feedback

        Args:
            input_data: {feedback_type, message, strengths, improvements, next_action}

        Returns:
            {success, feedback}
        """
        feedback = {
            "feedback_type": input_data["feedback_type"],
            "message": input_data["message"],
            "strengths": input_data.get("strengths", []),
            "improvements": input_data.get("improvements", []),
            "next_action": input_data["next_action"],
            "created_at": datetime.utcnow()
        }

        return {
            "success": True,
            "feedback": feedback
        }

    async def handle_update_user_progress(self, input_data: Dict) -> Dict:
        """
        Update user's learning progress

        Args:
            input_data: {node_id, status, completion_percentage}

        Returns:
            {success}
        """
        node_id = input_data["node_id"]
        status = input_data["status"]
        completion_percentage = input_data.get("completion_percentage", 0)

        # Update user progress for this node
        await self.db.user_progress.update_one(
            {
                "user_id": self.user_id,
                "node_id": node_id
            },
            {
                "$set": {
                    "status": status,
                    "completion_percentage": completion_percentage,
                    "updated_at": datetime.utcnow()
                }
            },
            upsert=True
        )

        return {
            "success": True,
            "message": f"Progress updated: {node_id} - {status} ({completion_percentage}%)"
        }
