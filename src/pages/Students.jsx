import { useCallback, useEffect, useState } from 'react';
import { useEffectWithAbort } from '../hooks/useEffectWithAbort.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { Link, useNavigate } from 'react-router-dom';
import * as studentsApi from '../api/students.js';
import * as requestsApi from '../api/requests.js';
import * as portfolioApi from '../api/portfolio.js';
import * as experienceApi from '../api/experience.js';
import * as institutionApi from '../api/institutions.js';
import * as accountApi from '../api/accountApprovals.js';
import { getSkillsOptions, getSpecialityOptions } from '../lib/referenceCache.js';
import { AccountRejectForm } from '../components/AccountRejectForm.jsx';
import { SkillPicker } from '../components/SkillPicker.jsx';
import { TextAreaWithToolbar } from '../components/TextAreaWithToolbar.jsx';
import {
  contactFieldsFromStudentDto,
  contactFieldsToApiPayload,
} from '../utils/studentContact.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { DateField } from '../components/ui/DateTimeField.jsx';
import { ApiPhoto } from '../components/ui/ApiPhoto.jsx';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';
import { ACCOUNT_STATUS_LABELS, labelOf } from '../lib/labels.js';
import {
  accountStatusVariant,
  isPendingApproval,
  studentAccountStatus,
  studentEmailVerified,
  studentUserId,
} from '../lib/studentAccount.js';

const PAGE_SIZES = [10, 25, 50, 100, 200];

const SORT_FIELDS = {
  name: 'LAST_NAME',
  email: 'EMAIL',
  course: 'COURSE',
  status: 'ACCOUNT_STATUS',
};

function SortHeader({ label, sortKey, sort, onSort }) {
  const active = sort.key === sortKey;
  const mark = active ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : '';
  return (
    <button type="button" className="th-sort" onClick={() => onSort(sortKey)}>
      {label}
      {mark}
    </button>
  );
}

function studentDisplayName(student) {
  const name = `${student?.firstName ?? ''} ${student?.lastName ?? ''}`.trim();
  return name || 'студент';
}

function studentEmail(student) {
  return contactFieldsFromStudentDto(student).email;
}

export function Students() {
  const navigate = useNavigate();
  const [findString, setFindString] = useState('');
  const debouncedFindString = useDebouncedValue(findString);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[1]);
  const [sort, setSort] = useState({ key: null, dir: 'asc' });
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState(null);
  const [skillsOptions, setSkillsOptions] = useState([]);
  const [specialityOptions, setSpecialityOptions] = useState([]);
  const [optionsError, setOptionsError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState(null);
  const [pendingByStudentId, setPendingByStudentId] = useState(() => new Map());
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [approvalMsg, setApprovalMsg] = useState(null);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    city: '',
    hhLink: '',
    birthDate: '',
    bio: '',
    course: 'NEW',
    busyness: 'FREE',
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    email: '',
    phoneNumber: '',
    telegramUsername: '',
    specialityId: '',
    skillsIds: [],
    portfolioRows: [],
    experienceRows: [],
    institutionRows: [],
    educationRows: [],
  });

  const loadPending = useCallback(async (isActive = () => true) => {
    try {
      const pending = await accountApi.loadPendingStudentApprovals();
      if (isActive()) setPendingByStudentId(pending);
    } catch {
      if (isActive()) setPendingByStudentId(new Map());
    }
  }, []);

  const load = useCallback(async (isActive = () => true) => {
    if (isActive()) {
      setError(null);
      setLoading(true);
    }
    try {
      const filter = {};
      if (debouncedFindString.trim()) filter.findString = debouncedFindString.trim();
      if (sort.key && SORT_FIELDS[sort.key]) {
        filter.useDefaultRanking = false;
        filter.sortBy = SORT_FIELDS[sort.key];
        filter.sortDirection = sort.dir === 'asc' ? 'ASC' : 'DESC';
      }
      const { data: res } = await studentsApi.filterStudents(filter, page, pageSize);
      if (isActive()) setData(res);
    } catch (e) {
      if (isActive()) {
        setError(e.message);
        setData(null);
      }
    } finally {
      if (isActive()) setLoading(false);
    }
  }, [debouncedFindString, page, pageSize, sort]);

  useEffectWithAbort((_signal, isActive) => load(isActive), [load]);
  useEffectWithAbort((_signal, isActive) => loadPending(isActive), [loadPending]);

  async function cascadeDeleteStudent(studentId) {
    const sid = String(studentId);
    const safeList = (res) => {
      const v = res?.data?.data ?? res?.data ?? [];
      return Array.isArray(v) ? v : [];
    };

    async function deleteAllByFilter(filterFn, deleteFn, filter) {
      for (let i = 0; i < 10; i += 1) {
        const { data } = await filterFn(filter, 0, 200);
        const rows = safeList({ data });
        if (!rows.length) return;
        for (const r of rows) {
          const rid =
            (r && typeof r === 'object' && 'id' in r ? r.id : r) ??
            (r && typeof r === 'object' && r.id ? r.id : null);

          const idStr = rid == null ? '' : String(rid).trim();
          if (!idStr || idStr.toLowerCase() === 'nan' || idStr === '[object Object]') continue;
          await deleteFn(idStr);
        }
      }
    }

    await deleteAllByFilter(requestsApi.filterRequests, requestsApi.deleteRequest, { studentId: sid });
    await deleteAllByFilter(portfolioApi.filterPortfolio, portfolioApi.deletePortfolio, { studentId: sid });
    await deleteAllByFilter(experienceApi.filterExperience, experienceApi.deleteExperience, { studentId: sid });
    await deleteAllByFilter(institutionApi.filterInstitutions, institutionApi.deleteInstitution, { studentId: sid });
  }

  async function handleDelete(student) {
    const id = student?.id;
    if (id == null) return;
    const name = studentDisplayName(student);
    const email = studentEmail(student);
    const label = email ? `«${name}» (${email})` : `«${name}»`;
    if (!window.confirm(`Удалить ${label}? Действие нельзя отменить.`)) return;

    setDeletingId(id);
    setError(null);
    setDeleteStatus(null);
    try {
      await studentsApi.deleteStudent(id);
      await load();
      await loadPending();
    } catch (e) {
      const msg = String(e?.message ?? '');
      if (msg.includes('409') || msg.toLowerCase().includes('conflict')) {
        try {
          setDeleteStatus('Удаляем связанные данные (заявки, портфолио, опыт)…');
          await cascadeDeleteStudent(id);
          await studentsApi.deleteStudent(id);
          setDeleteStatus(null);
          await load();
          await loadPending();
          return;
        } catch (e2) {
          setDeleteStatus(null);
          setError(e2.message);
          return;
        }
      }
      setError(msg || 'Ошибка удаления');
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    if (!creating) return;

    let cancelled = false;
    async function loadOptions() {
      setOptionsError(null);
      try {
        const [skillsList, specList] = await Promise.all([
          getSkillsOptions(),
          getSpecialityOptions(),
        ]);
        if (!cancelled) {
          setSkillsOptions(skillsList);
          setSpecialityOptions(specList);
        }
      } catch (e) {
        if (!cancelled) setOptionsError(e.message);
      }
    }

    loadOptions();
    return () => {
      cancelled = true;
    };
  }, [creating]);

  function extractCreatedStudentId(data) {
    if (data == null) return null;
    if (typeof data === 'object' && 'id' in data && data.id != null) {
      const raw = data.id;
      if (typeof raw === 'number' && Number.isInteger(raw)) return String(raw);
      const s = String(raw).trim();
      if (!s) return null;
      if (s.toLowerCase() === 'nan') return null;
      return s;
    }
    if (typeof data === 'number' && Number.isInteger(data)) return String(data);
    if (typeof data === 'string' && data.trim()) return data.trim();
    return null;
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreateMsg(null);
    try {
      const skillsIds = createForm.skillsIds
        .map((x) => Number(x))
        .filter((x) => Number.isInteger(x) && x >= 0);
      if (!skillsIds.length) {
        throw new Error('Укажите хотя бы один навык');
      }
      const login = createForm.username.trim();
      const pass = createForm.password;
      if (!login || login.length < 3) {
        throw new Error('Укажите логин (минимум 3 символа)');
      }
      if (!pass || pass.length < 8) {
        throw new Error('Укажите пароль (минимум 12 символов)');
      }
      if (createForm.specialityId === '') {
        throw new Error('Выберите специальность');
      }

      const payload = {
        city: createForm.city || undefined,
        hhLink: createForm.hhLink || undefined,
        birthDate: createForm.birthDate,
        bio: createForm.bio || undefined,
        course: createForm.course,
        busyness: createForm.busyness,
        firstName: createForm.firstName.trim(),
        lastName: createForm.lastName.trim(),
        username: login,
        password: pass,
        ...contactFieldsToApiPayload(createForm),
        specialityId: Number(createForm.specialityId),
        skillsIds,
      };

      const { data: resData } = await studentsApi.createStudent(payload);
      const newId = extractCreatedStudentId(resData);
      if (newId == null) throw new Error('Не удалось получить ID созданного студента');
      setCreateMsg({ type: 'ok', text: 'Студент создан. Открываю карточку…' });

      setCreateForm({
        city: '',
        hhLink: '',
        birthDate: '',
        bio: '',
        course: 'NEW',
        busyness: 'FREE',
        firstName: '',
        lastName: '',
        username: '',
        password: '',
        email: '',
        phoneNumber: '',
        telegramUsername: '',
        specialityId: '',
        skillsIds: [],
        portfolioRows: [],
        experienceRows: [],
        institutionRows: [],
        educationRows: [],
      });
      setPage(0);
      await load();
      navigate(`/students/${newId}`);
    } catch (e) {
      setCreateMsg({ type: 'err', text: e.message });
    }
  }

  const totalPages = data?.totalPages ?? 0;
  const rows = data?.data ?? [];

  function rowMeta(student) {
    const status = studentAccountStatus(student, pendingByStudentId);
    const userId = studentUserId(student, pendingByStudentId);
    const selectable = Boolean(userId) && isPendingApproval(status);
    const emailVerified = studentEmailVerified(student, pendingByStudentId);
    return { status, userId, selectable, emailVerified };
  }

  const selectableRows = rows.filter((s) => rowMeta(s).selectable);
  const selectedOnPage = selectableRows.filter((s) => selectedIds.has(String(s.id)));
  const allSelectableChecked =
    selectableRows.length > 0 && selectedOnPage.length === selectableRows.length;

  function toggleSelected(studentId, checked) {
    const key = String(studentId);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  function toggleSelectAllOnPage(checked) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const s of selectableRows) {
        const key = String(s.id);
        if (checked) next.add(key);
        else next.delete(key);
      }
      return next;
    });
  }

  function selectedPendingTargets() {
    return rows
      .filter((s) => selectedIds.has(String(s.id)))
      .map((s) => ({ student: s, ...rowMeta(s) }))
      .filter((item) => item.selectable);
  }

  function handleSort(key) {
    setSort((prev) => {
      if (prev.key === key) {
        return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
      }
      return { key, dir: 'asc' };
    });
    setPage(0);
  }

  async function handleEmailVerified(userId, emailVerified) {
    if (!userId) return;
    setApprovalLoading(true);
    setApprovalMsg(null);
    try {
      await accountApi.setAccountEmailVerified(userId, emailVerified);
      setApprovalMsg({
        type: 'ok',
        text: emailVerified ? 'Почта подтверждена' : 'Подтверждение почты снято',
      });
      await loadPending();
    } catch (e) {
      setApprovalMsg({ type: 'err', text: e.message });
    } finally {
      setApprovalLoading(false);
    }
  }

  async function handleApproveOne(studentId, userId) {
    if (!userId) return;
    if (!window.confirm('Одобрить учётную запись?')) return;
    setApprovalLoading(true);
    setApprovalMsg(null);
    try {
      await accountApi.approveAccount(userId);
      setApprovalMsg({ type: 'ok', text: 'Аккаунт одобрен' });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(String(studentId));
        return next;
      });
      await loadPending();
      await load();
    } catch (e) {
      setApprovalMsg({ type: 'err', text: e.message });
    } finally {
      setApprovalLoading(false);
    }
  }

  async function handleBulkApprove() {
    const targets = selectedPendingTargets();
    if (!targets.length) return;
    if (!window.confirm(`Одобрить выбранные аккаунты (${targets.length})?`)) return;
    setApprovalLoading(true);
    setApprovalMsg(null);
    try {
      for (const item of targets) {
        await accountApi.approveAccount(item.userId);
      }
      setApprovalMsg({ type: 'ok', text: `Одобрено: ${targets.length}` });
      setSelectedIds(new Set());
      await loadPending();
      await load();
    } catch (e) {
      setApprovalMsg({ type: 'err', text: e.message });
    } finally {
      setApprovalLoading(false);
    }
  }

  function openBulkReject() {
    if (!selectedPendingTargets().length) return;
    setApprovalMsg(null);
    setRejectOpen(true);
  }

  async function handleBulkReject(body) {
    const targets = selectedPendingTargets();
    if (!targets.length) return;
    setApprovalLoading(true);
    setApprovalMsg(null);
    try {
      for (const item of targets) {
        await accountApi.rejectAccount(item.userId, body);
      }
      setApprovalMsg({ type: 'ok', text: `Отклонено: ${targets.length}` });
      setSelectedIds(new Set());
      setRejectOpen(false);
      await loadPending();
      await load();
    } catch (e) {
      setApprovalMsg({ type: 'err', text: e.message });
    } finally {
      setApprovalLoading(false);
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Студенты"
        lead="Карточка резюме создаётся вместе с учётной записью (логин и пароль обязательны)."
      >
        <button
          type="button"
          className="btn btn--ghost btn--small"
          onClick={() => setCreating((v) => !v)}
        >
          {creating ? 'Скрыть форму' : 'Создать студента'}
        </button>
      </PageHeader>

      {creating ? (
        <div className="panel">
          {createMsg?.type === 'ok' ? (
            <div className="alert alert--success">{createMsg.text}</div>
          ) : null}
          {createMsg?.type === 'err' ? (
            <div className="alert alert--error">{createMsg.text}</div>
          ) : null}
          {optionsError ? <div className="alert alert--error">{optionsError}</div> : null}
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="field">
                <label>Имя</label>
                <input
                  required
                  value={createForm.firstName}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, firstName: e.target.value }))
                  }
                />
              </div>
              <div className="field">
                <label>Фамилия</label>
                <input
                  required
                  value={createForm.lastName}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, lastName: e.target.value }))
                  }
                />
              </div>
              <div className="field">
                <label>Логин</label>
                <input
                  required
                  minLength={3}
                  autoComplete="off"
                  value={createForm.username}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, username: e.target.value.replace(/\s/g, '') }))
                  }
                  placeholder="latin_letters_123"
                />
              </div>
              <div className="field">
                <label>Пароль</label>
                <input
                  required
                  type="password"
                  minLength={12}
                  autoComplete="new-password"
                  value={createForm.password}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, password: e.target.value }))
                  }
                />
              </div>
              <DateField
                id="student-birth-date"
                label="Дата рождения"
                value={createForm.birthDate}
                required
                max={new Date().toISOString().slice(0, 10)}
                onChange={(v) => setCreateForm((p) => ({ ...p, birthDate: v }))}
              />
            </div>
            <div className="form-row">
              <div className="field">
                <label>Курс</label>
                <select
                  value={createForm.course}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, course: e.target.value }))
                  }
                >
                  <option value="NEW">NEW</option>
                  <option value="FIRST">FIRST</option>
                  <option value="SECOND">SECOND</option>
                  <option value="THIRD">THIRD</option>
                  <option value="FOURTH">FOURTH</option>
                </select>
              </div>
              <div className="field">
                <label>Занятость</label>
                <select
                  value={createForm.busyness}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, busyness: e.target.value }))
                  }
                >
                  <option value="FREE">FREE</option>
                  <option value="FREELANCE">FREELANCE</option>
                  <option value="EMPLOYED">EMPLOYED</option>
                </select>
              </div>
              <div className="field">
                <label>Специальность</label>
                <select
                  value={createForm.specialityId}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, specialityId: e.target.value }))
                  }
                  required
                >
                  <option value="">Не выбрано</option>
                  {specialityOptions.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field skill-picker-field">
              <label>Навыки</label>
              <SkillPicker
                options={skillsOptions}
                selectedIds={createForm.skillsIds}
                onChange={(ids) =>
                  setCreateForm((p) => ({ ...p, skillsIds: ids }))
                }
              />
            </div>
            <div className="form-row">
              <div className="field">
                <label>Город</label>
                <input
                  value={createForm.city}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, city: e.target.value }))
                  }
                />
              </div>
              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, email: e.target.value }))
                  }
                />
              </div>
              <div className="field">
                <label>Телефон</label>
                <input
                  value={createForm.phoneNumber}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, phoneNumber: e.target.value }))
                  }
                />
              </div>
              <div className="field">
                <label>Telegram username</label>
                <input
                  value={createForm.telegramUsername}
                  onChange={(e) =>
                    setCreateForm((p) => ({
                      ...p,
                      telegramUsername: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="form-row">
              <div className="field" style={{ minWidth: 300, flex: 1 }}>
                <label>HH link</label>
                <input
                  value={createForm.hhLink}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, hhLink: e.target.value }))
                  }
                />
              </div>
              <div className="field" style={{ minWidth: 300, flex: 1 }}>
                <TextAreaWithToolbar
                  label="Bio"
                  id="create-student-bio"
                  rows={4}
                  value={createForm.bio}
                  onChange={(v) => setCreateForm((p) => ({ ...p, bio: v }))}
                  hint="Жирный и списки — кнопками; сохраняется как текст с Markdown, если используете разметку."
                />
              </div>
            </div>
            <p className="page__lead" style={{ marginTop: '0.75rem' }}>
              Портфолио / опыт / образование добавляются после создания — на странице студента.
            </p>
            <div className="form-row" style={{ marginTop: '1rem' }}>
              <button type="submit" className="btn btn--primary">
                Создать студента
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="panel">
        <h2 className="panel__title">Поиск</h2>
        <form
          className="form-row"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(0);
            load();
          }}
        >
          <div className="field">
            <label htmlFor="sfind">Строка поиска (ФИО, email)</label>
            <input
              id="sfind"
              value={findString}
              onChange={(e) => {
                setFindString(e.target.value);
                setPage(0);
              }}
              placeholder="ФИО или email"
            />
          </div>
          <button type="submit" className="btn btn--primary">
            Применить
          </button>
        </form>
      </div>

      {error ? <div className="alert alert--error">{error}</div> : null}
      {deleteStatus ? <div className="alert">{deleteStatus}</div> : null}
      {approvalMsg?.type === 'ok' ? <div className="alert alert--success">{approvalMsg.text}</div> : null}
      {approvalMsg?.type === 'err' ? <div className="alert alert--error">{approvalMsg.text}</div> : null}

      <div className="panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <h2 className="panel__title" style={{ margin: 0 }}>Карточки</h2>
          <div className="form-row" style={{ margin: 0 }}>
            <button
              type="button"
              className="btn btn--primary btn--small"
              disabled={approvalLoading || selectedOnPage.length === 0}
              onClick={handleBulkApprove}
            >
              Одобрить выбранных
            </button>
            <button
              type="button"
              className="btn btn--danger btn--small"
              disabled={approvalLoading || selectedOnPage.length === 0}
              onClick={openBulkReject}
            >
              Отклонить выбранных
            </button>
          </div>
        </div>
        {rejectOpen ? (
          <AccountRejectForm
            title={`Отклонение выбранных (${selectedOnPage.length})`}
            submitting={approvalLoading}
            onSubmit={handleBulkReject}
            onCancel={() => setRejectOpen(false)}
          />
        ) : null}
        {loading ? (
          <p style={{ color: 'var(--text-muted)', margin: '0.75rem 0 0' }}>Загрузка…</p>
        ) : (
          <>
            <div className="table-wrap" style={{ marginTop: '0.75rem' }}>
              <table className="data">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>
                      <input
                        type="checkbox"
                        checked={allSelectableChecked}
                        disabled={!selectableRows.length || approvalLoading}
                        onChange={(e) => toggleSelectAllOnPage(e.target.checked)}
                        aria-label="Выбрать всех на модерации"
                      />
                    </th>
                    <th />
                    <th>
                      <SortHeader label="ФИО" sortKey="name" sort={sort} onSort={handleSort} />
                    </th>
                    <th>
                      <SortHeader label="Email" sortKey="email" sort={sort} onSort={handleSort} />
                    </th>
                    <th>Специальность</th>
                    <th>
                      <SortHeader label="Курс" sortKey="course" sort={sort} onSort={handleSort} />
                    </th>
                    <th>
                      <SortHeader label="Статус" sortKey="status" sort={sort} onSort={handleSort} />
                    </th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => {
                    const email = studentEmail(s);
                    const isDeleting = deletingId === s.id;
                    const meta = rowMeta(s);
                    const checked = selectedIds.has(String(s.id));
                    return (
                      <tr key={s.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={meta.selectable && checked}
                            disabled={!meta.selectable || approvalLoading}
                            onChange={(e) => toggleSelected(s.id, e.target.checked)}
                            aria-label={`Выбрать ${studentDisplayName(s)}`}
                          />
                        </td>
                        <td style={{ width: 48 }}>
                          {s.imagePath ? (
                            <ApiPhoto imagePath={s.imagePath} className="avatar" />
                          ) : (
                            <span className="avatar avatar--placeholder">
                              {(s.firstName?.[0] ?? '?').toUpperCase()}
                            </span>
                          )}
                        </td>
                        <td>
                          {s.firstName} {s.lastName}
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>{email || '—'}</td>
                        <td>{s.speciality}</td>
                        <td>{s.course}</td>
                        <td>
                          <StatusBadge variant={accountStatusVariant(meta.status)}>
                            {labelOf(ACCOUNT_STATUS_LABELS, meta.status, meta.status)}
                          </StatusBadge>
                        </td>
                        <td>
                          <div className="table-actions">
                          {meta.selectable && meta.emailVerified === false ? (
                            <button
                              type="button"
                              className="btn btn--ghost btn--small"
                              disabled={approvalLoading || deletingId != null}
                              onClick={() => handleEmailVerified(meta.userId, true)}
                            >
                              Подтвердить почту
                            </button>
                          ) : null}
                          {meta.selectable && meta.emailVerified === true ? (
                            <button
                              type="button"
                              className="btn btn--ghost btn--small"
                              disabled={approvalLoading || deletingId != null}
                              onClick={() => handleEmailVerified(meta.userId, false)}
                            >
                              Снять подтверждение
                            </button>
                          ) : null}
                          {meta.selectable ? (
                            <button
                              type="button"
                              className="btn btn--primary btn--small"
                              disabled={approvalLoading || deletingId != null}
                              onClick={() => handleApproveOne(s.id, meta.userId)}
                            >
                              Одобрить
                            </button>
                          ) : null}
                          <Link
                            className="btn btn--ghost"
                            to={`/students/${s.id}`}
                            style={{ textDecoration: 'none' }}
                          >
                            Открыть
                          </Link>
                          <button
                            type="button"
                            className="btn btn--danger"
                            disabled={isDeleting || deletingId != null}
                            onClick={() => handleDelete(s)}
                          >
                            {isDeleting ? 'Удаление…' : 'Удалить'}
                          </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="pager">
              <span>
                Стр. {data ? data.page + 1 : 1} из {Math.max(totalPages, 1)} · всего{' '}
                {data?.totalElements ?? 0}
              </span>
              <label className="pager__size">
                На странице
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(0);
                  }}
                >
                  {PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
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
    </div>
  );
}
