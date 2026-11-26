import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as recruitmentApi from '../api/recruitmentRequests.js';
import { listAllCities } from '../api/cities.js';
import { getSpecialityOptions } from '../lib/referenceCache.js';
import { formFromRequest, payloadFromForm } from '../lib/recruitmentRequestForm.js';
import {
  COOPERATION_FORMAT_LABELS,
  RECRUITMENT_REQUEST_STATUS_LABELS,
  RECRUITMENT_RESPONSE_STATUS_LABELS,
  labelOf,
} from '../lib/labels.js';
import { isValidUuid } from '../utils/studentId.js';
import { fromApiDateTime } from '../utils/dateTimeApi.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { DetailGrid } from '../components/ui/DetailGrid.jsx';
import { LoadingBlock } from '../components/ui/LoadingBlock.jsx';
import { FlashMessages } from '../components/ui/FlashMessages.jsx';
import {
  StatusBadge,
  recruitmentRequestStatusVariant,
  recruitmentResponseStatusVariant,
} from '../components/ui/StatusBadge.jsx';
import { RecruitmentRequestForm } from '../components/RecruitmentRequestForm.jsx';

function readyLabel(value) {
  if (value === true) return 'Да';
  if (value === false) return 'Нет';
  return 'Не указано';
}

function namesOf(ids, options) {
  const byId = new Map((options ?? []).map((item) => [Number(item.id), item.name]));
  const names = (ids ?? []).map((id) => byId.get(Number(id)) || String(id));
  return names.length ? names.join(', ') : '—';
}

function textValue(value) {
  return <span style={{ whiteSpace: 'pre-wrap' }}>{value || '—'}</span>;
}

function windowLabel(from, to) {
  const start = fromApiDateTime(from) || 'без ограничения';
  const end = fromApiDateTime(to) || 'без ограничения';
  return `${start} — ${end}`;
}

export function RecruitmentRequestDetail() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [specialities, setSpecialities] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);

  const load = useCallback(async () => {
    if (!isValidUuid(id)) {
      setError('Некорректный ID заявки');
      setRequest(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [{ data: row }, { data: responseRows }, specialityOptions, cityOptions] = await Promise.all([
        recruitmentApi.getRecruitmentRequest(id),
        recruitmentApi.listRecruitmentResponses(id),
        getSpecialityOptions(),
        listAllCities(),
      ]);
      setRequest(row);
      setForm(formFromRequest(row));
      setResponses(Array.isArray(responseRows) ? responseRows : []);
      setSpecialities(specialityOptions ?? []);
      setCities(cityOptions ?? []);
    } catch (e) {
      setError(e.message);
      setRequest(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(e) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setMsg(null);
    try {
      const { data } = await recruitmentApi.updateRecruitmentRequest(id, payloadFromForm(form));
      setRequest(data);
      setForm(formFromRequest(data));
      setMsg({ type: 'ok', text: 'Заявка сохранена' });
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleClose() {
    if (!window.confirm('Закрыть заявку? Новые отклики больше не принимаются.')) return;
    setMsg(null);
    setSaving(true);
    try {
      await recruitmentApi.closeRecruitmentRequest(id);
      setMsg({ type: 'ok', text: 'Заявка закрыта' });
      await load();
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive() {
    if (!window.confirm('Отправить заявку в архив? После этого её нельзя править.')) return;
    setMsg(null);
    setSaving(true);
    try {
      await recruitmentApi.archiveRecruitmentRequest(id);
      setMsg({ type: 'ok', text: 'Заявка в архиве' });
      await load();
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDecision(responseId, accept) {
    setActionId(responseId);
    setMsg(null);
    try {
      const { data } = accept
        ? await recruitmentApi.acceptRecruitmentResponse(id, responseId)
        : await recruitmentApi.rejectRecruitmentResponse(id, responseId);
      setResponses((rows) => rows.map((row) => (row.id === data.id ? data : row)));
      setMsg({ type: 'ok', text: accept ? 'Отклик принят' : 'Отклик отклонён' });
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setActionId(null);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <LoadingBlock text="Загрузка заявки…" />
      </div>
    );
  }

  if (!request || !form) {
    return (
      <div className="page">
        <div className="alert alert--error">{error ?? 'Заявка не найдена'}</div>
        <Link to="/recruitment-requests" className="btn btn--ghost">
          ← К списку
        </Link>
      </div>
    );
  }

  const archived = request.status === 'ARCHIVED';
  const accepted = responses.filter((row) => row.status === 'ACCEPTED').length;
  const companyHint = request.recruiterId
    ? 'В списке имя компании берётся из карточки работодателя. Название всё равно нужно указать при сохранении.'
    : null;

  return (
    <div className="page">
      <p style={{ margin: '0 0 1rem' }}>
        <Link to="/recruitment-requests" className="btn btn--ghost" style={{ textDecoration: 'none' }}>
          ← Заявки
        </Link>
      </p>
      <PageHeader
        title={request.companyName || 'Заявка'}
        lead={request.recruiterId == null ? 'Своя заявка администратора' : 'Заявка работодателя'}
      />

      <FlashMessages
        success={msg?.type === 'ok' ? msg.text : null}
        error={msg?.type === 'err' ? msg.text : error}
      />

      <div className="panel">
        <div className="projects-admin__panel-head">
          <h2 className="panel__title">
            <StatusBadge variant={recruitmentRequestStatusVariant(request.status)}>
              {labelOf(RECRUITMENT_REQUEST_STATUS_LABELS, request.status)}
            </StatusBadge>
          </h2>
          <div className="table-actions">
            {request.status === 'OPEN' ? (
              <button type="button" className="btn btn--ghost" disabled={saving} onClick={handleClose}>
                Закрыть
              </button>
            ) : null}
            {request.status === 'OPEN' || request.status === 'CLOSED' ? (
              <button type="button" className="btn btn--danger" disabled={saving} onClick={handleArchive}>
                В архив
              </button>
            ) : null}
          </div>
        </div>
        <p className="page__lead" style={{ marginTop: 0 }}>
          Нужно {request.studentCount}. Принято {accepted}. Окно публикации: {windowLabel(request.publishedFrom, request.publishedTo)}.
          {' '}Формат: {labelOf(COOPERATION_FORMAT_LABELS, request.cooperationFormat, 'не указан')}.
          {' '}Готовы запросить: {readyLabel(request.readyToRequestStudents)}.
        </p>
      </div>

      <div className="panel">
        <h2 className="panel__title">{archived ? 'Заявка' : 'Правка'}</h2>
        {archived ? (
          <DetailGrid
            items={[
              { label: 'Компания', value: request.companyName || '—' },
              { label: 'Задачи', value: textValue(request.tasks) },
              { label: 'Требования', value: textValue(request.qualificationRequirements) },
              { label: 'Условия', value: textValue(request.workConditions) },
              { label: 'Специальности', value: namesOf(request.specialityIds, specialities) },
              { label: 'Города', value: namesOf(request.cityIds, cities) },
              { label: 'Сроки', value: textValue(request.scheduleNote) },
              { label: 'Прочее', value: textValue(request.extraInfo) },
            ]}
          />
        ) : (
          <form onSubmit={handleSave}>
            <RecruitmentRequestForm
              form={form}
              onChange={setForm}
              specialities={specialities}
              cities={cities}
              companyHint={companyHint}
              idPrefix="rr-edit"
              disabled={saving}
            />
            <button type="submit" className="btn btn--primary" disabled={saving} style={{ marginTop: '0.75rem' }}>
              {saving ? 'Сохранение…' : 'Сохранить'}
            </button>
          </form>
        )}
      </div>

      <div className="panel">
        <h2 className="panel__title">Отклики · принято {accepted}</h2>
        {responses.length === 0 ? (
          <p className="page__lead" style={{ margin: 0 }}>Откликов нет.</p>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Студент</th>
                  <th>Специальность</th>
                  <th>Статус</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {responses.map((row) => {
                  const busy = actionId === row.id;
                  const name = `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim() || 'Студент';
                  return (
                    <tr key={row.id}>
                      <td>
                        {row.studentId ? (
                          <Link to={`/students/${row.studentId}`}>{name}</Link>
                        ) : name}
                      </td>
                      <td>{row.speciality || '—'}</td>
                      <td>
                        <StatusBadge variant={recruitmentResponseStatusVariant(row.status)}>
                          {labelOf(RECRUITMENT_RESPONSE_STATUS_LABELS, row.status)}
                        </StatusBadge>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          className="btn btn--primary btn--small"
                          disabled={busy || row.status === 'ACCEPTED'}
                          onClick={() => handleDecision(row.id, true)}
                        >
                          Принять
                        </button>
                        <button
                          type="button"
                          className="btn btn--danger btn--small"
                          style={{ marginLeft: '0.4rem' }}
                          disabled={busy || row.status === 'REJECTED'}
                          onClick={() => handleDecision(row.id, false)}
                        >
                          Отказать
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
