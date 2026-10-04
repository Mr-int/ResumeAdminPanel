import { shortUuid } from '../lib/format.js';

export function recruiterHasEmail(recruiter) {
  return Boolean(recruiter?.email?.trim());
}

export function recruiterPersonName(recruiter) {
  if (!recruiter || typeof recruiter !== 'object') return '';
  const full = `${recruiter.firstName ?? ''} ${recruiter.lastName ?? ''}`.trim();
  return full || recruiter.name?.trim() || '';
}

/** Имя и логин рекрутёра для таблиц и карточек. */
export function formatRecruiterLabel(recruiter, fallbackId) {
  if (!recruiter) {
    return fallbackId ? shortUuid(fallbackId) : '—';
  }

  const name = recruiterPersonName(recruiter);
  const login = recruiter.username?.trim().replace(/^@/, '');

  if (name && login) return `${name} · @${login}`;
  if (name) return name;
  if (login) return `@${login}`;
  if (recruiter.companyName?.trim()) return recruiter.companyName.trim();
  return fallbackId ? shortUuid(fallbackId) : '—';
}
