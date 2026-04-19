from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.calorie_calculator import (
    calculate_bmr,
    calculate_calories,
    adjust_calories_for_goal,
    calculate_bmi,
    calculate_macronutrients,
)

router = APIRouter(prefix="/api/calories", tags=["Калькулятор КБЖУ"])


class CalorieRequest(BaseModel):
    age: int = Field(..., gt=0, description="Возраст")
    gender: str = Field(..., pattern="^[mMwW]$", description="Пол (M/W)")
    weight: float = Field(..., gt=0, description="Вес в кг")
    height: float = Field(..., gt=0, description="Рост в см")
    activity_level: int = Field(..., ge=1, le=3, description="Уровень активности (1-3)")
    goal: str = Field(..., description="Цель: похудение / набор / поддержание")


class CalorieResponse(BaseModel):
    calories: float
    goal: str
    bmi: float
    bmi_classification: str
    proteins: float
    fats: float
    carbs: float


@router.post("/calculate", response_model=CalorieResponse)
async def calculate(data: CalorieRequest):
    """Рассчитать КБЖУ, ИМТ и макронутриенты."""
    bmr = calculate_bmr(data.age, data.gender, data.weight, data.height)
    calories = calculate_calories(bmr, data.activity_level)
    adjusted = adjust_calories_for_goal(calories, data.goal)
    bmi, classification = calculate_bmi(data.weight, data.height)
    proteins, fats, carbs = calculate_macronutrients(adjusted, data.gender)

    return CalorieResponse(
        calories=round(adjusted, 2),
        goal=data.goal,
        bmi=bmi,
        bmi_classification=classification,
        proteins=proteins,
        fats=fats,
        carbs=carbs,
    )
