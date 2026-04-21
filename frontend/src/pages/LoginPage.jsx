import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiPost } from '../utils/api'
import Button from '../components/Button'
import Input from '../components/Input'
import './AuthPage.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard')
  }, [isAuthenticated])

  // Google Identity Services
  useEffect(() => {
    const googleClientId = window.__GOOGLE_CLIENT_ID__
    if (!googleClientId || googleClientId === 'your-google-client-id-here') return

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCallback,
      })
      window.google?.accounts.id.renderButton(
        document.getElementById('google-signin-btn'),
        { theme: 'outline', size: 'large', width: '100%', text: 'signin_with' }
      )
    }
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [])

  const handleGoogleCallback = async (response) => {
    setLoading(true)
    setError('')
    try {
      const data = await apiPost('/api/auth/google', { credential: response.credential })
      login(data.user)
      // Если профиль не заполнен — отправляем на страницу параметров
      if (!data.user.height || !data.user.weight || !data.user.gender) {
        navigate('/register-params')
      } else {
        navigate('/dashboard')
      }
    } catch {
      setError('Ошибка входа через Google')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await apiPost('/api/auth/login', { email, password })
      login(data.user)
      navigate('/dashboard')
    } catch {
      setError('Неверный email или пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">Добро пожаловать обратно!</h1>
          <p className="auth-subtitle">
            Ещё не создали аккаунт?{' '}
            <Link to="/register" className="auth-link">Регистрация</Link>
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            placeholder="Введите email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Пароль"
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error}
            required
          />
          <Link to="/forgot-password" className="auth-forgot-link">
            Забыли пароль?
          </Link>
          <div className="auth-form-actions">
            <Button type="submit" variant="primary" size="medium" disabled={loading}>
              {loading ? 'Вход...' : 'Войти'}
            </Button>
          </div>

          <div className="auth-divider">
            <span>или</span>
          </div>

          <div id="google-signin-btn" className="google-btn-wrapper"></div>
        </form>
      </div>
    </div>
  )
}
