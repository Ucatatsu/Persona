import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEffect } from 'react'

export default function TermsOfService() {
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const handleBack = () => {
    navigate(-1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4 hover:bg-white/5 px-4 py-2 rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Назад</span>
          </button>
        </div>

        {/* Content */}
        <div className="glass rounded-2xl p-8 prose prose-invert max-w-none">
          <div className="space-y-6 text-white/90">
            <h1 className="text-3xl font-bold text-white mb-4">УСЛОВИЯ ИСПОЛЬЗОВАНИЯ МЕССЕНДЖЕРА «PERSONA»</h1>
            
            <div className="space-y-2 text-sm text-white/70">
              <p><strong>Поставщик услуг:</strong> Ucatatasu</p>
              <p><strong>Дата вступления в силу:</strong> 13 декабря 2025 года</p>
              <p><strong>Редакция:</strong> 1.1</p>
            </div>

            <p>Настоящие Условия использования регулируют отношения между Поставщиком услуг и Пользователем при использовании мессенджера «Persona».</p>

            <hr className="border-white/20 my-6" />

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. ОБЩИЕ ПОЛОЖЕНИЯ</h2>
            <p>1.1. Настоящее Соглашение является публичной офертой в соответствии со статьёй 437 Гражданского кодекса Российской Федерации.</p>
            <p>1.2. Регистрация в Сервисе и/или использование Сервиса означает полное и безоговорочное принятие настоящих Условий в соответствии со статьёй 438 ГК РФ.</p>
            <p>1.3. Условия могут быть изменены Поставщиком в одностороннем порядке. Изменения вступают в силу с момента публикации новой редакции.</p>
            <p>1.4. Пользователь обязуется самостоятельно отслеживать изменения Условий. Продолжение использования Сервиса после публикации изменений означает согласие с ними.</p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. ТЕРМИНЫ И ОПРЕДЕЛЕНИЯ</h2>
            <p><strong>Сервис</strong> — программное обеспечение «Persona», предоставляющее функции обмена сообщениями и аудио/видеозвонков, доступное через веб-интерфейс, PWA и настольные приложения.</p>
            <p><strong>Пользователь</strong> — физическое лицо, прошедшее регистрацию и использующее Сервис.</p>
            <p><strong>Поставщик</strong> — лицо, предоставляющее доступ к Сервису (Ucatatasu).</p>
            <p><strong>Учётная запись</strong> — совокупность данных о Пользователе, необходимых для его идентификации и авторизации в Сервисе.</p>
            <p><strong>Контент</strong> — любая информация, размещаемая Пользователем в Сервисе (сообщения, изображения, файлы и т.д.).</p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. ТРЕБОВАНИЯ К ПОЛЬЗОВАТЕЛЮ</h2>
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.1. Возрастные ограничения</h3>
            <p>3.1.1. Сервис предназначен для лиц, достигших возраста <strong>14 лет</strong>.</p>
            <p>3.1.2. Лица в возрасте от 14 до 18 лет могут использовать Сервис с согласия родителей или иных законных представителей.</p>
            <p>3.1.3. Регистрируясь в Сервисе, Пользователь подтверждает достижение установленного возраста.</p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.2. Дееспособность</h3>
            <p>3.2.1. Пользователь подтверждает, что обладает необходимой дееспособностью для заключения настоящего Соглашения.</p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">6. ЗАПРЕЩЁННЫЕ ДЕЙСТВИЯ</h2>
            <p>При использовании Сервиса <strong>запрещается</strong>:</p>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">6.1. Распространение противоправного контента:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Материалов, содержащих призывы к экстремизму или терроризму</li>
              <li>Материалов, пропагандирующих насилие, жестокость, ненависть</li>
              <li>Порнографических материалов с участием несовершеннолетних</li>
              <li>Материалов, нарушающих авторские и смежные права</li>
              <li>Персональных данных третьих лиц без их согласия</li>
              <li>Заведомо ложной информации, порочащей честь и достоинство граждан</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">6.2. Нарушение работы Сервиса:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Попытки несанкционированного доступа к системам Сервиса</li>
              <li>Использование автоматизированных средств (ботов) без разрешения</li>
              <li>Массовая рассылка нежелательных сообщений (спам)</li>
              <li>Действия, создающие чрезмерную нагрузку на инфраструктуру</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">14. КОНТАКТНАЯ ИНФОРМАЦИЯ</h2>
            <p><strong>Поставщик услуг:</strong> Ucatatasu</p>
            <p><strong>Адрес для обращений:</strong> support@persona-messenger.com</p>

            <hr className="border-white/20 my-6" />

            <p className="text-sm text-white/60 italic">Используя Сервис, вы подтверждаете, что ознакомились с настоящими Условиями и Политикой конфиденциальности и принимаете их в полном объёме.</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
