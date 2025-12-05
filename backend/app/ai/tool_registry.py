"""
Tool Registry for AI Tool Calling
Centralizes tool definitions and execution routing
"""
from typing import List, Dict
from motor.motor_asyncio import AsyncIOMotorDatabase
import json

from app.ai.tool_handlers import AIToolHandlers


class ToolRegistry:
    """Registry for AI-callable tools with Claude API definitions"""

    def __init__(self, db: AsyncIOMotorDatabase, user_id: str):
        self.db = db
        self.user_id = user_id
        self.handlers = AIToolHandlers(db, user_id)
        self.tools = {}
        self._register_tools()

    def _register_tools(self):
        """Register all available tools with their Claude API definitions"""

        # Tool 1: Display Learning Content
        self.tools["display_learning_content"] = {
            "name": "display_learning_content",
            "description": "Display educational content (notes, explanations, concept breakdowns) to the user. Use this to teach concepts before exercises or provide custom notes.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "Title of the content"
                    },
                    "content_type": {
                        "type": "string",
                        "enum": ["note", "explanation", "example", "summary", "reference"],
                        "description": "Type of educational content"
                    },
                    "sections": {
                        "type": "array",
                        "description": "Content broken into sections",
                        "items": {
                            "type": "object",
                            "properties": {
                                "heading": {
                                    "type": "string",
                                    "description": "Section heading"
                                },
                                "body": {
                                    "type": "string",
                                    "description": "Main content in Markdown format"
                                },
                                "code_example": {
                                    "type": "string",
                                    "description": "Optional code snippet"
                                },
                                "language": {
                                    "type": "string",
                                    "description": "Programming language of code example"
                                }
                            },
                            "required": ["heading", "body"]
                        }
                    }
                },
                "required": ["title", "content_type", "sections"]
            }
        }

        # Tool 2: Generate Exercise
        self.tools["generate_exercise"] = {
            "name": "generate_exercise",
            "description": "Generate a coding exercise dynamically based on the topic and user's skill level. Creates a new practice problem with test cases.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "Short, descriptive title for the exercise"
                    },
                    "description": {
                        "type": "string",
                        "description": "Brief description of what this exercise teaches"
                    },
                    "prompt": {
                        "type": "string",
                        "description": "Detailed instructions for the student"
                    },
                    "difficulty": {
                        "type": "string",
                        "enum": ["beginner", "intermediate", "advanced"],
                        "description": "Difficulty level"
                    },
                    "exercise_type": {
                        "type": "string",
                        "enum": ["python", "bash", "terraform", "pulumi", "ansible"],
                        "description": "Programming language or tool"
                    },
                    "starter_code": {
                        "type": "string",
                        "description": "Initial code template"
                    },
                    "solution": {
                        "type": "string",
                        "description": "Complete solution code"
                    },
                    "test_cases": {
                        "type": "array",
                        "description": "Test cases to validate solution",
                        "items": {
                            "type": "object",
                            "properties": {
                                "test_id": {"type": "string"},
                                "description": {"type": "string"},
                                "validation_script": {"type": "string"}
                            },
                            "required": ["test_id", "description", "validation_script"]
                        }
                    },
                    "node_id": {
                        "type": "string",
                        "description": "Associated learning node"
                    }
                },
                "required": ["title", "description", "prompt", "difficulty", "exercise_type", "solution"]
            }
        }

        # Tool 3: Navigate to Next Step
        self.tools["navigate_to_next_step"] = {
            "name": "navigate_to_next_step",
            "description": "Control the learning flow by navigating the user to the next step. Use after completing current task to automatically move them forward.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string",
                        "enum": ["show_exercise", "show_content", "complete_node", "take_break", "review_concepts"],
                        "description": "What should happen next"
                    },
                    "message": {
                        "type": "string",
                        "description": "Brief message explaining what's next"
                    },
                    "target_id": {
                        "type": "string",
                        "description": "ID of exercise or content to show"
                    },
                    "auto_navigate_delay": {
                        "type": "integer",
                        "description": "Seconds to wait before auto-navigating (default: 3)"
                    }
                },
                "required": ["action", "message"]
            }
        }

        # Tool 4: Provide Feedback
        self.tools["provide_feedback"] = {
            "name": "provide_feedback",
            "description": "Provide personalized feedback on user's exercise submission. Use after evaluating their code to guide improvement.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "feedback_type": {
                        "type": "string",
                        "enum": ["success", "partial_success", "needs_improvement", "excellent"],
                        "description": "Overall assessment"
                    },
                    "message": {
                        "type": "string",
                        "description": "Main feedback message"
                    },
                    "strengths": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "What the student did well"
                    },
                    "improvements": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Areas to improve"
                    },
                    "next_action": {
                        "type": "string",
                        "description": "What student should do next"
                    }
                },
                "required": ["feedback_type", "message", "next_action"]
            }
        }

        # Tool 5: Update User Progress
        self.tools["update_user_progress"] = {
            "name": "update_user_progress",
            "description": "Update the user's learning progress. Use when user completes exercises or milestones.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "node_id": {
                        "type": "string",
                        "description": "Learning node ID"
                    },
                    "status": {
                        "type": "string",
                        "enum": ["not_started", "in_progress", "completed"],
                        "description": "Current status"
                    },
                    "completion_percentage": {
                        "type": "integer",
                        "minimum": 0,
                        "maximum": 100,
                        "description": "Percentage completed"
                    }
                },
                "required": ["node_id", "status"]
            }
        }

    async def execute_tool(self, tool_name: str, tool_input: Dict) -> str:
        """
        Execute a tool by name and return JSON result

        Args:
            tool_name: Name of the tool to execute
            tool_input: Input parameters for the tool

        Returns:
            JSON string with tool execution result
        """
        if tool_name not in self.tools:
            return json.dumps({"error": f"Unknown tool: {tool_name}"})

        try:
            # Route to appropriate handler
            handler = getattr(self.handlers, f"handle_{tool_name}", None)

            if not handler:
                return json.dumps({"error": f"No handler for tool: {tool_name}"})

            result = await handler(tool_input)
            return json.dumps(result)

        except Exception as e:
            return json.dumps({
                "error": f"Tool execution failed: {str(e)}",
                "tool_name": tool_name
            })

    def get_tool_definitions(self) -> List[Dict]:
        """
        Get all tool definitions in Claude API format

        Returns:
            List of tool definition dictionaries
        """
        return list(self.tools.values())
