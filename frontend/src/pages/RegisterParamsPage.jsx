import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiPost, apiPut } from '../utils/api'
import Button from '../components/Button'
import './RegisterParams.css'

export default function RegisterParamsPage() {
  const navigate = useNavigate()
  const { user, login, updateUser } = useAuth()
  const [formData, setFormData] = useState({
    gender: '',
    birthDay: '',
    birthMonth: '',
    birthYear: '',
    height: '',
    weight: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Формируем дату рождения
    let birth_date = null
    if (formData.birthYear && formData.birthMonth && formData.birthDay) {
      birth_date = `${formData.birthYear}-${formData.birthMonth.padStart(2, '0')}-${formData.birthDay.padStart(2, '0')}`
    }

    // Если пользователь уже авторизован (через Google) — просто обновляем профиль
    if (user) {
      try {
        const updated = await apiPut('/api/auth/me', {
          gender: formData.gender || null,
          height: formData.height ? Number(formData.height) : null,
          weight: formData.weight ? Number(formData.weight) : null,
          birth_date,
        })
        updateUser(updated)
        navigate('/dashboard')
      } catch (err) {
        setError('Ошибка сохранения параметров')
      } finally {
        setLoading(false)
      }
      return
    }

    // Обычная регистрация — получаем данные с предыдущего шага
    const saved = sessionStorage.getItem('registerData')
    if (!saved) {
      navigate('/register')
      return
    }
    const { name, email, password } = JSON.parse(saved)

    try {
      const data = await apiPost('/api/auth/register', {
        name,
        email,
        password,
        gender: formData.gender || null,
        height: formData.height ? Number(formData.height) : null,
        weight: formData.weight ? Number(formData.weight) : null,
        birth_date,
      })
      sessionStorage.removeItem('registerData')
      login(data.user)
      navigate('/dashboard')
    } catch (err) {
      setError('Ошибка регистрации. Возможно, email уже занят.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">Укажите свои параметры</h1>
        </div>

        <form className="auth-form params-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="form-label">Пол</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === 'male'}
                  onChange={handleChange}
                />
                <span className="radio-text">Мужчина</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === 'female'}
                  onChange={handleChange}
                />
                <span className="radio-text">Женщина</span>
              </label>
            </div>
          </div>

          <div className="form-row">
            <label className="form-label">Дата рождения</label>
            <div className="date-inputs">
              <input type="text" name="birthDay" placeholder="День" value={formData.birthDay} onChange={handleChange} className="date-input" maxLength="2" />
              <input type="text" name="birthMonth" placeholder="Месяц" value={formData.birthMonth} onChange={handleChange} className="date-input" maxLength="2" />
              <input type="text" name="birthYear" placeholder="Год" value={formData.birthYear} onChange={handleChange} className="date-input" maxLength="4" />
            </div>
          </div>

          <div className="form-row">
            <label className="form-label">Рост</label>
            <div className="input-with-unit">
              <input type="number" name="height" placeholder="" value={formData.height} onChange={handleChange} className="auth-input" />
              <span className="input-unit">см</span>
            </div>
          </div>

          <div className="form-row">
            <label className="form-label">Вес</label>
            <div className="input-with-unit">
              <input type="number" name="weight" placeholder="" value={formData.weight} onChange={handleChange} className="auth-input" />
              <span className="input-unit">кг</span>
            </div>
          </div>

          {error && <p style={{ color: '#f44336', fontSize: 14 }}>{error}</p>}

          <div className="auth-form-actions">
            <Button type="submit" variant="primary" size="medium" disabled={loading}>
              {loading ? 'Регистрация...' : 'Дальше'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
