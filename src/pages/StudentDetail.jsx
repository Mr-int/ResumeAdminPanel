import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as studentsApi from '../api/students.js';
import * as experienceApi from '../api/experience.js';
import * as institutionApi from '../api/institutions.js';
import * as educationApi from '../api/education.js';
import * as portfolioApi from '../api/portfolio.js';
import * as skillsApi from '../api/skills.js';
import * as specialitiesApi from '../api/specialities.js';
import { compressImageForUpload } from '../utils/compressImage.js';
import { SkillPicker, StudentPhotoBlock } from '../components/SkillPicker.jsx';

export function StudentDetail() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [mediaMsg, setMediaMsg] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [skillsOptions, setSkillsOptions] = useState([]);
  const [specialityOptions, setSpecialityOptions] = useState([]);
  const [optionsError, setOptionsError] = useState(null);
  const [extendedMsg, setExtendedMsg] = useState(null);
  const [experienceForm, setExperienceForm] = useState({
    companyId: '',
    position: '',
    additionalInfo: '',
    startDate: '',
    endDate: '',
  });
  const [institutionForm, setInstitutionForm] = useState({
    educationId: '',
    startYear: '',
    endYear: '',
  });
  const [educationForm, setEducationForm] = useState({
    institution: '',
    additionalInfo: '',
    webUrl: '',
  });
  const [portfolioForm, setPortfolioForm] = useState({
    name: '',
    link: '',
    additionalInfo: '',
  });
  const [form, setForm] = useState({
    city: '', hhLink: '', birthDate: '', bio: '', course: 'NEW', busyness: 'FREE',
    firstName: '', lastName: '', email: '', phoneNumber: '', telegramUsername: '',
    specialityId: '', skillsIds: [],
  });

  async function loadStudent() {
    setLoading(true);
    setError(null);
    setOptionsError(null);
    try {
      const [{ data }, { data: specRes }, { data: skillsRes }] = await Promise.all([
        studentsApi.getStudent(id),
        specialitiesApi.filterSpecialities({}, 0, 500, ['id,asc']),
        skillsApi.filterSkills({}, 0, 500, ['id,asc']),
      ]);
      setStudent(data);
      const specList = specRes?.data ?? [];
      const skillsList = skillsRes?.data ?? [];
      setSpecialityOptions(specList);
      setSkillsOptions(skillsList);

      let specialityId = '';
      if (data.specialityId != null && data.specialityId !== '') {
        specialityId = String(data.specialityId);
      } else {
        const specName =
          typeof data.speciality === 'string' ? data.speciality.trim() : '';
        const match = specList.find((s) => s.name === specName);
        if (match) specialityId = String(match.id);
      }

      setForm({
        city: data.city ?? '', hhLink: data.hhLink ?? '', birthDate: data.birthDate ?? '',
        bio: data.bio ?? '', course: data.course ?? 'NEW', busyness: data.busyness ?? 'FREE',
        firstName: data.firstName ?? '', lastName: data.lastName ?? '', email: data.email ?? '',
        phoneNumber: data.phoneNumber ?? '', telegramUsername: data.telegramUsername ?? '',
        specialityId,
        skillsIds: (data.skills ?? []).map((s) => s.id),
      });
    } catch (e) {
      setOptionsError(e.message);
      try {
        const { data } = await studentsApi.getStudent(id);
        setStudent(data);
        setForm({
          city: data.city ?? '', hhLink: data.hhLink ?? '', birthDate: data.birthDate ?? '',
          bio: data.bio ?? '', course: data.course ?? 'NEW', busyness: data.busyness ?? 'FREE',
          firstName: data.firstName ?? '', lastName: data.lastName ?? '', email: data.email ?? '',
          phoneNumber: data.phoneNumber ?? '', telegramUsername: data.telegramUsername ?? '',
          specialityId:
            data.specialityId != null && data.specialityId !== ''
              ? String(data.specialityId)
              : '',
          skillsIds: (data.skills ?? []).map((s) => s.id),
        });
      } catch (e2) {
        setError(e2.message);
        setStudent(null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadStudent(); }, [id]);

  function getCollection(keys) {
    if (!student || typeof student !== 'object') return [];
    for (const key of keys) {
      if (Array.isArray(student[key])) return student[key];
    }
    return [];
  }

  const experiences = getCollection(['experiences', 'experience', 'workExperiences']);
  const institutions = getCollection(['institutions', 'institution', 'educationInstitutions']);
  const educations = getCollection(['educations', 'education', 'educationRecords']);
  const portfolios = getCollection(['portfolios', 'portfolio', 'portfolioItems']);

  async function handleUpdate(e) {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      const skillsIds = form.skillsIds
        .map((x) => Number(x))
        .filter((x) => Number.isInteger(x) && x >= 0);
      if (!skillsIds.length) throw new Error('Укажите хотя бы один навык');
      if (form.specialityId === '') throw new Error('Выберите специальность');

      await studentsApi.updateStudent(id, {
        city: form.city || undefined,
        hhLink: form.hhLink || undefined,
        birthDate: form.birthDate,
        bio: form.bio || undefined,
        course: form.course,
        busyness: form.busyness,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email || undefined,
        phoneNumber: form.phoneNumber || undefined,
        telegramUsername: form.telegramUsername || undefined,
        specialityId: Number(form.specialityId),
        skillsIds,
      });

      setMsg({ type: 'ok', text: 'Профиль сохранён' });
      await loadStudent();
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoUpload(e) {
    e.preventDefault();
    if (!photoFile) {
      setMediaMsg({ type: 'err', text: 'Выберите файл фото' });
      return;
    }
    setMediaMsg(null);
    setPhotoUploading(true);
    try {
      let fileToSend = photoFile;
      if (photoFile.type.startsWith('image/')) {
        try {
          fileToSend = await compressImageForUpload(photoFile);
        } catch {
          fileToSend = photoFile;
        }
      }
      await studentsApi.uploadStudentPhoto(id, fileToSend);
      setPhotoFile(null);
      setMediaMsg({ type: 'ok', text: 'Фото обновлено' });
      await loadStudent();
    } catch (e) {
      setMediaMsg({ type: 'err', text: e.message });
    } finally {
      setPhotoUploading(false);
    }
  }

  async function createExperience() {
    setExtendedMsg(null);
    try {
      await experienceApi.createExperience({
        companyId: Number(experienceForm.companyId),
        studentId: id,
        experience: {
          id: 0,
          position: experienceForm.position.trim(),
          additionalInfo: experienceForm.additionalInfo || '',
          startDate: experienceForm.startDate,
          endDate: experienceForm.endDate,
        },
      });
      setExperienceForm({
        companyId: '',
        position: '',
        additionalInfo: '',
        startDate: '',
        endDate: '',
      });
      setExtendedMsg({ type: 'ok', text: 'experience добавлен' });
      await loadStudent();
    } catch (e) {
      setExtendedMsg({ type: 'err', text: e.message });
    }
  }

  async function createInstitution() {
    setExtendedMsg(null);
    try {
      await institutionApi.createInstitution({
        educationId: Number(institutionForm.educationId),
        studentId: id,
        institution: {
          id: 0,
          startYear: Number(institutionForm.startYear),
          endYear: Number(institutionForm.endYear),
        },
      });
      setInstitutionForm({ educationId: '', startYear: '', endYear: '' });
      setExtendedMsg({ type: 'ok', text: 'institution добавлен' });
      await loadStudent();
    } catch (e) {
      setExtendedMsg({ type: 'err', text: e.message });
    }
  }

  async function createEducation() {
    setExtendedMsg(null);
    try {
      await educationApi.createEducation({
        id: 0,
        institution: educationForm.institution.trim(),
        additionalInfo: educationForm.additionalInfo || '',
        webUrl: educationForm.webUrl || '',
      });
      setEducationForm({ institution: '', additionalInfo: '', webUrl: '' });
      setExtendedMsg({ type: 'ok', text: 'education добавлен' });
      await loadStudent();
    } catch (e) {
      setExtendedMsg({ type: 'err', text: e.message });
    }
  }

  async function createPortfolio() {
    setExtendedMsg(null);
    try {
      await portfolioApi.createPortfolio({
        id: 0,
        name: portfolioForm.name.trim(),
        link: portfolioForm.link || '',
        additionalInfo: portfolioForm.additionalInfo || '',
        studentId: id,
      });
      setPortfolioForm({ name: '', link: '', additionalInfo: '' });
      setExtendedMsg({ type: 'ok', text: 'portfolio добавлен' });
      await loadStudent();
    } catch (e) {
      setExtendedMsg({ type: 'err', text: e.message });
    }
  }

  async function deleteExtendedPart(kind, entityId) {
    if (!window.confirm('Удалить запись?')) return;
    setExtendedMsg(null);
    try {
      if (kind === 'experience') await experienceApi.deleteExperience(entityId);
      if (kind === 'institution') await institutionApi.deleteInstitution(entityId);
      if (kind === 'education') await educationApi.deleteEducation(entityId);
      if (kind === 'portfolio') await portfolioApi.deletePortfolio(entityId);
      setExtendedMsg({ type: 'ok', text: `${kind} удален` });
      await loadStudent();
    } catch (e) {
      setExtendedMsg({ type: 'err', text: e.message });
    }
  }

  if (loading) return <div className="page"><p className="page__lead">Loading...</p></div>;
  if (error || !student) {
    return <div className="page"><div className="alert alert--error">{error ?? 'Not found'}</div><Link to="/students" className="btn btn--ghost">Back to list</Link></div>;
  }

  return (
    <div className="page">
      <p style={{ marginBottom: '1rem' }}><Link to="/students" style={{ color: 'var(--text-secondary)' }}>К списку студентов</Link></p>
      <div style={{ marginBottom: '1rem' }}>
        <h1 className="page__title" style={{ marginBottom: '0.25rem' }}>{student.firstName} {student.lastName}</h1>
        <p className="page__lead" style={{ margin: 0 }}>{student.course} · {student.busyness}{student.speciality ? ` · ${student.speciality}` : ''}</p>
      </div>

      <div className="panel">
        <h2 className="panel__title">Профиль (фото + PUT /student/{'{id}'})</h2>
        {optionsError ? <div className="alert alert--error">Справочники (навыки/специальности): {optionsError}</div> : null}
        <div className="profile-edit-layout">
          <div className="profile-edit-layout__photo">
            {mediaMsg?.type === 'ok' ? <div className="alert alert--success">{mediaMsg.text}</div> : null}
            {mediaMsg?.type === 'err' ? <div className="alert alert--error">{mediaMsg.text}</div> : null}
            <StudentPhotoBlock
              imagePath={student.imagePath}
              studentId={Number(id)}
              firstName={student.firstName}
              title="Фото"
            >
              <form className="student-photo-block__upload" onSubmit={handlePhotoUpload}>
                <div className="field">
                  <label htmlFor="student-photo-file">Файл изображения</label>
                  <input
                    id="student-photo-file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                  />
                </div>
                <button type="submit" className="btn btn--primary" disabled={photoUploading}>
                  {photoUploading ? 'Загрузка…' : 'Загрузить / сменить фото'}
                </button>
              </form>
            </StudentPhotoBlock>
            <p className="page__lead" style={{ margin: '0.75rem 0 0' }}>
              Перед отправкой изображение сжимается. Ошибка 413 — увеличьте лимит тела запроса на сервере (nginx / приложение).
            </p>
          </div>
          <div className="profile-edit-layout__form">
            {msg?.type === 'ok' ? <div className="alert alert--success">{msg.text}</div> : null}
            {msg?.type === 'err' ? <div className="alert alert--error">{msg.text}</div> : null}
            <form onSubmit={handleUpdate}>
              <div className="form-row">
                <div className="field"><label>Имя</label><input required value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} /></div>
                <div className="field"><label>Фамилия</label><input required value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} /></div>
                <div className="field"><label>Дата рождения</label><input type="date" required value={form.birthDate} onChange={(e) => setForm((p) => ({ ...p, birthDate: e.target.value }))} /></div>
              </div>
              <div className="form-row">
                <div className="field"><label>Курс</label><select value={form.course} onChange={(e) => setForm((p) => ({ ...p, course: e.target.value }))}><option value="NEW">NEW</option><option value="FIRST">FIRST</option><option value="SECOND">SECOND</option><option value="THIRD">THIRD</option><option value="FOURTH">FOURTH</option></select></div>
                <div className="field"><label>Занятость</label><select value={form.busyness} onChange={(e) => setForm((p) => ({ ...p, busyness: e.target.value }))}><option value="FREE">FREE</option><option value="FREELANCE">FREELANCE</option><option value="EMPLOYED">EMPLOYED</option></select></div>
                <div className="field">
                  <label>Специальность</label>
                  <select
                    required
                    value={form.specialityId}
                    onChange={(e) => setForm((p) => ({ ...p, specialityId: e.target.value }))}
                  >
                    <option value="">Не выбрано</option>
                    {specialityOptions.map((s) => (
                      <option key={s.id} value={String(s.id)}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field skill-picker-field">
                <label>Навыки</label>
                <SkillPicker
                  options={skillsOptions}
                  selectedIds={form.skillsIds}
                  onChange={(ids) => setForm((p) => ({ ...p, skillsIds: ids }))}
                />
              </div>
              <div className="form-row">
                <div className="field"><label>Город</label><input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} /></div>
                <div className="field"><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></div>
                <div className="field"><label>Телефон</label><input value={form.phoneNumber} onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))} /></div>
                <div className="field"><label>Telegram</label><input value={form.telegramUsername} onChange={(e) => setForm((p) => ({ ...p, telegramUsername: e.target.value }))} /></div>
              </div>
              <div className="form-row">
                <div className="field" style={{ minWidth: 300, flex: 1 }}><label>HH</label><input value={form.hhLink} onChange={(e) => setForm((p) => ({ ...p, hhLink: e.target.value }))} /></div>
                <div className="field" style={{ minWidth: 300, flex: 1 }}><label>Bio</label><input value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} /></div>
                <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? 'Сохранение…' : 'Сохранить'}</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="panel">
        <h2 className="panel__title">Experience / Education / Institution / Portfolio</h2>
        {extendedMsg?.type === 'ok' ? <div className="alert alert--success">{extendedMsg.text}</div> : null}
        {extendedMsg?.type === 'err' ? <div className="alert alert--error">{extendedMsg.text}</div> : null}

        <div className="form-row">
          <div className="field">
            <label>Experience: Company ID</label>
            <input
              type="number"
              min="0"
              value={experienceForm.companyId}
              onChange={(e) => setExperienceForm((p) => ({ ...p, companyId: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Position</label>
            <input
              value={experienceForm.position}
              onChange={(e) => setExperienceForm((p) => ({ ...p, position: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Start date</label>
            <input
              type="date"
              value={experienceForm.startDate}
              onChange={(e) => setExperienceForm((p) => ({ ...p, startDate: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>End date</label>
            <input
              type="date"
              value={experienceForm.endDate}
              onChange={(e) => setExperienceForm((p) => ({ ...p, endDate: e.target.value }))}
            />
          </div>
          <button type="button" className="btn btn--primary" onClick={createExperience}>
            Добавить Experience
          </button>
        </div>
        <div className="form-row" style={{ marginTop: '-0.5rem' }}>
          <div className="field" style={{ minWidth: 320, flex: 1 }}>
            <label>Additional info</label>
            <input
              value={experienceForm.additionalInfo}
              onChange={(e) =>
                setExperienceForm((p) => ({ ...p, additionalInfo: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="table-wrap" style={{ marginBottom: '1rem' }}>
          <table className="data">
            <thead><tr><th>ID</th><th>Данные</th><th /></tr></thead>
            <tbody>
              {experiences.map((item) => (
                <tr key={item.id ?? JSON.stringify(item)}>
                  <td>{item.id ?? '-'}</td>
                  <td><pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(item, null, 2)}</pre></td>
                  <td style={{ textAlign: 'right' }}>
                    <button type="button" className="btn btn--danger" disabled={!item.id} onClick={() => deleteExtendedPart('experience', item.id)}>Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="form-row">
          <div className="field">
            <label>Institution: Education ID</label>
            <input
              type="number"
              min="0"
              value={institutionForm.educationId}
              onChange={(e) =>
                setInstitutionForm((p) => ({ ...p, educationId: e.target.value }))
              }
            />
          </div>
          <div className="field">
            <label>Start year</label>
            <input
              type="number"
              min="1900"
              value={institutionForm.startYear}
              onChange={(e) =>
                setInstitutionForm((p) => ({ ...p, startYear: e.target.value }))
              }
            />
          </div>
          <div className="field">
            <label>End year</label>
            <input
              type="number"
              min="1900"
              value={institutionForm.endYear}
              onChange={(e) =>
                setInstitutionForm((p) => ({ ...p, endYear: e.target.value }))
              }
            />
          </div>
          <button type="button" className="btn btn--primary" onClick={createInstitution}>
            Добавить Institution
          </button>
        </div>
        <div className="table-wrap" style={{ marginBottom: '1rem' }}>
          <table className="data">
            <thead><tr><th>ID</th><th>Данные</th><th /></tr></thead>
            <tbody>
              {institutions.map((item) => (
                <tr key={item.id ?? JSON.stringify(item)}>
                  <td>{item.id ?? '-'}</td>
                  <td><pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(item, null, 2)}</pre></td>
                  <td style={{ textAlign: 'right' }}>
                    <button type="button" className="btn btn--danger" disabled={!item.id} onClick={() => deleteExtendedPart('institution', item.id)}>Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="form-row">
          <div className="field">
            <label>Education: Institution</label>
            <input
              value={educationForm.institution}
              onChange={(e) =>
                setEducationForm((p) => ({ ...p, institution: e.target.value }))
              }
            />
          </div>
          <div className="field" style={{ minWidth: 320, flex: 1 }}>
            <label>Web URL</label>
            <input
              value={educationForm.webUrl}
              onChange={(e) =>
                setEducationForm((p) => ({ ...p, webUrl: e.target.value }))
              }
            />
          </div>
          <button type="button" className="btn btn--primary" onClick={createEducation}>
            Добавить Education
          </button>
        </div>
        <div className="form-row" style={{ marginTop: '-0.5rem' }}>
          <div className="field" style={{ minWidth: 320, flex: 1 }}>
            <label>Additional info</label>
            <input
              value={educationForm.additionalInfo}
              onChange={(e) =>
                setEducationForm((p) => ({ ...p, additionalInfo: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="table-wrap" style={{ marginBottom: '1rem' }}>
          <table className="data">
            <thead><tr><th>ID</th><th>Данные</th><th /></tr></thead>
            <tbody>
              {educations.map((item) => (
                <tr key={item.id ?? JSON.stringify(item)}>
                  <td>{item.id ?? '-'}</td>
                  <td><pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(item, null, 2)}</pre></td>
                  <td style={{ textAlign: 'right' }}>
                    <button type="button" className="btn btn--danger" disabled={!item.id} onClick={() => deleteExtendedPart('education', item.id)}>Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="form-row">
          <div className="field">
            <label>Portfolio: Name</label>
            <input
              value={portfolioForm.name}
              onChange={(e) =>
                setPortfolioForm((p) => ({ ...p, name: e.target.value }))
              }
            />
          </div>
          <div className="field" style={{ minWidth: 320, flex: 1 }}>
            <label>Link</label>
            <input
              value={portfolioForm.link}
              onChange={(e) =>
                setPortfolioForm((p) => ({ ...p, link: e.target.value }))
              }
            />
          </div>
          <button type="button" className="btn btn--primary" onClick={createPortfolio}>
            Добавить Portfolio
          </button>
        </div>
        <div className="form-row" style={{ marginTop: '-0.5rem' }}>
          <div className="field" style={{ minWidth: 320, flex: 1 }}>
            <label>Additional info</label>
            <input
              value={portfolioForm.additionalInfo}
              onChange={(e) =>
                setPortfolioForm((p) => ({ ...p, additionalInfo: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>ID</th><th>Данные</th><th /></tr></thead>
            <tbody>
              {portfolios.map((item) => (
                <tr key={item.id ?? JSON.stringify(item)}>
                  <td>{item.id ?? '-'}</td>
                  <td><pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(item, null, 2)}</pre></td>
                  <td style={{ textAlign: 'right' }}>
                    <button type="button" className="btn btn--danger" disabled={!item.id} onClick={() => deleteExtendedPart('portfolio', item.id)}>Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

