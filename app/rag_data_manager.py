from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
import asyncio

class RAGDataManager:
    def __init__(self):
        self.embeddings = OllamaEmbeddings(model="mxbai-embed-large:latest")
        self.vector_store = Chroma(
            collection_name="health_knowledge_base",
            persist_directory="./rag_vector_db",
            embedding_function=self.embeddings
        )
        self.is_initialized = False
    
    async def initialize(self):
        if not self.is_initialized:
            self.is_initialized = True
            print("✅ RAG Data Manager инициализирован")
    
    async def add_knowledge_item(self, title: str, content: str, category: str = "general"):
        """Добавляет элемент знаний в векторную БД"""
        await self.initialize()
        
        document = Document(
            page_content=content,
            metadata={
                "title": title,
                "category": category,
                "source": "user_created",
                "type": "health_knowledge"
            }
        )
        
        try:
            self.vector_store.add_documents(documents=[document])
            print(f"✅ Знание '{title}' добавлено в векторную БД")
            return True
        except Exception as e:
            print(f"❌ Ошибка добавления знания: {e}")
            return False
    
    async def get_all_knowledge(self):
        """Получает все знания из векторной БД"""
        await self.initialize()
        
        try:
            # Получаем все документы из ChromaDB
            all_docs = self.vector_store.get()
            
            knowledge_items = []
            if all_docs and 'documents' in all_docs:
                for i, doc in enumerate(all_docs['documents']):
                    metadata = all_docs['metadatas'][i] if 'metadatas' in all_docs and i < len(all_docs['metadatas']) else {}
                    knowledge_items.append({
                        "title": metadata.get('title', f'Знание {i+1}'),
                        "category": metadata.get('category', 'general'),
                        "content_preview": doc[:100] + "..." if len(doc) > 100 else doc,
                        "source": metadata.get('source', 'user_created')
                    })
            
            return knowledge_items
        except Exception as e:
            print(f"❌ Ошибка получения знаний: {e}")
            return []
    
    async def search_knowledge(self, query: str, k: int = 3):
        """Ищет знания по запросу"""
        await self.initialize()
        
        try:
            docs = self.vector_store.similarity_search(query, k=k)
            return docs
        except Exception as e:
            print(f"❌ Ошибка поиска: {e}")
            return []

# Глобальный экземпляр
rag_data_manager = RAGDataManager()