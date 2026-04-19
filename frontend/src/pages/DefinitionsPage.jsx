import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Button from '../components/Button'
import { apiGet, apiPost } from '../utils/api'
import './DefinitionsPage.css'

export default function DefinitionsPage() {
  const [concepts, setConcepts] = useState([])
  const [selectedConcept, setSelectedConcept] = useState(null)
  const [definition, setDefinition] = useState(null)
  const [defLoading, setDefLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({ idtf: '', definition: '' })
  const [addStatus, setAddStatus] = useState('')

  useEffect(() => {
    apiGet('/api/definitions/concepts')
      .then(data => setConcepts(data.concepts || []))
      .catch(() => {})
  }, [])

  const handleLookup = async (concept) => {
    setSelectedConcept(concept)
    setDefinition(null)
    setDefLoading(true)
    try {
      const data = await apiGet(`/api/definitions/lookup/${concept.id}`)
      setDefinition(data)
    } catch {
      setDefinition({ error: 'OSTIS-сервер недоступен. Попробуйте позже.' })
    } finally {
      setDefLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!addForm.idtf.trim() || !addForm.definition.trim()) return
    setAddStatus('loading')
    try {
      await apiPost('/api/definitions/add', addForm)
      setAddStatus('success')
      setAddForm({ idtf: '', definition: '' })
      setTimeout(() => { setShowAddModal(false); setAddStatus('') }, 1500)
    } catch {
      setAddStatus('error')
    }
  }

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="dashboard-content">
        <div className="def-header">
          <h1 className="page-title">Определения (OSTIS)</h1>
          <Button variant="primary" size="medium" onClick={() => setShowAddModal(true)}>
            + Добавить определение
          </Button>
        </div>

        <p className="def-description">
          Нажмите на понятие чтобы получить определение из базы знаний OSTIS.
        </p>

        <div className="def-concepts-grid">
          {concepts.map(c => (
            <button
              key={c.id}
              className={`def-concept-card ${selectedConcept?.id === c.id ? 'def-concept-card--active' : ''}`}
              onClick={() => handleLookup(c)}
            >
              <div className="def-concept-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
              </div>
              <span className="def-concept-name">{c.name}</span>
              <span className="def-concept-id">{c.id}</span>
            </button>
          ))}
        </div>

        {selectedConcept && (
          <div className="def-result">
            <h3 className="def-result-title">{selectedConcept.name}</h3>
            {defLoading ? (
              <p className="def-result-loading">Загрузка из OSTIS...</p>
            ) : definition?.definition ? (
              <p className="def-result-text">{definition.definition}</p>
            ) : (
              <p className="def-result-error">{definition?.error || 'Определение не найдено'}</p>
            )}
          </div>
        )}

        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3 className="modal-title">Добавить определение</h3>
              <div className="modal-form">
                <div className="form-group">
                  <label className="form-label">Идентификатор понятия</label>
                  <input type="text" className="form-input" value={addForm.idtf} onChange={e => setAddForm({ ...addForm, idtf: e.target.value })} placeholder="Например: nrel_sport" />
                </div>
                <div className="form-group">
                  <label className="form-label">Определение</label>
                  <textarea className="form-input def-textarea" value={addForm.definition} onChange={e => setAddForm({ ...addForm, definition: e.target.value })} placeholder="Текст определения..." rows={4} />
                </div>
                {addStatus === 'success' && <p className="def-add-success">Определение добавлено!</p>}
                {addStatus === 'error' && <p className="def-add-error">Ошибка. OSTIS недоступен?</p>}
              </div>
              <div className="modal-actions">
                <Button variant="secondary" onClick={() => setShowAddModal(false)}>Отмена</Button>
                <Button variant="primary" onClick={handleAdd} disabled={addStatus === 'loading'}>
                  {addStatus === 'loading' ? 'Сохранение...' : 'Добавить'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
