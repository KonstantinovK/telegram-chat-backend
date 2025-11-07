// Единое глобальное хранилище для всех API
global.chatStorage = global.chatStorage || {
  messages: new Map(),
  lastCleanup: Date.now()
};

// Функции для работы с хранилищем
export function getMessages(visitorId) {
  const storage = global.chatStorage;
  const messages = storage.messages.get(visitorId) || [];
  console.log('📦 Storage getMessages for', visitorId, ':', messages);
  return messages;
}

export function addMessage(visitorId, message) {
  const storage = global.chatStorage;
  
  if (!storage.messages.has(visitorId)) {
    storage.messages.set(visitorId, []);
  }
  
  storage.messages.get(visitorId).push({
    ...message,
    id: Date.now(),
    timestamp: new Date().toISOString()
  });
  
  console.log('💾 Storage addMessage for', visitorId, ':', message);
  console.log('📊 Storage state:', Array.from(storage.messages.entries()));
}

export function getStorageStats() {
  const storage = global.chatStorage;
  return {
    totalVisitors: storage.messages.size,
    totalMessages: Array.from(storage.messages.values()).reduce((sum, msgs) => sum + msgs.length, 0)
  };
}
