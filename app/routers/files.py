"""Роутер для загрузки файлов (фото профиля)."""

import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.models import User
from app.database import get_db

router = APIRouter(prefix="/api/files", tags=["Файлы"])

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_SIZE = 5 * 1024 * 1024


@router.post("/upload-photo")
async def upload_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Загрузить фото профиля."""
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, "Недопустимый формат")
    
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(400, "Слишком большой")
    
    await file.seek(0)
    
    file_ext = ext
    file_name = f"{current_user.id}_{uuid.uuid4().hex[:8]}{file_ext}"
    file_path = UPLOAD_DIR / file_name
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    current_user.photo = f"/uploads/{file_name}"
    db.commit()
    db.refresh(current_user)
    
    return {"photo": f"/uploads/{file_name}"}