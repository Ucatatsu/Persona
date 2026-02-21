import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'

interface LegalModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'terms' | 'privacy'
}

export default function LegalModal({ isOpen, onClose, type }: LegalModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const content = type === 'terms' ? (
    <TermsContent />
  ) : (
    <PrivacyContent />
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl max-h-[90vh] glass rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-white/10 bg-slate-900/80 backdrop-blur-xl">
              <h2 className="text-2xl font-bold text-white">
                {type === 'terms' ? 'Условия использования' : 'Политика конфиденциальности'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors text-white/60 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-88px)] p-6">
              {content}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function TermsContent() {
  return (
    <div className="space-y-6 text-white/90">
      <div className="space-y-2 text-sm text-white/70">
        <p><strong>Поставщик услуг:</strong> Ucatatasu</p>
        <p><strong>Дата вступления в силу:</strong> 13 декабря 2025 года</p>
        <p><strong>Редакция:</strong> 1.1</p>
      </div>

      <p>Настоящие Условия использования регулируют отношения между Поставщиком услуг и Пользователем при использовании мессенджера «Persona».</p>

      <hr className="border-white/20 my-6" />

      <h3 className="text-xl font-bold text-white mt-6 mb-3">1. ОБЩИЕ ПОЛОЖЕНИЯ</h3>
      <p>1.1. Настоящее Соглашение является публичной офертой в соответствии со статьёй 437 Гражданского кодекса Российской Федерации.</p>
      <p>1.2. Регистрация в Сервисе и/или использование Сервиса означает полное и безоговорочное принятие настоящих Условий в соответствии со статьёй 438 ГК РФ.</p>
      <p>1.3. Условия могут быть изменены Поставщиком в одностороннем порядке. Изменения вступают в силу с момента публикации новой редакции.</p>
      <p>1.4. Пользователь обязуется самостоятельно отслеживать изменения Условий. Продолжение использования Сервиса после публикации изменений означает согласие с ними.</p>

      <h3 className="text-xl font-bold text-white mt-6 mb-3">2. ТЕРМИНЫ И ОПРЕДЕЛЕНИЯ</h3>
      <p><strong>Сервис</strong> — программное обеспечение «Persona», предоставляющее функции обмена сообщениями и аудио/видеозвонков, доступное через веб-интерфейс, PWA и настольные приложения.</p>
      <p><strong>Пользователь</strong> — физическое лицо, прошедшее регистрацию и использующее Сервис.</p>
      <p><strong>Поставщик</strong> — лицо, предоставляющее доступ к Сервису (Ucatatasu).</p>
      <p><strong>Учётная запись</strong> — совокупность данных о Пользователе, необходимых для его идентификации и авторизации в Сервисе.</p>
      <p><strong>Контент</strong> — любая информация, размещаемая Пользователем в Сервисе (сообщения, изображения, файлы и т.д.).</p>

      <h3 className="text-xl font-bold text-white mt-6 mb-3">3. ТРЕБОВАНИЯ К ПОЛЬЗОВАТЕЛЮ</h3>
      <h4 className="text-lg font-semibold text-white mt-4 mb-2">3.1. Возрастные ограничения</h4>
      <p>3.1.1. Сервис предназначен для лиц, достигших возраста <strong>14 лет</strong>.</p>
      <p>3.1.2. Лица в возрасте от 14 до 18 лет могут использовать Сервис с согласия родителей или иных законных представителей.</p>
      <p>3.1.3. Регистрируясь в Сервисе, Пользователь подтверждает достижение установленного возраста.</p>

      <h4 className="text-lg font-semibold text-white mt-4 mb-2">3.2. Дееспособность</h4>
      <p>3.2.1. Пользователь подтверждает, что обладает необходимой дееспособностью для заключения настоящего Соглашения.</p>

      <h3 className="text-xl font-bold text-white mt-6 mb-3">4. РЕГИСТРАЦИЯ И УЧЁТНАЯ ЗАПИСЬ</h3>
      <p>4.1. Для использования Сервиса необходима регистрация с указанием уникального имени пользователя (username) и пароля.</p>
      <p>4.2. Пользователь обязуется:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Предоставлять достоверную информацию при регистрации</li>
        <li>Не использовать имена, нарушающие права третьих лиц</li>
        <li>Обеспечивать конфиденциальность данных для входа</li>
        <li>Незамедлительно уведомлять Поставщика о несанкционированном доступе к учётной записи</li>
      </ul>

      <h3 className="text-xl font-bold text-white mt-6 mb-3">6. ЗАПРЕЩЁННЫЕ ДЕЙСТВИЯ</h3>
      <p>При использовании Сервиса <strong>запрещается</strong>:</p>
      
      <h4 className="text-lg font-semibold text-white mt-4 mb-2">6.1. Распространение противоправного контента:</h4>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Материалов, содержащих призывы к экстремизму или терроризму</li>
        <li>Материалов, пропагандирующих насилие, жестокость, ненависть</li>
        <li>Порнографических материалов с участием несовершеннолетних</li>
        <li>Материалов, нарушающих авторские и смежные права</li>
        <li>Персональных данных третьих лиц без их согласия</li>
      </ul>

      <h4 className="text-lg font-semibold text-white mt-4 mb-2">6.2. Нарушение работы Сервиса:</h4>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Попытки несанкционированного доступа к системам Сервиса</li>
        <li>Использование автоматизированных средств (ботов) без разрешения</li>
        <li>Массовая рассылка нежелательных сообщений (спам)</li>
        <li>Действия, создающие чрезмерную нагрузку на инфраструктуру</li>
      </ul>

      <h3 className="text-xl font-bold text-white mt-6 mb-3">14. КОНТАКТНАЯ ИНФОРМАЦИЯ</h3>
      <p><strong>Поставщик услуг:</strong> Ucatatasu</p>
      <p><strong>Адрес для обращений:</strong> support@persona-messenger.com</p>

      <hr className="border-white/20 my-6" />

      <p className="text-sm text-white/60 italic">Используя Сервис, вы подтверждаете, что ознакомились с настоящими Условиями и Политикой конфиденциальности и принимаете их в полном объёме.</p>
    </div>
  )
}

function PrivacyContent() {
  return (
    <div className="space-y-6 text-white/90">
      <div className="space-y-2 text-sm text-white/70">
        <p><strong>Оператор персональных данных:</strong> Ucatatasu</p>
        <p><strong>Дата вступления в силу:</strong> 13 декабря 2025 года</p>
        <p><strong>Редакция:</strong> 1.1</p>
      </div>

      <p>Настоящая Политика конфиденциальности разработана в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных» и определяет порядок обработки и защиты персональных данных Пользователей мессенджера «Persona».</p>

      <hr className="border-white/20 my-6" />

      <h3 className="text-xl font-bold text-white mt-6 mb-3">1. ОБЩИЕ ПОЛОЖЕНИЯ</h3>
      <p>1.1. Настоящая Политика является официальным документом Оператора и определяет порядок обработки и защиты информации о физических лицах, использующих Сервис.</p>
      <p>1.2. Целью настоящей Политики является обеспечение надлежащей защиты информации о Пользователях, в том числе их персональных данных, от несанкционированного доступа и разглашения.</p>
      <p>1.3. Использование Сервиса означает безоговорочное согласие Пользователя с настоящей Политикой и указанными в ней условиями обработки его персональных данных.</p>
      <p>1.4. В случае несогласия с условиями Политики Пользователь должен прекратить использование Сервиса.</p>

      <h3 className="text-xl font-bold text-white mt-6 mb-3">2. ОСНОВНЫЕ ПОНЯТИЯ</h3>
      <p><strong>Персональные данные</strong> — любая информация, относящаяся к прямо или косвенно определённому или определяемому физическому лицу (субъекту персональных данных).</p>
      <p><strong>Обработка персональных данных</strong> — любое действие (операция) или совокупность действий с персональными данными, включая сбор, запись, систематизацию, накопление, хранение, уточнение, извлечение, использование, передачу, обезличивание, блокирование, удаление, уничтожение.</p>
      <p><strong>Оператор</strong> — лицо, самостоятельно или совместно с другими лицами организующее и (или) осуществляющее обработку персональных данных.</p>
      <p><strong>Пользователь</strong> — физическое лицо, использующее Сервис.</p>

      <h3 className="text-xl font-bold text-white mt-6 mb-3">3. ПЕРЕЧЕНЬ ОБРАБАТЫВАЕМЫХ ПЕРСОНАЛЬНЫХ ДАННЫХ</h3>
      <h4 className="text-lg font-semibold text-white mt-4 mb-2">3.1. Данные учётной записи</h4>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Имя пользователя (username)</li>
        <li>Уникальный идентификатор (ID)</li>
        <li>Уникальный тег пользователя</li>
        <li>Хешированный пароль (в зашифрованном виде)</li>
      </ul>

      <h4 className="text-lg font-semibold text-white mt-4 mb-2">3.2. Данные профиля (предоставляются добровольно)</h4>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Отображаемое имя</li>
        <li>Описание профиля (био)</li>
        <li>Изображение аватара</li>
        <li>Изображение баннера</li>
        <li>Настройки цветового оформления профиля</li>
      </ul>

      <h4 className="text-lg font-semibold text-white mt-4 mb-2">3.3. Данные коммуникаций</h4>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Текстовые сообщения</li>
        <li>Метаданные сообщений (время отправки, статус прочтения)</li>
        <li>Информация о звонках (длительность)</li>
      </ul>

      <h4 className="text-lg font-semibold text-white mt-4 mb-2">3.4. Технические данные</h4>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Данные для push-уведомлений (endpoint, ключи шифрования)</li>
        <li>Токены авторизации (JWT)</li>
        <li>IP-адреса (для установления WebRTC-соединений, не хранятся постоянно)</li>
      </ul>

      <h3 className="text-xl font-bold text-white mt-6 mb-3">4. ЦЕЛИ ОБРАБОТКИ ПЕРСОНАЛЬНЫХ ДАННЫХ</h3>
      <p>Оператор обрабатывает персональные данные Пользователя в следующих целях:</p>
      <p>4.1. Регистрация и идентификация Пользователя в Сервисе.</p>
      <p>4.2. Предоставление Пользователю доступа к функциям Сервиса.</p>
      <p>4.3. Обеспечение работы функций обмена сообщениями и звонков.</p>
      <p>4.4. Направление уведомлений о новых сообщениях и звонках.</p>
      <p>4.5. Обеспечение безопасности Сервиса и предотвращение несанкционированного доступа.</p>
      <p>4.6. Улучшение качества Сервиса и разработка новых функций.</p>
      <p>4.7. Исполнение требований законодательства Российской Федерации.</p>

      <h3 className="text-xl font-bold text-white mt-6 mb-3">8. ЗАЩИТА ПЕРСОНАЛЬНЫХ ДАННЫХ</h3>
      <p>Оператор принимает необходимые правовые, организационные и технические меры для защиты персональных данных:</p>
      <p>8.1. <strong>Криптографическая защита:</strong> пароли хранятся в виде хешей (Bcrypt, cost factor 12).</p>
      <p>8.2. <strong>Защита передачи данных:</strong> использование HTTPS/TLS для всех соединений.</p>
      <p>8.3. <strong>Защита API:</strong> применение JWT-токенов для авторизации запросов.</p>
      <p>8.4. <strong>Шифрование уведомлений:</strong> push-уведомления шифруются с использованием протокола VAPID.</p>
      <p>8.5. <strong>P2P-соединения:</strong> аудио- и видеопотоки передаются напрямую между пользователями через WebRTC.</p>

      <h3 className="text-xl font-bold text-white mt-6 mb-3">12. КОНТАКТНАЯ ИНФОРМАЦИЯ</h3>
      <p><strong>Оператор персональных данных:</strong> Ucatatasu</p>
      <p><strong>Адрес для обращений:</strong> support@persona-messenger.com</p>
      <p className="mt-4"><strong>Уполномоченный орган по защите прав субъектов персональных данных:</strong></p>
      <p>Федеральная служба по надзору в сфере связи, информационных технологий и массовых коммуникаций (Роскомнадзор)</p>
      <p>Адрес: 109992, г. Москва, Китайгородский пр., д. 7, стр. 2</p>
      <p>Сайт: <a href="https://rkn.gov.ru" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">https://rkn.gov.ru</a></p>

      <hr className="border-white/20 my-6" />

      <p className="text-sm text-white/60 italic">Настоящая Политика конфиденциальности является неотъемлемой частью Условий использования Сервиса.</p>
    </div>
  )
}
