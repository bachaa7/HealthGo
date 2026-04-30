import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv(encoding="utf-8")
print(repr(os.getenv("DATABASE_URL")))
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://postgres:12345@localhost:5432/healthgo"
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI Depends — выдаёт сессию БД и закрывает после запроса."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
