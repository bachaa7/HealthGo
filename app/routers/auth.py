"""Роутер аутентификации: регистрация, логин, Google OAuth2, профиль."""

import os
import secrets
import datetime
from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field, EmailStr
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import User, PasswordResetToken
from app.auth import (
    hash_password,
    verify_password,
    create_jwt,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_DAYS,
    COOKIE_NAME,
)
from app.email_service import send_password_reset_email
from app.achievements import check_on_login

router = APIRouter(prefix="/api/auth", tags=["Аутентификация"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")


# ─────────────── Pydantic-модели ───────────────

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr = Field(...)
    password: str = Field(..., min_length=6, max_length=128)
    gender: Optional[str] = Field(None, pattern="^(male|female)$")
    height: Optional[float] = Field(None, ge=50, le=250, description="Рост в см (50-250)")
    weight: Optional[float] = Field(None, ge=20, le=300, description="Вес в кг (20-300)")
    birth_date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$", description="Формат YYYY-MM-DD")
    activity_level: Optional[str] = Field("moderate", pattern="^(sedentary|light|moderate|active|very-active)$")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    credential: str = Field(..., description="Google ID-токен")


class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    photo: Optional[str] = Field(None, max_length=500)  # ПУТЬ К ФОТО
    gender: Optional[str] = Field(None, pattern="^(male|female)$")
    height: Optional[float] = Field(None, ge=50, le=250)
    weight: Optional[float] = Field(None, ge=20, le=300)
    birth_date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    activity_level: Optional[str] = Field(None, pattern="^(sedentary|light|moderate|active|very-active)$")


# ─────────────── Вспомогательные функции ───────────────

def _set_token_cookie(response: Response, token: str):
    """Установить JWT в httpOnly cookie."""
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,           # JavaScript не может прочитать
        secure=False,            # True для HTTPS в продакшене
        samesite="lax",          # Защита от CSRF
        max_age=ACCESS_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,  # 7 дней в секундах
        path="/",
    )


def _user_to_dict(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "phone": user.phone,
        "photo": user.photo,
        "gender": user.gender,
        "height": user.height,
        "weight": user.weight,
        "birth_date": user.birth_date,
        "activity_level": user.activity_level,
        "google_id": user.google_id,
    }


# ─────────────── Эндпоинты ───────────────

@router.post("/register")
async def register(data: RegisterRequest, response: Response, db: Session = Depends(get_db)):
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
    _set_token_cookie(response, token)
    check_on_login(db, user)
    return {"user": _user_to_dict(user)}


@router.post("/login")
async def login(data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """Вход по email + пароль."""
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    if not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

    token = create_jwt(user.id, user.email, user.name)
    _set_token_cookie(response, token)
    check_on_login(db, user)
    return {"user": _user_to_dict(user)}


@router.post("/google")
async def google_auth(data: GoogleAuthRequest, response: Response, db: Session = Depends(get_db)):
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
    _set_token_cookie(response, token)
    check_on_login(db, user)
    return {"user": _user_to_dict(user)}


@router.post("/logout")
async def logout(response: Response):
    """Выход — удаляет cookie."""
    response.delete_cookie(key=COOKIE_NAME, path="/")
    return {"detail": "Вы вышли из системы"}


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
    from app.models import Reminder, WeightRecord

    # Удаляем все данные пользователя
    db.query(WeightRecord).filter(WeightRecord.user_id == current_user.id).delete()
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
    UPDATABLE_FIELDS = {"email", "name", "phone", "photo", "gender", "height", "weight", "birth_date", "activity_level"}
    
    raw_data = data.model_dump()
    
    for field, value in raw_data.items():
        if field in UPDATABLE_FIELDS and value is not None and value != '':
            setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    check_on_login(db, current_user)
    return _user_to_dict(current_user)


# ─────────────── Восстановление пароля ───────────────

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6, max_length=128)


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Запрос на восстановление пароля.

    Всегда возвращает 200, даже если email не найден — чтобы нельзя было
    проверять существование аккаунтов перебором.
    """
    user = db.query(User).filter(User.email == data.email).first()

    if user and user.password_hash:
        # Создаём токен (действителен 1 час)
        token = secrets.token_urlsafe(32)
        expires = datetime.datetime.utcnow() + datetime.timedelta(hours=1)

        # Удаляем старые неиспользованные токены этого пользователя
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used == False,
        ).delete()

        reset_record = PasswordResetToken(
            user_id=user.id,
            token=token,
            expires_at=expires,
        )
        db.add(reset_record)
        db.commit()

        # Отправляем email (в отдельном потоке было бы правильнее,
        # но для простоты — синхронно)
        send_password_reset_email(user.email, user.name, token)

    return {"detail": "Если email зарегистрирован, на него отправлено письмо с инструкцией"}


@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Сброс пароля по токену из email."""
    reset_record = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == data.token,
        PasswordResetToken.used == False,
    ).first()

    if not reset_record:
        raise HTTPException(status_code=400, detail="Недействительная или уже использованная ссылка")

    if reset_record.expires_at < datetime.datetime.utcnow():
        raise HTTPException(status_code=400, detail="Срок действия ссылки истёк. Запросите новую")

    user = db.query(User).filter(User.id == reset_record.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="Пользователь не найден")

    # Меняем пароль и помечаем токен использованным
    user.password_hash = hash_password(data.new_password)
    reset_record.used = True
    db.commit()

    return {"detail": "Пароль успешно изменён. Теперь вы можете войти с новым паролем"}
