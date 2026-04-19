import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Button from '../components/Button'
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api'
import './RemindersPage.css'

const daysOfWeek = [
  { id: 'mon', label: 'Пн' },
  { id: 'tue', label: 'Вт' },
  { id: 'wed', label: 'Ср' },
  { id: 'thu', label: 'Чт' },
  { id: 'fri', label: 'Пт' },
  { id: 'sat', label: 'Сб' },
  { id: 'sun', label: 'Вс' },
]

const defaultReminders = [
  { id: 1, title: 'Принять витамины', time: '08:00', days: ['mon', 'wed', 'fri'], enabled: true },
  { id: 2, title: 'Выпить стакан воды', time: '09:00', days: ['mon', 'tue', 'wed', 'thu', 'fri'], enabled: true },
  { id: 3, title: 'Обед', time: '13:00', days: ['mon', 'tue', 'wed', 'thu', 'fri'], enabled: true },
  { id: 4, title: 'Вечерняя тренировка', time: '18:00', days: ['mon', 'wed', 'fri'], enabled: false },
  { id: 5, title: 'Лечь спать', time: '22:00', days: ['sun', 'mon', 'tue', 'wed', 'thu'], enabled: true },
]

export default function RemindersPage() {
  const [reminders, setReminders] = useState(defaultReminders)
  const [showModal, setShowModal] = useState(false)
  const [editingReminder, setEditingReminder] = useState(null)
  const [formData, setFormData] = useState({ title: '', time: '09:00', days: [] })
  const [useApi, setUseApi] = useState(false)

  // Пробуем загрузить с сервера
  useEffect(() => {
    apiGet('/api/reminders/')
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setReminders(data)
        }
        setUseApi(true)
      })
      .catch(() => {
        // API недоступен — используем localStorage
        const saved = localStorage.getItem('reminders')
        if (saved) setReminders(JSON.parse(saved))
      })
  }, [])

  // Сохраняем в localStorage как fallback
  useEffect(() => {
    if (!useApi) {
      localStorage.setItem('reminders', JSON.stringify(reminders))
    }
  }, [reminders, useApi])

  const handleToggle = async (id) => {
    const reminder = reminders.find(r => r.id === id)
    if (!reminder) return

    if (useApi) {
      try {
        const updated = await apiPut(`/api/reminders/${id}`, { enabled: !reminder.enabled })
        setReminders(reminders.map(r => r.id === id ? updated : r))
      } catch {
        setReminders(reminders.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))
      }
    } else {
      setReminders(reminders.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Удалить это напоминание?')) return

    if (useApi) {
      try {
        await apiDelete(`/api/reminders/${id}`)
      } catch { /* ignore */ }
    }
    setReminders(reminders.filter(r => r.id !== id))
  }

  const handleOpenModal = (reminder = null) => {
    if (reminder) {
      setEditingReminder(reminder)
      setFormData({ title: reminder.title, time: reminder.time, days: reminder.days })
    } else {
      setEditingReminder(null)
      setFormData({ title: '', time: '09:00', days: [] })
    }
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.title.trim()) return
    const days = formData.days.length > 0 ? formData.days : ['mon', 'tue', 'wed', 'thu', 'fri']

    if (editingReminder) {
      if (useApi) {
        try {
          const updated = await apiPut(`/api/reminders/${editingReminder.id}`, {
            title: formData.title, time: formData.time, days,
          })
          setReminders(reminders.map(r => r.id === editingReminder.id ? updated : r))
        } catch {
          setReminders(reminders.map(r => r.id === editingReminder.id ? { ...r, title: formData.title, time: formData.time, days } : r))
        }
      } else {
        setReminders(reminders.map(r => r.id === editingReminder.id ? { ...r, title: formData.title, time: formData.time, days } : r))
      }
    } else {
      if (useApi) {
        try {
          const created = await apiPost('/api/reminders/', { title: formData.title, time: formData.time, days, enabled: true })
          setReminders([...reminders, created])
        } catch {
          setReminders([...reminders, { id: Date.now(), title: formData.title, time: formData.time, days, enabled: true }])
        }
      } else {
        setReminders([...reminders, { id: Date.now(), title: formData.title, time: formData.time, days, enabled: true }])
      }
    }
    setShowModal(false)
  }

  const toggleDay = (dayId) => {
    setFormData({
      ...formData,
      days: formData.days.includes(dayId) ? formData.days.filter(d => d !== dayId) : [...formData.days, dayId],
    })
  }

  const formatDays = (days) => {
    if (days.length === 7) return 'Ежедневно'
    if (days.length === 5 && !days.includes('sat') && !days.includes('sun')) return 'По будням'
    if (days.length === 2 && days.includes('sat') && days.includes('sun')) return 'По выходным'
    return days.map(d => daysOfWeek.find(dw => dw.id === d)?.label).join(', ')
  }

  const getTodayReminder = () => {
    const today = daysOfWeek[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]?.id
    return reminders.filter(r => r.enabled && r.days.includes(today))
  }

  const todayReminders = getTodayReminder()

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="dashboard-content">
        <div className="reminders-header">
          <h1 className="page-title">Напоминания</h1>
          <Button variant="primary" size="medium" onClick={() => handleOpenModal()}>+ Добавить</Button>
        </div>

        {todayReminders.length > 0 && (
          <div className="today-reminders">
            <h3 className="section-subtitle">Сегодня</h3>
            <div className="today-list">
              {todayReminders.map(reminder => (
                <div key={reminder.id} className="today-item">
                  <span className="today-time">{reminder.time}</span>
                  <span className="today-title">{reminder.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <h3 className="section-subtitle">Все напоминания</h3>

        <div className="reminders-list">
          {reminders.length === 0 ? (
            <div className="reminders-empty">
              <p>Нет напоминаний</p>
              <Button variant="secondary" size="small" onClick={() => handleOpenModal()}>Создать первое напоминание</Button>
            </div>
          ) : (
            reminders.map((reminder) => (
              <div key={reminder.id} className={`reminder-item ${!reminder.enabled ? 'reminder-item--disabled' : ''}`}>
                <div className="reminder-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
                  </svg>
                </div>
                <div className="reminder-content">
                  <h3 className="reminder-title">{reminder.title}</h3>
                  <div className="reminder-meta">
                    <span className="reminder-time">{reminder.time}</span>
                    <span className="reminder-days">{formatDays(reminder.days)}</span>
                  </div>
                </div>
                <div className="reminder-actions">
                  <label className="reminder-toggle">
                    <input type="checkbox" checked={reminder.enabled} onChange={() => handleToggle(reminder.id)} />
                    <span className="toggle-slider"></span>
                  </label>
                  <button className="reminder-edit" onClick={() => handleOpenModal(reminder)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button className="reminder-delete" onClick={() => handleDelete(reminder.id)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-title">{editingReminder ? 'Редактировать напоминание' : 'Новое напоминание'}</h3>
              <div className="modal-form">
                <div className="form-group">
                  <label className="form-label">Название</label>
                  <input type="text" className="form-input" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Например: Принять витамины" autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Время</label>
                  <input type="time" className="form-input" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Дни недели</label>
                  <div className="days-selector">
                    {daysOfWeek.map((day) => (
                      <button key={day.id} className={`day-btn ${formData.days.includes(day.id) ? 'day-btn--active' : ''}`} onClick={() => toggleDay(day.id)} type="button">
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <Button variant="secondary" onClick={() => setShowModal(false)}>Отмена</Button>
                <Button variant="primary" onClick={handleSave}>{editingReminder ? 'Сохранить' : 'Создать'}</Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
