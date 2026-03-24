import { useCallback, useEffect, useState } from 'react';

import * as requestsApi from '../api/requests.js';
import * as studentsApi from '../api/students.js';
import * as recruitersApi from '../api/recruiters.js';

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

function shortUuid(value) {
  if (!value) return 'вЂ”';
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

  useEffect(() => {
    const rows = data?.data ?? [];
    if (!rows.length) return;

    let cancelled = false;
    (async () => {
      const studentIds = [...new Set(rows.map((r) => r.studentId).filter(Boolean))];
      const recruiterIds = [...new Set(rows.map((r) => r.recruiterId).filter(Boolean))];

      const studentPairs = await Promise.all(
        studentIds.map(async (id) => {
          try {
            const { data: s } = await studentsApi.getStudent(id);
            return [id, `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || shortUuid(id)];
          } catch {
            return [id, shortUuid(id)];
          }
        })
      );

      const recruiterPairs = await Promise.all(
        recruiterIds.map(async (id) => {
          try {
            const { data: r } = await recruitersApi.getRecruiter(id);
            const full = `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim();
            return [id, full || r.companyName || shortUuid(id)];
          } catch {
            return [id, shortUuid(id)];
          }
        })
      );

      if (!cancelled) {
        setNames({
          students: Object.fromEntries(studentPairs),
          recruiters: Object.fromEntries(recruiterPairs),
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [data]);

  async function handleDelete(id) {
    if (!window.confirm('РЈРґР°Р»РёС‚СЊ Р·Р°СЏРІРєСѓ?')) return;
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
    setStatusFilter((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  const totalPages = data?.totalPages ?? 0;
  const rows = data?.data ?? [];

  return (
    <div className="page">
      <h1 className="page__title">Р—Р°СЏРІРєРё</h1>
      <p className="page__lead">POST /request/filter + GET /request/{'{id}'}</p>

      <div className="panel">
        <h2 className="panel__title">Р¤РёР»СЊС‚СЂ</h2>
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
                placeholder="РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ"
              />
            </div>
            <div className="field">
              <label htmlFor="reqStu">Student UUID</label>
              <input
                id="reqStu"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ"
              />
            </div>
            <button type="submit" className="btn btn--primary">
              РџСЂРёРјРµРЅРёС‚СЊ
            </button>
          </div>
          <div className="field" style={{ marginTop: '0.75rem' }}>
            <label>РЎС‚Р°С‚СѓСЃС‹ (РјСѓР»СЊС‚РёРІС‹Р±РѕСЂ)</label>
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
        <h2 className="panel__title">РЎРїРёСЃРѕРє</h2>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Р—Р°РіСЂСѓР·РєР°вЂ¦</p>
        ) : (
          <>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>РЎС‚Р°С‚СѓСЃ</th>
                    <th>РЎС‚СѓРґРµРЅС‚</th>
                    <th>Р РµРєСЂСѓС‚РµСЂ</th>
                    <th>РћР±РЅРѕРІР»РµРЅРѕ</th>
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
                      <td style={{ fontSize: '0.8rem' }}>
                        {names.students[r.studentId] ?? shortUuid(r.studentId)}
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>
                        {names.recruiters[r.recruiterId] ?? shortUuid(r.recruiterId)}
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>
                        {r.updatedAt
                          ? new Date(r.updatedAt).toLocaleString('ru-RU')
                          : 'вЂ”'}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          className="btn btn--ghost"
                          onClick={() => openDetails(r.id)}
                        >
                          РћС‚РєСЂС‹С‚СЊ
                        </button>
                        <button
                          type="button"
                          className="btn btn--danger"
                          style={{ marginLeft: '0.5rem' }}
                          onClick={() => handleDelete(r.id)}
                        >
                          РЈРґР°Р»РёС‚СЊ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pager">
              <span>
                РЎС‚СЂ. {data ? data.page + 1 : 1} РёР· {Math.max(totalPages, 1)} В· РІСЃРµРіРѕ{' '}
                {data?.totalElements ?? 0}
              </span>
              <div className="pager__btns">
                <button
                  type="button"
                  className="btn btn--ghost"
                  disabled={page <= 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  РќР°Р·Р°Рґ
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  disabled={totalPages && page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Р’РїРµСЂС‘Рґ
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedRequest ? (
        <div className="panel">
          <h2 className="panel__title">Р”РµС‚Р°Р»Рё Р·Р°СЏРІРєРё #{selectedRequest}</h2>
          {detailsLoading ? (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Р—Р°РіСЂСѓР·РєР°вЂ¦</p>
          ) : requestDetails ? (
            <dl
              style={{
                display: 'grid',
                gridTemplateColumns: '220px 1fr',
                gap: '0.35rem 1rem',
                margin: 0,
                fontSize: '0.9rem',
              }}
            >
              <dt style={{ color: 'var(--text-muted)' }}>РЎС‚Р°С‚СѓСЃ</dt>
              <dd style={{ margin: 0 }}>{requestDetails.result ?? 'вЂ”'}</dd>
              <dt style={{ color: 'var(--text-muted)' }}>РЎС‚СѓРґРµРЅС‚</dt>
              <dd style={{ margin: 0 }}>
                {names.students[requestDetails.studentId] ?? requestDetails.studentId}
              </dd>
              <dt style={{ color: 'var(--text-muted)' }}>Р РµРєСЂСѓС‚РµСЂ</dt>
              <dd style={{ margin: 0 }}>
                {names.recruiters[requestDetails.recruiterId] ?? requestDetails.recruiterId}
              </dd>
              <dt style={{ color: 'var(--text-muted)' }}>Chat ID</dt>
              <dd style={{ margin: 0 }}>{requestDetails.chatId ?? 'вЂ”'}</dd>
              <dt style={{ color: 'var(--text-muted)' }}>Chat title</dt>
              <dd style={{ margin: 0 }}>{requestDetails.chatTitle ?? 'вЂ”'}</dd>
              <dt style={{ color: 'var(--text-muted)' }}>Chat URL</dt>
              <dd style={{ margin: 0 }}>
                {requestDetails.chatUrl ? (
                  <a href={requestDetails.chatUrl} target="_blank" rel="noreferrer">
                    РћС‚РєСЂС‹С‚СЊ С‡Р°С‚
                  </a>
                ) : (
                  'вЂ”'
                )}
              </dd>
              <dt style={{ color: 'var(--text-muted)' }}>РЎРѕРѕР±С‰РµРЅРёРµ СЃС‚СѓРґРµРЅС‚Р°</dt>
              <dd style={{ margin: 0 }}>{requestDetails.studentResponseText ?? 'вЂ”'}</dd>
              <dt style={{ color: 'var(--text-muted)' }}>hasRecruiterMessage</dt>
              <dd style={{ margin: 0 }}>{String(requestDetails.hasRecruiterMessage)}</dd>
              <dt style={{ color: 'var(--text-muted)' }}>hasStudentMessage</dt>
              <dd style={{ margin: 0 }}>{String(requestDetails.hasStudentMessage)}</dd>
            </dl>
          ) : (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Р”Р°РЅРЅС‹Рµ РЅРµ РЅР°Р№РґРµРЅС‹</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
