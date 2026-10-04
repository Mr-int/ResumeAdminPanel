/** Элементы Spring Page или голого массива из ответа API. */
export function pageItems(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.content)) return payload.content;
  return [];
}

export function pageTotalPages(payload) {
  if (!payload || typeof payload !== 'object') return 1;
  return payload.totalPages ?? 1;
}
