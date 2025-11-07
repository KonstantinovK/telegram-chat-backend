import { getMessages } from './storage.js';

export default async function handler(req, res) {
  console.log('=== GET-MESSAGES START ===');
  
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { visitorId } = req.query;
  console.log('🔍 Getting messages for:', visitorId);

  if (!visitorId) {
    return res.status(400).json({ error: 'visitorId is required' });
  }

  try {
    const allMessages = getMessages(visitorId);
    console.log('📦 All messages from storage:', allMessages);
    
    // Фильтруем непрочитанные сообщения оператора
    const operatorMessages = allMessages
      .filter(msg => msg.sender === 'operator' && !msg.displayed)
      .map(msg => ({ ...msg, displayed: true }));
    
    console.log('📤 Sending operator messages:', operatorMessages);
    
    // Обновляем сообщения как прочитанные
    if (operatorMessages.length > 0) {
      const updatedMessages = allMessages.map(msg => 
        operatorMessages.some(om => om.id === msg.id) 
          ? { ...msg, displayed: true } 
          : msg
      );
      // Сохраняем обновленные сообщения
      global.chatStorage.messages.set(visitorId, updatedMessages);
    }

    res.status(200).json(operatorMessages);
    
  } catch (error) {
    console.error('❌ GET-MESSAGES ERROR:', error);
    res.status(500).json({ error: error.message });
  }
}
