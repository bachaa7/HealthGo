"""Роутер достижений."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.auth import get_current_user
from app.achievements import (
    get_user_achievements,
    get_recent_user_achievements,
    ACHIEVEMENTS,
)

router = APIRouter(prefix="/api/achievements", tags=["Достижения"])


@router.get("/")
async def list_achievements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Все ачивки с пометкой полученные/нет для текущего пользователя."""
    return {
        "achievements": get_user_achievements(db, current_user.id),
        "total": len(ACHIEVEMENTS),
    }


@router.get("/recent")
async def recent_achievements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Последние полученные ачивки (для уведомлений)."""
    return {"recent": get_recent_user_achievements(db, current_user.id, limit=5)}
