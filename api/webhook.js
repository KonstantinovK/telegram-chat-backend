import axios from 'axios';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const messagesDB = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const message = req.body.message;
  
  if (message && message.text) {
    // Обработка команды /reply_visitorId
    if (message.text.startsWith('/reply_')) {
      const parts = message.text.split(' ');
      const visitorId = parts[0].replace('/reply_', '');
      const replyText = parts.slice(1).join(' ');
      
      if (messagesDB.has(visitorId)) {
        messagesDB.get(visitorId).push({
          id: Date.now(),
          text: replyText,
          sender: 'operator',
          timestamp: new Date().toISOString(),
          displayed: false
        });
        
        // Отправляем подтверждение в Telegram
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          chat_id: message.chat.id,
          text: '✅ Ответ отправлен посетителю'
        });
      }
    }
  }
  
  res.status(200).send('OK');
}
