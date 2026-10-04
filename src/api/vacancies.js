import { apiFetch, pageableQuery } from './client.js';

const MODERATION_STATUSES = [
  'DRAFT',
  'PENDING_REVIEW',
  'PUBLISHED',
  'REJECTED',
  'CLOSED',
  'ARCHIVED',
];

function vacancySortKey(v) {
  const raw = v?.submittedForReviewAt ?? v?.createdAt ?? v?.moderatedAt ?? null;
  const t = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(t) ? t : 0;
}

function extractPageRows(body) {
  if (!body) return [];
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body.content)) return body.content;
  return [];
}

function paginateRows(rows, page, size) {
  const totalElements = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size) || 1);
  const safePage = Math.min(Math.max(0, page), totalPages - 1);
  return {
    data: rows.slice(safePage * size, safePage * size + size),
    page: safePage,
    size,
    totalElements,
    totalPages,
  };
}

/** Создание черновика — только в сессии рекрутёра (POST /vacancies). */
export function createRecruiterVacancy(body) {
  return apiFetch('/vacancies', { method: 'POST', json: body });
}

/** Первая вакансия после регистрации рекрутёра. */
export function createOnboardingVacancy(body) {
  return apiFetch('/recruiter/onboarding/vacancy', { method: 'POST', json: body });
}

/** Отправка на модерацию — только в сессии рекрутёра. */
export function submitRecruiterVacancyForReview(id) {
  return apiFetch(`/vacancies/${id}/submit-for-review`, { method: 'POST' });
}

/** Список вакансий текущего рекрутёра. */
export function listMyVacancies(page, size) {
  const q = pageableQuery(page, size);
  return apiFetch(`/vacancies/mine${q}`, { method: 'GET' });
}

export function getRecruiterVacancy(id) {
  return apiFetch(`/vacancies/${id}`, { method: 'GET' });
}

export function filterVacancies(filter, page, size) {
  const q = pageableQuery(page, size);
  return apiFetch(`/admin/vacancies/filter${q}`, {
    method: 'POST',
    json: filter ?? {},
  });
}

/**
 * Модерация: без status бэкенд отдаёт только PENDING_REVIEW.
 * Для «Все» собираем все статусы (устойчиво к ошибкам отдельных статусов).
 */
export async function filterVacanciesModeration(filter, page, size) {
  const base = { ...(filter ?? {}) };
  const status = base.status;
  delete base.status;

  if (status) {
    return filterVacancies({ ...base, status }, page, size);
  }

  const fetchSize = Math.min(Math.max(size, 50), 100);
  const results = await Promise.allSettled(
    MODERATION_STATUSES.map((s) =>
      filterVacancies({ ...base, status: s }, 0, fetchSize)
    )
  );

  const byId = new Map();
  for (const result of results) {
    if (result.status !== 'fulfilled') continue;
    const rows = extractPageRows(result.value?.data);
    for (const v of rows) {
      if (v?.id) byId.set(v.id, v);
    }
  }

  const merged = [...byId.values()].sort((a, b) => vacancySortKey(b) - vacancySortKey(a));
  return { data: paginateRows(merged, page, size) };
}

export function getVacancy(id) {
  return apiFetch(`/admin/vacancies/${id}`, { method: 'GET' });
}

export function approveVacancy(id) {
  return apiFetch(`/admin/vacancies/${id}/approve`, { method: 'POST' });
}

export function rejectVacancy(id, body) {
  return apiFetch(`/admin/vacancies/${id}/reject`, {
    method: 'POST',
    json: body ?? {},
  });
}

export function reorderVacancies(orderedIds) {
  return apiFetch('/admin/vacancies/reorder', {
    method: 'POST',
    json: { orderedIds },
  });
}

export function patchVacancyVitrina(id, body) {
  return apiFetch(`/admin/vacancies/${id}/vitrina`, {
    method: 'PATCH',
    json: body,
  });
}

/** Архивировать вакансию (DELETE /vacancies/{id}, для не-черновиков). */
export function archiveVacancy(id) {
  return apiFetch(`/vacancies/${id}`, { method: 'DELETE' });
}

/** Удалить черновик рекрутёра или пустой черновик (DELETE /vacancies/{id}). */
export function deleteRecruiterVacancy(id) {
  return apiFetch(`/vacancies/${id}`, { method: 'DELETE' });
}

/** Полное удаление вакансии из БД (только ADMIN, DELETE /admin/vacancies/{id}). */
export function adminDeleteVacancy(id) {
  return apiFetch(`/admin/vacancies/${id}`, { method: 'DELETE' });
}
