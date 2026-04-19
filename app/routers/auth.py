"""Роутер аутентификации: регистрация, логин, Google OAuth2, профиль."""

import os
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, EmailStr
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import User
from app.auth import (
    hash_password,
    verify_password,
    create_jwt,
    get_current_user,
)

router = APIRouter(prefix="/api/auth", tags=["Аутентификация"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")


# ─────────────── Pydantic-модели ───────────────

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr = Field(...)
    password: str = Field(..., min_length=6)
    gender: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    birth_date: Optional[str] = None
    activity_level: Optional[str] = "moderate"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    credential: str = Field(..., description="Google ID-токен")


class TokenResponse(BaseModel):
    token: str
    user: dict


class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    gender: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    birth_date: Optional[str] = None
    activity_level: Optional[str] = None
    phone: Optional[str] = None


# ─────────────── Вспомогательные функции ───────────────

def _user_to_dict(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "gender": user.gender,
        "height": user.height,
        "weight": user.weight,
        "birth_date": user.birth_date,
        "activity_level": user.activity_level,
        "google_id": user.google_id,
    }


# ─────────────── Эндпоинты ───────────────

@router.post("/register", response_model=TokenResponse)
async def register(data: RegisterRequest, db: Session = Depends(get_db)):
    """Регистрация нового пользователя (email + пароль)."""
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")

    user = User(
        email=data.email,
        name=data.name,
        password_hash=hash_password(data.password),
        gender=data.gender,
        height=data.height,
        weight=data.weight,
        birth_date=data.birth_date,
        activity_level=data.activity_level or "moderate",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_jwt(user.id, user.email, user.name)
    return TokenResponse(token=token, user=_user_to_dict(user))


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: Session = Depends(get_db)):
    """Вход по email + пароль."""
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    if not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

    token = create_jwt(user.id, user.email, user.name)
    return TokenResponse(token=token, user=_user_to_dict(user))


@router.post("/google", response_model=TokenResponse)
async def google_auth(data: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Вход / регистрация через Google OAuth2.

    Фронтенд получает Google ID-токен через Google Identity Services
    и отправляет его сюда. Бэкенд верифицирует токен и выдаёт JWT.
    """
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests

        idinfo = id_token.verify_oauth2_token(
            data.credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Невалидный Google-токен: {e}")

    google_id = idinfo["sub"]
    email = idinfo.get("email", "")
    name = idinfo.get("name", email)

    # Ищем существующего пользователя по google_id или email
    user = db.query(User).filter(
        (User.google_id == google_id) | (User.email == email)
    ).first()

    if user is None:
        # Первый вход — создаём аккаунт
        user = User(
            email=email,
            name=name,
            google_id=google_id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif user.google_id is None:
        # Привязываем Google к существующему аккаунту
        user.google_id = google_id
        db.commit()

    token = create_jwt(user.id, user.email, user.name)
    return TokenResponse(token=token, user=_user_to_dict(user))


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Получить данные текущего пользователя."""
    return _user_to_dict(current_user)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)


@router.put("/password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Смена пароля (требуется текущий пароль)."""
    if not current_user.password_hash:
        raise HTTPException(status_code=400, detail="Аккаунт через Google — пароль не задан")
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Неверный текущий пароль")
    current_user.password_hash = hash_password(data.new_password)
    db.commit()
    return {"detail": "Пароль успешно изменён"}


@router.delete("/me")
async def delete_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Удалить аккаунт текущего пользователя и все связанные данные."""
    from app.models import Reminder

    # Удаляем напоминания пользователя
    db.query(Reminder).filter(Reminder.user_id == current_user.id).delete()
    # Удаляем пользователя
    db.delete(current_user)
    db.commit()
    return {"detail": "Аккаунт успешно удалён"}


@router.put("/me")
async def update_me(
    data: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Обновить профиль текущего пользователя."""
    UPDATABLE_FIELDS = {"name", "gender", "height", "weight", "birth_date", "activity_level", "phone"}
    for field, value in data.model_dump(exclude_unset=True).items():
        if field in UPDATABLE_FIELDS and value is not None:
            setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return _user_to_dict(current_user)
