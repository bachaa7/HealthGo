from langchain_ollama.llms import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from app.rag_data_manager import rag_data_manager
from ostis_manager import find_node_in_ostis, extract_data_from_ostis  # Новый импорт

class SimpleRAGSystem:
    def __init__(self):
        self.llm = OllamaLLM(model="llama3.2:latest")
        self.chain = self._create_chain()
    
    def _create_chain(self):
        template = """
        Ты - полезный ассистент по здоровому образу жизни. Отвечай на вопросы 
        ИСКЛЮЧИТЕЛЬНО на основе предоставленной информации. Не придумывай ничего от себя.

        Информация из базы знаний:
        {context}

        Вопрос: {question}

        Ответ (основанный только на информации выше):
        """
        prompt = ChatPromptTemplate.from_template(template)
        return prompt | self.llm

    async def ask_question(self, question: str):
        """Задает вопрос - использует векторную БД"""
        print(f"🤔 Вопрос: {question}")
        
        # Ищем в векторной БД
        relevant_docs = await rag_data_manager.search_knowledge(question)
        
        # Генерируем ответ
        if not relevant_docs:
            return (
                "❌ В базе знаний нет информации по этому вопросу.\n\n"
                "Вы можете добавить информацию через '➕ Добавить знание для ИИ'",
                None
            )
        
        # Объединяем контекст
        context = "\n\n".join([doc.page_content for doc in relevant_docs])
        sources = [doc.metadata.get('title', 'Неизвестно') for doc in relevant_docs]
        
        try:
            answer = self.chain.invoke({
                "context": context,
                "question": question
            })
            return answer, sources
        except Exception as e:
            return f"❌ Ошибка при генерации ответа: {str(e)}", None

# Глобальный экземпляр
rag_system = SimpleRAGSystem()