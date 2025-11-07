import axios from 'axios';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const messagesDB = new Map();

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Webhook received:', JSON.stringify(req.body, null, 2));

    const message = req.body.message;
    
    if (message && message.text) {
      console.log('Message text:', message.text);

      // Обработка команды /reply_visitorId
      if (message.text.startsWith('/reply_')) {
        const parts = message.text.split(' ');
        const visitorId = parts[0].replace('/reply_', '');
        const replyText = parts.slice(1).join(' ');

        console.log('Processing reply for visitor:', visitorId, 'Text:', replyText);
        
        if (!messagesDB.has(visitorId)) {
          messagesDB.set(visitorId, []);
        }

        messagesDB.get(visitorId).push({
          id: Date.now(),
          text: replyText,
          sender: 'operator',
          timestamp: new Date().toISOString(),
          displayed: false
        });

        console.log('Reply saved for visitor:', visitorId);
        
        // Отправляем подтверждение
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          chat_id: message.chat.id,
          text: '✅ Ответ отправлен посетителю: ' + replyText
        });

        console.log('Confirmation sent to Telegram');
      }
    }
    
    res.status(200).json({ status: 'OK', processed: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}
