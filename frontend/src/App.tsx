import { Routes, Route } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { useEffect } from 'react'

// Pages
import LoginPage from '@/pages/LoginPage'
import ChatPage from '@/pages/ChatPage'
import LoadingPage from '@/pages/LoadingPage'

function App() {
  const { user, isLoading, checkAuth } = useAuthStore()
  const { theme } = useThemeStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    // Применяем тему к документу
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  if (isLoading) {
    return <LoadingPage />
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Routes>
        <Route 
          path="/" 
          element={user ? <ChatPage /> : <LoginPage />} 
        />
        <Route 
          path="/login" 
          element={!user ? <LoginPage /> : <ChatPage />} 
        />
        <Route 
          path="/chat/*" 
          element={user ? <ChatPage /> : <LoginPage />} 
        />
      </Routes>
    </div>
  )
}

export default App