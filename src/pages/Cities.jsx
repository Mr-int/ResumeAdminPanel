import { useCallback, useEffect, useState } from 'react';
import * as citiesApi from '../api/cities.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { LoadingBlock } from '../components/ui/LoadingBlock.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { FlashMessages } from '../components/ui/FlashMessages.jsx';

const PAGE_SIZE = 15;

export function Cities() {
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
      const { data: res } = await citiesApi.filterCities(
        { name: nameFilter.trim() || undefined },
        page,
        PAGE_SIZE,
        ['name,asc'],
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

  async function handleCreate(event) {
    event.preventDefault();
    setMsg(null);
    try {
      await citiesApi.createCity({ name: newName.trim() });
      setNewName('');
      setMsg({ type: 'ok', text: 'Город добавлен' });
      await load();
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    }
  }

  async function handleUpdate() {
    if (!editId) return;
    setMsg(null);
    try {
      await citiesApi.updateCity(editId, { name: editName.trim() });
      setEditId(null);
      setEditName('');
      setMsg({ type: 'ok', text: 'Город обновлён' });
      await load();
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Удалить город?')) return;
    setMsg(null);
    try {
      await citiesApi.deleteCity(id);
      setMsg({ type: 'ok', text: 'Город удалён' });
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
        title="Города"
        lead="Справочник городов для анкет студентов. Переименование обновляет имя у выбранных студентов."
      />

      <div className="panel">
        <h2 className="panel__title">Поиск и добавление</h2>
        <form
          className="form-row"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(0);
            load();
          }}
        >
          <div className="field">
            <label htmlFor="city-search">Название</label>
            <input
              id="city-search"
              value={nameFilter}
              onChange={(event) => setNameFilter(event.target.value)}
              placeholder="Пусто — все записи"
            />
          </div>
          <button type="submit" className="btn btn--primary">Найти</button>
        </form>
        <form className="form-row" onSubmit={handleCreate}>
          <div className="field">
            <label htmlFor="city-new">Новый город</label>
            <input id="city-new" value={newName} onChange={(event) => setNewName(event.target.value)} required />
          </div>
          <button type="submit" className="btn btn--primary">Добавить</button>
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
          <EmptyState title="Города не найдены" />
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
                  {rows.map((city) => (
                    <tr key={city.id}>
                      <td className="cell-mono">{city.id}</td>
                      <td>
                        {editId === city.id ? (
                          <input value={editName} onChange={(event) => setEditName(event.target.value)} />
                        ) : (
                          city.name
                        )}
                      </td>
                      <td>
                        <div className="table-actions">
                          {editId === city.id ? (
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
                                  setEditId(city.id);
                                  setEditName(city.name);
                                }}
                              >
                                Изменить
                              </button>
                              <button
                                type="button"
                                className="btn btn--danger btn--small"
                                onClick={() => handleDelete(city.id)}
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
              onPrev={() => setPage((current) => Math.max(0, current - 1))}
              onNext={() => setPage((current) => current + 1)}
            />
          </>
        )}
      </div>
    </div>
  );
}
