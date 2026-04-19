import { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import Button from '../components/Button'
import { apiPost } from '../utils/api'
import './ChatPage.css'

const quickQuestions = [
  'Как рассчитать калории?',
  'Сколько пить воды в день?',
  'Лучшее время для тренировки',
  'Как улучшить сон?',
  'Что есть до тренировки?',
  'Как похудеть безопасно?',
]

export default function ChatPage() {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('chatMessages')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return [{ id: 1, text: 'Привет! Я ваш AI-ассистент HealthGo. Чем могу помочь?', isBot: true, timestamp: Date.now() }]
      }
    }
    return [{ id: 1, text: 'Привет! Я ваш AI-ассистент HealthGo. Чем могу помочь?', isBot: true, timestamp: Date.now() }]
  })
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages))
  }, [messages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!message.trim()) return

    const userMessage = {
      id: Date.now(),
      text: message,
      isBot: false,
      timestamp: Date.now(),
    }

    setMessages(prev => [...prev, userMessage])
    const question = message
    setMessage('')
    setIsTyping(true)

    try {
      const data = await apiPost('/api/rag/ask', { question })
      const botResponse = {
        id: Date.now() + 1,
        text: data.answer,
        isBot: true,
        timestamp: Date.now(),
        sources: data.sources,
      }
      setMessages(prev => [...prev, botResponse])
    } catch {
      const errorMsg = {
        id: Date.now() + 1,
        text: 'Сервис временно недоступен. Попробуйте позже.',
        isBot: true,
        timestamp: Date.now(),
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsTyping(false)
    }
  }

  const handleQuickQuestion = (question) => {
    setMessage(question)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const clearHistory = () => {
    if (confirm('Очистить историю сообщений?')) {
      setMessages([{ id: 1, text: 'Привет! Я ваш AI-ассистент HealthGo. Чем могу помочь?', isBot: true, timestamp: Date.now() }])
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="dashboard-content chat-content">
        <div className="chat-header">
          <h1 className="page-title">Чат с интеллектуальным ассистентом</h1>
          <button className="chat-clear-btn" onClick={clearHistory}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
            Очистить
          </button>
        </div>

        <div className="chat-container">
          <div className="chat-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-message ${msg.isBot ? 'chat-message--bot' : 'chat-message--user'}`}
              >
                {msg.isBot && (
                  <div className="chat-message-avatar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="12" rx="2"/>
                      <path d="M9 20h6M12 16v4M7 10h2M15 10h2M9 14h6"/>
                    </svg>
                  </div>
                )}
                <div className="chat-message-content">
                  <div className="chat-message-bubble">
                    <p>{msg.text}</p>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="chat-sources">
                        <span className="chat-sources-label">Источники:</span>
                        {msg.sources.map((src, i) => (
                          <span key={i} className="chat-source-tag">{src}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="chat-message-time">{formatTime(msg.timestamp)}</span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="chat-message chat-message--bot">
                <div className="chat-message-avatar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="12" rx="2"/>
                    <path d="M9 20h6M12 16v4M7 10h2M15 10h2M9 14h6"/>
                  </svg>
                </div>
                <div className="chat-message-bubble chat-message--typing">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="chat-quick-questions">
            <span className="quick-questions-label">Быстрые вопросы:</span>
            <div className="quick-questions-list">
              {quickQuestions.map((question, index) => (
                <button key={index} className="quick-question-btn" onClick={() => handleQuickQuestion(question)}>
                  {question}
                </button>
              ))}
            </div>
          </div>

          <div className="chat-input-container">
            <textarea
              className="chat-input"
              placeholder="Печатать..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              rows="1"
            />
            <Button onClick={handleSend} variant="primary" size="medium" disabled={!message.trim() || isTyping}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
