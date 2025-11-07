import axios from 'axios';
import { addMessage, getStorageStats } from './storage.js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export default async function handler(req, res) {
  console.log('=== WEBHOOK START ===');
  
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

  try {
    const update = req.body;
    console.log('📦 Update:', JSON.stringify(update, null, 2));
    
    if (update && update.message) {
      const message = update.message;
      console.log('💬 Processing message:', message.text);

      // Обработка команды reply
      if (message.text && message.text.startsWith('/reply_')) {
        console.log('🎯 REPLY COMMAND DETECTED');
        
        const parts = message.text.split(' ');
        const visitorId = parts[0].replace('/reply_', '');
        const replyText = parts.slice(1).join(' ');
        
        console.log('🎯 VisitorId:', visitorId);
        console.log('🎯 ReplyText:', replyText);
        
        if (visitorId && replyText) {
          // Сохраняем сообщение
          addMessage(visitorId, {
            text: replyText,
            sender: 'operator',
            displayed: false
          });
          
          console.log('💾 Message saved successfully');
          console.log('📊 Storage stats:', getStorageStats());
          
          // Отправляем подтверждение
          await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: message.chat.id,
            text: `✅ Ответ "${replyText}" сохранен для ${visitorId}`
          });
        }
      }
    }
    
    console.log('✅ WEBHOOK COMPLETED');
    res.status(200).json({ success: true, stats: getStorageStats() });
    
  } catch (error) {
    console.error('❌ WEBHOOK ERROR:', error);
    res.status(500).json({ error: error.message });
  }
}
