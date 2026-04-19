import { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import Button from '../components/Button'
import './WorkoutsPage.css'

const workoutsData = [
  { id: 1, name: 'Кардио тренировка', duration: 30, level: 'Средний', type: 'cardio', calories: 300, image: '🏃' },
  { id: 2, name: 'Силовая тренировка', duration: 45, level: 'Продвинутый', type: 'strength', calories: 400, image: '💪' },
  { id: 3, name: 'Йога', duration: 60, level: 'Начинающий', type: 'flexibility', calories: 150, image: '🧘' },
  { id: 4, name: 'HIIT', duration: 20, level: 'Продвинутый', type: 'cardio', calories: 350, image: '🔥' },
  { id: 5, name: 'Пилатес', duration: 45, level: 'Средний', type: 'flexibility', calories: 200, image: '🤸' },
  { id: 6, name: 'Бег на улице', duration: 40, level: 'Средний', type: 'cardio', calories: 450, image: '👟' },
  { id: 7, name: 'Тренировка пресса', duration: 15, level: 'Начинающий', type: 'strength', calories: 100, image: '🏋️' },
  { id: 8, name: 'Растяжка', duration: 30, level: 'Начинающий', type: 'flexibility', calories: 80, image: '🤲' },
]

const levelColors = {
  'Начинающий': '#4CAF50',
  'Средний': '#FF9800',
  'Продвинутый': '#F44336',
}

export default function WorkoutsPage() {
  const [filter, setFilter] = useState('all')
  const [completedWorkouts, setCompletedWorkouts] = useState(() => {
    const saved = localStorage.getItem('completedWorkouts')
    return saved ? JSON.parse(saved) : []
  })
  const [activeWorkout, setActiveWorkout] = useState(null)
  const [timer, setTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    localStorage.setItem('completedWorkouts', JSON.stringify(completedWorkouts))
  }, [completedWorkouts])

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev + 1)
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [isTimerRunning])

  const filteredWorkouts = filter === 'all' 
    ? workoutsData 
    : workoutsData.filter(w => w.type === filter)

  const handleStartWorkout = (workout) => {
    setActiveWorkout(workout)
    setTimer(0)
    setIsTimerRunning(true)
  }

  const handleFinishWorkout = () => {
    if (activeWorkout) {
      const completed = {
        ...activeWorkout,
        completedAt: Date.now(),
        actualDuration: timer,
      }
      setCompletedWorkouts([...completedWorkouts, completed])
    }
    setIsTimerRunning(false)
    setActiveWorkout(null)
    setTimer(0)
  }

  const handlePauseResume = () => {
    setIsTimerRunning(!isTimerRunning)
  }

  const handleCancelWorkout = () => {
    setIsTimerRunning(false)
    setActiveWorkout(null)
    setTimer(0)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getWeekStats = () => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const weekWorkouts = completedWorkouts.filter(w => w.completedAt > weekAgo)
    return {
      count: weekWorkouts.length,
      calories: weekWorkouts.reduce((sum, w) => sum + w.calories, 0),
      minutes: weekWorkouts.reduce((sum, w) => sum + w.actualDuration, 0),
    }
  }

  const stats = getWeekStats()

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="dashboard-content">
        <h1 className="page-title">Тренировки</h1>

        {/* Stats */}
        <div className="workouts-stats">
          <div className="stat-card">
            <span className="stat-value">{stats.count}</span>
            <span className="stat-label">Тренировок за неделю</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.calories}</span>
            <span className="stat-label">Сожжено ккал</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{Math.floor(stats.minutes / 60)}ч {stats.minutes % 60}м</span>
            <span className="stat-label">Время тренировок</span>
          </div>
        </div>

        {/* Filters */}
        <div className="workout-filters">
          <button 
            className={`workout-filter ${filter === 'all' ? 'workout-filter--active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Все
          </button>
          <button 
            className={`workout-filter ${filter === 'cardio' ? 'workout-filter--active' : ''}`}
            onClick={() => setFilter('cardio')}
          >
            🏃 Кардио
          </button>
          <button 
            className={`workout-filter ${filter === 'strength' ? 'workout-filter--active' : ''}`}
            onClick={() => setFilter('strength')}
          >
            💪 Силовые
          </button>
          <button 
            className={`workout-filter ${filter === 'flexibility' ? 'workout-filter--active' : ''}`}
            onClick={() => setFilter('flexibility')}
          >
            🧘 Гибкость
          </button>
        </div>

        {/* Workouts Grid */}
        <div className="workouts-grid">
          {filteredWorkouts.map((workout) => {
            const isCompleted = completedWorkouts.some(w => w.id === workout.id && w.completedAt > Date.now() - 24 * 60 * 60 * 1000)
            return (
              <div key={workout.id} className={`workout-card ${isCompleted ? 'workout-card--completed' : ''}`}>
                <div className="workout-image">{workout.image}</div>
                <div className="workout-body">
                  <h3 className="workout-name">{workout.name}</h3>
                  <div className="workout-meta">
                    <span className="workout-duration">⏱ {workout.duration} мин</span>
                    <span 
                      className="workout-level"
                      style={{ backgroundColor: levelColors[workout.level] + '20', color: levelColors[workout.level] }}
                    >
                      {workout.level}
                    </span>
                  </div>
                  <div className="workout-calories">🔥 {workout.calories} ккал</div>
                </div>
                {isCompleted ? (
                  <div className="workout-completed-badge">✓ Выполнено</div>
                ) : (
                  <button className="workout-btn" onClick={() => handleStartWorkout(workout)}>
                    Начать
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Timer Modal */}
        {activeWorkout && (
          <div className="timer-overlay">
            <div className="timer-modal">
              <div className="timer-header">
                <span className="timer-emoji">{activeWorkout.image}</span>
                <h2 className="timer-title">{activeWorkout.name}</h2>
              </div>
              
              <div className="timer-display">
                <span className="timer-time">{formatTime(timer)}</span>
                <span className="timer-target">из {activeWorkout.duration} мин</span>
              </div>

              <div className="timer-progress">
                <div 
                  className="timer-progress-bar"
                  style={{ width: `${Math.min((timer / (activeWorkout.duration * 60)) * 100, 100)}%` }}
                />
              </div>

              <div className="timer-stats">
                <div className="timer-stat">
                  <span className="timer-stat-value">{Math.floor((timer / 60) * (activeWorkout.calories / activeWorkout.duration))}</span>
                  <span className="timer-stat-label">Сожжено ккал</span>
                </div>
                <div className="timer-stat">
                  <span className="timer-stat-value">{activeWorkout.level}</span>
                  <span className="timer-stat-label">Уровень</span>
                </div>
              </div>

              <div className="timer-actions">
                <Button variant="secondary" onClick={handlePauseResume}>
                  {isTimerRunning ? '⏸ Пауза' : '▶ Продолжить'}
                </Button>
                <Button variant="primary" onClick={handleFinishWorkout}>
                  ✓ Завершить
                </Button>
                <Button variant="danger" onClick={handleCancelWorkout}>
                  ✕ Отмена
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
