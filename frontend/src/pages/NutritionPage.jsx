import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'
import { apiPost } from '../utils/api'
import './NutritionPage.css'

const defaultMeals = {
  breakfast: [
    { id: 1, name: 'Овсянка с ягодами', calories: 250, protein: 8, carbs: 45, fat: 6 },
    { id: 2, name: 'Кофе с молоком', calories: 80, protein: 4, carbs: 8, fat: 3 },
  ],
  lunch: [
    { id: 3, name: 'Куриная грудка с рисом', calories: 450, protein: 40, carbs: 50, fat: 10 },
    { id: 4, name: 'Салат овощной', calories: 120, protein: 3, carbs: 15, fat: 5 },
  ],
  dinner: [
    { id: 5, name: 'Лосось на гриле', calories: 350, protein: 35, carbs: 5, fat: 20 },
  ],
  snacks: [
    { id: 6, name: 'Яблоко', calories: 80, protein: 0, carbs: 20, fat: 0 },
    { id: 7, name: 'Горсть орехов', calories: 180, protein: 6, carbs: 6, fat: 15 },
  ],
}

const weightHistory = [
  { date: '01.03', weight: 74 },
  { date: '08.03', weight: 73.5 },
  { date: '15.03', weight: 73 },
  { date: '22.03', weight: 72.5 },
  { date: '29.03', weight: 72 },
]

export default function NutritionPage() {
  const { user } = useAuth()
  const [height, setHeight] = useState(user?.height || 170)
  const [weight, setWeight] = useState(user?.weight || 72)
  const [age, setAge] = useState(() => {
    if (user?.birth_date) {
      return new Date().getFullYear() - new Date(user.birth_date).getFullYear()
    }
    return 25
  })
  const [gender, setGender] = useState(user?.gender === 'female' ? 'W' : 'M')
  const [activityLevel, setActivityLevel] = useState(2)
  const [goal, setGoal] = useState('поддержание')
  const [meals, setMeals] = useState(defaultMeals)
  const [activeMealTab, setActiveMealTab] = useState('breakfast')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newProduct, setNewProduct] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' })
  const [serverGoals, setServerGoals] = useState(null)
  const [calcLoading, setCalcLoading] = useState(false)

  const handleCalculateKBJU = async () => {
    setCalcLoading(true)
    try {
      const data = await apiPost('/api/calories/calculate', {
        age, gender, weight, height, activity_level: activityLevel, goal,
      })
      setServerGoals({
        calories: Math.round(data.calories),
        protein: Math.round(data.proteins),
        fat: Math.round(data.fats),
        carbs: Math.round(data.carbs),
        bmi: data.bmi,
        bmi_classification: data.bmi_classification,
      })
    } catch {
      alert('Ошибка расчёта КБЖУ')
    } finally {
      setCalcLoading(false)
    }
  }

  const calculateBMI = () => {
    const heightInMeters = height / 100
    return (weight / (heightInMeters * heightInMeters)).toFixed(1)
  }

  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return { text: 'Недостаточный вес', color: '#FFB74D' }
    if (bmi < 25) return { text: 'Масса тела в норме!', color: '#4CAF50' }
    if (bmi < 30) return { text: 'Избыточный вес', color: '#FF9800' }
    return { text: 'Ожирение', color: '#F44336' }
  }

  const bmi = calculateBMI()
  const category = getBMICategory(bmi)

  const getBMIPosition = (bmi) => {
    const min = 15
    const max = 40
    const position = ((bmi - min) / (max - min)) * 100
    return Math.max(0, Math.min(100, position))
  }

  // Calculate totals
  const totals = Object.values(meals).flat().reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fat: acc.fat + meal.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  const goals = serverGoals || { calories: 2000, protein: 150, carbs: 250, fat: 70 }

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.calories) return
    
    const product = {
      id: Date.now(),
      name: newProduct.name,
      calories: Number(newProduct.calories),
      protein: Number(newProduct.protein) || 0,
      carbs: Number(newProduct.carbs) || 0,
      fat: Number(newProduct.fat) || 0,
    }
    
    setMeals({
      ...meals,
      [activeMealTab]: [...meals[activeMealTab], product],
    })
    setNewProduct({ name: '', calories: '', protein: '', carbs: '', fat: '' })
    setShowAddModal(false)
  }

  const handleDeleteProduct = (mealType, productId) => {
    setMeals({
      ...meals,
      [mealType]: meals[mealType].filter(p => p.id !== productId),
    })
  }

  const mealTabs = [
    { id: 'breakfast', label: 'Завтрак' },
    { id: 'lunch', label: 'Обед' },
    { id: 'dinner', label: 'Ужин' },
    { id: 'snacks', label: 'Перекусы' },
  ]

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="dashboard-content">
        <h1 className="page-title">Питание</h1>

        <div className="nutrition-grid">
          <div className="nutrition-inputs">
            <div className="input-card input-card--green">
              <label className="input-card-label">Рост</label>
              <div className="slider-container">
                <input
                  type="range"
                  min="140"
                  max="220"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="slider slider--green"
                />
                <span className="slider-value">{height} cm</span>
              </div>
            </div>

            <div className="input-card input-card--orange">
              <label className="input-card-label">Вес</label>
              <div className="slider-container">
                <input
                  type="range"
                  min="40"
                  max="150"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="slider slider--orange"
                />
                <span className="slider-value">{weight} kg</span>
              </div>
            </div>
          </div>

          <div className="bmi-card">
            <div className="bmi-header">
              <span className="bmi-title">Индекс массы тела (ИМТ)</span>
              <span className="bmi-status" style={{ backgroundColor: category.color }}>
                {category.text}
              </span>
            </div>
            <div className="bmi-value">{bmi}</div>
            <div className="bmi-scale">
              <div className="bmi-scale-bar">
                <div className="bmi-scale-fill"></div>
                <div className="bmi-scale-marker" style={{ left: `${getBMIPosition(bmi)}%` }}>
                  <div className="bmi-scale-dot"></div>
                </div>
              </div>
              <div className="bmi-scale-labels">
                <span>15</span>
                <span>18.5</span>
                <span>25</span>
                <span>30</span>
                <span>40</span>
              </div>
            </div>
          </div>
        </div>

        {/* KBJU Calculator */}
        <div className="kbju-section">
          <h2 className="section-title">Рассчитать КБЖУ</h2>
          <div className="kbju-form">
            <div className="kbju-row">
              <div className="kbju-field">
                <label>Возраст</label>
                <input type="number" value={age} onChange={e => setAge(Number(e.target.value))} className="form-input" />
              </div>
              <div className="kbju-field">
                <label>Пол</label>
                <select value={gender} onChange={e => setGender(e.target.value)} className="form-input">
                  <option value="M">Мужской</option>
                  <option value="W">Женский</option>
                </select>
              </div>
              <div className="kbju-field">
                <label>Активность</label>
                <select value={activityLevel} onChange={e => setActivityLevel(Number(e.target.value))} className="form-input">
                  <option value={1}>Низкая</option>
                  <option value={2}>Средняя</option>
                  <option value={3}>Высокая</option>
                </select>
              </div>
              <div className="kbju-field">
                <label>Цель</label>
                <select value={goal} onChange={e => setGoal(e.target.value)} className="form-input">
                  <option value="похудение">Похудение</option>
                  <option value="поддержание">Поддержание</option>
                  <option value="набор">Набор массы</option>
                </select>
              </div>
            </div>
            <Button variant="primary" size="medium" onClick={handleCalculateKBJU} disabled={calcLoading}>
              {calcLoading ? 'Расчёт...' : 'Рассчитать КБЖУ'}
            </Button>
            {serverGoals && (
              <div className="kbju-result">
                <span>Норма: <strong>{serverGoals.calories} ккал</strong></span>
                <span>Б: {serverGoals.protein}г</span>
                <span>Ж: {serverGoals.fat}г</span>
                <span>У: {serverGoals.carbs}г</span>
              </div>
            )}
          </div>
        </div>

        {/* Calorie Progress */}
        <div className="calories-section">
          <h2 className="section-title">Прогресс калорий</h2>
          <div className="calories-overview">
            <div className="calorie-main">
              <div className="calorie-circle">
                <svg viewBox="0 0 120 120" className="progress-ring">
                  <circle
                    className="progress-ring-bg"
                    cx="60"
                    cy="60"
                    r="52"
                  />
                  <circle
                    className="progress-ring-fill"
                    cx="60"
                    cy="60"
                    r="52"
                    style={{
                      strokeDashoffset: 326 * (1 - Math.min(totals.calories / goals.calories, 1)),
                    }}
                  />
                </svg>
                <div className="calorie-circle-text">
                  <span className="calorie-current">{totals.calories}</span>
                  <span className="calorie-goal">из {goals.calories}</span>
                </div>
              </div>
              <div className="calorie-summary">
                <div className="calorie-item">
                  <span className="calorie-label">Осталось</span>
                  <span className="calorie-value">{Math.max(0, goals.calories - totals.calories)}</span>
                </div>
                <div className="calorie-item">
                  <span className="calorie-label">Съедено</span>
                  <span className="calorie-value">{totals.calories}</span>
                </div>
              </div>
            </div>
            
            <div className="macros-progress">
              <div className="macro-progress-item">
                <div className="macro-progress-header">
                  <span>Белки</span>
                  <span>{totals.protein} / {goals.protein} г</span>
                </div>
                <div className="macro-progress-bar">
                  <div 
                    className="macro-progress-fill macro-progress-fill--protein"
                    style={{ width: `${Math.min((totals.protein / goals.protein) * 100, 100)}%` }}
                  />
                </div>
              </div>
              
              <div className="macro-progress-item">
                <div className="macro-progress-header">
                  <span>Жиры</span>
                  <span>{totals.fat} / {goals.fat} г</span>
                </div>
                <div className="macro-progress-bar">
                  <div 
                    className="macro-progress-fill macro-progress-fill--fat"
                    style={{ width: `${Math.min((totals.fat / goals.fat) * 100, 100)}%` }}
                  />
                </div>
              </div>
              
              <div className="macro-progress-item">
                <div className="macro-progress-header">
                  <span>Углеводы</span>
                  <span>{totals.carbs} / {goals.carbs} г</span>
                </div>
                <div className="macro-progress-bar">
                  <div 
                    className="macro-progress-fill macro-progress-fill--carbs"
                    style={{ width: `${Math.min((totals.carbs / goals.carbs) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Meals Section */}
        <div className="meals-section">
          <div className="meals-header">
            <h2 className="section-title">Приёмы пищи</h2>
            <Button variant="primary" size="small" onClick={() => setShowAddModal(true)}>
              + Добавить продукт
            </Button>
          </div>

          <div className="meal-tabs">
            {mealTabs.map((tab) => (
              <button
                key={tab.id}
                className={`meal-tab ${activeMealTab === tab.id ? 'meal-tab--active' : ''}`}
                onClick={() => setActiveMealTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="meal-content">
            {meals[activeMealTab].length === 0 ? (
              <div className="meal-empty">
                <p>Нет продуктов в этой категории</p>
                <Button variant="secondary" size="small" onClick={() => setShowAddModal(true)}>
                  Добавить продукт
                </Button>
              </div>
            ) : (
              <div className="meal-list">
                {meals[activeMealTab].map((product) => (
                  <div key={product.id} className="meal-item">
                    <div className="meal-item-info">
                      <span className="meal-item-name">{product.name}</span>
                      <span className="meal-item-macros">
                        Б: {product.protein}г | Ж: {product.fat}г | У: {product.carbs}г
                      </span>
                    </div>
                    <div className="meal-item-actions">
                      <span className="meal-item-calories">{product.calories} ккал</span>
                      <button 
                        className="meal-item-delete"
                        onClick={() => handleDeleteProduct(activeMealTab, product.id)}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="meal-total">
              <span>Итого за {mealTabs.find(t => t.id === activeMealTab)?.label}:</span>
              <span className="meal-total-value">
                {meals[activeMealTab].reduce((sum, p) => sum + p.calories, 0)} ккал
              </span>
            </div>
          </div>
        </div>

        {/* Weight Chart */}
        <div className="weight-section">
          <h2 className="section-title">Динамика веса</h2>
          <div className="weight-chart">
            <div className="weight-chart-grid">
              {weightHistory.map((item, index) => (
                <div key={index} className="weight-chart-column">
                  <div 
                    className="weight-chart-bar"
                    style={{ 
                      height: `${((item.weight - 70) / 5) * 100}%`,
                      minHeight: '20px'
                    }}
                  />
                  <span className="weight-chart-date">{item.date}</span>
                  <span className="weight-chart-value">{item.weight} кг</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Add Product Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-title">Добавить продукт</h3>
              
              <div className="modal-form">
                <div className="form-group">
                  <label className="form-label">Название</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="Например: Яблоко"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Калории (ккал)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newProduct.calories}
                    onChange={(e) => setNewProduct({ ...newProduct, calories: e.target.value })}
                    placeholder="0"
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Белки (г)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newProduct.protein}
                      onChange={(e) => setNewProduct({ ...newProduct, protein: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Жиры (г)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newProduct.fat}
                      onChange={(e) => setNewProduct({ ...newProduct, fat: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Углеводы (г)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newProduct.carbs}
                      onChange={(e) => setNewProduct({ ...newProduct, carbs: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
              
              <div className="modal-actions">
                <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                  Отмена
                </Button>
                <Button variant="primary" onClick={handleAddProduct}>
                  Добавить
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
