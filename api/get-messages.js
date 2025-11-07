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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { visitorId } = req.query;

  if (!visitorId) {
    return res.status(400).json({ error: 'visitorId is required' });
  }

  const messages = messagesDB.get(visitorId) || [];
  const operatorMessages = messages
    .filter(msg => msg.sender === 'operator' && !msg.displayed)
    .map(msg => ({ ...msg, displayed: true }));

  res.status(200).json(operatorMessages);
}
