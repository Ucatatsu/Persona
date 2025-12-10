const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Подключение к PostgreSQL (Railway автоматически задаёт DATABASE_URL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        display_name TEXT,
        phone TEXT,
        bio TEXT,
        avatar_color TEXT DEFAULT '#4fc3f7',
        banner_color TEXT DEFAULT '#1976d2',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Добавляем новые колонки если их нет (для существующих БД)
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_url TEXT`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        sender_id TEXT NOT NULL REFERENCES users(id),
        receiver_id TEXT NOT NULL REFERENCES users(id),
        text TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        message_type TEXT DEFAULT 'text',
        call_duration INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE`);
    await client.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text'`);
    await client.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS call_duration INTEGER DEFAULT 0`);

    // Индексы для быстрого поиска
    await client.query(`CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);

    // Таблица push-подписок
    await client.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        endpoint TEXT NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, endpoint)
      )
    `);

    console.log('База данных инициализирована');
  } finally {
    client.release();
  }
}

async function createUser(username, password) {
  try {
    const hash = bcrypt.hashSync(password, 10);
    const id = uuidv4();
    await pool.query(
      'INSERT INTO users (id, username, password) VALUES ($1, $2, $3)',
      [id, username, hash]
    );
    return { success: true, user: { id, username } };
  } catch (e) {
    console.error('Create user error:', e);
    return { success: false, error: 'Пользователь уже существует' };
  }
}

async function loginUser(username, password) {
  try {
    const result = await pool.query(
      'SELECT id, username, password FROM users WHERE username = $1',
      [username]
    );
    if (result.rows.length === 0) {
      return { success: false, error: 'Пользователь не найден' };
    }
    const user = result.rows[0];
    if (!bcrypt.compareSync(password, user.password)) {
      return { success: false, error: 'Неверный пароль' };
    }
    return { success: true, user: { id: user.id, username: user.username } };
  } catch (e) {
    console.error('Login error:', e);
    return { success: false, error: 'Ошибка входа' };
  }
}


async function getAllUsers() {
  try {
    const result = await pool.query('SELECT id, username, display_name, avatar_color FROM users');
    return result.rows;
  } catch (e) {
    console.error('Get users error:', e);
    return [];
  }
}

async function getUser(userId) {
  try {
    const result = await pool.query(
      'SELECT id, username, display_name, phone, bio, avatar_url, banner_url FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0] || null;
  } catch (e) {
    console.error('Get user error:', e);
    return null;
  }
}

async function updateUser(userId, data) {
  try {
    const { display_name, phone, bio } = data;
    await pool.query(
      `UPDATE users SET 
        display_name = COALESCE($2, display_name),
        phone = COALESCE($3, phone),
        bio = COALESCE($4, bio)
      WHERE id = $1`,
      [userId, display_name, phone, bio]
    );
    return { success: true };
  } catch (e) {
    console.error('Update user error:', e);
    return { success: false, error: 'Ошибка обновления' };
  }
}

async function updateUserAvatar(userId, avatarUrl) {
  try {
    await pool.query('UPDATE users SET avatar_url = $2 WHERE id = $1', [userId, avatarUrl]);
    return { success: true };
  } catch (e) {
    console.error('Update avatar error:', e);
    return { success: false };
  }
}

async function updateUserBanner(userId, bannerUrl) {
  try {
    await pool.query('UPDATE users SET banner_url = $2 WHERE id = $1', [userId, bannerUrl]);
    return { success: true };
  } catch (e) {
    console.error('Update banner error:', e);
    return { success: false };
  }
}

async function updateUsername(userId, username) {
  try {
    // Проверяем уникальность
    const existing = await pool.query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, userId]);
    if (existing.rows.length > 0) {
      return { success: false, error: 'Этот ник уже занят' };
    }
    await pool.query('UPDATE users SET username = $2 WHERE id = $1', [userId, username]);
    return { success: true };
  } catch (e) {
    console.error('Update username error:', e);
    return { success: false, error: 'Ошибка смены ника' };
  }
}

async function searchUsers(query) {
  try {
    const result = await pool.query(
      'SELECT id, username FROM users WHERE username ILIKE $1 LIMIT 20',
      [`%${query}%`]
    );
    return result.rows;
  } catch (e) {
    console.error('Search users error:', e);
    return [];
  }
}

async function saveMessage(senderId, receiverId, text, messageType = 'text', callDuration = 0) {
  const id = uuidv4();
  const created_at = new Date().toISOString();
  await pool.query(
    'INSERT INTO messages (id, sender_id, receiver_id, text, message_type, call_duration, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [id, senderId, receiverId, text, messageType, callDuration, created_at]
  );
  return { id, sender_id: senderId, receiver_id: receiverId, text, created_at, message_type: messageType, call_duration: callDuration };
}

async function getMessages(userId1, userId2) {
  try {
    const result = await pool.query(`
      SELECT id, sender_id, receiver_id, text, message_type, call_duration, created_at FROM messages 
      WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
      ORDER BY created_at ASC
    `, [userId1, userId2]);
    return result.rows;
  } catch (e) {
    console.error('Get messages error:', e);
    return [];
  }
}

async function getContacts(userId) {
  try {
    const result = await pool.query(`
      SELECT DISTINCT u.id, u.username, u.display_name, u.avatar_url,
        (SELECT COUNT(*) FROM messages m 
         WHERE m.sender_id = u.id AND m.receiver_id = $1 AND m.is_read = FALSE) as unread_count
      FROM users u
      WHERE u.id IN (
        SELECT DISTINCT sender_id FROM messages WHERE receiver_id = $1
        UNION
        SELECT DISTINCT receiver_id FROM messages WHERE sender_id = $1
      )
    `, [userId]);
    return result.rows;
  } catch (e) {
    console.error('Get contacts error:', e);
    return [];
  }
}

async function markMessagesAsRead(senderId, receiverId) {
  try {
    await pool.query(
      'UPDATE messages SET is_read = TRUE WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE',
      [senderId, receiverId]
    );
    return { success: true };
  } catch (e) {
    console.error('Mark as read error:', e);
    return { success: false };
  }
}

async function getUnreadCount(userId) {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM messages WHERE receiver_id = $1 AND is_read = FALSE',
      [userId]
    );
    return parseInt(result.rows[0].count);
  } catch (e) {
    return 0;
  }
}

// Push подписки
async function savePushSubscription(userId, subscription) {
  const id = uuidv4();
  try {
    await pool.query(
      `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth) 
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, endpoint) DO UPDATE SET p256dh = $4, auth = $5`,
      [id, userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth]
    );
    return { success: true };
  } catch (e) {
    console.error('Save push subscription error:', e);
    return { success: false };
  }
}

async function getPushSubscriptions(userId) {
  try {
    const result = await pool.query(
      'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1',
      [userId]
    );
    return result.rows.map(row => ({
      endpoint: row.endpoint,
      keys: { p256dh: row.p256dh, auth: row.auth }
    }));
  } catch (e) {
    console.error('Get push subscriptions error:', e);
    return [];
  }
}

async function deletePushSubscription(endpoint) {
  try {
    await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
  } catch (e) {
    console.error('Delete push subscription error:', e);
  }
}

module.exports = { initDB, createUser, loginUser, getAllUsers, getUser, updateUser, updateUserAvatar, updateUserBanner, updateUsername, searchUsers, saveMessage, getMessages, getContacts, markMessagesAsRead, getUnreadCount, savePushSubscription, getPushSubscriptions, deletePushSubscription };
