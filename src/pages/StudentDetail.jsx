import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as studentsApi from '../api/students.js';
import * as skillsApi from '../api/skills.js';
import * as specialitiesApi from '../api/specialities.js';
import { compressImageForUpload } from '../utils/compressImage.js';
import {
  contactFieldsFromStudentDto,
  contactFieldsToApiPayload,
} from '../utils/studentContact.js';
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
  const [form, setForm] = useState({
    city: '', hhLink: '', birthDate: '', bio: '', course: 'NEW', busyness: 'FREE',
    firstName: '', lastName: '', email: '', phoneNumber: '', telegramUsername: '',
    specialityId: '', skillsIds: [],
  });

  function applyStudentToForm(data, specList) {
    const contact = contactFieldsFromStudentDto(data);
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
      firstName: data.firstName ?? '', lastName: data.lastName ?? '',
      email: contact.email,
      phoneNumber: contact.phoneNumber,
      telegramUsername: contact.telegramUsername,
      specialityId,
      skillsIds: (data.skills ?? []).map((s) => s.id),
    });
  }

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
      applyStudentToForm(data, specList);
    } catch (e) {
      setOptionsError(e.message);
      try {
        const { data } = await studentsApi.getStudent(id);
        setStudent(data);
        applyStudentToForm(data, specialityOptions);
      } catch (e2) {
        setError(e2.message);
        setStudent(null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadStudent(); }, [id]);

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
        specialityId: Number(form.specialityId),
        skillsIds,
        ...contactFieldsToApiPayload(form),
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
              studentId={id}
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

    </div>
  );
}
