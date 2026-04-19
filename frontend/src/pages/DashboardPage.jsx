import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import { apiGet } from '../utils/api'
import './DashboardPage.css'

export default function DashboardPage() {
  const { user } = useAuth()
  const [reminders, setReminders] = useState([])
  const [recommendations, setRecommendations] = useState(null)

  useEffect(() => {
    apiGet('/api/reminders/').then(data => {
      if (Array.isArray(data)) setReminders(data.filter(r => r.enabled).slice(0, 4))
    }).catch(() => {})

    apiGet('/api/recommendations/habits').then(data => {
      if (data.habits) setRecommendations(data.habits.slice(0, 3))
    }).catch(() => {})
  }, [])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 6) return 'Доброй ночи'
    if (hour < 12) return 'Доброе утро'
    if (hour < 18) return 'Добрый день'
    return 'Добрый вечер'
  }

  const getDateString = () => {
    return new Date().toLocaleDateString('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }

  const bmi = user?.weight && user?.height
    ? (user.weight / ((user.height / 100) ** 2)).toFixed(1)
    : null

  const getBmiClass = (val) => {
    if (!val) return ''
    const n = parseFloat(val)
    if (n < 18.5) return 'bmi--under'
    if (n < 25) return 'bmi--normal'
    if (n < 30) return 'bmi--over'
    return 'bmi--obese'
  }

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="dashboard-content">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-greeting">{getGreeting()}, {user?.name || 'Пользователь'}!</h1>
            <p className="dashboard-date">{getDateString()}</p>
          </div>
          <Link to="/dashboard/account" className="dashboard-user">
            <div className="dashboard-avatar">{user?.name?.charAt(0) || 'U'}</div>
          </Link>
        </div>

        {/* Профиль — краткая инфо */}
        {user?.height && user?.weight && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-icon">📏</span>
                <h3 className="stat-card-title">Рост</h3>
              </div>
              <div className="stat-card-value">
                {user.height} <span className="stat-card-unit">см</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-icon">⚖️</span>
                <h3 className="stat-card-title">Вес</h3>
              </div>
              <div className="stat-card-value">
                {user.weight} <span className="stat-card-unit">кг</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-icon">💪</span>
                <h3 className="stat-card-title">ИМТ</h3>
              </div>
              <div className={`stat-card-value ${getBmiClass(bmi)}`}>
                {bmi}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-icon">🎯</span>
                <h3 className="stat-card-title">Активность</h3>
              </div>
              <div className="stat-card-value" style={{ fontSize: '16px' }}>
                {
                  {
                    sedentary: 'Низкая',
                    light: 'Лёгкая',
                    moderate: 'Умеренная',
                    active: 'Высокая',
                    'very-active': 'Очень высокая',
                  }[user.activity_level] || 'Умеренная'
                }
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="dashboard-grid">
          {/* Напоминания */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3 className="card-title">⏰ Активные напоминания</h3>
              <Link to="/dashboard/reminders" className="card-link">Все напоминания</Link>
            </div>
            {reminders.length > 0 ? (
              <div className="workouts-today">
                {reminders.map((r) => (
                  <div key={r.id} className="workout-today-item">
                    <div className="workout-today-time">{r.time}</div>
                    <div className="workout-today-info">
                      <span className="workout-today-title">{r.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#999', padding: '16px 0' }}>Нет активных напоминаний</p>
            )}
            <Link to="/dashboard/reminders" className="add-workout-btn">+ Добавить напоминание</Link>
          </div>

          {/* Quick Actions */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3 className="card-title">⚡ Быстрые действия</h3>
            </div>
            <div className="quick-actions">
              <Link to="/dashboard/nutrition" className="quick-action-btn">
                <span className="quick-action-icon">🍎</span>
                <span>Рассчитать КБЖУ</span>
              </Link>
              <Link to="/dashboard/workouts" className="quick-action-btn">
                <span className="quick-action-icon">🏋️</span>
                <span>Тренировки</span>
              </Link>
              <Link to="/dashboard/reminders" className="quick-action-btn">
                <span className="quick-action-icon">⏰</span>
                <span>Напоминания</span>
              </Link>
              <Link to="/dashboard/ai-assistant" className="quick-action-btn">
                <span className="quick-action-icon">🤖</span>
                <span>Спросить AI</span>
              </Link>
              <Link to="/dashboard/definitions" className="quick-action-btn">
                <span className="quick-action-icon">📖</span>
                <span>Определения</span>
              </Link>
              <Link to="/dashboard/knowledge" className="quick-action-btn">
                <span className="quick-action-icon">🧠</span>
                <span>База знаний</span>
              </Link>
            </div>
          </div>

          {/* Рекомендации дня */}
          <div className="dashboard-card dashboard-card--full">
            <div className="card-header">
              <h3 className="card-title">💡 Полезные привычки</h3>
              <Link to="/dashboard/recommendations" className="card-link">Все рекомендации</Link>
            </div>
            <div className="ai-tip">
              <div className="ai-tip-content">
                {recommendations ? (
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {recommendations.map((tip, i) => (
                      <li key={i} style={{ marginBottom: '8px', lineHeight: '1.5' }}>{tip}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="ai-tip-text">Загрузка рекомендаций...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
