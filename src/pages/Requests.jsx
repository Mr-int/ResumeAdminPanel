import { useCallback, useEffect, useState } from 'react';
import * as requestsApi from '../api/requests.js';
import * as studentsApi from '../api/students.js';
import * as recruitersApi from '../api/recruiters.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { LoadingBlock } from '../components/ui/LoadingBlock.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { FlashMessages } from '../components/ui/FlashMessages.jsx';
import { DetailGrid } from '../components/ui/DetailGrid.jsx';
import { StatusBadge, requestStatusVariant } from '../components/ui/StatusBadge.jsx';
import { REQUEST_STATUS_LABELS, labelOf } from '../lib/labels.js';
import { fmtDate, shortUuid } from '../lib/format.js';

const PAGE_SIZE = 10;
const STATUSES = Object.keys(REQUEST_STATUS_LABELS);

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
    if (!window.confirm('Удалить заявку? Это действие необратимо.')) return;
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
      const { data: details } = await requestsApi.getRequest(id);
      setRequestDetails(details);
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
      <PageHeader
        title="Заявки на контакт"
        lead="Заявки рекрутеров на связь со студентами. После принятия студентом открывается чат."
      />

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
              <label>UUID рекрутера</label>
              <input
                value={recruiterId}
                onChange={(e) => setRecruiterId(e.target.value)}
                placeholder="Необязательно"
              />
            </div>
            <div className="field">
              <label>UUID студента</label>
              <input
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Необязательно"
              />
            </div>
            <button type="submit" className="btn btn--primary">
              Применить
            </button>
          </div>
          <div className="field" style={{ marginTop: '0.75rem' }}>
            <label>Статус (можно несколько)</label>
            <div className="checkbox-grid">
              {STATUSES.map((s) => (
                <label key={s} className="checkbox-chip">
                  <input
                    type="checkbox"
                    checked={statusFilter.includes(s)}
                    onChange={() => toggleStatus(s)}
                  />
                  {labelOf(REQUEST_STATUS_LABELS, s, s)}
                </label>
              ))}
            </div>
          </div>
        </form>
      </div>

      <FlashMessages error={error} />

      <div className="panel">
        <h2 className="panel__title">Список заявок</h2>
        {loading ? (
          <LoadingBlock />
        ) : rows.length === 0 ? (
          <EmptyState title="Заявок не найдено" hint="Измените фильтр или дождитесь новых заявок" />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>№</th>
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
                      <td className="cell-mono">{r.id}</td>
                      <td>
                        <StatusBadge variant={requestStatusVariant(r.result)}>
                          {labelOf(REQUEST_STATUS_LABELS, r.result, r.result)}
                        </StatusBadge>
                      </td>
                      <td>{names.students[r.studentId] ?? shortUuid(r.studentId)}</td>
                      <td>{names.recruiters[r.recruiterId] ?? shortUuid(r.recruiterId)}</td>
                      <td className="cell-muted">{fmtDate(r.updatedAt)}</td>
                      <td>
                        <div className="table-actions">
                          <button type="button" className="btn btn--ghost btn--small" onClick={() => openDetails(r.id)}>
                            Подробнее
                          </button>
                          <button type="button" className="btn btn--danger btn--small" onClick={() => handleDelete(r.id)}>
                            Удалить
                          </button>
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

      {selectedRequest ? (
        <div className="panel panel--accent">
          <h2 className="panel__title">Заявка №{selectedRequest}</h2>
          {detailsLoading ? (
            <LoadingBlock />
          ) : requestDetails ? (
            <DetailGrid
              items={[
                {
                  label: 'Статус',
                  value: (
                    <StatusBadge variant={requestStatusVariant(requestDetails.result)}>
                      {labelOf(REQUEST_STATUS_LABELS, requestDetails.result, requestDetails.result)}
                    </StatusBadge>
                  ),
                },
                {
                  label: 'Студент',
                  value: names.students[requestDetails.studentId] ?? requestDetails.studentId,
                },
                {
                  label: 'Рекрутер',
                  value: names.recruiters[requestDetails.recruiterId] ?? requestDetails.recruiterId,
                },
                { label: 'ID чата', value: requestDetails.chatId },
                { label: 'Название чата', value: requestDetails.chatTitle },
                {
                  label: 'Ссылка на чат',
                  value: requestDetails.chatUrl ? (
                    <a href={requestDetails.chatUrl} target="_blank" rel="noreferrer">
                      Открыть чат
                    </a>
                  ) : null,
                },
                { label: 'Ответ студента', value: requestDetails.studentResponseText },
                {
                  label: 'Сообщение рекрутера',
                  value: requestDetails.hasRecruiterMessage ? 'Да' : 'Нет',
                },
                {
                  label: 'Сообщение студента',
                  value: requestDetails.hasStudentMessage ? 'Да' : 'Нет',
                },
              ]}
            />
          ) : (
            <EmptyState title="Не удалось загрузить детали" />
          )}
        </div>
      ) : null}
    </div>
  );
}
