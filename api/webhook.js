import axios from 'axios';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const messagesDB = new Map();

// Глобальная переменная для хранения сообщений между запросами
global.messagesDB = global.messagesDB || new Map();

export default async function handler(req, res) {
  // Используем глобальную переменную чтобы сохранять данные между cold starts
  const messagesDB = global.messagesDB;

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
    console.log('🔄 ===== WEBHOOK START =====');
    console.log('📦 Request method:', req.method);
    console.log('📦 Request URL:', req.url);
    
    // Логируем тело запроса по частям
    const body = req.body;
    console.log('📦 Body type:', typeof body);
    console.log('📦 Body keys:', Object.keys(body || {}));
    
    if (body && typeof body === 'object') {
      console.log('📦 Body message type:', body.message ? typeof body.message : 'no message');
      console.log('📦 Body message keys:', body.message ? Object.keys(body.message) : 'no message');
      
      if (body.message && body.message.text) {
        console.log('💬 Message text found:', body.message.text);
        console.log('👤 From:', body.message.from?.username || body.message.from?.id);
        console.log('💬 Chat ID:', body.message.chat?.id);
        
        // Обработка команды /reply
        if (body.message.text.startsWith('/reply')) {
          console.log('🎯 REPLY COMMAND DETECTED');
          
          const parts = body.message.text.split(' ');
          console.log('📋 Command parts:', parts);
          
          let visitorId, replyText;
          
          if (parts[0].startsWith('/reply_')) {
            visitorId = parts[0].replace('/reply_', '');
            replyText = parts.slice(1).join(' ');
          } else if (parts[0] === '/reply' && parts[1]) {
            visitorId = parts[1];
            replyText = parts.slice(2).join(' ');
          }
          
          console.log('🎯 Parsed visitorId:', visitorId);
          console.log('🎯 Parsed replyText:', replyText);
          
          if (visitorId && replyText) {
            console.log('💾 Saving message for visitor:', visitorId);
            
            if (!messagesDB.has(visitorId)) {
              messagesDB.set(visitorId, []);
              console.log('📝 Created new array for visitor:', visitorId);
            }
            
            const newMessage = {
              id: Date.now(),
              text: replyText,
              sender: 'operator', 
              timestamp: new Date().toISOString(),
              displayed: false
            };
            
            messagesDB.get(visitorId).push(newMessage);
            console.log('💾 Message saved successfully');
            console.log('📊 All messages for visitor:', messagesDB.get(visitorId));
            
            // Тестовое сообщение - принудительно добавим
            const testVisitorId = 'visitor_test123';
            if (!messagesDB.has(testVisitorId)) {
              messagesDB.set(testVisitorId, []);
            }
            messagesDB.get(testVisitorId).push({
              id: Date.now(),
              text: 'ТЕСТОВОЕ СООБЩЕНИЕ ОТ МЕНЕДЖЕРА',
              sender: 'operator',
              timestamp: new Date().toISOString(),
              displayed: false
            });
            console.log('🧪 TEST: Added test message for visitor_test123');
            
            // Отправляем подтверждение в Telegram
            try {
              await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: body.message.chat.id,
                text: `✅ Ответ "${replyText}" отправлен посетителю ${visitorId}`
              });
              console.log('📤 Confirmation sent to Telegram');
            } catch (telegramError) {
              console.error('❌ Telegram error:', telegramError.message);
            }
          } else {
            console.log('❌ Could not parse visitorId or replyText');
          }
        } else {
          console.log('ℹ️ Regular message (not a reply command)');
        }
      } else {
        console.log('❌ No message text in request');
      }
    } else {
      console.log('❌ No body or invalid body format');
    }
    
    console.log('✅ ===== WEBHOOK END =====');
    res.status(200).json({ status: 'OK', received: true });
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}
