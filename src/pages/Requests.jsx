import { useCallback, useEffect, useState } from 'react';
import * as requestsApi from '../api/requests.js';
import * as studentsApi from '../api/students.js';
import * as recruitersApi from '../api/recruiters.js';

const PAGE_SIZE = 10;
const STATUSES = ['CREATION','SYNC','WAITING','EXPECTATION','STUDENT_CONFIRMED','RECRUITER_CONFIRMED','SUCCESS','REFUSAL'];

function shortUuid(value) {
  if (!value) return '-';
  return `${value.slice(0, 8)}...`;
}

export function Requests() {
  const [recruiterId, setRecruiterId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [statusFilter, setStatusFilter] = useState([]);
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [names, setNames] = useState({ students: {}, recruiters: {} });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestDetails, setRequestDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const filter = {};
      if (recruiterId.trim()) filter.recruiterId = recruiterId.trim();
      if (studentId.trim()) filter.studentId = studentId.trim();
      if (statusFilter.length) filter.results = statusFilter;
      const { data: res } = await requestsApi.filterRequests(filter, page, PAGE_SIZE);
      setData(res);
    } catch (e) {
      setError(e.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [recruiterId, studentId, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const rows = data?.data ?? [];
    if (!rows.length) return;
    let cancelled = false;
    (async () => {
      const studentIds = [...new Set(rows.map((r) => r.studentId).filter(Boolean))];
      const recruiterIds = [...new Set(rows.map((r) => r.recruiterId).filter(Boolean))];

      const studentPairs = await Promise.all(studentIds.map(async (id) => {
        try {
          const { data: s } = await studentsApi.getStudent(id);
          return [id, `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || shortUuid(id)];
        } catch { return [id, shortUuid(id)]; }
      }));

      const recruiterPairs = await Promise.all(recruiterIds.map(async (id) => {
        try {
          const { data: r } = await recruitersApi.getRecruiter(id);
          const full = `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim();
          return [id, full || r.companyName || shortUuid(id)];
        } catch { return [id, shortUuid(id)]; }
      }));

      if (!cancelled) setNames({ students: Object.fromEntries(studentPairs), recruiters: Object.fromEntries(recruiterPairs) });
    })();

    return () => { cancelled = true; };
  }, [data]);

  async function handleDelete(id) {
    if (!window.confirm('Delete request?')) return;
    try {
      await requestsApi.deleteRequest(id);
      if (selectedRequest === id) {
        setSelectedRequest(null);
        setRequestDetails(null);
      }
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function openDetails(id) {
    setSelectedRequest(id);
    setDetailsLoading(true);
    try {
      const { data } = await requestsApi.getRequest(id);
      setRequestDetails(data);
    } catch (e) {
      setRequestDetails(null);
      setError(e.message);
    } finally {
      setDetailsLoading(false);
    }
  }

  function toggleStatus(s) {
    setStatusFilter((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }

  const totalPages = data?.totalPages ?? 0;
  const rows = data?.data ?? [];

  return (
    <div className="page">
      <h1 className="page__title">Requests</h1>
      <p className="page__lead">POST /request/filter + GET /request/{'{id}'}</p>

      <div className="panel">
        <h2 className="panel__title">Filter</h2>
        <form onSubmit={(e) => { e.preventDefault(); setPage(0); load(); }}>
          <div className="form-row">
            <div className="field"><label>Recruiter UUID</label><input value={recruiterId} onChange={(e) => setRecruiterId(e.target.value)} placeholder="optional" /></div>
            <div className="field"><label>Student UUID</label><input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="optional" /></div>
            <button type="submit" className="btn btn--primary">Apply</button>
          </div>
          <div className="field" style={{ marginTop: '0.75rem' }}>
            <label>Status (multi-select)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.35rem' }}>
              {STATUSES.map((s) => (
                <label key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={statusFilter.includes(s)} onChange={() => toggleStatus(s)} />
                  {s}
                </label>
              ))}
            </div>
          </div>
        </form>
      </div>

      {error ? <div className="alert alert--error">{error}</div> : null}

      <div className="panel">
        <h2 className="panel__title">List</h2>
        {loading ? <p style={{ color: 'var(--text-muted)', margin: 0 }}>Loading...</p> : (
          <>
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>ID</th><th>Status</th><th>Student</th><th>Recruiter</th><th>Updated</th><th /></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td><span style={{ fontSize: '0.75rem', padding: '0.2rem 0.45rem', borderRadius: 6, background: 'rgba(255,255,255,0.06)' }}>{r.result}</span></td>
                      <td style={{ fontSize: '0.8rem' }}>{names.students[r.studentId] ?? shortUuid(r.studentId)}</td>
                      <td style={{ fontSize: '0.8rem' }}>{names.recruiters[r.recruiterId] ?? shortUuid(r.recruiterId)}</td>
                      <td style={{ fontSize: '0.8rem' }}>{r.updatedAt ? new Date(r.updatedAt).toLocaleString('en-US') : '-'}</td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button type="button" className="btn btn--ghost" onClick={() => openDetails(r.id)}>Open</button>
                        <button type="button" className="btn btn--danger" style={{ marginLeft: '0.5rem' }} onClick={() => handleDelete(r.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pager">
              <span>Page {data ? data.page + 1 : 1} of {Math.max(totalPages, 1)} -- total {data?.totalElements ?? 0}</span>
              <div className="pager__btns">
                <button type="button" className="btn btn--ghost" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Prev</button>
                <button type="button" className="btn btn--ghost" disabled={totalPages && page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedRequest ? (
        <div className="panel">
          <h2 className="panel__title">Request details #{selectedRequest}</h2>
          {detailsLoading ? <p style={{ color: 'var(--text-muted)', margin: 0 }}>Loading...</p> : requestDetails ? (
            <dl style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '0.35rem 1rem', margin: 0, fontSize: '0.9rem' }}>
              <dt style={{ color: 'var(--text-muted)' }}>Status</dt><dd style={{ margin: 0 }}>{requestDetails.result ?? '-'}</dd>
              <dt style={{ color: 'var(--text-muted)' }}>Student</dt><dd style={{ margin: 0 }}>{names.students[requestDetails.studentId] ?? requestDetails.studentId}</dd>
              <dt style={{ color: 'var(--text-muted)' }}>Recruiter</dt><dd style={{ margin: 0 }}>{names.recruiters[requestDetails.recruiterId] ?? requestDetails.recruiterId}</dd>
              <dt style={{ color: 'var(--text-muted)' }}>Chat ID</dt><dd style={{ margin: 0 }}>{requestDetails.chatId ?? '-'}</dd>
              <dt style={{ color: 'var(--text-muted)' }}>Chat title</dt><dd style={{ margin: 0 }}>{requestDetails.chatTitle ?? '-'}</dd>
              <dt style={{ color: 'var(--text-muted)' }}>Chat URL</dt><dd style={{ margin: 0 }}>{requestDetails.chatUrl ? <a href={requestDetails.chatUrl} target="_blank" rel="noreferrer">Open chat</a> : '-'}</dd>
              <dt style={{ color: 'var(--text-muted)' }}>Student response</dt><dd style={{ margin: 0 }}>{requestDetails.studentResponseText ?? '-'}</dd>
              <dt style={{ color: 'var(--text-muted)' }}>hasRecruiterMessage</dt><dd style={{ margin: 0 }}>{String(requestDetails.hasRecruiterMessage)}</dd>
              <dt style={{ color: 'var(--text-muted)' }}>hasStudentMessage</dt><dd style={{ margin: 0 }}>{String(requestDetails.hasStudentMessage)}</dd>
            </dl>
          ) : <p style={{ color: 'var(--text-muted)', margin: 0 }}>No data</p>}
        </div>
      ) : null}
    </div>
  );
}

