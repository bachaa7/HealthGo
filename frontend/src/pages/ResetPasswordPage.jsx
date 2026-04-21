import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Button from '../components/Button'
import Input from '../components/Input'
import { apiPost } from '../utils/api'
import './AuthPage.css'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Отсутствует токен. Проверьте ссылку из письма.')
    }
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }
    if (password.length < 6) {
      setError('Пароль должен быть не менее 6 символов')
      return
    }

    setLoading(true)
    try {
      await apiPost('/api/auth/reset-password', {
        token,
        new_password: password,
      })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.message || 'Ошибка смены пароля')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">Новый пароль</h1>
          <p className="auth-subtitle">
            Введите новый пароль для вашего аккаунта
          </p>
        </div>

        {success ? (
          <div className="auth-success">
            <div className="success-icon">✓</div>
            <p>Пароль успешно изменён!</p>
            <p style={{ color: '#666', fontSize: 14, marginTop: 8 }}>
              Через 3 секунды вы будете перенаправлены на страницу входа...
            </p>
            <Link to="/login">
              <Button variant="primary" size="medium" className="mt-16">
                Войти
              </Button>
            </Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <Input
              label="Новый пароль"
              type="password"
              placeholder="Минимум 6 символов"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={!token}
            />
            <Input
              label="Подтверждение пароля"
              type="password"
              placeholder="Повторите пароль"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={error}
              required
              disabled={!token}
            />
            <div className="auth-form-actions">
              <Button type="submit" variant="primary" size="medium" disabled={loading || !token}>
                {loading ? 'Сохранение...' : 'Сохранить новый пароль'}
              </Button>
            </div>
            <div className="auth-footer">
              <Link to="/login" className="auth-link">
                ← Вернуться ко входу
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
