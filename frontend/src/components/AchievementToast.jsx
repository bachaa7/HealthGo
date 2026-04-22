import { useEffect, useState, useRef } from 'react'
import { apiGet } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import './AchievementToast.css'

/**
 * Следит за полученными ачивками и показывает тост при появлении новых.
 * Опрашивает /api/achievements/recent каждые 10 секунд.
 */
export default function AchievementToast() {
  const { user } = useAuth()
  const [queue, setQueue] = useState([])
  const [current, setCurrent] = useState(null)
  const knownCodes = useRef(new Set())
  const initialized = useRef(false)

  useEffect(() => {
    if (!user) return

    let mounted = true

    const poll = async () => {
      try {
        const data = await apiGet('/api/achievements/recent')
        if (!mounted || !data?.recent) return

        if (!initialized.current) {
          // При первой загрузке просто запоминаем уже полученные
          data.recent.forEach(a => knownCodes.current.add(a.code))
          initialized.current = true
          return
        }

        // Ищем новые ачивки (которых ещё не видели)
        const newOnes = data.recent.filter(a => !knownCodes.current.has(a.code))
        newOnes.forEach(a => knownCodes.current.add(a.code))
        if (newOnes.length > 0) {
          setQueue(prev => [...prev, ...newOnes])
        }
      } catch {
        // тихо игнорируем
      }
    }

    poll()
    const interval = setInterval(poll, 10000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [user])

  // Показываем следующий из очереди
  useEffect(() => {
    if (current || queue.length === 0) return
    const next = queue[0]
    setCurrent(next)
    setQueue(prev => prev.slice(1))
    const timer = setTimeout(() => setCurrent(null), 5000)
    return () => clearTimeout(timer)
  }, [queue, current])

  if (!current) return null

  return (
    <div className="achievement-toast" onClick={() => setCurrent(null)}>
      <div className="achievement-toast-icon">{current.icon}</div>
      <div className="achievement-toast-content">
        <div className="achievement-toast-header">🏆 Новое достижение!</div>
        <div className="achievement-toast-name">{current.name}</div>
        <div className="achievement-toast-desc">{current.description}</div>
      </div>
    </div>
  )
}
