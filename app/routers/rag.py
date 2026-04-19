from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/rag", tags=["RAG (ИИ-ассистент)"])

KNOWLEDGE_CATEGORIES = [
    {"id": "nutrition", "name": "Питание"},
    {"id": "sleep", "name": "Сон"},
    {"id": "activity", "name": "Активность"},
    {"id": "psychology", "name": "Психология"},
    {"id": "health", "name": "Здоровье"},
    {"id": "general", "name": "Общее"},
]


class AskQuestionRequest(BaseModel):
    question: str = Field(..., min_length=1, description="Вопрос о здоровье")


class AskQuestionResponse(BaseModel):
    question: str
    answer: str
    sources: list[str] | None = None


class CreateKnowledgeRequest(BaseModel):
    title: str = Field(..., min_length=1, description="Название темы")
    content: str = Field(..., min_length=1, description="Содержание знания")
    category: str = Field(default="general", description="Категория")


class KnowledgeItem(BaseModel):
    title: str
    category: str
    content_preview: str
    source: str


@router.post("/ask", response_model=AskQuestionResponse)
async def ask_question(data: AskQuestionRequest):
    """Задать вопрос ИИ-ассистенту (RAG)."""
    try:
        from app.rag_system import rag_system

        answer, sources = await rag_system.ask_question(data.question)

        return AskQuestionResponse(
            question=data.question,
            answer=answer,
            sources=sources,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при обработке вопроса: {e}")


@router.post("/knowledge/create")
async def create_knowledge(data: CreateKnowledgeRequest):
    """Создать новое знание (сохраняется в OSTIS + векторную БД)."""
    try:
        from ostis_manager import create_node_in_ostis, extract_data_from_ostis
        from app.rag_data_manager import rag_data_manager
        import asyncio

        # Формируем OSTIS-идентификатор
        ostis_idtf = data.title.replace(" ", "_").replace("-", "_").lower()

        # 1. Сохраняем в OSTIS
        node = create_node_in_ostis(ostis_idtf, data.content)
        if node is None:
            raise HTTPException(
                status_code=500,
                detail="Не удалось сохранить в OSTIS систему. Попробуйте другой идентификатор.",
            )

        await asyncio.sleep(1)

        # 2. Извлекаем из OSTIS в векторную БД
        extracted_data = extract_data_from_ostis(ostis_idtf, node)

        vector_success = False
        if extracted_data:
            vector_success = await rag_data_manager.add_knowledge_item(
                title=ostis_idtf,
                content=extracted_data["content"],
                category=data.category,
            )

        return {
            "success": True,
            "title": data.title,
            "ostis_id": ostis_idtf,
            "category": data.category,
            "ostis_saved": True,
            "vector_db_saved": vector_success,
            "message": (
                "Знание успешно добавлено в OSTIS и векторную БД"
                if vector_success
                else "Знание добавлено в OSTIS, но не в векторную БД"
            ),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка: {e}")


@router.get("/knowledge/list")
async def list_knowledge():
    """Получить все знания из векторной БД."""
    try:
        from app.rag_data_manager import rag_data_manager

        items = await rag_data_manager.get_all_knowledge()
        return {"knowledge": items, "total": len(items)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка: {e}")


@router.get("/categories")
async def get_categories():
    """Получить доступные категории знаний."""
    return {"categories": KNOWLEDGE_CATEGORIES}
