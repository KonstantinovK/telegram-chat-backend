import axios from 'axios';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Используем глобальную переменную для хранения между cold starts
global.messagesDB = global.messagesDB || new Map();

export default async function handler(req, res) {
  const messagesDB = global.messagesDB;
  
  console.log('=== WEBHOOK CALLED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Логируем ВСЕ что приходит
  console.log('📦 RAW BODY:', JSON.stringify(req.body));
  console.log('📦 BODY TYPE:', typeof req.body);
  
  try {
    const update = req.body;
    console.log('🔄 Update received:', update);
    
    if (update && update.message) {
      const message = update.message;
      console.log('💬 Message text:', message.text);
      console.log('👤 From:', message.from?.username || message.from?.id);
      console.log('💬 Chat:', message.chat?.id);

      // ПРОСТАЯ обработка команды reply
      if (message.text && message.text.includes('reply')) {
        console.log('🎯 REPLY COMMAND FOUND');
        
        // Простая логика - ищем visitor_ в тексте
        const visitorMatch = message.text.match(/visitor_[a-z0-9]+/);
        if (visitorMatch) {
          const visitorId = visitorMatch[0];
          console.log('🎯 Found visitorId:', visitorId);
          
          // Извлекаем текст ответа (все после visitorId)
          const replyStart = message.text.indexOf(visitorId) + visitorId.length;
          const replyText = message.text.substring(replyStart).trim();
          console.log('🎯 Reply text:', replyText);
          
          if (replyText) {
            // Сохраняем сообщение
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
            
            console.log('💾 Message saved for:', visitorId);
            console.log('📊 All messages:', Array.from(messagesDB.entries()));
            
            // Отправляем подтверждение
            await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
              chat_id: message.chat.id,
              text: `✅ Ответ сохранен для ${visitorId}`
            });
          }
        }
      }
    }
    
    console.log('✅ WEBHOOK COMPLETED');
    res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('❌ WEBHOOK ERROR:', error);
    res.status(500).json({ error: error.message });
  }
}
