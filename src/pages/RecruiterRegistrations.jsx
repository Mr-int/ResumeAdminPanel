import { useCallback, useEffect, useState } from 'react';
import * as regApi from '../api/recruiterRegistrations.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { LoadingBlock } from '../components/ui/LoadingBlock.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { FlashMessages } from '../components/ui/FlashMessages.jsx';
import { StatusBadge, registrationStatusVariant } from '../components/ui/StatusBadge.jsx';
import { REGISTRATION_STATUS_LABELS, labelOf } from '../lib/labels.js';
import { fmtDate } from '../lib/format.js';

const PAGE_SIZE = 10;
const STATUSES = Object.keys(REGISTRATION_STATUS_LABELS);

export function RecruiterRegistrations() {
  const [status, setStatus] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const filter = {};
      if (status) filter.status = status;
      if (search.trim()) filter.search = search.trim();
      const { data: res } = await regApi.filterRecruiterRegistrations(filter, page, PAGE_SIZE);
      setData(res);
    } catch (e) {
      setError(e.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [status, search, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleApprove(id) {
    if (!window.confirm('Одобрить заявку и создать аккаунт рекрутера?')) return;
    setMsg(null);
    try {
      const { data: result } = await regApi.approveRecruiterRegistration(id);
      setMsg({
        type: 'ok',
        text: `Заявка одобрена. Пользователь и рекрутер созданы.`,
      });
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
      await regApi.rejectRecruiterRegistration(rejectId, {
        reason: rejectReason.trim() || undefined,
      });
      setRejectId(null);
      setRejectReason('');
      setMsg({ type: 'ok', text: 'Заявка отклонена' });
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
        title="Заявки на регистрацию рекрутеров"
        lead="Модерация саморегистрации работодателей: одобрение создаёт аккаунт RECRUITER."
      />

      <div className="panel">
        <h2 className="panel__title">Фильтр</h2>
        <form
          className="form-row"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(0);
            load();
          }}
        >
          <div className="field">
            <label htmlFor="reg-status">Статус</label>
            <select
              id="reg-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Все</option>
                    {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {labelOf(REGISTRATION_STATUS_LABELS, s, s)}
                  </option>
                ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="reg-search">Поиск</label>
            <input
              id="reg-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Логин, компания, email, ФИО"
            />
          </div>
          <button type="submit" className="btn btn--primary">
            Применить
          </button>
        </form>
      </div>

      {msg?.type === 'ok' ? <div className="alert alert--success">{msg.text}</div> : null}
      {error ? <div className="alert alert--error">{error}</div> : null}

      <div className="panel">
        <h2 className="panel__title">Список</h2>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Загрузка…</p>
        ) : (
          <>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Логин</th>
                    <th>Компания</th>
                    <th>ФИО</th>
                    <th>Email</th>
                    <th>Статус</th>
                    <th>Создана</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.username}</td>
                      <td>{r.companyName ?? '—'}</td>
                      <td>
                        {[r.firstName, r.lastName].filter(Boolean).join(' ') || '—'}
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{r.email ?? '—'}</td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.2rem 0.45rem',
                            borderRadius: 6,
                            background: 'rgba(255,255,255,0.06)',
                          }}
                        >
                          {STATUS_LABELS[r.status] ?? r.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>{fmtDate(r.createdAt)}</td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {r.status === 'PENDING' ? (
                          <>
                            <button
                              type="button"
                              className="btn btn--primary"
                              onClick={() => handleApprove(r.id)}
                            >
                              Одобрить
                            </button>
                            <button
                              type="button"
                              className="btn btn--danger"
                              style={{ marginLeft: '0.5rem' }}
                              onClick={() => {
                                setRejectId(r.id);
                                setRejectReason('');
                              }}
                            >
                              Отклонить
                            </button>
                          </>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            {r.rejectReason ? `Причина: ${r.rejectReason}` : '—'}
                          </span>
                        )}
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

      {rejectId ? (
        <div className="panel">
          <h2 className="panel__title">Отклонение заявки</h2>
          <form onSubmit={handleReject}>
            <div className="field">
              <label htmlFor="reject-reason">Причина (необязательно)</label>
              <textarea
                id="reject-reason"
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
