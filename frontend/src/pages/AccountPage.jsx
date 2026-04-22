import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Button from '../components/Button'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api'
import './AccountPage.css'

export default function AccountPage() {
  const { isDark, toggleTheme } = useTheme()
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    gender: user?.gender || 'male',
    birthDate: user?.birth_date || '',
    height: user?.height || 175,
    weight: user?.weight || 70,
    activityLevel: user?.activity_level || 'moderate',
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [weightHistory, setWeightHistory] = useState([])
  const [newWeight, setNewWeight] = useState('')
  const [weightLoading, setWeightLoading] = useState(false)
  const [achievements, setAchievements] = useState([])

  useEffect(() => {
    apiGet('/api/weight/')
      .then(data => { if (Array.isArray(data)) setWeightHistory(data) })
      .catch(() => {})
    apiGet('/api/achievements/')
      .then(data => { if (data?.achievements) setAchievements(data.achievements) })
      .catch(() => {})
  }, [])

  const handleAddWeight = async () => {
    if (!newWeight || newWeight < 20 || newWeight > 300) return
    setWeightLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      await apiPost('/api/weight/', { weight: Number(newWeight), date: today })
      const data = await apiGet('/api/weight/')
      if (Array.isArray(data)) setWeightHistory(data)
      setProfileData({ ...profileData, weight: Number(newWeight) })
      updateUser({ ...user, weight: Number(newWeight) })
      setNewWeight('')
    } catch {
      alert('Ошибка сохранения веса')
    } finally {
      setWeightLoading(false)
    }
  }

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileData({ ...profileData, [name]: value })
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData({ ...passwordData, [name]: value })
  }

  const handleSave = async () => {
    try {
      const updated = await apiPut('/api/auth/me', {
        name: profileData.name,
        gender: profileData.gender,
        height: Number(profileData.height),
        weight: Number(profileData.weight),
        birth_date: profileData.birthDate,
        activity_level: profileData.activityLevel,
      })
      updateUser(updated)
      setIsEditing(false)
    } catch {
      alert('Ошибка сохранения')
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const tabs = [
    { id: 'profile', label: 'Профиль' },
    { id: 'stats', label: 'Статистика' },
    { id: 'achievements', label: 'Достижения' },
    { id: 'settings', label: 'Настройки' },
    { id: 'security', label: 'Безопасность' },
  ]

  const bmi = profileData.weight && profileData.height
    ? (profileData.weight / ((profileData.height / 100) ** 2)).toFixed(1)
    : null

  const getBmiLabel = (val) => {
    if (!val) return '-'
    const n = parseFloat(val)
    if (n < 16) return 'Выраженный дефицит'
    if (n < 18.5) return 'Недостаточная масса'
    if (n < 25) return 'Норма'
    if (n < 30) return 'Избыточная масса'
    if (n < 35) return 'Ожирение I'
    if (n < 40) return 'Ожирение II'
    return 'Ожирение III'
  }

  const getBmiColor = (val) => {
    if (!val) return '#999'
    const n = parseFloat(val)
    if (n < 18.5) return '#FF9800'
    if (n < 25) return '#4CAF50'
    if (n < 30) return '#FF9800'
    return '#f44336'
  }

  const getBmiPercent = (val) => {
    if (!val) return 0
    const n = parseFloat(val)
    return Math.min(Math.max(((n - 10) / 35) * 100, 5), 100)
  }

  const age = profileData.birthDate
    ? Math.floor((new Date() - new Date(profileData.birthDate)) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="dashboard-content">
        <h1 className="page-title">Аккаунт</h1>

        <div className="account-container">
          <div className="account-header">
            <div className="avatar-section">
              <div className="avatar">
                <span>{profileData.name.charAt(0)}</span>
              </div>
              <button className="avatar-change-btn" onClick={() => alert('Функция в разработке')}>Изменить фото</button>
            </div>
            <div className="user-info">
              <h2 className="user-name">{profileData.name}</h2>
              <p className="user-email">{profileData.email}</p>
            </div>
          </div>

          <div className="account-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`account-tab ${activeTab === tab.id ? 'account-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="account-content">
            {activeTab === 'profile' && (
              <div className="profile-section">
                <div className="section-header">
                  <h3 className="section-title">Личная информация</h3>
                  {!isEditing && (
                    <Button variant="secondary" size="small" onClick={() => setIsEditing(true)}>
                      Редактировать
                    </Button>
                  )}
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Имя</label>
                    <input
                      type="text"
                      name="name"
                      className="form-input"
                      value={profileData.name}
                      onChange={handleProfileChange}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      className="form-input"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Телефон</label>
                    <input
                      type="tel"
                      name="phone"
                      className="form-input"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Пол</label>
                    <select
                      name="gender"
                      className="form-input"
                      value={profileData.gender}
                      onChange={handleProfileChange}
                      disabled={!isEditing}
                    >
                      <option value="male">Мужской</option>
                      <option value="female">Женский</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Дата рождения</label>
                    <input
                      type="date"
                      name="birthDate"
                      className="form-input"
                      value={profileData.birthDate}
                      onChange={handleProfileChange}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Возраст</label>
                    <input
                      type="text"
                      className="form-input"
                      value={profileData.birthDate ? new Date().getFullYear() - new Date(profileData.birthDate).getFullYear() : '—'}
                      disabled
                    />
                  </div>
                </div>

                <h3 className="section-title section-title--margin">Физические параметры</h3>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Рост (см)</label>
                    <input
                      type="number"
                      name="height"
                      className="form-input"
                      value={profileData.height}
                      onChange={handleProfileChange}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Вес (кг)</label>
                    <input
                      type="number"
                      name="weight"
                      className="form-input"
                      value={profileData.weight}
                      onChange={handleProfileChange}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Уровень активности</label>
                    <select
                      name="activityLevel"
                      className="form-input"
                      value={profileData.activityLevel}
                      onChange={handleProfileChange}
                      disabled={!isEditing}
                    >
                      <option value="sedentary">Сидячий образ жизни</option>
                      <option value="light">Лёгкая активность (1-3 дня/нед)</option>
                      <option value="moderate">Умеренная активность (3-5 дней/нед)</option>
                      <option value="active">Высокая активность (6-7 дней/нед)</option>
                      <option value="very-active">Очень высокая (физическая работа)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">ИМТ</label>
                    <input
                      type="text"
                      className="form-input"
                      value={((profileData.weight / ((profileData.height / 100) ** 2)).toFixed(1))}
                      disabled
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="form-actions">
                    <Button variant="primary" onClick={handleSave}>
                      Сохранить
                    </Button>
                    <Button variant="secondary" onClick={() => setIsEditing(false)}>
                      Отмена
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="stats-section">
                {/* ИМТ визуализация */}
                <h3 className="section-title">Индекс массы тела (ИМТ)</h3>
                <div className="stats-bmi-card">
                  <div className="stats-bmi-value" style={{ color: getBmiColor(bmi) }}>
                    {bmi || '—'}
                  </div>
                  <div className="stats-bmi-label" style={{ color: getBmiColor(bmi) }}>
                    {getBmiLabel(bmi)}
                  </div>
                  <div className="stats-bmi-bar">
                    <div className="stats-bmi-bar-bg">
                      <div className="stats-bmi-zone stats-bmi-zone--under" style={{ width: '22%' }} />
                      <div className="stats-bmi-zone stats-bmi-zone--normal" style={{ width: '17%' }} />
                      <div className="stats-bmi-zone stats-bmi-zone--over" style={{ width: '14%' }} />
                      <div className="stats-bmi-zone stats-bmi-zone--obese" style={{ width: '47%' }} />
                    </div>
                    {bmi && (
                      <div className="stats-bmi-indicator" style={{ left: `${getBmiPercent(bmi)}%` }} />
                    )}
                  </div>
                  <div className="stats-bmi-labels">
                    <span>16</span>
                    <span>18.5</span>
                    <span>25</span>
                    <span>30</span>
                    <span>40+</span>
                  </div>
                </div>

                {/* Карточки параметров */}
                <h3 className="section-title section-title--margin">Ваши параметры</h3>
                <div className="stats-params-grid">
                  <div className="stats-param-card">
                    <span className="stats-param-icon">📏</span>
                    <div className="stats-param-value">{profileData.height} см</div>
                    <div className="stats-param-label">Рост</div>
                  </div>
                  <div className="stats-param-card">
                    <span className="stats-param-icon">⚖️</span>
                    <div className="stats-param-value">{profileData.weight} кг</div>
                    <div className="stats-param-label">Вес</div>
                  </div>
                  <div className="stats-param-card">
                    <span className="stats-param-icon">🎂</span>
                    <div className="stats-param-value">{age || '—'}</div>
                    <div className="stats-param-label">Возраст</div>
                  </div>
                  <div className="stats-param-card">
                    <span className="stats-param-icon">{profileData.gender === 'male' ? '♂️' : '♀️'}</span>
                    <div className="stats-param-value">{profileData.gender === 'male' ? 'Муж.' : 'Жен.'}</div>
                    <div className="stats-param-label">Пол</div>
                  </div>
                </div>

                {/* Идеальный вес */}
                <h3 className="section-title section-title--margin">Рекомендуемый диапазон веса</h3>
                <div className="stats-ideal-weight">
                  <div className="stats-ideal-bar">
                    <div className="stats-ideal-range"
                      style={{
                        left: `${Math.max(((18.5 * (profileData.height/100)**2) - 40) / 80 * 100, 0)}%`,
                        width: `${((25 - 18.5) * (profileData.height/100)**2) / 80 * 100}%`,
                      }}
                    />
                    <div className="stats-ideal-current"
                      style={{
                        left: `${Math.min(Math.max((profileData.weight - 40) / 80 * 100, 2), 98)}%`,
                      }}
                    />
                  </div>
                  <div className="stats-ideal-info">
                    <span>Мин: <strong>{Math.round(18.5 * (profileData.height/100)**2)} кг</strong></span>
                    <span>Ваш: <strong style={{ color: getBmiColor(bmi) }}>{profileData.weight} кг</strong></span>
                    <span>Макс: <strong>{Math.round(25 * (profileData.height/100)**2)} кг</strong></span>
                  </div>
                </div>

                {/* Обновить вес */}
                <h3 className="section-title section-title--margin">Обновить вес</h3>
                <div className="stats-weight-input">
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Вес в кг"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    min="20"
                    max="300"
                    step="0.1"
                  />
                  <Button variant="primary" size="medium" onClick={handleAddWeight} disabled={weightLoading}>
                    {weightLoading ? 'Сохранение...' : 'Записать'}
                  </Button>
                </div>

                {/* График веса */}
                <h3 className="section-title section-title--margin">Динамика веса</h3>
                {weightHistory.length > 1 ? (
                  <div className="stats-weight-chart">
                    {(() => {
                      const weights = weightHistory.map(r => r.weight)
                      const minW = Math.min(...weights) - 2
                      const maxW = Math.max(...weights) + 2
                      const range = maxW - minW || 1
                      const chartW = 600
                      const chartH = 200
                      const padX = 40
                      const padY = 30
                      const innerW = chartW - padX * 2
                      const innerH = chartH - padY * 2

                      const points = weightHistory.map((r, i) => ({
                        x: padX + (innerW / (weightHistory.length - 1)) * i,
                        y: padY + innerH - ((r.weight - minW) / range) * innerH,
                        weight: r.weight,
                        date: r.date.slice(5).replace('-', '.'),
                      }))

                      const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
                      const areaPath = linePath + ` L ${points[points.length-1].x} ${chartH - padY} L ${points[0].x} ${chartH - padY} Z`

                      return (
                        <svg viewBox={`0 0 ${chartW} ${chartH}`} className="stats-line-chart">
                          {/* Горизонтальные линии */}
                          {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
                            const y = padY + innerH * (1 - frac)
                            const val = Math.round(minW + range * frac)
                            return (
                              <g key={i}>
                                <line x1={padX} y1={y} x2={chartW - padX} y2={y} stroke="#e0e0e0" strokeWidth="1" />
                                <text x={padX - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#999">{val}</text>
                              </g>
                            )
                          })}
                          {/* Заливка под кривой */}
                          <path d={areaPath} fill="url(#greenGrad)" opacity="0.3" />
                          {/* Линия */}
                          <path d={linePath} fill="none" stroke="#4CAF50" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                          {/* Точки и подписи */}
                          {points.map((p, i) => (
                            <g key={i}>
                              <circle cx={p.x} cy={p.y} r="5" fill="#4CAF50" stroke="white" strokeWidth="2" />
                              <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize="12" fontWeight="600" fill="#333">{p.weight}</text>
                              <text x={p.x} y={chartH - 8} textAnchor="middle" fontSize="11" fill="#999">{p.date}</text>
                            </g>
                          ))}
                          <defs>
                            <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#4CAF50" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="#4CAF50" stopOpacity="0.05" />
                            </linearGradient>
                          </defs>
                        </svg>
                      )
                    })()}
                  </div>
                ) : weightHistory.length === 1 ? (
                  <p style={{ color: '#999' }}>Добавьте ещё одну запись для отображения графика</p>
                ) : (
                  <p style={{ color: '#999' }}>Нет записей. Введите вес выше чтобы начать отслеживание</p>
                )}
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="achievements-section">
                {(() => {
                  const earned = achievements.filter(a => a.earned)
                  const categories = [
                    { id: 'start', label: 'Первые шаги' },
                    { id: 'progress', label: 'Прогресс' },
                    { id: 'health', label: 'Здоровье' },
                    { id: 'fun', label: 'Разное' },
                  ]
                  return (
                    <>
                      <div className="achievements-header">
                        <div className="achievements-counter">
                          <span className="achievements-counter-num">{earned.length}</span>
                          <span className="achievements-counter-total">/ {achievements.length}</span>
                        </div>
                        <div className="achievements-counter-label">достижений получено</div>
                        <div className="achievements-progress-bar">
                          <div
                            className="achievements-progress-fill"
                            style={{ width: `${achievements.length ? (earned.length / achievements.length * 100) : 0}%` }}
                          />
                        </div>
                      </div>

                      {categories.map(cat => {
                        const catAchievements = achievements.filter(a => a.category === cat.id)
                        if (catAchievements.length === 0) return null
                        return (
                          <div key={cat.id} className="achievements-category">
                            <h3 className="section-title section-title--margin">{cat.label}</h3>
                            <div className="achievements-grid">
                              {catAchievements.map(a => (
                                <div
                                  key={a.code}
                                  className={`achievement-card ${a.earned ? 'achievement-card--earned' : 'achievement-card--locked'}`}
                                  title={a.earned && a.earned_at ? `Получено: ${new Date(a.earned_at).toLocaleDateString('ru-RU')}` : 'Не получено'}
                                >
                                  <div className="achievement-card-icon">{a.earned ? a.icon : '🔒'}</div>
                                  <div className="achievement-card-name">{a.name}</div>
                                  <div className="achievement-card-desc">{a.description}</div>
                                  {a.earned && a.earned_at && (
                                    <div className="achievement-card-date">
                                      {new Date(a.earned_at).toLocaleDateString('ru-RU')}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </>
                  )
                })()}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="settings-section">
                <h3 className="section-title">Внешний вид</h3>

                <div className="settings-list">
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-label">Тёмная тема</span>
                      <span className="setting-description">Переключиться на тёмный режим интерфейса</span>
                    </div>
                    <label className="toggle">
                      <input type="checkbox" checked={isDark} onChange={toggleTheme} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <h3 className="section-title section-title--margin">Персональные данные</h3>

                <div className="settings-list">
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-label">Согласие на обработку данных</span>
                      <span className="setting-description">
                        Вы дали согласие при регистрации.{' '}
                        <Link to="/privacy" className="auth-link">Политика конфиденциальности</Link>
                      </span>
                    </div>
                  </div>
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-label">Отозвать согласие</span>
                      <span className="setting-description">
                        Отзыв согласия приведёт к удалению аккаунта и всех данных
                      </span>
                    </div>
                    <Button variant="danger" size="small" onClick={async () => {
                      if (window.confirm('Вы отзываете согласие на обработку данных. Ваш аккаунт и все данные будут удалены. Продолжить?')) {
                        try {
                          await apiDelete('/api/auth/me')
                          logout()
                          navigate('/login')
                        } catch {
                          alert('Ошибка удаления')
                        }
                      }
                    }}>Отозвать</Button>
                  </div>
                </div>

                <p className="setting-description" style={{ color: '#999', marginTop: '16px' }}>
                  Настройки уведомлений и языка будут доступны в следующей версии.
                </p>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="security-section">
                <h3 className="section-title">Смена пароля</h3>

                <div className="form-grid form-grid--narrow">
                  <div className="form-group">
                    <label className="form-label">Текущий пароль</label>
                    <input
                      type="password"
                      name="currentPassword"
                      className="form-input"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Введите текущий пароль"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Новый пароль</label>
                    <input
                      type="password"
                      name="newPassword"
                      className="form-input"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Введите новый пароль"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Подтверждение пароля</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      className="form-input"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Повторите новый пароль"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <Button variant="primary" onClick={async () => {
                    if (!passwordData.currentPassword || !passwordData.newPassword) {
                      alert('Заполните все поля')
                      return
                    }
                    if (passwordData.newPassword !== passwordData.confirmPassword) {
                      alert('Пароли не совпадают')
                      return
                    }
                    if (passwordData.newPassword.length < 6) {
                      alert('Новый пароль должен быть не менее 6 символов')
                      return
                    }
                    try {
                      await apiPut('/api/auth/password', {
                        current_password: passwordData.currentPassword,
                        new_password: passwordData.newPassword,
                      })
                      alert('Пароль успешно изменён')
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                    } catch (err) {
                      alert(err.message || 'Ошибка смены пароля')
                    }
                  }}>Изменить пароль</Button>
                </div>

                <h3 className="section-title section-title--margin">Двухфакторная аутентификация</h3>

                <div className="security-info">
                  <p className="security-description">
                    Повысьте безопасность аккаунта, включив двухфакторную аутентификацию.
                  </p>
                  <Button variant="secondary">Включить 2FA</Button>
                </div>

                <h3 className="section-title section-title--margin">Выход</h3>

                <div className="danger-zone">
                  <p className="danger-description">
                    Выйти из аккаунта на этом устройстве.
                  </p>
                  <Button variant="danger" onClick={handleLogout}>Выйти из аккаунта</Button>
                </div>

                <h3 className="section-title section-title--margin">Удаление аккаунта</h3>

                <div className="danger-zone">
                  <p className="danger-description">
                    Это действие необратимо. Все ваши данные, включая напоминания, будут удалены.
                  </p>
                  <Button variant="danger" onClick={async () => {
                    if (window.confirm('Вы уверены? Все данные будут удалены безвозвратно.')) {
                      try {
                        await apiDelete('/api/auth/me')
                        logout()
                        navigate('/login')
                      } catch {
                        alert('Ошибка удаления аккаунта')
                      }
                    }
                  }}>Удалить аккаунт</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
