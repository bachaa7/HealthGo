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
    weight_records = relationship("WeightRecord", back_populates="user", cascade="all, delete-orphan")
    achievements = relationship("UserAchievement", back_populates="user", cascade="all, delete-orphan")


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    time = Column(String, nullable=False)       # "HH:MM"
    days = Column(JSON, default=list)            # ["mon","tue",...]
    enabled = Column(Boolean, default=True)

    user = relationship("User", back_populates="reminders")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class WeightRecord(Base):
    __tablename__ = "weight_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    weight = Column(Float, nullable=False)
    date = Column(String, nullable=False)  # "YYYY-MM-DD"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="weight_records")


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    code = Column(String, nullable=False)  # код ачивки из справочника
    earned_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="achievements")
