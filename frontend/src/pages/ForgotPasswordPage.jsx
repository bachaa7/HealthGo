import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/Button'
import Input from '../components/Input'
import { apiPost } from '../utils/api'
import './AuthPage.css'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await apiPost('/api/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      setError(err.message || 'Ошибка отправки. Попробуйте позже.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">Забыли пароль?</h1>
          <p className="auth-subtitle">
            Не переживайте! Введите ваш email и мы отправим инструкцию по сбросу пароля.
          </p>
        </div>

        {sent ? (
          <div className="auth-success">
            <div className="success-icon">✓</div>
            <p>Если email <strong>{email}</strong> зарегистрирован, на него отправлено письмо с инструкцией.</p>
            <p style={{ color: '#666', fontSize: 14, marginTop: 12 }}>
              Проверьте папку «Спам», если письмо не пришло в течение пары минут.
            </p>
            <Link to="/login">
              <Button variant="primary" size="medium" className="mt-16">
                Вернуться ко входу
              </Button>
            </Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              placeholder="Введите ваш email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
              required
            />
            <div className="auth-form-actions">
              <Button type="submit" variant="primary" size="medium" disabled={loading}>
                {loading ? 'Отправка...' : 'Отправить'}
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
