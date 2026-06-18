import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import * as vacanciesApi from '../api/vacancies.js';
import { useSkillsOptions, useSpecialityOptions } from '../hooks/useSkillsOptions.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { LoadingBlock } from '../components/ui/LoadingBlock.jsx';
import { FlashMessages } from '../components/ui/FlashMessages.jsx';
import { DateTimeField } from '../components/ui/DateTimeField.jsx';
import { DetailGrid } from '../components/ui/DetailGrid.jsx';
import { StatusBadge, vacancyStatusVariant } from '../components/ui/StatusBadge.jsx';
import { SkillPicker } from '../components/SkillPicker.jsx';
import { TextAreaWithToolbar } from '../components/TextAreaWithToolbar.jsx';
import {
  EMPLOYMENT_TYPE_LABELS,
  VACANCY_STATUS_LABELS,
  WORK_FORMAT_LABELS,
  labelOf,
} from '../lib/labels.js';
import { fmtDate } from '../lib/format.js';
import { getRecruiterDirectory } from '../lib/recruiterDirectory.js';
import { toApiDateTime } from '../utils/dateTimeApi.js';
import { formatRecruiterLabel } from '../utils/recruiterDisplay.js';

const PAGE_SIZE = 10;
const STATUSES = Object.keys(VACANCY_STATUS_LABELS);
const WORK_FORMATS = Object.keys(WORK_FORMAT_LABELS);
const EMPLOYMENT_TYPES = Object.keys(EMPLOYMENT_TYPE_LABELS);

const emptyCreateForm = () => ({
  useOnboarding: false,
  title: '',
  description: '',
  city: '',
  workFormat: 'REMOTE',
  employmentType: 'INTERNSHIP',
  specialityId: '',
  skillIds: [],
  publishedFrom: '',
  publishedTo: '',
  slotsCount: '',
  visibleToAnonymous: true,
  submitForReview: true,
  approveImmediately: false,
});

export function Vacancies() {
  const { isRecruiter } = useAuth();
  const [status, setStatus] = useState('');
  const [findString, setFindString] = useState('');
  const [recruiterId, setRecruiterId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [msg, setMsg] = useState(null);
  const [detailsToggling, setDetailsToggling] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [createPending, setCreatePending] = useState(false);
  const [recruitersById, setRecruitersById] = useState({});
  const { skillsOptions, error: skillsOptionsError } = useSkillsOptions(creating);
  const { specialityOptions, error: specialityOptionsError } = useSpecialityOptions(creating);
  const optionsError = skillsOptionsError || specialityOptionsError;

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      if (isRecruiter) {
        const { data: res } = await vacanciesApi.listMyVacancies(page, PAGE_SIZE);
        let rows = res?.data ?? (Array.isArray(res) ? res : []);
        if (status) rows = rows.filter((v) => v.status === status);
        const q = findString.trim().toLowerCase();
        if (q) {
          rows = rows.filter(
            (v) =>
              (v.title ?? '').toLowerCase().includes(q) ||
              (v.description ?? '').toLowerCase().includes(q)
          );
        }
        setData({
          ...res,
          data: rows,
          totalElements: res?.totalElements ?? rows.length,
          totalPages: res?.totalPages ?? 1,
          page: res?.page ?? page,
        });
      } else {
        const filter = {};
        if (status) filter.status = status;
        if (findString.trim()) filter.findString = findString.trim();
        if (recruiterId.trim()) filter.recruiterId = recruiterId.trim();
        if (companyName.trim()) filter.companyName = companyName.trim();
        const { data: res } = await vacanciesApi.filterVacanciesModeration(filter, page, PAGE_SIZE);
        setData(res);
      }
    } catch (e) {
      if (isRecruiter && e.status === 403) {
        setError(
          'Нет доступа к списку вакансий. Оформите профиль работодателя (GET /recruiter/me не должен возвращать 404).'
        );
      } else {
        setError(e.message);
      }
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [isRecruiter, status, findString, recruiterId, companyName, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isRecruiter) return;
    let cancelled = false;
    getRecruiterDirectory()
      .then((map) => {
        if (!cancelled) setRecruitersById(map);
      })
      .catch(() => {
        if (!cancelled) setRecruitersById({});
      });
    return () => {
      cancelled = true;
    };
  }, [isRecruiter]);

  function recruiterCell(recruiterId) {
    if (!recruiterId) return '—';
    const recruiter = recruitersById[recruiterId];
    return formatRecruiterLabel(recruiter, recruiterId);
  }

  function recruiterDetailValue(recruiterId) {
    if (!recruiterId) return '—';
    const recruiter = recruitersById[recruiterId];
    return (
      <span>
        <span>{formatRecruiterLabel(recruiter, recruiterId)}</span>
        <span className="cell-muted cell-mono" style={{ display: 'block', marginTop: '0.2rem', fontSize: '0.8rem' }}>
          {recruiterId}
        </span>
      </span>
    );
  }

  async function openDetails(id) {
    setSelectedId(id);
    setDetailsLoading(true);
    try {
      const getVacancy = isRecruiter ? vacanciesApi.getRecruiterVacancy : vacanciesApi.getVacancy;
      const { data } = await getVacancy(id);
      setDetails(data);
    } catch (e) {
      setDetails(null);
      setError(e.message);
    } finally {
      setDetailsLoading(false);
    }
  }

  async function handleSubmitForReview(id) {
    if (!window.confirm('Отправить вакансию на модерацию?')) return;
    setMsg(null);
    try {
      await vacanciesApi.submitRecruiterVacancyForReview(id);
      setMsg({ type: 'ok', text: 'Вакансия отправлена на модерацию' });
      if (selectedId === id) await openDetails(id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setMsg(null);
    setError(null);

    const title = createForm.title.trim();
    const description = createForm.description.trim();

    if (!title) {
      setMsg({ type: 'err', text: 'Укажите название вакансии' });
      return;
    }
    if (createForm.submitForReview && description.length < 20) {
      setMsg({
        type: 'err',
        text: 'Для отправки на модерацию описание должно быть не короче 20 символов',
      });
      return;
    }

    setCreatePending(true);
    try {
      const skillIds = createForm.skillIds
        .map((x) => Number(x))
        .filter((x) => Number.isInteger(x) && x > 0);

      const payload = {
        title,
        description: description || undefined,
        city: createForm.city.trim() || undefined,
        workFormat: createForm.workFormat || undefined,
        employmentType: createForm.employmentType || undefined,
        specialityId:
          createForm.specialityId !== '' ? Number(createForm.specialityId) : undefined,
        skillIds: skillIds.length ? skillIds : undefined,
        publishedFrom: toApiDateTime(createForm.publishedFrom),
        publishedTo: toApiDateTime(createForm.publishedTo),
        slotsCount:
          createForm.slotsCount !== '' && !Number.isNaN(Number(createForm.slotsCount))
            ? Number(createForm.slotsCount)
            : null,
        visibleToAnonymous: createForm.visibleToAnonymous,
      };

      const createCall = createForm.useOnboarding
        ? vacanciesApi.createOnboardingVacancy
        : vacanciesApi.createRecruiterVacancy;
      const { data: created } = await createCall(payload);
      const vacancyId = created?.id;
      if (!vacancyId) throw new Error('Не удалось получить ID созданной вакансии');

      let statusNote = 'черновик (DRAFT)';

      if (createForm.submitForReview) {
        await vacanciesApi.submitRecruiterVacancyForReview(vacancyId);
        statusNote = 'на модерации (PENDING_REVIEW)';
      }

      if (createForm.approveImmediately) {
        try {
          await vacanciesApi.approveVacancy(vacancyId);
          statusNote = 'опубликована (PUBLISHED)';
        } catch (approveErr) {
          setCreateForm(emptyCreateForm());
          setCreating(false);
          setStatus('PENDING_REVIEW');
          setPage(0);
          await load();
          await openDetails(vacancyId);
          setMsg({
            type: 'err',
            text:
              `${statusNote}. Публикация (approve) доступна только admin: ${approveErr.message}`,
          });
          return;
        }
      }

      setCreateForm(emptyCreateForm());
      setCreating(false);
      setMsg({ type: 'ok', text: `Вакансия создана — ${statusNote}` });
      setStatus(createForm.approveImmediately ? 'PUBLISHED' : createForm.submitForReview ? 'PENDING_REVIEW' : 'DRAFT');
      setPage(0);
      await load();
      await openDetails(vacancyId);
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    } finally {
      setCreatePending(false);
    }
  }

  async function handleApprove(id) {
    if (!window.confirm('Опубликовать вакансию?')) return;
    setMsg(null);
    try {
      await vacanciesApi.approveVacancy(id);
      setMsg({ type: 'ok', text: 'Вакансия опубликована' });
      if (selectedId === id) await openDetails(id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleReject(e) {
    e.preventDefault();
    if (!rejectId) return;
    setMsg(null);
    try {
      await vacanciesApi.rejectVacancy(rejectId, {
        moderationRejectionReason: rejectReason.trim() || undefined,
      });
      setRejectId(null);
      setRejectReason('');
      setMsg({ type: 'ok', text: 'Вакансия отклонена' });
      if (selectedId === rejectId) await openDetails(rejectId);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleArchiveVacancy(v) {
    const title = v.title?.trim() || v.id;
    if (
      !window.confirm(
        `Архивировать вакансию «${title}»? Она исчезнет с витрины, запись останется в системе.`
      )
    ) {
      return;
    }
    setMsg(null);
    setError(null);
    try {
      await vacanciesApi.archiveVacancy(v.id);
      setMsg({ type: 'ok', text: 'Вакансия архивирована' });
      if (selectedId === v.id) {
        setSelectedId(null);
        setDetails(null);
      }
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDeleteVacancy(v) {
    const title = v.title?.trim() || v.id;
    const message = isRecruiter
      ? `Удалить черновик «${title}» безвозвратно?`
      : `Удалить вакансию «${title}» безвозвратно? Действие нельзя отменить.`;
    if (!window.confirm(message)) return;
    setMsg(null);
    setError(null);
    try {
      if (isRecruiter) {
        await vacanciesApi.deleteRecruiterVacancy(v.id);
      } else {
        await vacanciesApi.adminDeleteVacancy(v.id);
      }
      setMsg({ type: 'ok', text: 'Вакансия удалена' });
      if (selectedId === v.id) {
        setSelectedId(null);
        setDetails(null);
      }
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  function canArchiveVacancy(v) {
    if (!v?.id) return false;
    return ['PENDING_REVIEW', 'PUBLISHED', 'CLOSED', 'REJECTED'].includes(v.status);
  }

  function canDeleteVacancy(v) {
    if (!v?.id) return false;
    if (isRecruiter) return v.status === 'DRAFT';
    return true;
  }

  async function handleVisibleToggle(v, checked) {
    setDetailsToggling(v.id);
    setError(null);
    try {
      await vacanciesApi.patchVacancyVitrina(v.id, { visibleToAnonymous: checked });
      if (selectedId === v.id && details) {
        setDetails({ ...details, visibleToAnonymous: checked });
      }
      setMsg({ type: 'ok', text: 'Настройки каталога обновлены' });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setDetailsToggling(null);
    }
  }

  const totalPages = data?.totalPages ?? 0;
  const rows = data?.data ?? [];

  return (
    <div className="page">
      <PageHeader
        title={isRecruiter ? 'Мои вакансии' : 'Модерация вакансий'}
        lead={
          isRecruiter
            ? 'Создавайте черновики и отправляйте на модерацию. Публикация — после одобрения администратором.'
            : 'Модерация и публикация вакансий. Создание — в сессии рекрутёра, одобрение — admin.'
        }
      />

      <div className="panel">
        <h2 className="panel__title">Создание вакансии</h2>
        {!isRecruiter ? (
          <div className="alert alert--warning" style={{ marginBottom: '1rem' }}>
            Шаги 1–3 работают только при входе как <strong>рекрутёр</strong> (не admin):{' '}
            <code>POST /vacancies</code> → <code>submit-for-review</code>. Шаг 4 (публикация) — под
            admin: <code>POST /admin/vacancies/&#123;id&#125;/approve</code>. Без approve вакансия не
            видна студентам.
          </div>
        ) : null}
        {optionsError ? <div className="alert alert--error">{optionsError}</div> : null}
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => setCreating((v) => !v)}
          style={{ marginBottom: creating ? '1rem' : 0 }}
        >
          {creating ? 'Скрыть форму' : 'Создать вакансию'}
        </button>
        {creating ? (
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="field" style={{ minWidth: 220, flex: 1 }}>
                <label htmlFor="vac-create-title">Название</label>
                <input
                  id="vac-create-title"
                  required
                  maxLength={255}
                  value={createForm.title}
                  onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Java Intern"
                />
              </div>
              <div className="field">
                <label htmlFor="vac-create-city">Город</label>
                <input
                  id="vac-create-city"
                  value={createForm.city}
                  onChange={(e) => setCreateForm((p) => ({ ...p, city: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label htmlFor="vac-create-format">Формат работы</label>
                <select
                  id="vac-create-format"
                  value={createForm.workFormat}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, workFormat: e.target.value }))
                  }
                >
                  {WORK_FORMATS.map((v) => (
                    <option key={v} value={v}>
                      {labelOf(WORK_FORMAT_LABELS, v, v)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="vac-create-employment">Тип занятости</label>
                <select
                  id="vac-create-employment"
                  value={createForm.employmentType}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, employmentType: e.target.value }))
                  }
                >
                  {EMPLOYMENT_TYPES.map((v) => (
                    <option key={v} value={v}>
                      {labelOf(EMPLOYMENT_TYPE_LABELS, v, v)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="vac-create-speciality">Специальность</label>
                <select
                  id="vac-create-speciality"
                  value={createForm.specialityId}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, specialityId: e.target.value }))
                  }
                >
                  <option value="">Не выбрано</option>
                  {specialityOptions.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="vac-create-slots">Лимит откликов</label>
                <input
                  id="vac-create-slots"
                  type="number"
                  min={1}
                  placeholder="Пусто — без лимита"
                  value={createForm.slotsCount}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, slotsCount: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="field skill-picker-field">
              <label>Навыки</label>
              <SkillPicker
                options={skillsOptions}
                selectedIds={createForm.skillIds}
                onChange={(ids) => setCreateForm((p) => ({ ...p, skillIds: ids }))}
              />
            </div>
            <div className="field" style={{ marginBottom: '1rem' }}>
              <TextAreaWithToolbar
                label="Описание"
                id="vac-create-description"
                rows={5}
                value={createForm.description}
                onChange={(v) => setCreateForm((p) => ({ ...p, description: v }))}
                hint="Минимум 20 символов, если отправляете на модерацию."
              />
            </div>
            <div className="form-row">
              <DateTimeField
                id="vac-create-from"
                label="Публикация с"
                value={createForm.publishedFrom}
                onChange={(v) => setCreateForm((p) => ({ ...p, publishedFrom: v }))}
                hint="Сначала дата в календаре, затем время"
              />
              <DateTimeField
                id="vac-create-to"
                label="Публикация до"
                value={createForm.publishedTo}
                onChange={(v) => setCreateForm((p) => ({ ...p, publishedTo: v }))}
              />
            </div>
            <div className="form-row" style={{ marginTop: '0.5rem' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={createForm.useOnboarding}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, useOnboarding: e.target.checked }))
                  }
                />
                Первая вакансия (onboarding API)
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={createForm.visibleToAnonymous}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, visibleToAnonymous: e.target.checked }))
                  }
                />
                Видна в каталоге после входа
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={createForm.submitForReview}
                  onChange={(e) =>
                    setCreateForm((p) => ({
                      ...p,
                      submitForReview: e.target.checked,
                      approveImmediately: e.target.checked ? p.approveImmediately : false,
                    }))
                  }
                />
                Отправить на модерацию
              </label>
              {!isRecruiter ? (
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={createForm.approveImmediately}
                    disabled={!createForm.submitForReview}
                    onChange={(e) =>
                      setCreateForm((p) => ({ ...p, approveImmediately: e.target.checked }))
                    }
                  />
                  Опубликовать сразу (только admin, шаг 4)
                </label>
              ) : null}
            </div>
            <div className="form-row" style={{ marginTop: '1rem' }}>
              <button type="submit" className="btn btn--primary" disabled={createPending}>
                {createPending ? 'Создание…' : 'Создать вакансию'}
              </button>
            </div>
          </form>
        ) : null}
      </div>

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
              <label htmlFor="vac-status">Статус</label>
              <select
                id="vac-status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">Все</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {labelOf(VACANCY_STATUS_LABELS, s, s)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="vac-find">Поиск</label>
              <input
                id="vac-find"
                value={findString}
                onChange={(e) => setFindString(e.target.value)}
                placeholder="Заголовок, описание…"
              />
            </div>
            {!isRecruiter ? (
              <>
                <div className="field">
                  <label htmlFor="vac-rec">UUID рекрутера</label>
                  <input
                    id="vac-rec"
                    value={recruiterId}
                    onChange={(e) => setRecruiterId(e.target.value)}
                    placeholder="необязательно"
                  />
                </div>
                <div className="field">
                  <label htmlFor="vac-co">Компания</label>
                  <input
                    id="vac-co"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="необязательно"
                  />
                </div>
              </>
            ) : null}
            <button type="submit" className="btn btn--primary">
              Применить
            </button>
          </div>
        </form>
      </div>

      <FlashMessages
        success={msg?.type === 'ok' ? msg.text : null}
        error={msg?.type === 'err' ? msg.text : error}
      />

      <div className="panel">
        <h2 className="panel__title">{isRecruiter ? 'Список' : 'Список вакансий'}</h2>
        {!isRecruiter && !status ? (
          <p className="page__lead" style={{ marginTop: 0 }}>
            По умолчанию показаны все статусы, включая опубликованные на сайте. Для очереди модерации
            выберите «На модерации».
          </p>
        ) : null}
        {loading ? (
          <LoadingBlock />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Название</th>
                    {!isRecruiter ? <th>Рекрутер</th> : null}
                    <th>Компания</th>
                    <th>Город</th>
                    <th>Статус</th>
                    <th>Подана</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((v) => (
                    <tr key={v.id}>
                      <td>{v.title}</td>
                      {!isRecruiter ? <td>{recruiterCell(v.recruiterId)}</td> : null}
                      <td>{v.companyName ?? '—'}</td>
                      <td>{v.city ?? '—'}</td>
                      <td>
                        <StatusBadge variant={vacancyStatusVariant(v.status)}>
                          {labelOf(VACANCY_STATUS_LABELS, v.status, v.status)}
                        </StatusBadge>
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>
                        {fmtDate(v.submittedForReviewAt ?? v.createdAt)}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          className="btn btn--ghost"
                          onClick={() => openDetails(v.id)}
                        >
                          Открыть
                        </button>
                        {isRecruiter && (v.status === 'DRAFT' || v.status === 'REJECTED') ? (
                          <button
                            type="button"
                            className="btn btn--primary"
                            style={{ marginLeft: '0.5rem' }}
                            onClick={() => handleSubmitForReview(v.id)}
                          >
                            На модерацию
                          </button>
                        ) : null}
                        {!isRecruiter && v.status === 'PENDING_REVIEW' ? (
                          <>
                            <button
                              type="button"
                              className="btn btn--primary"
                              style={{ marginLeft: '0.5rem' }}
                              onClick={() => handleApprove(v.id)}
                            >
                              Одобрить
                            </button>
                            <button
                              type="button"
                              className="btn btn--danger"
                              style={{ marginLeft: '0.5rem' }}
                              onClick={() => {
                                setRejectId(v.id);
                                setRejectReason('');
                              }}
                            >
                              Отклонить
                            </button>
                          </>
                        ) : null}
                        {canArchiveVacancy(v) ? (
                          <button
                            type="button"
                            className="btn btn--ghost"
                            style={{ marginLeft: '0.5rem' }}
                            onClick={() => handleArchiveVacancy(v)}
                          >
                            Архивировать
                          </button>
                        ) : null}
                        {canDeleteVacancy(v) ? (
                          <button
                            type="button"
                            className="btn btn--danger"
                            style={{ marginLeft: '0.5rem' }}
                            onClick={() => handleDeleteVacancy(v)}
                          >
                            Удалить
                          </button>
                        ) : null}
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

      {selectedId ? (
        <div className="panel">
          <h2 className="panel__title">Карточка вакансии</h2>
          {detailsLoading ? (
            <LoadingBlock />
          ) : details ? (
            <>
            <DetailGrid
              items={[
                { label: 'ID', value: <span className="cell-mono">{details.id}</span> },
                { label: 'Рекрутер', value: recruiterDetailValue(details.recruiterId) },
                {
                  label: 'Статус',
                  value: (
                    <StatusBadge variant={vacancyStatusVariant(details.status)}>
                      {labelOf(VACANCY_STATUS_LABELS, details.status, details.status)}
                    </StatusBadge>
                  ),
                },
                { label: 'Описание', value: <span style={{ whiteSpace: 'pre-wrap' }}>{details.description ?? '—'}</span> },
                { label: 'Формат работы', value: details.workFormat },
                { label: 'Занятость', value: details.employmentType },
                { label: 'Навыки', value: (details.skills ?? []).map((s) => s.name).join(', ') || '—' },
                { label: 'Откликов', value: details.applicationsCount ?? 0 },
                {
                  label: 'В каталоге после входа',
                  value: isRecruiter ? (
                    details.visibleToAnonymous ? 'да' : 'нет'
                  ) : (
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <input
                        type="checkbox"
                        checked={!!details.visibleToAnonymous}
                        disabled={detailsToggling === details.id || details.status !== 'PUBLISHED'}
                        onChange={(e) => handleVisibleToggle(details, e.target.checked)}
                      />
                      {details.visibleToAnonymous ? 'да' : 'нет'}
                    </label>
                  ),
                },
                ...(details.moderationRejectionReason
                  ? [{ label: 'Причина отклонения', value: details.moderationRejectionReason }]
                  : []),
              ]}
            />
            {(canArchiveVacancy(details) || canDeleteVacancy(details)) ? (
              <div className="form-row" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {canArchiveVacancy(details) ? (
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => handleArchiveVacancy(details)}
                  >
                    Архивировать
                  </button>
                ) : null}
                {canDeleteVacancy(details) ? (
                  <button
                    type="button"
                    className="btn btn--danger"
                    onClick={() => handleDeleteVacancy(details)}
                  >
                    Удалить безвозвратно
                  </button>
                ) : null}
              </div>
            ) : null}
            </>
          ) : (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Нет данных</p>
          )}
        </div>
      ) : null}

      {!isRecruiter && rejectId ? (
        <div className="panel">
          <h2 className="panel__title">Отклонение вакансии</h2>
          <form onSubmit={handleReject}>
            <div className="field">
              <label htmlFor="vac-reject">Причина (необязательно)</label>
              <textarea
                id="vac-reject"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div className="form-row" style={{ marginTop: '0.75rem' }}>
              <button type="submit" className="btn btn--danger">
                Подтвердить отклонение
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setRejectId(null)}
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
