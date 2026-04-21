# HealthGo — Веб-приложение для здорового образа жизни

Интеллектуальный веб-помощник для отслеживания здоровья: калькулятор КБЖУ, AI-ассистент на базе RAG, напоминания, рекомендации по питанию и привычкам, интеграция с базой знаний OSTIS. Аутентификация через Google OAuth2 и email/пароль.

## Стек технологий

| Компонент | Технология |
|-----------|-----------|
| Бэкенд | Python 3.10+, FastAPI, Uvicorn |
| Фронтенд | React 18, Vite, React Router 6 |
| База данных | PostgreSQL + SQLAlchemy 2.0 |
| Аутентификация | Google OAuth2 + JWT (python-jose) |
| AI/RAG | LangChain + Ollama (llama3.2) + ChromaDB |
| База знаний | OSTIS (py-sc-client, py-sc-kpm) |
| Пароли | bcrypt |

## Структура проекта

```
Zoch_bot/
  main_web.py              # Точка входа FastAPI
  ostis_client.py           # Подключение к OSTIS
  ostis_manager.py          # Управление узлами OSTIS
  add_defiition.py          # Добавление определений в OSTIS
  requirements.txt
  .env                      # Переменные окружения
  README.md

  app/
    __init__.py
    auth.py                 # JWT-утилиты, хеширование паролей
    database.py             # SQLAlchemy engine, SessionLocal
    models.py               # Модели User, Reminder, WeightRecord, PasswordResetToken
    calorie_calculator.py   # Формула Миффлина-Сан Жеора
    rag_system.py           # RAG: LangChain + Ollama
    rag_data_manager.py     # ChromaDB: векторный поиск
    routers/
      auth.py               # /api/auth/* — регистрация, логин, Google OAuth
      calories.py           # /api/calories/* — расчёт КБЖУ
      reminders.py          # /api/reminders/* — CRUD напоминаний
      recommendations.py    # /api/recommendations/* — рекомендации
      definitions.py        # /api/definitions/* — OSTIS определения
      rag.py                # /api/rag/* — AI-ассистент, база знаний
      weight.py             # /api/weight/* — история веса
    email_service.py        # Отправка писем через Gmail SMTP

  frontend/
    src/
      App.jsx               # Маршрутизация + ProtectedRoute
      main.jsx              # Точка входа React
      context/
        AuthContext.jsx      # Контекст аутентификации
        ThemeContext.jsx      # Тёмная/светлая тема
      utils/
        api.js               # Обёртка fetch с JWT
      components/
        Sidebar.jsx, Button.jsx, Input.jsx, Card.jsx, Logo.jsx
      pages/
        LandingPage.jsx      # Главная (лендинг)
        LoginPage.jsx        # Вход + Google Sign-In
        RegisterPage.jsx     # Регистрация (шаг 1)
        RegisterParamsPage.jsx # Регистрация (шаг 2 — параметры)
        DashboardPage.jsx    # Дашборд со статистикой
        NutritionPage.jsx    # Питание + калькулятор КБЖУ
        ChatPage.jsx         # AI-ассистент (RAG)
        RemindersPage.jsx    # Напоминания
        WorkoutsPage.jsx     # Тренировки
        AccountPage.jsx      # Профиль + настройки
        RecommendationsPage.jsx # Рекомендации по питанию и привычкам
        DefinitionsPage.jsx  # Определения из OSTIS
        KnowledgePage.jsx    # База знаний (RAG)
    dist/                    # Собранный фронтенд (раздаётся через FastAPI)
```

## Установка и запуск

### 1. Клонировать репозиторий

```bash
git clone <url>
cd Zoch_bot
```

### 2. Создать виртуальное окружение и установить зависимости

```bash
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Linux/macOS
pip install -r requirements.txt
```

### 3. Настроить PostgreSQL

Создайте базу данных:

```sql
CREATE DATABASE healthgo;
```

### 4. Настроить переменные окружения

Отредактируйте `.env`:

```env
DATABASE_URL=postgresql://postgres:ваш_пароль@localhost:5432/healthgo
JWT_SECRET=ваш-секретный-ключ-для-jwt
GOOGLE_CLIENT_ID=ваш-google-client-id
```

### 5. Собрать фронтенд

```bash
cd frontend
npm install
npm run build
cd ..
```

### 6. Запустить сервер

```bash
python main_web.py
```

Приложение доступно на `http://localhost:8000`.
API документация (Swagger): `http://localhost:8000/docs`.

## Настройка Google OAuth2

Чтобы работал вход через Google:

1. Перейдите на [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект (или выберите существующий)
3. Перейдите в **APIs & Services** → **Credentials**
4. Нажмите **Create Credentials** → **OAuth 2.0 Client ID**
5. Тип приложения: **Web Application**
6. Authorized JavaScript origins: `http://localhost:8000`
7. Authorized redirect URIs: `http://localhost:8000`
8. Скопируйте **Client ID** и вставьте в `.env` как `GOOGLE_CLIENT_ID`

### Как работает Google OAuth2 в проекте

**Схема работы:**

```
Пользователь → Нажимает "Войти через Google" на LoginPage
           → Google Identity Services показывает окно входа
           → Пользователь выбирает аккаунт Google
           → Google возвращает ID-токен (JWT от Google)
           → Фронтенд отправляет токен на POST /api/auth/google
           → Бэкенд верифицирует токен через google.oauth2.id_token
           → Если пользователь новый — создаётся запись в PostgreSQL
           → Бэкенд выдаёт свой JWT-токен
           → Фронтенд сохраняет JWT в localStorage
           → Все последующие запросы идут с заголовком Authorization: Bearer <token>
```

**Ключевые файлы:**

- `app/routers/auth.py` — эндпоинт `POST /api/auth/google` принимает Google ID-токен, верифицирует его через библиотеку `google-auth`, создаёт/находит пользователя и выдаёт JWT
- `app/auth.py` — функции `create_jwt()` и `get_current_user()` (FastAPI Depends) для защиты эндпоинтов
- `frontend/src/context/AuthContext.jsx` — хранит состояние аутентификации, токен и данные пользователя
- `frontend/src/pages/LoginPage.jsx` — загружает Google Identity Services скрипт и рендерит кнопку входа
- `frontend/src/utils/api.js` — автоматически добавляет JWT-токен ко всем API-запросам

## API эндпоинты

### Аутентификация (`/api/auth`)

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/auth/register` | Регистрация (email + пароль + параметры) |
| POST | `/api/auth/login` | Вход по email + пароль |
| POST | `/api/auth/logout` | Выход — удаляет httpOnly cookie |
| POST | `/api/auth/google` | Вход/регистрация через Google OAuth2 |
| GET | `/api/auth/me` | Получить данные текущего пользователя |
| PUT | `/api/auth/me` | Обновить профиль |
| PUT | `/api/auth/password` | Смена пароля (требуется текущий) |
| DELETE | `/api/auth/me` | Удалить аккаунт и все данные |
| POST | `/api/auth/forgot-password` | Запросить письмо для восстановления пароля |
| POST | `/api/auth/reset-password` | Установить новый пароль по токену из письма |

### Калькулятор КБЖУ (`/api/calories`)

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/calories/calculate` | Расчёт калорий, ИМТ, макронутриентов |

Параметры: `age`, `gender` (M/W), `weight` (кг), `height` (см), `activity_level` (1-3), `goal` (похудение/набор/поддержание).

Формула: Миффлина-Сан Жеора + коэффициент активности + корректировка по цели (±20%).

### Напоминания (`/api/reminders`)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/reminders/` | Список напоминаний (требует JWT) |
| POST | `/api/reminders/` | Создать напоминание |
| PUT | `/api/reminders/{id}` | Обновить напоминание |
| DELETE | `/api/reminders/{id}` | Удалить напоминание |

Данные хранятся в PostgreSQL. Каждое напоминание привязано к пользователю через JWT.

### Рекомендации (`/api/recommendations`)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/recommendations/food` | Рекомендации по питанию |
| GET | `/api/recommendations/habits` | Полезные привычки |
| GET | `/api/recommendations/all` | Все рекомендации |

### Определения — OSTIS (`/api/definitions`)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/definitions/concepts` | Список предопределённых понятий |
| GET | `/api/definitions/lookup/{id}` | Поиск определения в OSTIS |
| POST | `/api/definitions/add` | Добавить определение в OSTIS |

Требует запущенный OSTIS sc-server на `ws://localhost:8090/ws_json`.

### RAG ИИ-ассистент (`/api/rag`)

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/rag/ask` | Задать вопрос AI-ассистенту |
| POST | `/api/rag/knowledge/create` | Добавить знание (OSTIS + ChromaDB) |
| GET | `/api/rag/knowledge/list` | Список всех знаний |
| GET | `/api/rag/categories` | Категории знаний |

RAG-система: вопрос → поиск по ChromaDB (top-3) → формирование контекста → генерация ответа через Ollama (llama3.2).

### История веса (`/api/weight`)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/weight/` | История веса пользователя (сортировка по дате) |
| POST | `/api/weight/` | Добавить/обновить запись веса (по дате) |
| DELETE | `/api/weight/{id}` | Удалить запись |

При добавлении новой записи автоматически обновляется текущий вес пользователя в профиле. График динамики веса отображается во вкладке «Статистика» в аккаунте.

## Страницы фронтенда

| Маршрут | Страница | Описание |
|---------|----------|----------|
| `/` | LandingPage | Приветственная страница |
| `/login` | LoginPage | Вход (email + Google OAuth) |
| `/register` | RegisterPage | Регистрация (шаг 1) |
| `/register-params` | RegisterParamsPage | Параметры тела (шаг 2, также для Google-входа) |
| `/forgot-password` | ForgotPasswordPage | Запрос письма восстановления пароля |
| `/reset-password?token=...` | ResetPasswordPage | Установка нового пароля по ссылке из email |
| `/privacy` | PrivacyPage | Политика конфиденциальности |
| `/dashboard` | DashboardPage | Главный дашборд |
| `/dashboard/nutrition` | NutritionPage | Питание + калькулятор КБЖУ |
| `/dashboard/ai-assistant` | ChatPage | AI-чат (RAG) |
| `/dashboard/workouts` | WorkoutsPage | Тренировки с таймером |
| `/dashboard/reminders` | RemindersPage | Напоминания (CRUD) |
| `/dashboard/account` | AccountPage | Профиль + статистика (ИМТ, график веса) + настройки |
| `/dashboard/recommendations` | RecommendationsPage | Рекомендации по питанию и привычкам |
| `/dashboard/definitions` | DefinitionsPage | Определения из OSTIS |
| `/dashboard/knowledge` | KnowledgePage | База знаний (RAG) |

Все маршруты `/dashboard/*` защищены — требуют аутентификацию.

## Описание модулей

### Калькулятор КБЖУ (`app/calorie_calculator.py`)
Расчёт базового метаболизма по формуле Миффлина-Сан Жеора, TDEE с учётом активности, корректировка по цели. Возвращает калории, ИМТ с классификацией (7 категорий), макронутриенты (Б/Ж/У).

### RAG-система (`app/rag_system.py` + `app/rag_data_manager.py`)
- **rag_data_manager**: управляет ChromaDB (векторная БД), добавляет документы, ищет по похожести
- **rag_system**: получает вопрос → ищет релевантные документы → формирует контекст → отправляет в Ollama (llama3.2) → возвращает ответ + источники

### OSTIS-интеграция (`ostis_client.py` + `ostis_manager.py`)
Подключение к sc-server через WebSocket. Создание семантических узлов, добавление определений через ролевые отношения (`nrel_definition`). Опциональная зависимость — приложение работает без OSTIS.

### История веса (`app/routers/weight.py` + `app/models.py`)
Модель `WeightRecord` (user_id, weight, date) хранит измерения веса в PostgreSQL. При добавлении записи обновляется текущий вес в профиле пользователя. На фронтенде — линейный график динамики веса во вкладке «Статистика».

### Восстановление пароля (`app/email_service.py` + `app/routers/auth.py`)
Gmail SMTP отправляет письмо со ссылкой сброса пароля. Модель `PasswordResetToken` хранит одноразовые токены со сроком действия 1 час. При запросе генерируется токен `secrets.token_urlsafe(32)`, сохраняется в БД и отправляется пользователю в HTML-письме. По ссылке `/reset-password?token=...` пользователь вводит новый пароль.

### Аутентификация (`app/auth.py` + `app/routers/auth.py`)
JWT-токены (python-jose), хеширование паролей (bcrypt), Google OAuth2 (google-auth). Модели User, Reminder и WeightRecord хранятся в PostgreSQL через SQLAlchemy.

## Переменные окружения (.env)

| Переменная | Описание | Пример |
|-----------|----------|--------|
| `DATABASE_URL` | URL подключения к PostgreSQL | `postgresql://postgres:pass@localhost:5432/healthgo` |
| `JWT_SECRET` | Секретный ключ для JWT-токенов | `my-super-secret-key` |
| `GOOGLE_CLIENT_ID` | Client ID из Google Cloud Console | `123456.apps.googleusercontent.com` |
| `SMTP_EMAIL` | Gmail для отправки писем восстановления пароля | `healthgo.noreply@gmail.com` |
| `SMTP_PASSWORD` | App Password Gmail (16 символов, не обычный пароль) | `abcdefghijklmnop` |
| `FRONTEND_URL` | Адрес фронтенда для формирования ссылок в письмах | `http://localhost:8000` |

## Опциональные зависимости

- **OSTIS sc-server** (`ws://localhost:8090/ws_json`) — для определений и создания знаний
- **Ollama** с моделью `llama3.2` — для AI-ассистента (RAG)
- **Google Cloud Console** проект — для Google OAuth2
