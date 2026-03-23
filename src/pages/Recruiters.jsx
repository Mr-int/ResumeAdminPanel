import { useCallback, useEffect, useState } from 'react';

import * as recruitersApi from '../api/recruiters.js';

const PAGE_SIZE = 10;

export function Recruiters() {
  const [name, setName] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const filter = {};
      if (name.trim()) filter.name = name.trim();
      const { data: res } = await recruitersApi.filterRecruiters(
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
  }, [name, page]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = data?.totalPages ?? 0;
  const rows = data?.data ?? [];

  return (
    <div className="page">
      <h1 className="page__title">Рекрутеры</h1>
      <p className="page__lead">POST /recruiter/filter</p>

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
            <label htmlFor="rname">Имя / часть имени</label>
            <input
              id="rname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Пусто — все"
            />
          </div>
          <button type="submit" className="btn btn--primary">
            Найти
          </button>
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
                    <th>Компания</th>
                    <th>Имя</th>
                    <th>Email</th>
                    <th>Telegram</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.companyName}</td>
                      <td>
                        {r.firstName} {r.lastName}
                      </td>
                      <td>{r.email ?? '—'}</td>
                      <td>{r.telegramUsername ?? '—'}</td>
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
