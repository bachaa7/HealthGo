import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Input from '../components/Input'
import './AuthPage.css'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают')
      return
    }
    if (formData.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов')
      return
    }
    // Сохраняем данные для следующего шага
    sessionStorage.setItem('registerData', JSON.stringify({
      name: formData.name,
      email: formData.email,
      password: formData.password,
    }))
    navigate('/register-params')
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">Создай свой аккаунт</h1>
          <p className="auth-subtitle">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="auth-link">Войти</Link>
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <Input
            label="Имя"
            name="name"
            type="text"
            placeholder="Имя"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <Input
            label="Пароль"
            name="password"
            type="password"
            placeholder="Пароль"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <Input
            label="Подтверждение пароля"
            name="confirmPassword"
            type="password"
            placeholder="Пароль"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={error}
            required
          />
          <div className="auth-form-actions">
            <Button type="submit" variant="primary" size="medium">
              Дальше
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
