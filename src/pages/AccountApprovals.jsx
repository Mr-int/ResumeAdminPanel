import { useCallback, useEffect, useState } from 'react';
import * as accountApi from '../api/accountApprovals.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { LoadingBlock } from '../components/ui/LoadingBlock.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { FlashMessages } from '../components/ui/FlashMessages.jsx';
import { ROLE_LABELS, labelOf } from '../lib/labels.js';
import { fmtDate } from '../lib/format.js';

const PAGE_SIZE = 15;
const ROLES = ['', 'STUDENT', 'RECRUITER'];

export function AccountApprovals() {
  const [role, setRole] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [rejectComment, setRejectComment] = useState('');
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const { data: res } = await accountApi.listAccountApprovals(role || undefined, page, PAGE_SIZE);
      setData(res);
    } catch (e) {
      setError(e.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [role, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleApprove(userId) {
    if (!window.confirm('Одобрить учётную запись?')) return;
    setMsg(null);
    try {
      await accountApi.approveAccount(userId);
      setMsg({ type: 'ok', text: 'Аккаунт одобрен' });
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
      await accountApi.rejectAccount(rejectId, {
        comment: rejectComment.trim() || undefined,
      });
      setRejectId(null);
      setRejectComment('');
      setMsg({ type: 'ok', text: 'Аккаунт отклонён' });
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  const rows = data?.data ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="page">
      <PageHeader
        title="Одобрение аккаунтов"
        lead="Студенты и рекрутеры с статусом ожидания модерации после регистрации."
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
            <label htmlFor="appr-role">Роль</label>
            <select id="appr-role" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">Все</option>
              {ROLES.filter(Boolean).map((r) => (
                <option key={r} value={r}>
                  {labelOf(ROLE_LABELS, r, r)}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn--primary">
            Применить
          </button>
        </form>
      </div>

      <FlashMessages error={error} success={msg?.type === 'ok' ? msg.text : null} />

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
                    <th>Логин</th>
                    <th>Имя</th>
                    <th>Роль</th>
                    <th>Создан</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.length ? (
                    rows.map((u) => (
                      <tr key={u.id}>
                        <td>{u.username}</td>
                        <td>{u.name ?? '—'}</td>
                        <td>{labelOf(ROLE_LABELS, u.role, u.role)}</td>
                        <td style={{ fontSize: '0.8rem' }}>{fmtDate(u.createdAt)}</td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button
                            type="button"
                            className="btn btn--primary"
                            onClick={() => handleApprove(u.id)}
                          >
                            Одобрить
                          </button>
                          <button
                            type="button"
                            className="btn btn--danger"
                            style={{ marginLeft: '0.5rem' }}
                            onClick={() => {
                              setRejectId(u.id);
                              setRejectComment('');
                            }}
                          >
                            Отклонить
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ color: 'var(--text-muted)' }}>
                        Нет ожидающих аккаунтов
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              totalElements={data?.totalElements}
              onPrev={() => setPage((p) => Math.max(0, p - 1))}
              onNext={() => setPage((p) => p + 1)}
            />
          </>
        )}
      </div>

      {rejectId ? (
        <div className="panel">
          <h2 className="panel__title">Отклонение аккаунта</h2>
          <form onSubmit={handleReject}>
            <div className="field">
              <label htmlFor="appr-reject">Комментарий (необязательно)</label>
              <textarea
                id="appr-reject"
                rows={3}
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
              />
            </div>
            <div className="form-row" style={{ marginTop: '0.75rem' }}>
              <button type="submit" className="btn btn--danger">
                Подтвердить отклонение
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => setRejectId(null)}>
                Отмена
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
