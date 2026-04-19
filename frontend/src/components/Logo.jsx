import './Logo.css'

export default function Logo({ size = 'medium', showText = true }) {
  return (
    <div className={`logo logo--${size}`}>
      <svg className="logo-icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="20" height="20" rx="6" fill="#4CAF50"/>
        <rect x="26" y="2" width="20" height="20" rx="6" fill="#FF9800"/>
        <rect x="2" y="26" width="20" height="20" rx="6" fill="#2196F3"/>
        <rect x="26" y="26" width="20" height="20" rx="6" fill="#F44336"/>
      </svg>
      {showText && <span className="logo-text">HealthGo</span>}
    </div>
  )
}
