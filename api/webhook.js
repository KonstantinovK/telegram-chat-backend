import axios from 'axios';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const messagesDB = new Map();

export default async function handler(req, res) {
  // Добавьте CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const message = req.body.message;
  
  if (message && message.text) {
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
        
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          chat_id: message.chat.id,
          text: '✅ Ответ отправлен посетителю'
        });
      }
    }
  }
  
  res.status(200).send('OK');
}
