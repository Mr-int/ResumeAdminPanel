import { pageItems } from '../lib/pageable.js';
import { filterValidUuids, isValidUuid, resolveStudentId } from './studentId.js';

/** UUID из ответа `GET /admin/projects/{id}/students` (массив строк или page-обёртка). */
export function normalizeStudentIdList(payload) {
  return filterValidUuids(
    pageItems(payload).map((item) => {
      if (typeof item === 'string') return item;
      return resolveStudentId(item);
    })
  );
}

/**
 * Участники проекта: карточки из `SiteProjectDTO.students` + UUID из отдельного GET.
 * OpenAPI: GET `/admin/projects/{id}/students` → `string[]` (uuid), не DTO.
 */
export function mergeProjectParticipants(project, studentIdsPayload) {
  const embedded = Array.isArray(project?.students) ? project.students : [];
  const linkedIds = normalizeStudentIdList(studentIdsPayload);

  const byId = new Map();
  for (const p of embedded) {
    const sid = resolveStudentId(p);
    if (sid) byId.set(sid, p);
  }
  for (const sid of linkedIds) {
    if (!byId.has(sid)) byId.set(sid, { id: sid });
  }

  const ordered = [];
  const seen = new Set();

  for (const p of embedded) {
    const sid = resolveStudentId(p);
    if (sid && !seen.has(sid)) {
      ordered.push(byId.get(sid));
      seen.add(sid);
    }
  }
  for (const sid of linkedIds) {
    if (!seen.has(sid)) {
      ordered.push(byId.get(sid));
      seen.add(sid);
    }
  }

  return ordered;
}

export function participantDisplayName(p) {
  if (!p || typeof p !== 'object') {
    const sid = typeof p === 'string' && isValidUuid(p) ? p : null;
    return sid ? `Студент ${sid.slice(0, 8)}…` : 'Студент';
  }
  const name = `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim();
  return name || 'Студент';
}
