-- ============================================
-- УПРОЩЕННАЯ НАСТРОЙКА БЕЗ RLS
-- Для использования с собственным бэкенд
ом Go
-- ============================================

-- ВАЖНО: Так как вы используете собственный бэкенд на Go,
-- RLS политики с auth.uid() работать не будут.
-- Вместо этого контролируйте доступ на уровне Go кода.

-- Отключаем RLS для всех таблиц (если был включен)
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS servers DISABLE ROW LEVEL SECURITY;

-- Удаляем все существующие политики (если были)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname 
              FROM pg_policies 
              WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- ============================================
-- ВАЖНО: Безопасность на уровне приложения
-- ============================================

-- Убедитесь, что в вашем Go коде:
-- 1. Все запросы проходят через middleware аутентификации
-- 2. Проверяется, что пользователь имеет право на операцию
-- 3. Используются параметризованные запросы (защита от SQL injection)
-- 4. Валидируются все входные данные

-- Пример проверок в Go:
-- - При чтении сообщений: WHERE (sender_id = $1 OR receiver_id = $1)
-- - При обновлении профиля: WHERE id = $1 AND id = $userID
-- - При удалении сообщения: WHERE id = $1 AND sender_id = $userID

-- ============================================
-- НАСТРОЙКА ДОСТУПА К БАЗЕ ДАННЫХ
-- ============================================

-- Создайте отдельного пользователя для приложения (если еще не создан)
-- DO $$
-- BEGIN
--     IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'app_user') THEN
--         CREATE USER app_user WITH PASSWORD 'your_secure_password';
--     END IF;
-- END $$;

-- Дайте права только на нужные операции
-- GRANT CONNECT ON DATABASE postgres TO app_user;
-- GRANT USAGE ON SCHEMA public TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- ============================================
-- РЕКОМЕНДАЦИИ ПО БЕЗОПАСНОСТИ
-- ============================================

-- 1. Используйте переменные окружения для чувствительных данных
-- 2. Включите SSL для подключения к базе данных
-- 3. Ограничьте IP адреса, которые могут подключаться к БД
-- 4. Регулярно обновляйте пароли
-- 5. Логируйте все операции с данными
-- 6. Используйте rate limiting для API
-- 7. Валидируйте все входные данные
-- 8. Используйте HTTPS для всех запросов

-- ============================================
-- МОНИТОРИНГ
-- ============================================

-- Создайте таблицу для логов (опционально)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id TEXT,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекс для быстрого поиска по пользователю и времени
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created 
ON audit_logs(user_id, created_at DESC);

-- ============================================
-- ПРОВЕРКА
-- ============================================

-- Проверьте, что RLS отключен
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'messages', 'reactions', 'groups', 'group_members', 'channels', 'servers');

-- Должно показать rowsecurity = false для всех таблиц
