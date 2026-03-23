import { useCallback, useEffect, useState } from 'react';

import * as requestsApi from '../api/requests.js';

const PAGE_SIZE = 10;

const STATUSES = [
  'CREATION',
  'SYNC',
  'WAITING',
  'EXPECTATION',
  'STUDENT_CONFIRMED',
  'RECRUITER_CONFIRMED',
  'SUCCESS',
  'REFUSAL',
];

export function Requests() {
  const [recruiterId, setRecruiterId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [statusFilter, setStatusFilter] = useState([]);
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const filter = {};
      if (recruiterId.trim()) filter.recruiterId = recruiterId.trim();
      if (studentId.trim()) filter.studentId = studentId.trim();
      if (statusFilter.length) filter.results = statusFilter;
      const { data: res } = await requestsApi.filterRequests(
        filter,
        page,
        PAGE_SIZE
      );
      setData(res);
    } catch (e) {
      setError(e.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [recruiterId, studentId, statusFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id) {
    if (!window.confirm('Удалить заявку?')) return;
    try {
      await requestsApi.deleteRequest(id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  function toggleStatus(s) {
    setStatusFilter((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  const totalPages = data?.totalPages ?? 0;
  const rows = data?.data ?? [];

  return (
    <div className="page">
      <h1 className="page__title">Заявки</h1>
      <p className="page__lead">POST /request/filter</p>

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
              <label htmlFor="reqRec">Recruiter UUID</label>
              <input
                id="reqRec"
                value={recruiterId}
                onChange={(e) => setRecruiterId(e.target.value)}
                placeholder="опционально"
              />
            </div>
            <div className="field">
              <label htmlFor="reqStu">Student UUID</label>
              <input
                id="reqStu"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="опционально"
              />
            </div>
            <button type="submit" className="btn btn--primary">
              Применить
            </button>
          </div>
          <div className="field" style={{ marginTop: '0.75rem' }}>
            <label>Статусы (мультивыбор)</label>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginTop: '0.35rem',
              }}
            >
              {STATUSES.map((s) => (
                <label
                  key={s}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={statusFilter.includes(s)}
                    onChange={() => toggleStatus(s)}
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>
        </form>
      </div>

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
                    <th>ID</th>
                    <th>Статус</th>
                    <th>Студент</th>
                    <th>Рекрутер</th>
                    <th>Обновлено</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.2rem 0.45rem',
                            borderRadius: 6,
                            background: 'rgba(255,255,255,0.06)',
                          }}
                        >
                          {r.result}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>{r.studentId}</td>
                      <td style={{ fontSize: '0.8rem' }}>{r.recruiterId}</td>
                      <td style={{ fontSize: '0.8rem' }}>
                        {r.updatedAt
                          ? new Date(r.updatedAt).toLocaleString('ru-RU')
                          : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn--danger"
                          onClick={() => handleDelete(r.id)}
                        >
                          Удалить
                        </button>
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
    </div>
  );
}
