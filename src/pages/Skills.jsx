import { useCallback, useEffect, useState } from 'react';
import * as skillsApi from '../api/skills.js';

const PAGE_SIZE = 15;

export function Skills() {
  const [nameFilter, setNameFilter] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const { data: res } = await skillsApi.filterSkills(
        { name: nameFilter.trim() || undefined },
        page,
        PAGE_SIZE,
        ['id,asc']
      );
      setData(res);
    } catch (e) {
      setError(e.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [nameFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    setMsg(null);
    try {
      await skillsApi.createSkill({ name: newName.trim() });
      setNewName('');
      setMsg({ type: 'ok', text: 'Навык создан' });
      await load();
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    }
  }

  async function handleUpdate() {
    if (!editId) return;
    setMsg(null);
    try {
      await skillsApi.updateSkill(editId, { name: editName.trim() });
      setEditId(null);
      setEditName('');
      setMsg({ type: 'ok', text: 'Навык обновлен' });
      await load();
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Удалить навык?')) return;
    setMsg(null);
    try {
      await skillsApi.deleteSkill(id);
      setMsg({ type: 'ok', text: 'Навык удален' });
      await load();
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    }
  }

  const rows = data?.data ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="page">
      <h1 className="page__title">Навыки</h1>
      <p className="page__lead">GET/PUT/DELETE /skill/{'{id}'}, POST /skill, POST /skill/filter</p>

      <div className="panel">
        <h2 className="panel__title">Фильтр и создание</h2>
        <form
          className="form-row"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(0);
            load();
          }}
        >
          <div className="field">
            <label>Название навыка</label>
            <input
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              placeholder="Пусто - все"
            />
          </div>
          <button type="submit" className="btn btn--primary">
            Найти
          </button>
        </form>

        <form className="form-row" onSubmit={handleCreate}>
          <div className="field">
            <label>Новый навык</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn--primary">
            Добавить
          </button>
        </form>
      </div>

      {error ? <div className="alert alert--error">{error}</div> : null}
      {msg?.type === 'ok' ? <div className="alert alert--success">{msg.text}</div> : null}
      {msg?.type === 'err' ? <div className="alert alert--error">{msg.text}</div> : null}

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
                    <th>Название</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s.id}>
                      <td>{s.id}</td>
                      <td>
                        {editId === s.id ? (
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        ) : (
                          s.name
                        )}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {editId === s.id ? (
                          <>
                            <button
                              type="button"
                              className="btn btn--primary"
                              onClick={handleUpdate}
                            >
                              Сохранить
                            </button>
                            <button
                              type="button"
                              className="btn btn--ghost"
                              style={{ marginLeft: '0.5rem' }}
                              onClick={() => {
                                setEditId(null);
                                setEditName('');
                              }}
                            >
                              Отмена
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="btn btn--ghost"
                              onClick={() => {
                                setEditId(s.id);
                                setEditName(s.name);
                              }}
                            >
                              Изменить
                            </button>
                            <button
                              type="button"
                              className="btn btn--danger"
                              style={{ marginLeft: '0.5rem' }}
                              onClick={() => handleDelete(s.id)}
                            >
                              Удалить
                            </button>
                          </>
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
    </div>
  );
}
