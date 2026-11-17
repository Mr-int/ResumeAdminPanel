import { apiFetch, pageableQuery } from './client.js';

export function filterCities(filter, page, size, sort, fetchOptions = {}) {
  const q = pageableQuery(page, size, sort);
  return apiFetch(`/city/filter${q}`, {
    method: 'POST',
    json: filter ?? {},
    ...fetchOptions,
  });
}

export function createCity(body) {
  return apiFetch('/city', { method: 'POST', json: body });
}

export function updateCity(id, body) {
  return apiFetch(`/city/${id}`, { method: 'PUT', json: body });
}

export function deleteCity(id) {
  return apiFetch(`/city/${id}`, { method: 'DELETE' });
}

export async function listAllCities() {
  const all = [];
  const size = 200;
  for (let page = 0; page < 50; page += 1) {
    const { data } = await filterCities({}, page, size, ['name,asc']);
    const rows = data?.data ?? [];
    all.push(...rows);
    const totalPages = data?.totalPages ?? 1;
    if (!rows.length || page + 1 >= totalPages) break;
  }
  return all;
}
