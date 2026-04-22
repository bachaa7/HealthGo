"""Справочник достижений и логика выдачи."""

from sqlalchemy.orm import Session
from app.models import User, UserAchievement, WeightRecord, Reminder


# ─────────────── Справочник ачивок ───────────────

ACHIEVEMENTS = [
    # Первые шаги
    {"code": "first_login",      "icon": "🚀", "name": "Первый шаг",       "description": "Первый вход в систему",                "category": "start"},
    {"code": "profile_filled",   "icon": "📝", "name": "Новичок",          "description": "Заполнил полный профиль",               "category": "start"},
    {"code": "first_ai_question","icon": "❓", "name": "Любознательный",   "description": "Задал первый вопрос ИИ-ассистенту",     "category": "start"},
    {"code": "first_definition", "icon": "📖", "name": "Исследователь",    "description": "Посмотрел первое определение OSTIS",    "category": "start"},
    {"code": "first_knowledge",  "icon": "🧠", "name": "Вклад в знания",   "description": "Добавил первую запись в базу знаний",   "category": "start"},
    {"code": "first_reminder",   "icon": "⏰", "name": "Планировщик",      "description": "Создал первое напоминание",             "category": "start"},
    {"code": "first_weight",     "icon": "⚖️", "name": "Взвесился",        "description": "Добавил первую запись веса",            "category": "start"},

    # Прогресс
    {"code": "weight_3",         "icon": "🔥", "name": "На волне",         "description": "3 записи веса",                         "category": "progress"},
    {"code": "weight_7",         "icon": "💪", "name": "Постоянство",      "description": "7 записей веса",                        "category": "progress"},
    {"code": "weight_30",        "icon": "🏆", "name": "Железная воля",    "description": "30 записей веса",                       "category": "progress"},
    {"code": "ai_10",            "icon": "🎓", "name": "Мудрец",           "description": "10 вопросов ИИ-ассистенту",             "category": "progress"},
    {"code": "knowledge_5",      "icon": "📚", "name": "Энциклопедист",    "description": "Добавил 5 записей в базу знаний",       "category": "progress"},
    {"code": "reminders_5",      "icon": "✅", "name": "Дисциплина",       "description": "5 активных напоминаний одновременно",   "category": "progress"},

    # Здоровье
    {"code": "lost_1kg",         "icon": "📉", "name": "Минус килограмм",  "description": "Сбросил 1 кг от первой записи",         "category": "health"},
    {"code": "lost_5kg",         "icon": "🌱", "name": "Новый старт",      "description": "Сбросил 5 кг от первой записи",         "category": "health"},
    {"code": "healthy_bmi",      "icon": "💚", "name": "Здоровая норма",   "description": "ИМТ в диапазоне 18.5–25",               "category": "health"},

    # Забавные
    {"code": "night_owl",        "icon": "🌙", "name": "Полуночник",       "description": "Зашёл в систему после 00:00",           "category": "fun"},
    {"code": "early_bird",       "icon": "🌅", "name": "Жаворонок",        "description": "Зашёл в систему до 6:00",               "category": "fun"},
]

ACHIEVEMENTS_BY_CODE = {a["code"]: a for a in ACHIEVEMENTS}


# ─────────────── Вспомогательные функции ───────────────

def _has(db: Session, user_id: int, code: str) -> bool:
    """Проверить есть ли у пользователя ачивка."""
    return db.query(UserAchievement).filter(
        UserAchievement.user_id == user_id,
        UserAchievement.code == code,
    ).first() is not None


def _grant(db: Session, user_id: int, code: str) -> bool:
    """Выдать ачивку пользователю. Возвращает True если выдана сейчас, False если уже была."""
    if code not in ACHIEVEMENTS_BY_CODE:
        return False
    if _has(db, user_id, code):
        return False
    record = UserAchievement(user_id=user_id, code=code)
    db.add(record)
    db.commit()
    return True


# ─────────────── Проверки при разных действиях ───────────────

def check_on_login(db: Session, user: User) -> list[str]:
    """Вызывается при входе пользователя. Возвращает коды новых ачивок."""
    new_codes = []
    import datetime

    if _grant(db, user.id, "first_login"):
        new_codes.append("first_login")

    # Полный профиль
    if user.height and user.weight and user.gender and user.birth_date:
        if _grant(db, user.id, "profile_filled"):
            new_codes.append("profile_filled")

    # Время суток
    now = datetime.datetime.now()
    if now.hour < 6 and _grant(db, user.id, "early_bird"):
        new_codes.append("early_bird")
    if now.hour >= 0 and now.hour < 5 and _grant(db, user.id, "night_owl"):
        # между 0 и 5 утра
        pass
    if now.hour == 0 or now.hour >= 23:
        if _grant(db, user.id, "night_owl"):
            new_codes.append("night_owl")

    # ИМТ в норме
    if user.height and user.weight:
        bmi = user.weight / ((user.height / 100) ** 2)
        if 18.5 <= bmi < 25:
            if _grant(db, user.id, "healthy_bmi"):
                new_codes.append("healthy_bmi")

    return new_codes


def check_on_weight_added(db: Session, user: User) -> list[str]:
    """Вызывается при добавлении записи веса."""
    new_codes = []

    count = db.query(WeightRecord).filter(WeightRecord.user_id == user.id).count()

    if count >= 1 and _grant(db, user.id, "first_weight"):
        new_codes.append("first_weight")
    if count >= 3 and _grant(db, user.id, "weight_3"):
        new_codes.append("weight_3")
    if count >= 7 and _grant(db, user.id, "weight_7"):
        new_codes.append("weight_7")
    if count >= 30 and _grant(db, user.id, "weight_30"):
        new_codes.append("weight_30")

    # Похудение
    records = db.query(WeightRecord).filter(
        WeightRecord.user_id == user.id
    ).order_by(WeightRecord.date.asc()).all()

    if len(records) >= 2:
        first = records[0].weight
        current = records[-1].weight
        diff = first - current  # положительное = сброс
        if diff >= 1 and _grant(db, user.id, "lost_1kg"):
            new_codes.append("lost_1kg")
        if diff >= 5 and _grant(db, user.id, "lost_5kg"):
            new_codes.append("lost_5kg")

    # ИМТ после обновления веса
    if user.height and user.weight:
        bmi = user.weight / ((user.height / 100) ** 2)
        if 18.5 <= bmi < 25:
            if _grant(db, user.id, "healthy_bmi"):
                new_codes.append("healthy_bmi")

    return new_codes


def check_on_ai_question(db: Session, user: User) -> list[str]:
    """Вызывается при вопросе ИИ. Счётчик хранится в кастомной логике —
    подсчитаем через ачивку first_ai_question и отдельный счётчик."""
    new_codes = []

    if _grant(db, user.id, "first_ai_question"):
        new_codes.append("first_ai_question")

    # Для ачивки "10 вопросов" нужен счётчик. Используем UserAchievement
    # с особым кодом-счётчиком, но проще — считаем число выданных first_ai_question
    # не подходит (она одна). Сделаем проще: если у пользователя >= 10 записей
    # в логе действий. Вместо этого используем специальный код-счётчик.
    # Для простоты: считаем через отдельную таблицу или поле.
    # Сделаем без счётчика — по времени последней выдачи.

    # Альтернатива: храним счётчик в отдельном коде "ai_counter_N"
    # Для простоты прототипа — привязываем к числу напоминаний/знаний/...
    # а для "10 вопросов" считаем специально.

    # Используем хак: создаём записи с кодом "_ai_q_counter"
    # но проще — добавим поле в User или храним в отдельной таблице.
    # Для прототипа: считаем число UserAchievement с префиксом "_counter_ai"

    _counter_code = "_counter_ai_question"
    counter_record = UserAchievement(user_id=user.id, code=_counter_code)
    db.add(counter_record)
    db.commit()
    count = db.query(UserAchievement).filter(
        UserAchievement.user_id == user.id,
        UserAchievement.code == _counter_code,
    ).count()

    if count >= 10 and _grant(db, user.id, "ai_10"):
        new_codes.append("ai_10")

    return new_codes


def check_on_definition_viewed(db: Session, user: User) -> list[str]:
    """Вызывается при просмотре определения OSTIS."""
    new_codes = []
    if _grant(db, user.id, "first_definition"):
        new_codes.append("first_definition")
    return new_codes


def check_on_knowledge_added(db: Session, user: User) -> list[str]:
    """Вызывается при добавлении записи в базу знаний."""
    new_codes = []

    if _grant(db, user.id, "first_knowledge"):
        new_codes.append("first_knowledge")

    # Счётчик
    _counter_code = "_counter_knowledge"
    counter_record = UserAchievement(user_id=user.id, code=_counter_code)
    db.add(counter_record)
    db.commit()
    count = db.query(UserAchievement).filter(
        UserAchievement.user_id == user.id,
        UserAchievement.code == _counter_code,
    ).count()

    if count >= 5 and _grant(db, user.id, "knowledge_5"):
        new_codes.append("knowledge_5")

    return new_codes


def check_on_reminder_changed(db: Session, user: User) -> list[str]:
    """Вызывается при создании/изменении напоминания."""
    new_codes = []

    if _grant(db, user.id, "first_reminder"):
        new_codes.append("first_reminder")

    # 5 активных
    active_count = db.query(Reminder).filter(
        Reminder.user_id == user.id,
        Reminder.enabled == True,
    ).count()

    if active_count >= 5 and _grant(db, user.id, "reminders_5"):
        new_codes.append("reminders_5")

    return new_codes


# ─────────────── Запросы ───────────────

def get_user_achievements(db: Session, user_id: int) -> list[dict]:
    """Вернуть список всех ачивок с пометкой полученные/нет."""
    earned = {
        r.code: r.earned_at
        for r in db.query(UserAchievement).filter(
            UserAchievement.user_id == user_id
        ).all()
    }

    result = []
    for ach in ACHIEVEMENTS:
        is_earned = ach["code"] in earned
        result.append({
            **ach,
            "earned": is_earned,
            "earned_at": earned.get(ach["code"]).isoformat() if is_earned else None,
        })
    return result


def get_recent_user_achievements(db: Session, user_id: int, limit: int = 5) -> list[dict]:
    """Последние полученные ачивки."""
    records = db.query(UserAchievement).filter(
        UserAchievement.user_id == user_id,
        ~UserAchievement.code.startswith("_counter_"),  # исключаем счётчики
    ).order_by(UserAchievement.earned_at.desc()).limit(limit).all()

    return [
        {
            **ACHIEVEMENTS_BY_CODE[r.code],
            "earned_at": r.earned_at.isoformat(),
        }
        for r in records
        if r.code in ACHIEVEMENTS_BY_CODE
    ]
