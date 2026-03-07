-- ============================================
-- SUPABASE RLS POLICIES
-- Политики безопасности на уровне строк
-- ============================================

-- 1. USERS TABLE
-- Включаем RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Пользователи могут читать всех пользователей (для поиска и списка контактов)
CREATE POLICY "Users can view all users"
ON users FOR SELECT
TO authenticated
USING (true);

-- Пользователи могут обновлять только свой профиль
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid()::text = id)
WITH CHECK (auth.uid()::text = id);

-- Регистрация новых пользователей (через API)
CREATE POLICY "Anyone can insert users"
ON users FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- ============================================
-- 2. MESSAGES TABLE
-- ============================================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Пользователи могут читать сообщения, где они отправитель или получатель
CREATE POLICY "Users can view own messages"
ON messages FOR SELECT
TO authenticated
USING (
  auth.uid()::text = sender_id OR 
  auth.uid()::text = receiver_id
);

-- Пользователи могут отправлять сообщения
CREATE POLICY "Users can send messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = sender_id);

-- Пользователи могут обновлять свои сообщения (для редактирования)
CREATE POLICY "Users can update own messages"
ON messages FOR UPDATE
TO authenticated
USING (auth.uid()::text = sender_id)
WITH CHECK (auth.uid()::text = sender_id);

-- Пользователи могут удалять свои сообщения
CREATE POLICY "Users can delete own messages"
ON messages FOR DELETE
TO authenticated
USING (auth.uid()::text = sender_id);

-- ============================================
-- 3. REACTIONS TABLE
-- ============================================
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Пользователи могут видеть реакции на сообщения, которые они могут видеть
CREATE POLICY "Users can view reactions on accessible messages"
ON reactions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM messages 
    WHERE messages.id = reactions.message_id 
    AND (messages.sender_id = auth.uid()::text OR messages.receiver_id = auth.uid()::text)
  )
);

-- Пользователи могут добавлять реакции
CREATE POLICY "Users can add reactions"
ON reactions FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid()::text = user_id AND
  EXISTS (
    SELECT 1 FROM messages 
    WHERE messages.id = message_id 
    AND (messages.sender_id = auth.uid()::text OR messages.receiver_id = auth.uid()::text)
  )
);

-- Пользователи могут удалять свои реакции
CREATE POLICY "Users can delete own reactions"
ON reactions FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id);

-- ============================================
-- 4. GROUPS TABLE (если используется)
-- ============================================
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Пользователи могут видеть группы, в которых они состоят
CREATE POLICY "Users can view groups they are members of"
ON groups FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_members.group_id = groups.id 
    AND group_members.user_id = auth.uid()::text
  )
);

-- Пользователи могут создавать группы
CREATE POLICY "Users can create groups"
ON groups FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = created_by);

-- Создатели могут обновлять свои группы
CREATE POLICY "Creators can update own groups"
ON groups FOR UPDATE
TO authenticated
USING (auth.uid()::text = created_by)
WITH CHECK (auth.uid()::text = created_by);

-- Создатели могут удалять свои группы
CREATE POLICY "Creators can delete own groups"
ON groups FOR DELETE
TO authenticated
USING (auth.uid()::text = created_by);

-- ============================================
-- 5. GROUP_MEMBERS TABLE
-- ============================================
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Участники группы могут видеть других участников
CREATE POLICY "Group members can view other members"
ON group_members FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM group_members gm 
    WHERE gm.group_id = group_members.group_id 
    AND gm.user_id = auth.uid()::text
  )
);

-- Создатели группы могут добавлять участников
CREATE POLICY "Group creators can add members"
ON group_members FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM groups 
    WHERE groups.id = group_id 
    AND groups.created_by = auth.uid()::text
  )
);

-- Участники могут покинуть группу
CREATE POLICY "Members can leave group"
ON group_members FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id);

-- Создатели могут удалять участников
CREATE POLICY "Creators can remove members"
ON group_members FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM groups 
    WHERE groups.id = group_id 
    AND groups.created_by = auth.uid()::text
  )
);

-- ============================================
-- 6. CHANNELS TABLE (если используется)
-- ============================================
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

-- Все могут видеть публичные каналы
CREATE POLICY "Anyone can view public channels"
ON channels FOR SELECT
TO authenticated
USING (is_public = true);

-- Участники могут видеть приватные каналы
CREATE POLICY "Members can view private channels"
ON channels FOR SELECT
TO authenticated
USING (
  is_public = false AND
  EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_members.group_id = channels.group_id 
    AND group_members.user_id = auth.uid()::text
  )
);

-- Создатели групп могут создавать каналы
CREATE POLICY "Group creators can create channels"
ON channels FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM groups 
    WHERE groups.id = group_id 
    AND groups.created_by = auth.uid()::text
  )
);

-- ============================================
-- 7. SERVERS TABLE (если используется)
-- ============================================
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;

-- Все могут видеть публичные серверы
CREATE POLICY "Anyone can view public servers"
ON servers FOR SELECT
TO authenticated
USING (is_public = true);

-- Владельцы могут управлять своими серверами
CREATE POLICY "Owners can manage own servers"
ON servers FOR ALL
TO authenticated
USING (auth.uid()::text = owner_id)
WITH CHECK (auth.uid()::text = owner_id);

-- ============================================
-- ВАЖНО: После применения этих политик
-- ============================================
-- 1. Проверьте, что все работает корректно
-- 2. Убедитесь, что auth.uid() возвращает правильный ID пользователя
-- 3. Если используете JWT токены, убедитесь что они содержат user_id
-- 4. Протестируйте все операции (чтение, запись, обновление, удаление)

-- Для проверки текущего пользователя:
-- SELECT auth.uid();

-- Для просмотра всех политик:
-- SELECT * FROM pg_policies WHERE schemaname = 'public';
