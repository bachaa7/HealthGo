import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { apiGet } from '../utils/api'
import './RecommendationsPage.css'

export default function RecommendationsPage() {
  const [activeTab, setActiveTab] = useState('food')
  const [food, setFood] = useState(null)
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiGet('/api/recommendations/all')
      .then(data => {
        setFood(data.food)
        setHabits(data.habits)
      })
      .catch((err) => console.error('Не удалось загрузить рекомендации:', err.message))
      .finally(() => setLoading(false))
  }, [])

  const mealIcons = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍏' }

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="dashboard-content">
        <h1 className="page-title">Рекомендации</h1>

        <div className="rec-tabs">
          <button className={`rec-tab ${activeTab === 'food' ? 'rec-tab--active' : ''}`} onClick={() => setActiveTab('food')}>
            🍽️ Питание
          </button>
          <button className={`rec-tab ${activeTab === 'habits' ? 'rec-tab--active' : ''}`} onClick={() => setActiveTab('habits')}>
            💚 Привычки
          </button>
        </div>

        {loading ? (
          <p className="rec-loading">Загрузка рекомендаций...</p>
        ) : activeTab === 'food' && food ? (
          <div className="rec-food-grid">
            {Object.entries(food).map(([key, meal]) => (
              <div key={key} className="rec-meal-card">
                <div className="rec-meal-header">
                  <span className="rec-meal-icon">{mealIcons[key] || '🍴'}</span>
                  <div>
                    <h3 className="rec-meal-title">{meal.title}</h3>
                    <span className="rec-meal-time">{meal.time}</span>
                  </div>
                </div>
                <ul className="rec-meal-items">
                  {meal.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
                {meal.macros && (
                  <div className="rec-meal-macros">{meal.macros}</div>
                )}
              </div>
            ))}
          </div>
        ) : activeTab === 'habits' ? (
          <div className="rec-habits-list">
            {habits.map((habit, i) => (
              <div key={i} className="rec-habit-item">
                <div className="rec-habit-check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                </div>
                <span>{habit}</span>
              </div>
            ))}
          </div>
        ) : null}
      </main>
    </div>
  )
}
