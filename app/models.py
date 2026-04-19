import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=True)  # None для Google OAuth
    google_id = Column(String, unique=True, nullable=True)

    gender = Column(String, nullable=True)  # "male" / "female"
    height = Column(Float, nullable=True)   # см
    weight = Column(Float, nullable=True)   # кг
    birth_date = Column(String, nullable=True)  # "YYYY-MM-DD"
    activity_level = Column(String, default="moderate")

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    reminders = relationship("Reminder", back_populates="user", cascade="all, delete-orphan")


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    time = Column(String, nullable=False)       # "HH:MM"
    days = Column(JSON, default=list)            # ["mon","tue",...]
    enabled = Column(Boolean, default=True)

    user = relationship("User", back_populates="reminders")
