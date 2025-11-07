const messagesDB = new Map();

export default async function handler(req, res) {
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
