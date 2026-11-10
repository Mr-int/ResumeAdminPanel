import { apiFetch } from './client.js';

export function analyticsSummary(body) {
  return apiFetch('/admin/analytics/summary', { method: 'POST', json: body });
}

export function entityPopulation(body) {
  return apiFetch('/admin/analytics/entity-population', {
    method: 'POST',
    json: body ?? {},
  });
}

export function analyticsFunnel(body) {
  return apiFetch('/admin/analytics/funnel', { method: 'POST', json: body });
}

export function listEvents(body) {
  return apiFetch('/admin/analytics/events', { method: 'POST', json: body });
}

export async function listStudentEvents(studentId, from, to) {
  const matched = [];
  for (let page = 0; page < 20; page += 1) {
    const { data } = await listEvents({ from, to, page, size: 100 });
    const rows = data?.data ?? [];
    for (const event of rows) {
      const owner = event?.payload?.studentId;
      if (owner != null && String(owner) === String(studentId)) matched.push(event);
    }
    const totalPages = data?.totalPages ?? 1;
    if (!rows.length || page + 1 >= totalPages) {
      return { events: matched, truncated: false };
    }
  }
  return { events: matched, truncated: true };
}
