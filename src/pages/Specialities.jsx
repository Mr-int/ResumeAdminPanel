import { useCallback, useEffect, useState } from 'react';
import * as specialitiesApi from '../api/specialities.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { LoadingBlock } from '../components/ui/LoadingBlock.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { FlashMessages } from '../components/ui/FlashMessages.jsx';

const PAGE_SIZE = 15;

export function Specialities() {
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
      const { data: res } = await specialitiesApi.filterSpecialities(
        { name: nameFilter.trim() || undefined },
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
  }, [nameFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    setMsg(null);
    try {
      await specialitiesApi.createSpeciality({ name: newName.trim() });
      setNewName('');
      setMsg({ type: 'ok', text: 'Специальность добавлена' });
      await load();
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    }
  }

  async function handleUpdate() {
    if (!editId) return;
    setMsg(null);
    try {
      await specialitiesApi.updateSpeciality(editId, { name: editName.trim() });
      setEditId(null);
      setEditName('');
      setMsg({ type: 'ok', text: 'Специальность обновлена' });
      await load();
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Удалить специальность?')) return;
    setMsg(null);
    try {
      await specialitiesApi.deleteSpeciality(id);
      setMsg({ type: 'ok', text: 'Специальность удалена' });
      await load();
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    }
  }

  const rows = data?.data ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="page">
      <PageHeader
        title="Специальности"
        lead="Справочник направлений обучения для карточек студентов и вакансий."
      />

      <div className="panel">
        <h2 className="panel__title">Поиск и добавление</h2>
        <form
          className="form-row"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(0);
            load();
          }}
        >
          <div className="field">
            <label>Название</label>
            <input
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              placeholder="Пусто — все записи"
            />
          </div>
          <button type="submit" className="btn btn--primary">
            Найти
          </button>
        </form>

        <form className="form-row" onSubmit={handleCreate}>
          <div className="field">
            <label>Новая специальность</label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn--primary">
            Добавить
          </button>
        </form>
      </div>

      <FlashMessages
        error={error || (msg?.type === 'err' ? msg.text : null)}
        success={msg?.type === 'ok' ? msg.text : null}
      />

      <div className="panel">
        <h2 className="panel__title">Список</h2>
        {loading ? (
          <LoadingBlock />
        ) : rows.length === 0 ? (
          <EmptyState title="Специальности не найдены" />
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
                      <td className="cell-mono">{s.id}</td>
                      <td>
                        {editId === s.id ? (
                          <input value={editName} onChange={(e) => setEditName(e.target.value)} />
                        ) : (
                          s.name
                        )}
                      </td>
                      <td>
                        <div className="table-actions">
                          {editId === s.id ? (
                            <>
                              <button type="button" className="btn btn--primary btn--small" onClick={handleUpdate}>
                                Сохранить
                              </button>
                              <button
                                type="button"
                                className="btn btn--ghost btn--small"
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
                                className="btn btn--ghost btn--small"
                                onClick={() => {
                                  setEditId(s.id);
                                  setEditName(s.name);
                                }}
                              >
                                Изменить
                              </button>
                              <button
                                type="button"
                                className="btn btn--danger btn--small"
                                onClick={() => handleDelete(s.id)}
                              >
                                Удалить
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
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
    </div>
  );
}
