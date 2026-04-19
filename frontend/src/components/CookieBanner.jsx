import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './CookieBanner.css'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent')
    if (!consent) {
      setVisible(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="cookie-banner">
      <div className="cookie-banner-content">
        <span className="cookie-banner-icon">🍪</span>
        <p className="cookie-banner-text">
          Мы используем файлы cookie для обеспечения работы сайта и авторизации.{' '}
          <Link to="/privacy" className="cookie-banner-link">Подробнее</Link>
        </p>
        <button className="cookie-banner-btn" onClick={handleAccept}>
          Принять
        </button>
      </div>
    </div>
  )
}
