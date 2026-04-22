import sys
import os
from contextlib import asynccontextmanager
from pathlib import Path

# Добавляем корневую директорию в path для импортов (ostis_manager, add_defiition)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.database import engine, Base
from app.routers.auth import router as auth_router
from app.routers.calories import router as calories_router
from app.routers.reminders import router as reminders_router
from app.routers.recommendations import router as recommendations_router
from app.routers.definitions import router as definitions_router
from app.routers.rag import router as rag_router
from app.routers.weight import router as weight_router
from app.routers.achievements import router as achievements_router

FRONTEND_DIR = Path(__file__).parent / "frontend" / "dist"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    # Создаём таблицы в PostgreSQL (если их ещё нет)
    Base.metadata.create_all(bind=engine)

    # Подключаемся к OSTIS (опционально)
    try:
        from ostis_client import connect_to_ostis
        connect_to_ostis()
    except Exception as e:
        print(f"Не удалось подключиться к OSTIS: {e}")
        print("OSTIS-зависимые эндпоинты могут не работать.")

    yield
    # --- Shutdown ---


app = FastAPI(
    title="HealthGo API",
    description="API для веб-приложения здорового образа жизни. "
                "Калькулятор КБЖУ, напоминания, рекомендации, "
                "OSTIS-определения, RAG ИИ-ассистент и Google OAuth2.",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS — разрешаем фронтенду обращаться к API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- API роутеры ---
app.include_router(auth_router)
app.include_router(calories_router)
app.include_router(reminders_router)
app.include_router(recommendations_router)
app.include_router(definitions_router)
app.include_router(rag_router)
app.include_router(weight_router)
app.include_router(achievements_router)


# --- Раздача фронтенда ---
if FRONTEND_DIR.exists():
    from fastapi.responses import HTMLResponse
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="static")

    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

    def _inject_config(html: str) -> str:
        """Вставляет window.__GOOGLE_CLIENT_ID__ перед </head>."""
        config_script = (
            f'<script>window.__GOOGLE_CLIENT_ID__ = "{GOOGLE_CLIENT_ID}";</script>'
        )
        return html.replace("</head>", f"  {config_script}\n</head>", 1)

    @app.get("/{full_path:path}", tags=["Frontend"])
    async def serve_frontend(request: Request, full_path: str):
        file_path = FRONTEND_DIR / full_path
        if full_path and file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        index_path = FRONTEND_DIR / "index.html"
        html_content = index_path.read_text(encoding="utf-8")
        return HTMLResponse(_inject_config(html_content))
else:
    @app.get("/", tags=["Общее"])
    async def root():
        return {
            "message": "HealthGo API",
            "docs": "/docs",
            "note": "Frontend not found. Place built frontend in frontend/dist/",
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main_web:app", host="0.0.0.0", port=8000, reload=True)
