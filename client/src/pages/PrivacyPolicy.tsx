import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEffect } from 'react'

export default function PrivacyPolicy() {
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
            <h1 className="text-3xl font-bold text-white mb-4">ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ МЕССЕНДЖЕРА «PERSONA»</h1>
            
            <div className="space-y-2 text-sm text-white/70">
              <p><strong>Оператор персональных данных:</strong> Ucatatasu</p>
              <p><strong>Дата вступления в силу:</strong> 13 декабря 2025 года</p>
              <p><strong>Редакция:</strong> 1.1</p>
            </div>

            <p>Настоящая Политика конфиденциальности разработана в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных» и определяет порядок обработки и защиты персональных данных Пользователей мессенджера «Persona».</p>

            <hr className="border-white/20 my-6" />

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. ОБЩИЕ ПОЛОЖЕНИЯ</h2>
            <p>1.1. Настоящая Политика является официальным документом Оператора и определяет порядок обработки и защиты информации о физических лицах, использующих Сервис.</p>
            <p>1.2. Целью настоящей Политики является обеспечение надлежащей защиты информации о Пользователях, в том числе их персональных данных, от несанкционированного доступа и разглашения.</p>
            <p>1.3. Использование Сервиса означает безоговорочное согласие Пользователя с настоящей Политикой и указанными в ней условиями обработки его персональных данных.</p>
            <p>1.4. В случае несогласия с условиями Политики Пользователь должен прекратить использование Сервиса.</p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. ОСНОВНЫЕ ПОНЯТИЯ</h2>
            <p><strong>Персональные данные</strong> — любая информация, относящаяся к прямо или косвенно определённому или определяемому физическому лицу (субъекту персональных данных).</p>
            <p><strong>Обработка персональных данных</strong> — любое действие (операция) или совокупность действий с персональными данными, включая сбор, запись, систематизацию, накопление, хранение, уточнение, извлечение, использование, передачу, обезличивание, блокирование, удаление, уничтожение.</p>
            <p><strong>Оператор</strong> — лицо, самостоятельно или совместно с другими лицами организующее и (или) осуществляющее обработку персональных данных.</p>
            <p><strong>Пользователь</strong> — физическое лицо, использующее Сервис.</p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. ПЕРЕЧЕНЬ ОБРАБАТЫВАЕМЫХ ПЕРСОНАЛЬНЫХ ДАННЫХ</h2>
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.1. Данные учётной записи</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Имя пользователя (username)</li>
              <li>Уникальный идентификатор (ID)</li>
              <li>Уникальный тег пользователя</li>
              <li>Хешированный пароль (в зашифрованном виде)</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.2. Данные профиля (предоставляются добровольно)</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Отображаемое имя</li>
              <li>Описание профиля (био)</li>
              <li>Изображение аватара</li>
              <li>Изображение баннера</li>
              <li>Настройки цветового оформления профиля</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.3. Данные коммуникаций</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Текстовые сообщения</li>
              <li>Метаданные сообщений (время отправки, статус прочтения)</li>
              <li>Информация о звонках (длительность)</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.4. Технические данные</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Данные для push-уведомлений (endpoint, ключи шифрования)</li>
              <li>Токены авторизации (JWT)</li>
              <li>IP-адреса (для установления WebRTC-соединений, не хранятся постоянно)</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. ЦЕЛИ ОБРАБОТКИ ПЕРСОНАЛЬНЫХ ДАННЫХ</h2>
            <p>Оператор обрабатывает персональные данные Пользователя в следующих целях:</p>
            <p>4.1. Регистрация и идентификация Пользователя в Сервисе.</p>
            <p>4.2. Предоставление Пользователю доступа к функциям Сервиса.</p>
            <p>4.3. Обеспечение работы функций обмена сообщениями и звонков.</p>
            <p>4.4. Направление уведомлений о новых сообщениях и звонках.</p>
            <p>4.5. Обеспечение безопасности Сервиса и предотвращение несанкционированного доступа.</p>
            <p>4.6. Улучшение качества Сервиса и разработка новых функций.</p>
            <p>4.7. Исполнение требований законодательства Российской Федерации.</p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">12. КОНТАКТНАЯ ИНФОРМАЦИЯ</h2>
            <p><strong>Оператор персональных данных:</strong> Ucatatasu</p>
            <p><strong>Адрес для обращений:</strong> support@persona-messenger.com</p>
            <p className="mt-4"><strong>Уполномоченный орган по защите прав субъектов персональных данных:</strong></p>
            <p>Федеральная служба по надзору в сфере связи, информационных технологий и массовых коммуникаций (Роскомнадзор)</p>
            <p>Адрес: 109992, г. Москва, Китайгородский пр., д. 7, стр. 2</p>
            <p>Сайт: <a href="https://rkn.gov.ru" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">https://rkn.gov.ru</a></p>

            <hr className="border-white/20 my-6" />

            <p className="text-sm text-white/60 italic">Настоящая Политика конфиденциальности является неотъемлемой частью Условий использования Сервиса.</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
