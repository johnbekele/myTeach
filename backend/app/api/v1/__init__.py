from fastapi import APIRouter
from app.api.v1 import auth, nodes, exercises, progress, chat

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(nodes.router)
api_router.include_router(exercises.router)
api_router.include_router(progress.router)
api_router.include_router(chat.router)
