import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useUISettings } from './hooks/useUISettings'
import Login from './pages/Login'
import Register from './pages/Register'
import Chat from './pages/Chat'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import { useEffect, useState } from 'react'

function App() {
  const { token } = useAuthStore()
  const [isReady, setIsReady] = useState(false)
  useUISettings() // Apply UI settings globally

  // Небольшая задержка для инициализации
  useEffect(() => {
    setIsReady(true)
  }, [])

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <div className="text-white/60">Загрузка...</div>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <div className="min-h-screen bg-slate-900">
        <Routes>
          <Route path="/login" element={!token ? <Login /> : <Navigate to="/chat" replace />} />
          <Route path="/register" element={!token ? <Register /> : <Navigate to="/chat" replace />} />
          <Route path="/chat" element={token ? <Chat /> : <Navigate to="/login" replace />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/" element={<Navigate to={token ? "/chat" : "/login"} replace />} />
          <Route path="*" element={<Navigate to={token ? "/chat" : "/login"} replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
