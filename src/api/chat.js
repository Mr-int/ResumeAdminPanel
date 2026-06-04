import { apiFetch, pageableQuery } from './client.js';

export function listChats(page, size) {
  const q = pageableQuery(page, size, ['lastActivityAt,desc']);
  return apiFetch(`/chat${q}`, { method: 'GET' });
}

export function getChatMessages(chatId, page, size) {
  const q = pageableQuery(page, size, ['createdAt,asc']);
  return apiFetch(`/chat/${chatId}/messages${q}`, { method: 'GET' });
}

export function sendChatMessage(chatId, body) {
  return apiFetch(`/chat/${chatId}/messages`, {
    method: 'POST',
    json: { body: body ?? '' },
  });
}

export function adminDeleteChatMessage(chatId, messageId) {
  return apiFetch(`/chat/${chatId}/messages/${messageId}`, { method: 'DELETE' });
}

export function getChatSummary(chatId) {
  return apiFetch(`/chat/${chatId}/summary`, { method: 'GET' });
}
