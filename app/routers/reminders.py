"""Роутер напоминаний — данные хранятся в PostgreSQL."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Reminder, User
from app.auth import get_current_user

router = APIRouter(prefix="/api/reminders", tags=["Напоминания"])


# ─────────────── Pydantic-модели ───────────────

class ReminderCreate(BaseModel):
    title: str = Field(..., min_length=1)
    time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    days: list[str] = Field(default_factory=lambda: ["mon", "tue", "wed", "thu", "fri"])
    enabled: bool = True


class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    time: Optional[str] = None
    days: Optional[list[str]] = None
    enabled: Optional[bool] = None


class ReminderOut(BaseModel):
    id: int
    title: str
    time: str
    days: list[str]
    enabled: bool

    model_config = {"from_attributes": True}


# ─────────────── Эндпоинты ───────────────

@router.get("/", response_model=list[ReminderOut])
async def list_reminders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Получить все напоминания текущего пользователя."""
    return db.query(Reminder).filter(Reminder.user_id == current_user.id).all()


@router.post("/", response_model=ReminderOut, status_code=201)
async def create_reminder(
    data: ReminderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Создать напоминание."""
    reminder = Reminder(
        user_id=current_user.id,
        title=data.title,
        time=data.time,
        days=data.days,
        enabled=data.enabled,
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder


@router.put("/{reminder_id}", response_model=ReminderOut)
async def update_reminder(
    reminder_id: int,
    data: ReminderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Обновить напоминание."""
    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.user_id == current_user.id,
    ).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Напоминание не найдено")

    for field, value in data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(reminder, field, value)

    db.commit()
    db.refresh(reminder)
    return reminder


@router.delete("/{reminder_id}")
async def delete_reminder(
    reminder_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Удалить напоминание."""
    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.user_id == current_user.id,
    ).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Напоминание не найдено")

    db.delete(reminder)
    db.commit()
    return {"message": "Напоминание удалено", "id": reminder_id}
