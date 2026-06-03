import { useCallback, useEffect, useState } from 'react';
import * as vacanciesApi from '../api/vacancies.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { LoadingBlock } from '../components/ui/LoadingBlock.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { FlashMessages } from '../components/ui/FlashMessages.jsx';
import { DetailGrid } from '../components/ui/DetailGrid.jsx';
import { StatusBadge, vacancyStatusVariant } from '../components/ui/StatusBadge.jsx';
import { VACANCY_STATUS_LABELS, labelOf } from '../lib/labels.js';
import { fmtDate } from '../lib/format.js';

export function Vacancies() {
  const [status, setStatus] = useState('PENDING_REVIEW');
  const [findString, setFindString] = useState('');
  const [recruiterId, setRecruiterId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const filter = {};
      if (status) filter.status = status;
      if (findString.trim()) filter.findString = findString.trim();
      if (recruiterId.trim()) filter.recruiterId = recruiterId.trim();
      if (companyName.trim()) filter.companyName = companyName.trim();
      const { data: res } = await vacanciesApi.filterVacancies(filter, page, PAGE_SIZE);
      setData(res);
    } catch (e) {
      setError(e.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [status, findString, recruiterId, companyName, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function openDetails(id) {
    setSelectedId(id);
    setDetailsLoading(true);
    try {
      const { data } = await vacanciesApi.getVacancy(id);
      setDetails(data);
    } catch (e) {
      setDetails(null);
      setError(e.message);
    } finally {
      setDetailsLoading(false);
    }
  }

  async function handleApprove(id) {
    if (!window.confirm('Опубликовать вакансию?')) return;
    setMsg(null);
    try {
      await vacanciesApi.approveVacancy(id);
      setMsg({ type: 'ok', text: 'Вакансия опубликована' });
      if (selectedId === id) await openDetails(id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleReject(e) {
    e.preventDefault();
    if (!rejectId) return;
    setMsg(null);
    try {
      await vacanciesApi.rejectVacancy(rejectId, {
        moderationRejectionReason: rejectReason.trim() || undefined,
      });
      setRejectId(null);
      setRejectReason('');
      setMsg({ type: 'ok', text: 'Вакансия отклонена' });
      if (selectedId === rejectId) await openDetails(rejectId);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  const totalPages = data?.totalPages ?? 0;
  const rows = data?.data ?? [];

  return (
    <div className="page">
      <PageHeader
        title="Модерация вакансий"
        lead="Проверка и публикация вакансий от рекрутеров перед показом студентам."
      />

      <div className="panel">
        <h2 className="panel__title">Фильтр</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(0);
            load();
          }}
        >
          <div className="form-row">
            <div className="field">
              <label htmlFor="vac-status">Статус</label>
              <select
                id="vac-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">Все</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {labelOf(VACANCY_STATUS_LABELS, s, s)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="vac-find">Поиск</label>
              <input
                id="vac-find"
                value={findString}
                onChange={(e) => setFindString(e.target.value)}
                placeholder="Заголовок, описание…"
              />
            </div>
            <div className="field">
              <label htmlFor="vac-rec">UUID рекрутера</label>
              <input
                id="vac-rec"
                value={recruiterId}
                onChange={(e) => setRecruiterId(e.target.value)}
                placeholder="необязательно"
              />
            </div>
            <div className="field">
              <label htmlFor="vac-co">Компания</label>
              <input
                id="vac-co"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="необязательно"
              />
            </div>
            <button type="submit" className="btn btn--primary">
              Применить
            </button>
          </div>
        </form>
      </div>

      {msg?.type === 'ok' ? <div className="alert alert--success">{msg.text}</div> : null}
      {error ? <div className="alert alert--error">{error}</div> : null}

      <div className="panel">
        <h2 className="panel__title">Очередь</h2>
        {loading ? (
          <LoadingBlock />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Название</th>
                    <th>Компания</th>
                    <th>Город</th>
                    <th>Статус</th>
                    <th>Подана</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((v) => (
                    <tr key={v.id}>
                      <td>{v.title}</td>
                      <td>{v.companyName ?? '—'}</td>
                      <td>{v.city ?? '—'}</td>
                      <td>
                        <StatusBadge variant={vacancyStatusVariant(v.status)}>
                          {labelOf(VACANCY_STATUS_LABELS, v.status, v.status)}
                        </StatusBadge>
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>
                        {fmtDate(v.submittedForReviewAt ?? v.createdAt)}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          className="btn btn--ghost"
                          onClick={() => openDetails(v.id)}
                        >
                          Открыть
                        </button>
                        {v.status === 'PENDING_REVIEW' ? (
                          <>
                            <button
                              type="button"
                              className="btn btn--primary"
                              style={{ marginLeft: '0.5rem' }}
                              onClick={() => handleApprove(v.id)}
                            >
                              Одобрить
                            </button>
                            <button
                              type="button"
                              className="btn btn--danger"
                              style={{ marginLeft: '0.5rem' }}
                              onClick={() => {
                                setRejectId(v.id);
                                setRejectReason('');
                              }}
                            >
                              Отклонить
                            </button>
                          </>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pager">
              <span>
                Стр. {data ? data.page + 1 : 1} из {Math.max(totalPages, 1)} · всего{' '}
                {data?.totalElements ?? 0}
              </span>
              <div className="pager__btns">
                <button
                  type="button"
                  className="btn btn--ghost"
                  disabled={page <= 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Назад
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  disabled={totalPages && page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Вперёд
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedId ? (
        <div className="panel">
          <h2 className="panel__title">Карточка вакансии</h2>
          {detailsLoading ? (
            <LoadingBlock />
          ) : details ? (
            <DetailGrid
              items={[
                { label: 'ID', value: details.id },
                { label: 'Рекрутер', value: details.recruiterId },
                {
                  label: 'Статус',
                  value: (
                    <StatusBadge variant={vacancyStatusVariant(details.status)}>
                      {labelOf(VACANCY_STATUS_LABELS, details.status, details.status)}
                    </StatusBadge>
                  ),
                },
                { label: 'Описание', value: <span style={{ whiteSpace: 'pre-wrap' }}>{details.description ?? '—'}</span> },
                { label: 'Формат работы', value: details.workFormat },
                { label: 'Занятость', value: details.employmentType },
                { label: 'Навыки', value: (details.skills ?? []).map((s) => s.name).join(', ') || '—' },
                { label: 'Откликов', value: details.applicationsCount ?? 0 },
                ...(details.moderationRejectionReason
                  ? [{ label: 'Причина отклонения', value: details.moderationRejectionReason }]
                  : []),
              ]}
            />
          ) : (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Нет данных</p>
          )}
        </div>
      ) : null}

      {rejectId ? (
        <div className="panel">
          <h2 className="panel__title">Отклонение вакансии</h2>
          <form onSubmit={handleReject}>
            <div className="field">
              <label htmlFor="vac-reject">Причина (необязательно)</label>
              <textarea
                id="vac-reject"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div className="form-row" style={{ marginTop: '0.75rem' }}>
              <button type="submit" className="btn btn--danger">
                Подтвердить отклонение
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setRejectId(null)}
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
