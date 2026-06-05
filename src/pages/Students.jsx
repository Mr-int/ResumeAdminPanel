import { useCallback, useEffect, useState } from 'react';
import { useEffectWithAbort } from '../hooks/useEffectWithAbort.js';
import { Link, useNavigate } from 'react-router-dom';
import * as studentsApi from '../api/students.js';
import * as requestsApi from '../api/requests.js';
import * as portfolioApi from '../api/portfolio.js';
import * as experienceApi from '../api/experience.js';
import * as institutionApi from '../api/institutions.js';
import * as educationApi from '../api/education.js';
import * as skillsApi from '../api/skills.js';
import * as specialitiesApi from '../api/specialities.js';
import { API_BASE } from '../config.js';
import { SkillPicker } from '../components/SkillPicker.jsx';
import { contactFieldsToApiPayload } from '../utils/studentContact.js';
import { TextAreaWithToolbar } from '../components/TextAreaWithToolbar.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { SortableTable } from '../components/SortableTable.jsx';
import * as studentsAdminApi from '../api/studentsAdmin.js';

const PAGE_SIZE = 12;

function avatarUrl(imagePath) {
  if (!imagePath) return null;
  return `${API_BASE}/main/photo/${encodeURIComponent(imagePath)}`;
}

export function Students() {
  const navigate = useNavigate();
  const [findString, setFindString] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState(null);
  const [skillsOptions, setSkillsOptions] = useState([]);
  const [specialityOptions, setSpecialityOptions] = useState([]);
  const [optionsError, setOptionsError] = useState(null);
  const [createdStudent, setCreatedStudent] = useState(null);
  const [orderRows, setOrderRows] = useState([]);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderReordering, setOrderReordering] = useState(false);
  const [orderMsg, setOrderMsg] = useState(null);
  // Доп. блоки (портфолио/опыт/образование) добавляются после создания студента на его странице.
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

  const load = useCallback(async (signal, isActive = () => true) => {
    if (isActive()) {
      setError(null);
      setLoading(true);
    }
    try {
      const filter = {};
      if (findString.trim()) filter.findString = findString.trim();
      const { data: res } = await studentsApi.filterStudentCards(
        filter,
        page,
        PAGE_SIZE,
        { signal }
      );
      if (isActive()) setData(res);
    } catch (e) {
      if (e.name === 'AbortError') return;
      if (isActive()) {
        setError(e.message);
        setData(null);
      }
    } finally {
      if (isActive()) setLoading(false);
    }
  }, [findString, page]);

  useEffectWithAbort((signal, isActive) => load(signal, isActive), [load]);

  const loadOrderRows = useCallback(async (signal, isActive = () => true) => {
    if (isActive()) setOrderLoading(true);
    try {
      const { data: res } = await studentsApi.filterStudentCards(
        { useDefaultRanking: false, sortBy: 'MANUAL_SORT_ORDER', sortDirection: 'ASC' },
        0,
        100,
        { signal }
      );
      if (isActive()) setOrderRows(res?.data ?? []);
    } catch (e) {
      if (e.name === 'AbortError') return;
      if (isActive()) setOrderRows([]);
    } finally {
      if (isActive()) setOrderLoading(false);
    }
  }, []);

  useEffectWithAbort((signal, isActive) => loadOrderRows(signal, isActive), [loadOrderRows]);

  async function handleStudentsReorder(orderedIds) {
    const byId = new Map(orderRows.map((s) => [String(s.id), s]));
    const next = orderedIds.map((id) => byId.get(String(id))).filter(Boolean);
    setOrderRows(next);
    setOrderReordering(true);
    setOrderMsg(null);
    try {
      await studentsAdminApi.reorderStudents(orderedIds);
      setOrderMsg({ type: 'ok', text: 'Порядок витрины сохранён' });
      await loadOrderRows();
      await load();
    } catch (e) {
      setOrderMsg({ type: 'err', text: e.message });
      await loadOrderRows();
    } finally {
      setOrderReordering(false);
    }
  }

  async function cascadeDeleteStudent(studentId) {
    const sid = String(studentId);
    const safeList = (res) => {
      const v = res?.data?.data ?? res?.data ?? [];
      return Array.isArray(v) ? v : [];
    };

    async function deleteAllByFilter(filterFn, deleteFn, filter) {
      // удаляем пачками, пока не опустеет (на случай пагинации/нестабильного бэка)
      for (let i = 0; i < 10; i += 1) {
        const { data } = await filterFn(filter, 0, 200);
        const rows = safeList({ data });
        if (!rows.length) return;
        for (const r of rows) {
          const rid =
            (r && typeof r === 'object' && 'id' in r ? r.id : r) ??
            (r && typeof r === 'object' && r.id ? r.id : null);

          // не допускаем /institution/[object Object]
          const idStr = rid == null ? '' : String(rid).trim();
          if (!idStr || idStr.toLowerCase() === 'nan' || idStr === '[object Object]') continue;
          await deleteFn(idStr);
        }
      }
    }

    // 1) Requests (частая FK причина 409)
    await deleteAllByFilter(requestsApi.filterRequests, requestsApi.deleteRequest, { studentId: sid });

    // 2) Extended сущности
    await deleteAllByFilter(portfolioApi.filterPortfolio, portfolioApi.deletePortfolio, { studentId: sid });
    await deleteAllByFilter(experienceApi.filterExperience, experienceApi.deleteExperience, { studentId: sid });
    await deleteAllByFilter(institutionApi.filterInstitutions, institutionApi.deleteInstitution, { studentId: sid });
    // Education часто является общей сущностью/справочником и может использоваться другими записями.
    // При удалении студента удаляем только привязки (institution), а education не трогаем.
  }

  async function handleDelete(id) {
    if (!window.confirm('Удалить студента?')) return;
    try {
      await studentsApi.deleteStudent(id);
      await load();
    } catch (e) {
      // если 409 — пробуем удалить зависимости и повторить
      const msg = String(e?.message ?? '');
      if (msg.includes('409') || msg.toLowerCase().includes('conflict')) {
        try {
          await cascadeDeleteStudent(id);
          await studentsApi.deleteStudent(id);
          await load();
          return;
        } catch (e2) {
          setError(e2.message);
          return;
        }
      }
      setError(msg || 'Ошибка удаления');
    }
  }

  useEffect(() => {
    async function loadOptions() {
      setOptionsError(null);
      try {
        const [{ data: skillsRes }, { data: specialitiesRes }] = await Promise.all([
          skillsApi.filterSkills({}, 0, 500, ['id,asc']),
          specialitiesApi.filterSpecialities({}, 0, 500, ['id,asc']),
        ]);
        setSkillsOptions(skillsRes?.data ?? []);
        setSpecialityOptions(specialitiesRes?.data ?? []);
      } catch (e) {
        setOptionsError(e.message);
      }
    }

    loadOptions();
  }, []);

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

      // 1) создаём студента без расширенных сущностей
      const { data: resData } = await studentsApi.createStudent(payload);
      const newId = extractCreatedStudentId(resData);
      if (newId == null) throw new Error('Не удалось получить ID созданного студента');
      setCreateMsg({ type: 'ok', text: 'Студент создан. Открываю карточку…' });

      setCreatedStudent(null);
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

  return (
    <div className="page">
      <PageHeader
        title="Студенты"
        lead="Карточка резюме создаётся вместе с учётной записью (логин и пароль обязательны)."
      />

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
            <label htmlFor="sfind">Строка поиска (ФИО и др.)</label>
            <input
              id="sfind"
              value={findString}
              onChange={(e) => setFindString(e.target.value)}
              placeholder="Пусто — без фильтра по строке"
            />
          </div>
          <button type="submit" className="btn btn--primary">
            Применить
          </button>
        </form>
      </div>

      <div className="panel">
        <h2 className="panel__title">Создание студента</h2>
        {createMsg?.type === 'ok' ? (
          <div className="alert alert--success">{createMsg.text}</div>
        ) : null}
        {createMsg?.type === 'err' ? (
          <div className="alert alert--error">{createMsg.text}</div>
        ) : null}
        {optionsError ? <div className="alert alert--error">{optionsError}</div> : null}
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => setCreating((v) => !v)}
          style={{ marginBottom: creating ? '1rem' : 0 }}
        >
          {creating ? 'Скрыть форму' : 'Открыть форму создания'}
        </button>
        {creating ? (
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
              <div className="field">
                <label>Дата рождения</label>
                <input
                  type="date"
                  required
                  value={createForm.birthDate}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, birthDate: e.target.value }))
                  }
                />
              </div>
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
        ) : null}
      </div>

      {error ? <div className="alert alert--error">{error}</div> : null}

      <div className="panel">
        <h2 className="panel__title">Порядок на витрине {orderReordering ? '(сохранение…)' : ''}</h2>
        <p className="page__lead" style={{ marginTop: 0 }}>
          Перетащите строки — порядок сохраняется через POST /admin/students/reorder.
        </p>
        {orderMsg?.type === 'ok' ? <div className="alert alert--success">{orderMsg.text}</div> : null}
        {orderMsg?.type === 'err' ? <div className="alert alert--error">{orderMsg.text}</div> : null}
        {orderLoading ? (
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Загрузка…</p>
        ) : orderRows.length ? (
          <SortableTable
            items={orderRows}
            disabled={orderReordering}
            onReorder={handleStudentsReorder}
            headerCells={
              <>
                <th>ФИО</th>
                <th>Специальность</th>
                <th>Курс</th>
              </>
            }
            renderCells={(s) => (
              <>
                <td>
                  {s.firstName} {s.lastName}
                </td>
                <td>{s.speciality ?? '—'}</td>
                <td>{s.course}</td>
              </>
            )}
          />
        ) : (
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Нет студентов для сортировки</p>
        )}
      </div>

      <div className="panel">
        <h2 className="panel__title">Карточки</h2>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Загрузка…</p>
        ) : (
          <>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th />
                    <th>ФИО</th>
                    <th>Специальность</th>
                    <th>Курс</th>
                    <th>Навыки</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => {
                    const src = avatarUrl(s.imagePath);
                    return (
                      <tr key={s.id}>
                        <td style={{ width: 48 }}>
                          {src ? (
                            <img className="avatar" src={src} alt="" />
                          ) : (
                            <span className="avatar avatar--placeholder">
                              {(s.firstName?.[0] ?? '?').toUpperCase()}
                            </span>
                          )}
                        </td>
                        <td>
                          {s.firstName} {s.lastName}
                        </td>
                        <td>{s.speciality}</td>
                        <td>{s.course}</td>
                        <td>
                          {(s.skills ?? [])
                            .map((k) => k.name)
                            .slice(0, 4)
                            .join(', ')}
                          {(s.skills?.length ?? 0) > 4 ? '…' : ''}
                        </td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <Link
                            className="btn btn--ghost"
                            to={`/students/${s.id}`}
                            style={{ textDecoration: 'none', display: 'inline-flex' }}
                          >
                            Открыть
                          </Link>
                          <button
                            type="button"
                            className="btn btn--danger"
                            style={{ marginLeft: '0.5rem' }}
                            onClick={() => handleDelete(s.id)}
                          >
                            Удалить
                          </button>
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
