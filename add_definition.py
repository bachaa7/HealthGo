from sc_client.constants import sc_types
from sc_client.models import ScLinkContentType
from sc_kpm import ScKeynodes
from sc_kpm.utils import generate_link, generate_role_relation

async def add_definition_to_concept(idtf: str, definition_text: str) -> bool:
    """
    Добавляет определение к узлу по его идентификатору (idtf) в SC-базе.

    :param idtf: Идентификатор понятия (например: "личная_гигиена")
    :param definition_text: Текст определения
    :return: True, если успешно добавлено, иначе False
    """
    try:
        # Разрешаем или создаем узел с данным идентификатором
        node = ScKeynodes.resolve(idtf, sc_types.NODE_CONST_CLASS)
        if not node.is_valid():
            return False

        # Получаем идентификатор роли nrel_definition
        nrel_definition = ScKeynodes.resolve("nrel_definition", sc_types.NODE_ROLE)

        # Создаем ссылку с текстом определения
        definition_link = generate_link(
            content=definition_text,
            content_type=ScLinkContentType.STRING
        )

        if not definition_link.is_valid():
            return False

        # Создаем ролевую связь: node —[nrel_definition]→ definition_link
        generate_role_relation(node, definition_link, nrel_definition)
        return True

    except Exception as e:
        print(f"Ошибка при добавлении определения: {e}")
        return False
