import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserPlus } from 'lucide-react'
import Logo from '../components/Logo'
import LegalModal from '../components/LegalModal'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!agreedToTerms || !agreedToPrivacy) {
      setError('Необходимо согласиться с условиями использования и политикой конфиденциальности')
      return
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    if (password.length < 6) {
      setError('Пароль должен быть минимум 6 символов')
      return
    }

    setLoading(true)

    try {
      await api.post('/api/register', { username, password })
      // Автоматический вход после регистрации
      try {
        const loginResponse = await api.post('/api/login', { username, password })
        const { token, user } = loginResponse.data
        setAuth(user, token)
        navigate('/chat')
      } catch (loginErr) {
        // Если автовход не удался, переходим на страницу входа
        navigate('/login')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 right-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="card">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Logo size="md" animated />
          </div>

          <h1 className="text-3xl font-bold text-center mb-2 text-accent">
            Регистрация
          </h1>
          <p className="text-center text-white/60 mb-8">
            Создайте новый аккаунт
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Имя пользователя"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                required
                minLength={3}
                maxLength={20}
              />
              <p className="text-xs text-white/40 mt-1 ml-1">
                3-20 символов, только буквы, цифры и _
              </p>
            </div>

            <div>
              <input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                required
                minLength={6}
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="Подтвердите пароль"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
                required
              />
            </div>

            {/* Consent Checkboxes */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-accent focus:ring-accent focus:ring-offset-0 cursor-pointer"
                  required
                />
                <span className="text-sm text-white/80 group-hover:text-white transition-colors">
                  Я согласен с{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      setShowTermsModal(true)
                    }}
                    className="text-accent hover:text-accent/80 underline"
                  >
                    Условиями использования
                  </button>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreedToPrivacy}
                  onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-accent focus:ring-accent focus:ring-offset-0 cursor-pointer"
                  required
                />
                <span className="text-sm text-white/80 group-hover:text-white transition-colors">
                  Я согласен с{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      setShowPrivacyModal(true)
                    }}
                    className="text-accent hover:text-accent/80 underline"
                  >
                    Политикой конфиденциальности
                  </button>
                </span>
              </label>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Зарегистрироваться
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-white/60">
              Уже есть аккаунт?{' '}
              <Link
                to="/login"
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Войти
              </Link>
            </p>
          </div>
        </div>

        {/* Legal Modals */}
        <LegalModal
          isOpen={showTermsModal}
          onClose={() => setShowTermsModal(false)}
          type="terms"
        />
        <LegalModal
          isOpen={showPrivacyModal}
          onClose={() => setShowPrivacyModal(false)}
          type="privacy"
        />
      </motion.div>
    </div>
  )
}
