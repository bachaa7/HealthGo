import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import Button from '../components/Button'
import humanImg from '../assets/human.png'
import './LandingPage.css'

export default function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <Logo size="large" />
        <nav className="landing-nav">
          <a href="#features" className="landing-nav-link">Главная</a>
          <a href="#features" className="landing-nav-link">Возможности</a>
          <Link to="/login">
            <Button variant="primary" size="small">Войти</Button>
          </Link>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="hero-title-green">Умное решение</span> для{' '}
              <span className="hero-title-dark">здорового образа жизни</span>
            </h1>
            <p className="hero-description">
              Интеллектуальный ассистент, который помогает заботиться о здоровье каждый день.
              Персональные рекомендации, привычки и поддержка — в удобном для тебя формате.
            </p>
            <Link to="/register">
              <Button variant="primary" size="large">Зарегистрироваться</Button>
            </Link>
          </div>
          <div className="hero-image">
            <img src={humanImg} alt="HealthGo" />
          </div>
        </section>

        <section id="features" className="features">
          <h2 className="features-title">Что мы предлагаем</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon bmi-icon">
                <svg viewBox="0 0 48 48" fill="none">
                  <rect x="12" y="8" width="24" height="32" rx="4" fill="#E3F2FD"/>
                  <path d="M18 16 L30 16" stroke="#1976D2" strokeWidth="2"/>
                  <path d="M18 22 L30 22" stroke="#1976D2" strokeWidth="2"/>
                  <path d="M18 28 L26 28" stroke="#1976D2" strokeWidth="2"/>
                  <circle cx="34" cy="34" r="10" fill="#4CAF50"/>
                  <path d="M31 34 L33 36 L37 30" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="feature-title">Расчёт ИМТ</h3>
              <p className="feature-description">
                Мы рассчитываем ваш индекс массы тела (ИМТ) на основе таких данных, как возраст, рост и вес.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon chat-icon">
                <svg viewBox="0 0 48 48" fill="none">
                  <rect x="8" y="10" width="32" height="24" rx="8" fill="#E3F2FD"/>
                  <circle cx="18" cy="20" r="3" fill="#1976D2"/>
                  <circle cx="30" cy="20" r="3" fill="#1976D2"/>
                  <path d="M16 28 Q24 32 32 28" stroke="#1976D2" strokeWidth="2" strokeLinecap="round"/>
                  <rect x="28" y="4" width="12" height="10" rx="3" fill="#E91E63"/>
                  <circle cx="32" cy="8" r="2" fill="#fff"/>
                  <circle cx="36" cy="8" r="2" fill="#fff"/>
                </svg>
              </div>
              <h3 className="feature-title">Интерактивный чатбот</h3>
              <p className="feature-description">
                Решайте свои вопросы, взаимодействуя с нашим ботом.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon nutrition-icon">
                <svg viewBox="0 0 48 48" fill="none">
                  <rect x="6" y="10" width="36" height="28" rx="4" fill="#E8F5E9"/>
                  <path d="M14 18 L14 30" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round"/>
                  <path d="M14 22 L18 22" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round"/>
                  <circle cx="28" cy="20" r="6" fill="#FFB74D"/>
                  <circle cx="36" cy="24" r="5" fill="#F44336"/>
                  <path d="M26 30 Q28 26 30 30" stroke="#8BC34A" strokeWidth="2" fill="none"/>
                  <path d="M34 30 Q36 26 38 30" stroke="#8BC34A" strokeWidth="2" fill="none"/>
                </svg>
              </div>
              <h3 className="feature-title">Персональные рекомендации</h3>
              <p className="feature-description">
                Мы обеспечиваем рекомендации по спорту и питанию, учитывая ваши особенности.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <Logo size="small" showText={false} />
        <p className="footer-text">© 2026 HealthGo. Все права защищены.</p>
      </footer>
    </div>
  )
}
