from sc_client.client import connect, is_connected
from sc_client.constants import sc_types
from sc_client.models import ScLinkContentType
from sc_kpm import ScKeynodes
from sc_kpm.utils import (
    search_element_by_role_relation,
    generate_link,
    generate_role_relation,
    generate_node,
    get_link_content_data
)

# Глобальные переменные как в рабочем коде
nrel_definition = None
nrel_main_idtf = None

def setup_ostis_connection():
    """Подключение к OSTIS и инициализация отношений"""
    global nrel_definition, nrel_main_idtf
    if not is_connected():
        connect("ws://localhost:8090/ws_json")
    nrel_definition = ScKeynodes.resolve("nrel_definition", sc_types.NODE_ROLE)
    nrel_main_idtf = ScKeynodes.resolve("nrel_main_idtf", sc_types.NODE_ROLE)

def create_node_in_ostis(node_name, definition_text):
    """Создает узел в OSTIS (на основе рабочего кода)"""
    global nrel_definition, nrel_main_idtf
    
    try:
        # 1. Создаем узел в OSTIS
        new_node = generate_node(sc_types.NODE_CONST_CLASS)
        
        # 2. Добавляем определение в OSTIS
        definition_link = generate_link(content=definition_text, content_type=ScLinkContentType.STRING)
        generate_role_relation(new_node, definition_link, nrel_definition)
        
        # 3. Добавляем основной идентификатор в OSTIS
        main_idtf_link = generate_link(content=node_name, content_type=ScLinkContentType.STRING)
        generate_role_relation(new_node, main_idtf_link, nrel_main_idtf)
        
        print(f"✅ Узел '{node_name}' создан в OSTIS")
        return new_node
        
    except Exception as e:
        print(f"❌ Ошибка создания узла в OSTIS: {e}")
        return None

def extract_data_from_ostis(node_name, node):
    """Извлекает данные из OSTIS узла"""
    global nrel_definition
    
    try:
        content_parts = []
        metadata = {
            "node_name": node_name,
            "source": "ostis_kb", 
            "type": "knowledge"
        }
        
        # 1. Ищем определение в OSTIS
        definition_link = search_element_by_role_relation(node, nrel_definition)
        if definition_link.is_valid():
            definition_content = get_link_content_data(definition_link)
            content_parts.append(f"Определение: {definition_content}")
            metadata["has_definition"] = True
            print(f"✅ Найдено определение в OSTIS: {definition_content[:50]}...")
        else:
            metadata["has_definition"] = False
            print(f"❌ Определение не найдено в OSTIS для узла {node_name}")
        
        # 2. Формируем контент только если есть данные в OSTIS
        if content_parts:
            page_content = "\n".join(content_parts)
            return {
                "content": page_content,
                "metadata": metadata
            }
        else:
            print(f"❌ Не удалось извлечь данные из OSTIS для узла '{node_name}'")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка извлечения данных из OSTIS: {e}")
        return None

def find_node_in_ostis(node_name):
    """Ищет узел в OSTIS"""
    try:
        node = ScKeynodes.resolve(node_name, sc_types.NODE_CONST_CLASS)
        return node if node.is_valid() else None
    except Exception as e:
        print(f"❌ Ошибка поиска узла в OSTIS: {e}")
        return None

# Инициализируем подключение при импорте
setup_ostis_connection()