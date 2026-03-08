from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    goal: Mapped["DailyGoal"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    entries: Mapped[list["FoodEntry"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class DailyGoal(Base):
    __tablename__ = "daily_goals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    kcals: Mapped[int] = mapped_column(Integer, default=2000)
    fats_g: Mapped[float] = mapped_column(Float, default=65.0)
    saturated_fats_g: Mapped[float] = mapped_column(Float, default=20.0)
    carbs_g: Mapped[float] = mapped_column(Float, default=300.0)
    proteins_g: Mapped[float] = mapped_column(Float, default=50.0)
    sodium_mg: Mapped[float] = mapped_column(Float, default=2300.0)

    user: Mapped["User"] = relationship(back_populates="goal")


class FoodEntry(Base):
    __tablename__ = "food_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    food_name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    model_used: Mapped[str] = mapped_column(String(100), nullable=False)
    entry_date: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    kcals: Mapped[int] = mapped_column(Integer, nullable=False)
    fats_g: Mapped[float] = mapped_column(Float, nullable=False)
    saturated_fats_g: Mapped[float] = mapped_column(Float, nullable=False)
    carbs_g: Mapped[float] = mapped_column(Float, nullable=False)
    proteins_g: Mapped[float] = mapped_column(Float, nullable=False)
    sodium_mg: Mapped[float] = mapped_column(Float, nullable=False)
    ai_response_raw: Mapped[str] = mapped_column(Text, nullable=True)

    user: Mapped["User"] = relationship(back_populates="entries")
