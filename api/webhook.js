import axios from 'axios';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
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
    console.log('🔄 ===== WEBHOOK START =====');
    console.log('📦 Full request body:', JSON.stringify(req.body, null, 2));
    console.log('📦 Request headers:', req.headers);

    const update = req.body;
    
    // Логируем ВСЕ входящие данные
    if (update.message) {
      console.log('💬 Message received:');
      console.log('   From:', update.message.from);
      console.log('   Chat:', update.message.chat);
      console.log('   Text:', update.message.text);
      console.log('   Date:', update.message.date);
    }

    if (update.edited_message) {
      console.log('✏️ Edited message:', update.edited_message);
    }

    if (update.channel_post) {
      console.log('📢 Channel post:', update.channel_post);
    }

    const message = update.message;
    
    if (message && message.text) {
      console.log('🎯 Processing message text:', message.text);

      // Обработка команды /reply_visitorId
      if (message.text.startsWith('/reply')) {
        console.log('🔧 Command detected:', message.text);
        
        const parts = message.text.split(' ');
        console.log('📋 Command parts:', parts);
        
        if (parts.length >= 2) {
          let visitorId, replyText;
          
          if (parts[0].startsWith('/reply_')) {
            // Формат: /reply_visitor123 текст ответа
            visitorId = parts[0].replace('/reply_', '');
            replyText = parts.slice(1).join(' ');
          } else {
            // Формат: /reply visitor123 текст ответа
            visitorId = parts[1];
            replyText = parts.slice(2).join(' ');
          }

          console.log('🎯 Extracted visitorId:', visitorId);
          console.log('🎯 Extracted replyText:', replyText);

          if (visitorId && replyText) {
            console.log('💾 Saving reply for visitor:', visitorId);
            
            if (!messagesDB.has(visitorId)) {
              messagesDB.set(visitorId, []);
              console.log('📝 Created new messages array for visitor:', visitorId);
            }

            const newMessage = {
              id: Date.now(),
              text: replyText,
              sender: 'operator',
              timestamp: new Date().toISOString(),
              displayed: false
            };

            messagesDB.get(visitorId).push(newMessage);
            console.log('💾 Message saved:', newMessage);
            console.log('📊 All messages for visitor:', messagesDB.get(visitorId));
            
            // Отправляем подтверждение
            await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
              chat_id: message.chat.id,
              text: `✅ Ответ отправлен посетителю ${visitorId}: "${replyText}"`
            });

            console.log('📤 Confirmation sent to Telegram');
          } else {
            console.log('❌ Missing visitorId or replyText');
          }
        } else {
          console.log('❌ Invalid command format. Usage: /reply_visitorId text OR /reply visitorId text');
        }
      } else {
        console.log('ℹ️ Regular message (not a reply command)');
      }
    } else {
      console.log('❌ No message text found');
    }
    
    console.log('✅ ===== WEBHOOK END =====');
    res.status(200).json({ status: 'OK', processed: true });
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}
