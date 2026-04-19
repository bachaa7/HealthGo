from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/definitions", tags=["Определения (OSTIS)"])


# Предопределённые понятия (из keyboards.py бота)
PREDEFINED_CONCEPTS = [
    {"id": "food_recomend", "name": "Рекомендация по питанию"},
    {"id": "personal_hygiene", "name": "Личная гигиена"},
    {"id": "nrel_avoidance_of_bad_habits", "name": "Избежание вредных привычек"},
    {"id": "nrel_hydration", "name": "Гидратация"},
    {"id": "nrel_sleep", "name": "Сон"},
    {"id": "nrel_nutrition", "name": "Питание"},
    {"id": "physical_activity", "name": "Активность"},
    {"id": "nrel_hygiene", "name": "Гигиена"},
    {"id": "mental_health", "name": "Психическое здоровье"},
]


class AddDefinitionRequest(BaseModel):
    idtf: str = Field(..., description="Идентификатор понятия")
    definition: str = Field(..., description="Текст определения")


class DefinitionResponse(BaseModel):
    idtf: str
    definition: str | None = None
    error: str | None = None


@router.get("/concepts")
async def get_predefined_concepts():
    """Получить список предопределённых понятий."""
    return {"concepts": PREDEFINED_CONCEPTS}


@router.get("/lookup/{concept_id}", response_model=DefinitionResponse)
async def lookup_definition(concept_id: str):
    """Найти определение понятия в OSTIS."""
    try:
        from sc_client.client import is_connected, connect
        from sc_client.constants import sc_types
        from sc_kpm import ScKeynodes
        from sc_kpm.utils import search_element_by_role_relation, get_link_content_data

        if not is_connected():
            connect("ws://localhost:8090/ws_json")

        node = ScKeynodes.resolve(concept_id, sc_types.NODE_CONST_CLASS)
        if not node.is_valid():
            raise HTTPException(status_code=404, detail=f"Узел '{concept_id}' не найден")

        nrel_definition = ScKeynodes.resolve("nrel_definition", sc_types.NODE_ROLE)
        link = search_element_by_role_relation(node, nrel_definition)

        if link.is_valid():
            content = get_link_content_data(link)
            return DefinitionResponse(idtf=concept_id, definition=str(content))
        else:
            return DefinitionResponse(idtf=concept_id, error="У этого понятия нет определения")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при получении определения: {e}")


@router.post("/add")
async def add_definition(data: AddDefinitionRequest):
    """Добавить определение понятия в OSTIS."""
    try:
        from add_definition import add_definition_to_concept

        success = await add_definition_to_concept(data.idtf, data.definition)
        if success:
            return {"message": f"Понятие '{data.idtf}' с определением успешно добавлено", "success": True}
        else:
            raise HTTPException(status_code=500, detail=f"Не удалось добавить определение для '{data.idtf}'")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка: {e}")
