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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { visitorId } = req.query;

  if (!visitorId) {
    return res.status(400).json({ error: 'visitorId is required' });
  }

  console.log('🔍 Getting messages for:', visitorId);
  console.log('📊 Current messagesDB:', Array.from(messagesDB.entries()));

  const messages = messagesDB.get(visitorId) || [];
  const operatorMessages = messages
    .filter(msg => msg.sender === 'operator' && !msg.displayed)
    .map(msg => {
      const updatedMsg = { ...msg, displayed: true };
      console.log('📨 Returning message:', updatedMsg);
      return updatedMsg;
    });

  // Обновляем сообщения как прочитанные
  if (operatorMessages.length > 0) {
    const allMessages = messagesDB.get(visitorId) || [];
    const updatedMessages = allMessages.map(msg => 
      operatorMessages.some(om => om.id === msg.id) 
        ? { ...msg, displayed: true } 
        : msg
    );
    messagesDB.set(visitorId, updatedMessages);
  }

  console.log('📤 Sending operator messages:', operatorMessages);
  res.status(200).json(operatorMessages);
}
