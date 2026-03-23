import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as studentsApi from '../api/students.js';
import { API_BASE } from '../config.js';

const PAGE_SIZE = 12;

function avatarUrl(imagePath) {
  if (!imagePath) return null;
  return `${API_BASE}/main/photo/${encodeURIComponent(imagePath)}`;
}

export function Students() {
  const [findString, setFindString] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const filter = {};
      if (findString.trim()) filter.findString = findString.trim();
      const { data: res } = await studentsApi.filterStudentCards(
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
  }, [findString, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id) {
    if (!window.confirm('Удалить студента?')) return;
    try {
      await studentsApi.deleteStudent(id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  const totalPages = data?.totalPages ?? 0;
  const rows = data?.data ?? [];

  return (
    <div className="page">
      <h1 className="page__title">Студенты</h1>
      <p className="page__lead">
        Краткие карточки (POST /student/cardsFilter). Полный профиль — отдельная
        страница по ID.
      </p>

      <div className="panel">
        <h2 className="panel__title">Поиск</h2>
        <form
          className="form-row"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(0);
            load();
          }}
        >
          <div className="field">
            <label htmlFor="sfind">Строка поиска (ФИО и др.)</label>
            <input
              id="sfind"
              value={findString}
              onChange={(e) => setFindString(e.target.value)}
              placeholder="Пусто — без фильтра по строке"
            />
          </div>
          <button type="submit" className="btn btn--primary">
            Применить
          </button>
        </form>
      </div>

      {error ? <div className="alert alert--error">{error}</div> : null}

      <div className="panel">
        <h2 className="panel__title">Карточки</h2>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Загрузка…</p>
        ) : (
          <>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th />
                    <th>ФИО</th>
                    <th>Специальность</th>
                    <th>Курс</th>
                    <th>Навыки</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => {
                    const src = avatarUrl(s.imagePath);
                    return (
                      <tr key={s.id}>
                        <td style={{ width: 48 }}>
                          {src ? (
                            <img className="avatar" src={src} alt="" />
                          ) : (
                            <span className="avatar avatar--placeholder">
                              {(s.firstName?.[0] ?? '?').toUpperCase()}
                            </span>
                          )}
                        </td>
                        <td>
                          {s.firstName} {s.lastName}
                        </td>
                        <td>{s.speciality}</td>
                        <td>{s.course}</td>
                        <td>
                          {(s.skills ?? [])
                            .map((k) => k.name)
                            .slice(0, 4)
                            .join(', ')}
                          {(s.skills?.length ?? 0) > 4 ? '…' : ''}
                        </td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <Link
                            className="btn btn--ghost"
                            to={`/students/${s.id}`}
                            style={{ textDecoration: 'none', display: 'inline-flex' }}
                          >
                            Открыть
                          </Link>
                          <button
                            type="button"
                            className="btn btn--danger"
                            style={{ marginLeft: '0.5rem' }}
                            onClick={() => handleDelete(s.id)}
                          >
                            Удалить
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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
