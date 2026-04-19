import { NavLink } from 'react-router-dom'
import Logo from './Logo'
import './Sidebar.css'

const menuItems = [
  { path: '/dashboard', label: 'Главная', icon: 'dashboard' },
  { path: '/dashboard/account', label: 'Аккаунт', icon: 'account' },
  { path: '/dashboard/nutrition', label: 'Питание', icon: 'nutrition' },
  { path: '/dashboard/workouts', label: 'Тренировки', icon: 'workouts' },
  { path: '/dashboard/reminders', label: 'Напоминания', icon: 'reminders' },
  { path: '/dashboard/ai-assistant', label: 'AI-ассистент', icon: 'ai' },
  { path: '/dashboard/recommendations', label: 'Рекомендации', icon: 'recommendations' },
  { path: '/dashboard/definitions', label: 'Определения', icon: 'definitions' },
  { path: '/dashboard/knowledge', label: 'База знаний', icon: 'knowledge' },
]

const icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  account: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12v-3a3 3 0 013-3h0a3 3 0 013 3v3M3 12v7a2 2 0 002 2h8a2 2 0 002-2v-7M9 9v3M15 9v3M12 3a3 3 0 100 6 3 3 0 000-6z"/>
    </svg>
  ),
  nutrition: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M9 9h6M9 13h6M9 17h4"/>
    </svg>
  ),
  workouts: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6.5 6.5l11 11M21 21l-5-5M3 3l5 5M18 6l-3-3M6 18l-3 3"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  reminders: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  ),
  ai: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="12" rx="2"/>
      <path d="M9 20h6M12 16v4M7 10h2M15 10h2M9 14h6"/>
    </svg>
  ),
  recommendations: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18V5l12-2v13"/>
      <circle cx="6" cy="18" r="3"/>
      <circle cx="18" cy="16" r="3"/>
    </svg>
  ),
  definitions: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
    </svg>
  ),
  knowledge: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3"/>
      <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/>
    </svg>
  ),
}

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Logo size="small" />
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`
            }
          >
            <span className="sidebar-link-icon">{icons[item.icon]}</span>
            <span className="sidebar-link-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
