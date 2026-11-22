import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as recruitmentApi from '../api/recruitmentRequests.js';
import { listAllCities } from '../api/cities.js';
import { getSpecialityOptions } from '../lib/referenceCache.js';
import { emptyRecruitmentForm, payloadFromForm } from '../lib/recruitmentRequestForm.js';
import { RECRUITMENT_REQUEST_STATUS_LABELS, labelOf } from '../lib/labels.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { FlashMessages } from '../components/ui/FlashMessages.jsx';
import { StatusBadge, recruitmentRequestStatusVariant } from '../components/ui/StatusBadge.jsx';
import { LoadingBlock } from '../components/ui/LoadingBlock.jsx';
import { RecruitmentRequestForm } from '../components/RecruitmentRequestForm.jsx';

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { id: 'OPEN', label: 'Открытые' },
  { id: 'CLOSED', label: 'Закрытые' },
  { id: 'ARCHIVED', label: 'Архив' },
];

function ChoiceChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      className={`student-chip${active ? ' student-chip--active' : ''}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function namesOf(ids, options) {
  const byId = new Map((options ?? []).map((item) => [Number(item.id), item.name]));
  const names = (ids ?? []).map((id) => byId.get(Number(id)) || String(id));
  return names.length ? names.join(', ') : '—';
}

export function RecruitmentRequests() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [specialities, setSpecialities] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyRecruitmentForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: res }, specialityOptions, cityOptions] = await Promise.all([
        recruitmentApi.filterRecruitmentRequests(status || undefined, page, PAGE_SIZE),
        getSpecialityOptions(),
        listAllCities(),
      ]);
      setData(res);
      setSpecialities(specialityOptions ?? []);
      setCities(cityOptions ?? []);
    } catch (e) {
      setError(e.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      const body = payloadFromForm(form);
      await recruitmentApi.createRecruitmentRequest(body);
      setForm(emptyRecruitmentForm());
      setCreating(false);
      setMsg({ type: 'ok', text: 'Заявка создана' });
      if (page === 0 && !status) {
        await load();
      } else {
        setPage(0);
        setStatus('');
      }
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  const rows = data?.data ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="page">
      <PageHeader
        title="Заявки на студентов"
        lead="Все заявки, включая закрытые, архивные и вне окна публикации."
      />

      <div className="panel panel--accent">
        <div className="projects-admin__panel-head">
          <h2 className="panel__title">Своя заявка</h2>
          <button type="button" className="btn btn--ghost" onClick={() => setCreating((v) => !v)}>
            {creating ? 'Скрыть форму' : 'Новая заявка'}
          </button>
        </div>
        {creating ? (
          <form onSubmit={handleCreate}>
            <RecruitmentRequestForm
              form={form}
              onChange={setForm}
              specialities={specialities}
              cities={cities}
              idPrefix="rr-create"
            />
            <button type="submit" className="btn btn--primary" disabled={saving} style={{ marginTop: '0.75rem' }}>
              {saving ? 'Создание…' : 'Создать'}
            </button>
          </form>
        ) : null}
      </div>

      <FlashMessages
        success={msg?.type === 'ok' ? msg.text : null}
        error={msg?.type === 'err' ? msg.text : error}
      />

      <div className="panel">
        <div className="student-chip-rows">
          <div className="student-chip-row">
            <span className="student-chip-row__label">Статус</span>
            <div className="student-chip-row__items">
              <ChoiceChip
                active={!status}
                onClick={() => {
                  setStatus('');
                  setPage(0);
                }}
              >
                Все
              </ChoiceChip>
              {STATUS_OPTIONS.map((item) => (
                <ChoiceChip
                  key={item.id}
                  active={status === item.id}
                  onClick={() => {
                    setStatus(item.id);
                    setPage(0);
                  }}
                >
                  {item.label}
                </ChoiceChip>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        {loading ? (
          <LoadingBlock />
        ) : rows.length === 0 ? (
          <p className="page__lead" style={{ margin: 0 }}>Заявок нет.</p>
        ) : (
          <>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Компания</th>
                    <th>Статус</th>
                    <th>Студентов</th>
                    <th>Города</th>
                    <th>Специальности</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        {row.companyName || '—'}
                        {row.recruiterId == null ? (
                          <div className="cell-muted">Своя заявка</div>
                        ) : null}
                      </td>
                      <td>
                        <StatusBadge variant={recruitmentRequestStatusVariant(row.status)}>
                          {labelOf(RECRUITMENT_REQUEST_STATUS_LABELS, row.status)}
                        </StatusBadge>
                      </td>
                      <td>{row.studentCount}</td>
                      <td>{namesOf(row.cityIds, cities)}</td>
                      <td>{namesOf(row.specialityIds, specialities)}</td>
                      <td>
                        <Link className="btn btn--ghost" to={`/recruitment-requests/${row.id}`}>
                          Открыть
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={data?.page ?? page}
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
