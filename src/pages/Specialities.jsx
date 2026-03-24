import { useCallback, useEffect, useState } from 'react';
import * as specialitiesApi from '../api/specialities.js';

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
      setMsg({ type: 'ok', text: 'Speciality created' });
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
      setMsg({ type: 'ok', text: 'Speciality updated' });
      await load();
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete speciality?')) return;
    setMsg(null);
    try {
      await specialitiesApi.deleteSpeciality(id);
      setMsg({ type: 'ok', text: 'Speciality deleted' });
      await load();
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    }
  }

  const rows = data?.data ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="page">
      <h1 className="page__title">Specialities</h1>
      <p className="page__lead">GET/PUT/DELETE /speciality/{'{id}'}, POST /speciality, POST /speciality/filter</p>

      <div className="panel">
        <h2 className="panel__title">Filter and create</h2>
        <form
          className="form-row"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(0);
            load();
          }}
        >
          <div className="field">
            <label>Speciality name</label>
            <input
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              placeholder="Empty = all"
            />
          </div>
          <button type="submit" className="btn btn--primary">Search</button>
        </form>

        <form className="form-row" onSubmit={handleCreate}>
          <div className="field">
            <label>New speciality</label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn--primary">Add</button>
        </form>
      </div>

      {error ? <div className="alert alert--error">{error}</div> : null}
      {msg?.type === 'ok' ? <div className="alert alert--success">{msg.text}</div> : null}
      {msg?.type === 'err' ? <div className="alert alert--error">{msg.text}</div> : null}

      <div className="panel">
        <h2 className="panel__title">List</h2>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Loading...</p>
        ) : (
          <>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr><th>ID</th><th>Name</th><th /></tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s.id}>
                      <td>{s.id}</td>
                      <td>
                        {editId === s.id ? (
                          <input value={editName} onChange={(e) => setEditName(e.target.value)} />
                        ) : s.name}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {editId === s.id ? (
                          <>
                            <button type="button" className="btn btn--primary" onClick={handleUpdate}>Save</button>
                            <button type="button" className="btn btn--ghost" style={{ marginLeft: '0.5rem' }} onClick={() => { setEditId(null); setEditName(''); }}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button type="button" className="btn btn--ghost" onClick={() => { setEditId(s.id); setEditName(s.name); }}>Edit</button>
                            <button type="button" className="btn btn--danger" style={{ marginLeft: '0.5rem' }} onClick={() => handleDelete(s.id)}>Delete</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pager">
              <span>Page {data ? data.page + 1 : 1} of {Math.max(totalPages, 1)} - total {data?.totalElements ?? 0}</span>
              <div className="pager__btns">
                <button type="button" className="btn btn--ghost" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Prev</button>
                <button type="button" className="btn btn--ghost" disabled={totalPages && page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
