import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import RegisterParamsPage from './pages/RegisterParamsPage'
import DashboardPage from './pages/DashboardPage'
import NutritionPage from './pages/NutritionPage'
import ChatPage from './pages/ChatPage'
import AccountPage from './pages/AccountPage'
import WorkoutsPage from './pages/WorkoutsPage'
import RemindersPage from './pages/RemindersPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import RecommendationsPage from './pages/RecommendationsPage'
import DefinitionsPage from './pages/DefinitionsPage'
import KnowledgePage from './pages/KnowledgePage'
import PrivacyPage from './pages/PrivacyPage'
import CookieBanner from './components/CookieBanner'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Загрузка...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  return (
    <>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/register-params" element={<RegisterParamsPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />

      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/dashboard/nutrition" element={<ProtectedRoute><NutritionPage /></ProtectedRoute>} />
      <Route path="/dashboard/ai-assistant" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="/dashboard/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
      <Route path="/dashboard/workouts" element={<ProtectedRoute><WorkoutsPage /></ProtectedRoute>} />
      <Route path="/dashboard/reminders" element={<ProtectedRoute><RemindersPage /></ProtectedRoute>} />
      <Route path="/dashboard/recommendations" element={<ProtectedRoute><RecommendationsPage /></ProtectedRoute>} />
      <Route path="/dashboard/definitions" element={<ProtectedRoute><DefinitionsPage /></ProtectedRoute>} />
      <Route path="/dashboard/knowledge" element={<ProtectedRoute><KnowledgePage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <CookieBanner />
    </>
  )
}

export default App
