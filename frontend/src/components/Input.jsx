import './Input.css'

export default function Input({ 
  label, 
  error, 
  className = '',
  ...props 
}) {
  return (
    <div className={`input-wrapper ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <input className={`input ${error ? 'input--error' : ''}`} {...props} />
      {error && <span className="input-error">{error}</span>}
    </div>
  )
}
