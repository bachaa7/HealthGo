import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/Button'
import Input from '../components/Input'
import './AuthPage.css'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    alert('Функция восстановления пароля находится в разработке. Обратитесь к администратору.')
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
            <p>Письмо с инструкцией отправлено на <strong>{email}</strong></p>
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
              required
            />
            <div className="auth-form-actions">
              <Button type="submit" variant="primary" size="medium">
                Отправить
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
