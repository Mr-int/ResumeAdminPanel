import { useCallback, useEffect, useMemo, useState } from 'react';
import * as recruitersApi from '../api/recruiters.js';

const PAGE_SIZE = 10;

function emptyForm() {
  return {
    companyName: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    telegramUsername: '',
  };
}

export function Recruiters() {
  const [name, setName] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const filter = {};
      if (name.trim()) filter.name = name.trim();
      const { data: res } = await recruitersApi.filterRecruiters(filter, page, PAGE_SIZE);
      setData(res);
    } catch (e) {
      setError(e.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [name, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = data?.totalPages ?? 0;
  const rows = data?.data ?? [];
  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);

  useEffect(() => {
    if (!selected) return;
    setForm({
      companyName: selected.companyName ?? '',
      firstName: selected.firstName ?? '',
      lastName: selected.lastName ?? '',
      email: selected.email ?? '',
      phoneNumber: selected.phoneNumber ?? '',
      telegramUsername: selected.telegramUsername ?? '',
    });
  }, [selected]);

  async function handleDelete(id) {
    if (!window.confirm('Delete recruiter?')) return;
    setMsg(null);
    try {
      await recruitersApi.deleteRecruiter(id);
      if (selectedId === id) {
        setSelectedId(null);
        setForm(emptyForm());
      }
      await load();
      setMsg({ type: 'ok', text: 'Recruiter deleted' });
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    }
  }

  async function handlePut(e) {
    e.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    setMsg(null);
    try {
      await recruitersApi.updateRecruiter(selectedId, {
        companyName: form.companyName.trim(),
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        email: form.email || undefined,
        phoneNumber: form.phoneNumber || undefined,
        telegramUsername: form.telegramUsername || undefined,
      });
      await load();
      setMsg({ type: 'ok', text: 'Full update done (PUT)' });
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    } finally {
      setSaving(false);
    }
  }

  async function handlePatch() {
    if (!selectedId) return;
    setSaving(true);
    setMsg(null);
    try {
      const payload = {};
      if (form.companyName.trim()) payload.companyName = form.companyName.trim();
      if (form.firstName.trim()) payload.firstName = form.firstName.trim();
      if (form.lastName.trim()) payload.lastName = form.lastName.trim();
      if (form.email.trim()) payload.email = form.email.trim();
      if (form.phoneNumber.trim()) payload.phoneNumber = form.phoneNumber.trim();
      if (form.telegramUsername.trim()) payload.telegramUsername = form.telegramUsername.trim();

      await recruitersApi.patchRecruiter(selectedId, payload);
      await load();
      setMsg({ type: 'ok', text: 'Partial update done (PATCH)' });
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <h1 className="page__title">Recruiters</h1>
      <p className="page__lead">POST /recruiter/filter, PUT/PATCH/DELETE /recruiter/{'{id}'}</p>
      <div className="panel">
        <h2 className="panel__title">Filter</h2>
        <form className="form-row" onSubmit={(e) => { e.preventDefault(); setPage(0); load(); }}>
          <div className="field"><label>Name</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Empty = all" /></div>
          <button type="submit" className="btn btn--primary">Search</button>
        </form>
      </div>

      {error ? <div className="alert alert--error">{error}</div> : null}
      {msg?.type === 'ok' ? <div className="alert alert--success">{msg.text}</div> : null}
      {msg?.type === 'err' ? <div className="alert alert--error">{msg.text}</div> : null}

      <div className="panel">
        <h2 className="panel__title">List</h2>
        {loading ? <p style={{ color: 'var(--text-muted)', margin: 0 }}>Loading...</p> : (
          <>
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Company</th><th>Name</th><th>Email</th><th>Telegram</th><th /></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.companyName}</td>
                      <td>{r.firstName} {r.lastName}</td>
                      <td>{r.email ?? '-'}</td>
                      <td>{r.telegramUsername ?? '-'}</td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button type="button" className="btn btn--ghost" onClick={() => setSelectedId(r.id)}>Edit</button>
                        <button type="button" className="btn btn--danger" style={{ marginLeft: '0.5rem' }} onClick={() => handleDelete(r.id)}>Delete</button>
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

      {selectedId ? (
        <div className="panel">
          <h2 className="panel__title">Edit recruiter</h2>
          <form onSubmit={handlePut}>
            <div className="form-row">
              <div className="field"><label>Company *</label><input required value={form.companyName} onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))} /></div>
              <div className="field"><label>First name</label><input value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} /></div>
              <div className="field"><label>Last name</label><input value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} /></div>
            </div>
            <div className="form-row">
              <div className="field"><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></div>
              <div className="field"><label>Phone</label><input value={form.phoneNumber} onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))} /></div>
              <div className="field"><label>Telegram username</label><input value={form.telegramUsername} onChange={(e) => setForm((p) => ({ ...p, telegramUsername: e.target.value }))} /></div>
            </div>
            <div className="form-row">
              <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? 'Saving...' : 'Save (PUT)'}</button>
              <button type="button" className="btn btn--ghost" disabled={saving} onClick={handlePatch}>Patch</button>
              <button type="button" className="btn btn--ghost" onClick={() => { setSelectedId(null); setForm(emptyForm()); }}>Close</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

