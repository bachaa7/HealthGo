"""Роутер истории веса: добавление, просмотр, удаление записей."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import User, WeightRecord
from app.auth import get_current_user

router = APIRouter(prefix="/api/weight", tags=["История веса"])


class WeightCreate(BaseModel):
    weight: float = Field(..., ge=20, le=300, description="Вес в кг (20-300)")
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="Дата YYYY-MM-DD")


class WeightOut(BaseModel):
    id: int
    weight: float
    date: str

    class Config:
        from_attributes = True


@router.post("/", response_model=WeightOut)
async def add_weight(
    data: WeightCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Добавить запись веса. Если запись на эту дату уже есть — обновить."""
    existing = db.query(WeightRecord).filter(
        WeightRecord.user_id == current_user.id,
        WeightRecord.date == data.date,
    ).first()

    if existing:
        existing.weight = data.weight
        db.commit()
        db.refresh(existing)
        return existing

    record = WeightRecord(
        user_id=current_user.id,
        weight=data.weight,
        date=data.date,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    # Обновить текущий вес пользователя
    current_user.weight = data.weight
    db.commit()

    return record


@router.get("/", response_model=list[WeightOut])
async def get_weight_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Получить историю веса (отсортировано по дате)."""
    records = db.query(WeightRecord).filter(
        WeightRecord.user_id == current_user.id
    ).order_by(WeightRecord.date.asc()).all()
    return records


@router.delete("/{record_id}")
async def delete_weight(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Удалить запись веса."""
    record = db.query(WeightRecord).filter(
        WeightRecord.id == record_id,
        WeightRecord.user_id == current_user.id,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    db.delete(record)
    db.commit()
    return {"detail": "Запись удалена"}
