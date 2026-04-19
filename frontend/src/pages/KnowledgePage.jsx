import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Button from '../components/Button'
import { apiGet, apiPost } from '../utils/api'
import './KnowledgePage.css'

export default function KnowledgePage() {
  const [knowledge, setKnowledge] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', category: 'general' })
  const [addStatus, setAddStatus] = useState('')

  useEffect(() => {
    Promise.all([
      apiGet('/api/rag/knowledge/list').catch(() => ({ knowledge: [] })),
      apiGet('/api/rag/categories').catch(() => ({ categories: [] })),
    ]).then(([kData, cData]) => {
      setKnowledge(kData.knowledge || [])
      setCategories(cData.categories || [])
    }).finally(() => setLoading(false))
  }, [])

  const handleAdd = async () => {
    if (!form.title.trim() || !form.content.trim()) return
    setAddStatus('loading')
    try {
      await apiPost('/api/rag/knowledge/create', form)
      setAddStatus('success')
      // Обновляем список
      const data = await apiGet('/api/rag/knowledge/list').catch(() => ({ knowledge: [] }))
      setKnowledge(data.knowledge || [])
      setForm({ title: '', content: '', category: 'general' })
      setTimeout(() => { setShowAddModal(false); setAddStatus('') }, 1500)
    } catch {
      setAddStatus('error')
    }
  }

  const filtered = activeCategory === 'all'
    ? knowledge
    : knowledge.filter(k => k.category === activeCategory)

  const categoryColors = {
    nutrition: '#4CAF50', sleep: '#9C27B0', activity: '#FF9800',
    psychology: '#2196F3', health: '#F44336', general: '#607D8B',
  }

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="dashboard-content">
        <div className="kb-header">
          <h1 className="page-title">База знаний</h1>
          <Button variant="primary" size="medium" onClick={() => setShowAddModal(true)}>
            + Добавить знание
          </Button>
        </div>

        <div className="kb-filters">
          <button className={`kb-filter ${activeCategory === 'all' ? 'kb-filter--active' : ''}`} onClick={() => setActiveCategory('all')}>
            Все
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`kb-filter ${activeCategory === cat.id ? 'kb-filter--active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
              style={activeCategory === cat.id ? { background: categoryColors[cat.id], borderColor: categoryColors[cat.id] } : {}}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="kb-loading">Загрузка базы знаний...</p>
        ) : filtered.length === 0 ? (
          <div className="kb-empty">
            <p>Нет записей{activeCategory !== 'all' ? ' в этой категории' : ''}.</p>
            <Button variant="secondary" size="small" onClick={() => setShowAddModal(true)}>Добавить первую запись</Button>
          </div>
        ) : (
          <div className="kb-list">
            {filtered.map((item, i) => (
              <div key={i} className="kb-card">
                <div className="kb-card-header">
                  <h3 className="kb-card-title">{item.title}</h3>
                  <span className="kb-card-badge" style={{ background: categoryColors[item.category] || '#607D8B' }}>
                    {item.category}
                  </span>
                </div>
                <p className="kb-card-preview">{item.content_preview}</p>
                <span className="kb-card-source">{item.source}</span>
              </div>
            ))}
          </div>
        )}

        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3 className="modal-title">Добавить знание</h3>
              <div className="modal-form">
                <div className="form-group">
                  <label className="form-label">Заголовок</label>
                  <input type="text" className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Тема знания" />
                </div>
                <div className="form-group">
                  <label className="form-label">Содержание</label>
                  <textarea className="form-input kb-textarea" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Подробное описание..." rows={5} />
                </div>
                <div className="form-group">
                  <label className="form-label">Категория</label>
                  <select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                {addStatus === 'success' && <p style={{ color: '#4CAF50', fontWeight: 500 }}>Знание добавлено!</p>}
                {addStatus === 'error' && <p style={{ color: '#f44336', fontWeight: 500 }}>Ошибка добавления</p>}
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
