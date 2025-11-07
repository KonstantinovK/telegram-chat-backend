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

  if (req.method === 'POST') {
    const { visitorId, message } = req.body;
    
    console.log('🎯 TEST: Adding reply for visitor:', visitorId, 'Message:', message);
    
    if (!messagesDB.has(visitorId)) {
      messagesDB.set(visitorId, []);
    }

    messagesDB.get(visitorId).push({
      id: Date.now(),
      text: message,
      sender: 'operator',
      timestamp: new Date().toISOString(),
      displayed: false
    });

    console.log('💾 TEST: Messages for visitor:', messagesDB.get(visitorId));
    
    return res.status(200).json({ success: true, visitorId, message });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
