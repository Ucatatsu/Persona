import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useUISettings } from './hooks/useUISettings'
import Login from './pages/Login'
import Register from './pages/Register'
import Chat from './pages/Chat'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'

function App() {
  const { token } = useAuthStore()
  useUISettings() // Apply UI settings globally

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <div className="min-h-screen bg-slate-900">
        <Routes>
          <Route path="/login" element={!token ? <Login /> : <Navigate to="/chat" />} />
          <Route path="/register" element={!token ? <Register /> : <Navigate to="/chat" />} />
          <Route path="/chat" element={token ? <Chat /> : <Navigate to="/login" />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/" element={<Navigate to={token ? "/chat" : "/login"} />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
