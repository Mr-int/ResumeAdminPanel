import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as studentsApi from '../api/students.js';
import * as portfolioApi from '../api/portfolio.js';
import * as experienceApi from '../api/experience.js';
import * as institutionApi from '../api/institutions.js';
import * as educationApi from '../api/education.js';
import * as skillsApi from '../api/skills.js';
import * as specialitiesApi from '../api/specialities.js';
import { API_BASE } from '../config.js';
import { SkillPicker, StudentPhotoBlock } from '../components/SkillPicker.jsx';
import { compressImageForUpload } from '../utils/compressImage.js';
import { contactFieldsToApiPayload } from '../utils/studentContact.js';
import {
  buildExperienceCreateBody,
  buildInstitutionCreateBody,
} from '../utils/experienceInstitutionPayload.js';
import { StudentCreateExtendedBlocks } from '../components/StudentCreateExtendedBlocks.jsx';

const PAGE_SIZE = 12;

function avatarUrl(imagePath) {
  if (!imagePath) return null;
  return `${API_BASE}/main/photo/${encodeURIComponent(imagePath)}`;
}

export function Students() {
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
  const [createPhotoFile, setCreatePhotoFile] = useState(null);
  const [createPhotoUploading, setCreatePhotoUploading] = useState(false);
  const [createPhotoMsg, setCreatePhotoMsg] = useState(null);
  const [createForm, setCreateForm] = useState({
    city: '',
    hhLink: '',
    birthDate: '',
    bio: '',
    course: 'NEW',
    busyness: 'FREE',
    firstName: '',
    lastName: '',
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

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const filter = {};
      if (findString.trim()) filter.findString = findString.trim();
      const { data: res } = await studentsApi.filterStudentCards(
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
  }, [findString, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id) {
    if (!window.confirm('Удалить студента?')) return;
    try {
      await studentsApi.deleteStudent(id);
      await load();
    } catch (e) {
      setError(e.message);
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
      return Number(data.id);
    }
    if (typeof data === 'number' && Number.isInteger(data)) return data;
    return null;
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreateMsg(null);
    setCreatePhotoMsg(null);
    try {
      const skillsIds = createForm.skillsIds
        .map((x) => Number(x))
        .filter((x) => Number.isInteger(x) && x >= 0);
      if (!skillsIds.length) {
        throw new Error('Укажите хотя бы один навык');
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
        ...contactFieldsToApiPayload(createForm),
        specialityId:
          createForm.specialityId === ''
            ? undefined
            : Number(createForm.specialityId),
        skillsIds,
      };

      // 1) создаём студента без расширенных сущностей
      const { data: resData } = await studentsApi.createStudent(payload);
      const newId = extractCreatedStudentId(resData);
      setCreateMsg({ type: 'ok', text: 'Студент создан' });

      // 2) по очереди добавляем расширенные записи (если они есть)
      if (newId != null) {
        const sid = String(newId);

        const portfolios = (createForm.portfolioRows ?? []).filter((r) => r.name?.trim());
        for (const r of portfolios) {
          await portfolioApi.createPortfolio({
            name: r.name.trim(),
            link: (r.link || '').trim(),
            additionalInfo: (r.additionalInfo || '').trim(),
            studentId: sid,
          });
        }

        const experiences = (createForm.experienceRows ?? []).filter(
          (r) =>
            r.position?.trim() &&
            (r.companyName ?? r.company ?? '').trim()
        );
        for (const r of experiences) {
          await experienceApi.createExperience(buildExperienceCreateBody(sid, r));
        }

        const institutions = (createForm.institutionRows ?? []).filter(
          (r) =>
            (r.institutionName ?? r.institution ?? '').trim() &&
            r.startYear !== '' &&
            r.endYear !== '' &&
            !Number.isNaN(Number(r.startYear)) &&
            !Number.isNaN(Number(r.endYear))
        );
        for (const r of institutions) {
          await institutionApi.createInstitution(buildInstitutionCreateBody(sid, r));
        }

        const educations = (createForm.educationRows ?? []).filter((r) => r.institution?.trim());
        for (const r of educations) {
          await educationApi.createEducation({
            institution: r.institution.trim(),
            additionalInfo: (r.additionalInfo || '').trim(),
            webUrl: (r.webUrl || '').trim(),
            studentId: sid,
          });
        }
      }

      if (newId != null) {
        setCreatedStudent({
          id: newId,
          imagePath:
            typeof resData === 'object' && resData?.imagePath != null
              ? resData.imagePath
              : null,
          firstName: createForm.firstName.trim(),
        });
        setCreatePhotoFile(null);
      } else {
        setCreatedStudent(null);
      }
      setCreateForm({
        city: '',
        hhLink: '',
        birthDate: '',
        bio: '',
        course: 'NEW',
        busyness: 'FREE',
        firstName: '',
        lastName: '',
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
    } catch (e) {
      setCreateMsg({ type: 'err', text: e.message });
    }
  }

  async function handleCreatePhotoUpload(e) {
    e.preventDefault();
    setCreatePhotoMsg(null);
    if (!createdStudent?.id) {
      setCreatePhotoMsg({ type: 'err', text: 'Нет ID студента' });
      return;
    }
    if (!createPhotoFile) {
      setCreatePhotoMsg({ type: 'err', text: 'Выберите файл фото' });
      return;
    }
    setCreatePhotoUploading(true);
    try {
      let fileToSend = createPhotoFile;
      if (createPhotoFile.type.startsWith('image/')) {
        try {
          fileToSend = await compressImageForUpload(createPhotoFile);
        } catch {
          fileToSend = createPhotoFile;
        }
      }
      await studentsApi.uploadStudentPhoto(createdStudent.id, fileToSend);
      setCreatePhotoFile(null);
      setCreatePhotoMsg({ type: 'ok', text: 'Фото загружено' });
      const { data: fresh } = await studentsApi.getStudent(createdStudent.id);
      if (fresh && typeof fresh === 'object') {
        setCreatedStudent((prev) =>
          prev
            ? {
                ...prev,
                imagePath: fresh.imagePath ?? prev.imagePath,
              }
            : prev
        );
      }
      await load();
    } catch (err) {
      setCreatePhotoMsg({ type: 'err', text: err.message });
    } finally {
      setCreatePhotoUploading(false);
    }
  }

  const totalPages = data?.totalPages ?? 0;
  const rows = data?.data ?? [];

  return (
    <div className="page">
      <h1 className="page__title">Студенты</h1>
      <p className="page__lead">
        Краткие карточки (POST /student/cardsFilter). Полный профиль — отдельная
        страница по ID.
      </p>

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
        <h2 className="panel__title">
          Создание студента (POST /student/extended)
        </h2>
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
                <label>Bio</label>
                <input
                  value={createForm.bio}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, bio: e.target.value }))
                  }
                />
              </div>
            </div>
            <StudentCreateExtendedBlocks form={createForm} setForm={setCreateForm} />
            <div className="form-row" style={{ marginTop: '1rem' }}>
              <button type="submit" className="btn btn--primary">
                Создать студента
              </button>
            </div>
          </form>
        ) : null}
        {createdStudent ? (
          <div className="created-student-photo panel panel--nested">
            <h3 className="panel__title panel__title--small">
              Фото студента (ID: {createdStudent.id})
            </h3>
            {createPhotoMsg?.type === 'ok' ? (
              <div className="alert alert--success">{createPhotoMsg.text}</div>
            ) : null}
            {createPhotoMsg?.type === 'err' ? (
              <div className="alert alert--error">{createPhotoMsg.text}</div>
            ) : null}
            <StudentPhotoBlock
              imagePath={createdStudent.imagePath}
              studentId={createdStudent.id}
              firstName={createdStudent.firstName}
              title="Превью"
            >
              <form
                className="student-photo-block__upload"
                onSubmit={handleCreatePhotoUpload}
              >
                <div className="field">
                  <label htmlFor="create-student-photo-file">Файл изображения</label>
                  <input
                    id="create-student-photo-file"
                    key={createdStudent.id}
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setCreatePhotoFile(e.target.files?.[0] ?? null)
                    }
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={createPhotoUploading}
                >
                  {createPhotoUploading ? 'Загрузка…' : 'Загрузить / сменить фото'}
                </button>
              </form>
            </StudentPhotoBlock>
            <button
              type="button"
              className="btn btn--ghost"
              style={{ marginTop: '0.75rem' }}
              onClick={() => {
                setCreatedStudent(null);
                setCreatePhotoMsg(null);
                setCreatePhotoFile(null);
              }}
            >
              Скрыть блок фото
            </button>
          </div>
        ) : null}
      </div>

      {error ? <div className="alert alert--error">{error}</div> : null}

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
