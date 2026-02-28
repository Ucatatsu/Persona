# Настройка Supabase для Persona

## Подключение к Supabase

### Шаг 1: Получить строку подключения

1. Зайдите на https://supabase.com/dashboard
2. Выберите ваш проект
3. Перейдите в **Settings** → **Database**
4. Найдите раздел **Connection string**
5. Выберите **URI** формат
6. Скопируйте строку (она выглядит так):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

### Шаг 2: Настроить переменные окружения на Render

#### Для бэкенда (persona-backend-o96b):

1. Откройте https://dashboard.render.com
2. Выберите сервис `persona-backend-o96b`
3. Перейдите в **Environment**
4. Добавьте переменную:

**Вариант 1 (рекомендуется):**
```
DATABASE_URL=postgresql://postgres:Persona.msg296@db.ztjhjbpwfeiyjmxcdbke.supabase.co:5432/postgres
```

**Вариант 2 (отдельные параметры):**
```
USE_SQLITE=false
DB_HOST=db.ztjhjbpwfeiyjmxcdbke.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=Persona.msg296
DB_NAME=postgres
```

5. Нажмите **Save Changes**
6. Render автоматически перезапустит сервис

### Шаг 3: Проверить подключение

После перезапуска проверьте логи:
1. Откройте сервис на Render
2. Перейдите на вкладку **Logs**
3. Должно быть сообщение: `✅ Database migrations completed`

### Возможные проблемы

#### Ошибка: "network is unreachable"
**Причина:** Render не может подключиться к Supabase

**Решение:**
1. Проверьте, что используете правильный хост: `db.ztjhjbpwfeiyjmxcdbke.supabase.co`
2. Убедитесь, что в Supabase включен IPv4 (Settings → Database → Connection pooling)
3. Используйте Connection Pooler вместо прямого подключения:
   - В Supabase перейдите в Settings → Database
   - Включите **Connection Pooler**
   - Используйте Pooler connection string вместо Direct connection

#### Ошибка: "SSL required"
**Решение:** Код уже настроен на использование SSL для внешних хостов

#### Ошибка: "password authentication failed"
**Решение:** Проверьте пароль в переменных окружения

### Использование Connection Pooler (рекомендуется для Render)

Supabase предоставляет Connection Pooler для лучшей производительности:

1. В Supabase Dashboard → Settings → Database
2. Найдите **Connection Pooler** (порт 6543)
3. Используйте эту строку подключения:
   ```
   postgresql://postgres:Persona.msg296@db.ztjhjbpwfeiyjmxcdbke.supabase.co:6543/postgres
   ```

Обновите `DATABASE_URL` на Render с портом **6543** вместо **5432**.

### Миграции

При первом подключении автоматически создадутся таблицы:
- `users` - пользователи
- `messages` - сообщения
- `reactions` - реакции на сообщения
- `groups` - группы
- `group_members` - участники групп
- `channels` - каналы
- `servers` - серверы

### Проверка таблиц в Supabase

1. Зайдите в Supabase Dashboard
2. Перейдите в **Table Editor**
3. Должны появиться все таблицы после первого запуска

## Дата
28 февраля 2026
