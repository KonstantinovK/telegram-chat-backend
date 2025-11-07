import axios from 'axios';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Простое хранилище в памяти (в продакшене используйте базу)
const messagesDB = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { visitorId, message, page, userAgent } = req.body;

    const telegramMessage = `
👤 Новое сообщение от посетителя:
${message}

📄 Страница: ${page}
🆔 ID посетителя: ${visitorId}
📱 Браузер: ${userAgent}

Ответить: /reply_${visitorId}
    `;

    // Отправляем в Telegram
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: telegramMessage,
      parse_mode: 'HTML'
    });

    // Сохраняем сообщение
    if (!messagesDB.has(visitorId)) {
      messagesDB.set(visitorId, []);
    }
    
    messagesDB.get(visitorId).push({
      id: Date.now(),
      text: message,
      sender: 'visitor',
      timestamp: new Date().toISOString()
    });

    res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
}
