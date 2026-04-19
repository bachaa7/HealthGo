from fastapi import APIRouter

router = APIRouter(prefix="/api/recommendations", tags=["Рекомендации"])


FOOD_RECOMMENDATIONS = {
    "breakfast": {
        "time": "07:00-09:00",
        "title": "Завтрак",
        "items": [
            "Овсянка на воде или молоке с фруктами",
            "Яйца (варёные или омлет)",
            "Тост из цельнозернового хлеба + авокадо",
        ],
        "macros": "30% углеводы, 30% белки, 40% жиры",
    },
    "lunch": {
        "time": "12:00-14:00",
        "title": "Обед",
        "items": [
            "Отварная куриная грудка / рыба",
            "Рис, киноа, гречка",
            "Овощной салат с оливковым маслом",
        ],
        "macros": "40% углеводы, 35% белки, 25% жиры",
    },
    "dinner": {
        "time": "18:00-20:00",
        "title": "Ужин",
        "items": [
            "Творог с ягодами или запечённые овощи с белком",
            "Суп-пюре или омлет с зеленью",
        ],
        "macros": "20% углеводы, 50% белки, 30% жиры",
    },
    "snack": {
        "time": "Между приёмами пищи",
        "title": "Перекус",
        "items": [
            "Орехи, яблоко, кефир, банан",
            "Энергетические батончики без сахара",
        ],
        "macros": None,
    },
}

HEALTHY_HABITS = [
    "Прогулка на свежем воздухе — 30 мин/день",
    "Пить 1.5-2 литра воды в день",
    "Ложиться до 23:00 и спать не менее 7-8 часов",
    "Цифровой детокс: 1 час без телефона в день",
    "Медитация/дыхательные практики — 5-10 мин",
    "Есть 4-5 раз в день, без переедания",
    "Вести дневник питания и настроения (по желанию)",
]


@router.get("/food")
async def get_food_recommendations():
    """Рекомендации по питанию."""
    return {"recommendations": FOOD_RECOMMENDATIONS}


@router.get("/habits")
async def get_healthy_habits():
    """Полезные привычки для здоровья."""
    return {"habits": HEALTHY_HABITS}


@router.get("/all")
async def get_all_recommendations():
    """Все рекомендации."""
    return {
        "food": FOOD_RECOMMENDATIONS,
        "habits": HEALTHY_HABITS,
    }
