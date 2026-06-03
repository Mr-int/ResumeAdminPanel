import { apiFetch } from './client.js';

export function listStorageFiles() {
  return apiFetch('/admin/storage/files', { method: 'GET' });
}

export function uploadStorageFile(file) {
  const body = new FormData();
  body.append('file', file);
  return apiFetch('/admin/storage/files', { method: 'POST', body });
}

export function deleteStorageFile(fileName) {
  return apiFetch(`/admin/storage/files/${encodeURIComponent(fileName)}`, {
    method: 'DELETE',
  });
}
