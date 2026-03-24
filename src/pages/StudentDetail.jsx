import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as studentsApi from '../api/students.js';
import * as experienceApi from '../api/experience.js';
import * as institutionApi from '../api/institutions.js';
import * as educationApi from '../api/education.js';
import * as portfolioApi from '../api/portfolio.js';
import { API_BASE } from '../config.js';

function photoUrl(path) {
  if (!path) return null;
  return `${API_BASE}/main/photo/${encodeURIComponent(path)}`;
}

function parseIds(value) {
  return value
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => Number(x))
    .filter((x) => Number.isInteger(x) && x >= 0);
}

export function StudentDetail() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [mediaMsg, setMediaMsg] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [extendedMsg, setExtendedMsg] = useState(null);
  const [jsonDrafts, setJsonDrafts] = useState({
    experience: '{}',
    institution: '{}',
    education: '{}',
    portfolio: '{}',
  });
  const [form, setForm] = useState({
    city: '', hhLink: '', birthDate: '', bio: '', course: 'NEW', busyness: 'FREE',
    firstName: '', lastName: '', email: '', phoneNumber: '', telegramUsername: '',
    specialityId: '', skillsIds: '',
  });

  async function loadStudent() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await studentsApi.getStudent(id);
      setStudent(data);
      setForm({
        city: data.city ?? '', hhLink: data.hhLink ?? '', birthDate: data.birthDate ?? '',
        bio: data.bio ?? '', course: data.course ?? 'NEW', busyness: data.busyness ?? 'FREE',
        firstName: data.firstName ?? '', lastName: data.lastName ?? '', email: data.email ?? '',
        phoneNumber: data.phoneNumber ?? '', telegramUsername: data.telegramUsername ?? '',
        specialityId: '', skillsIds: (data.skills ?? []).map((s) => s.id).join(','),
      });
    } catch (e) {
      setError(e.message);
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
      const skillsIds = parseIds(form.skillsIds);
      if (!skillsIds.length) throw new Error('Provide at least one skills id');
      if (form.specialityId === '') throw new Error('specialityId is required for PUT');

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

      setMsg({ type: 'ok', text: 'Student updated' });
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
    try {
      await studentsApi.uploadStudentPhoto(id, photoFile);
      setPhotoFile(null);
      setMediaMsg({ type: 'ok', text: 'Фото обновлено' });
      await loadStudent();
    } catch (e) {
      setMediaMsg({ type: 'err', text: e.message });
    }
  }

  async function createExtendedPart(kind) {
    setExtendedMsg(null);
    try {
      const draft = jsonDrafts[kind];
      const parsed = JSON.parse(draft || '{}');
      const payload = { ...parsed, studentId: parsed.studentId ?? id };
      if (kind === 'experience') await experienceApi.createExperience(payload);
      if (kind === 'institution') await institutionApi.createInstitution(payload);
      if (kind === 'education') await educationApi.createEducation(payload);
      if (kind === 'portfolio') await portfolioApi.createPortfolio(payload);
      setExtendedMsg({ type: 'ok', text: `${kind} добавлен` });
      setJsonDrafts((p) => ({ ...p, [kind]: '{}' }));
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

  const src = photoUrl(student.imagePath);

  return (
    <div className="page">
      <p style={{ marginBottom: '1rem' }}><Link to="/students" style={{ color: 'var(--text-secondary)' }}>Back to students</Link></p>
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        {src ? <img src={src} alt="" style={{ width: 160, height: 160, borderRadius: 12, objectFit: 'cover', border: '1px solid var(--border)' }} /> : null}
        <div>
          <h1 className="page__title" style={{ marginBottom: '0.25rem' }}>{student.firstName} {student.lastName}</h1>
          <p className="page__lead" style={{ marginBottom: '0.75rem' }}>{student.speciality} - {student.course} - {student.busyness}</p>
        </div>
      </div>

      <div className="panel" style={{ marginTop: '1rem' }}>
        <h2 className="panel__title">Фото (POST /student/photo/{'{id}'})</h2>
        {mediaMsg?.type === 'ok' ? <div className="alert alert--success">{mediaMsg.text}</div> : null}
        {mediaMsg?.type === 'err' ? <div className="alert alert--error">{mediaMsg.text}</div> : null}
        <form className="form-row" onSubmit={handlePhotoUpload}>
          <div className="field">
            <label>Файл</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <button type="submit" className="btn btn--primary">Загрузить фото</button>
        </form>
      </div>

      <div className="panel" style={{ marginTop: '1.5rem' }}>
        <h2 className="panel__title">Full update (PUT /student/{'{id}'})</h2>
        {msg?.type === 'ok' ? <div className="alert alert--success">{msg.text}</div> : null}
        {msg?.type === 'err' ? <div className="alert alert--error">{msg.text}</div> : null}
        <form onSubmit={handleUpdate}>
          <div className="form-row">
            <div className="field"><label>First name</label><input required value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} /></div>
            <div className="field"><label>Last name</label><input required value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} /></div>
            <div className="field"><label>Birth date</label><input type="date" required value={form.birthDate} onChange={(e) => setForm((p) => ({ ...p, birthDate: e.target.value }))} /></div>
          </div>
          <div className="form-row">
            <div className="field"><label>Course</label><select value={form.course} onChange={(e) => setForm((p) => ({ ...p, course: e.target.value }))}><option value="NEW">NEW</option><option value="FIRST">FIRST</option><option value="SECOND">SECOND</option><option value="THIRD">THIRD</option><option value="FOURTH">FOURTH</option></select></div>
            <div className="field"><label>Busyness</label><select value={form.busyness} onChange={(e) => setForm((p) => ({ ...p, busyness: e.target.value }))}><option value="FREE">FREE</option><option value="FREELANCE">FREELANCE</option><option value="EMPLOYED">EMPLOYED</option></select></div>
            <div className="field"><label>Speciality ID</label><input type="number" min="0" required value={form.specialityId} onChange={(e) => setForm((p) => ({ ...p, specialityId: e.target.value }))} /></div>
            <div className="field" style={{ minWidth: 280 }}><label>Skills IDs (comma separated)</label><input required value={form.skillsIds} onChange={(e) => setForm((p) => ({ ...p, skillsIds: e.target.value }))} placeholder="1,2,10" /></div>
          </div>
          <div className="form-row">
            <div className="field"><label>City</label><input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} /></div>
            <div className="field"><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></div>
            <div className="field"><label>Phone</label><input value={form.phoneNumber} onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))} /></div>
            <div className="field"><label>Telegram username</label><input value={form.telegramUsername} onChange={(e) => setForm((p) => ({ ...p, telegramUsername: e.target.value }))} /></div>
          </div>
          <div className="form-row">
            <div className="field" style={{ minWidth: 300, flex: 1 }}><label>HH Link</label><input value={form.hhLink} onChange={(e) => setForm((p) => ({ ...p, hhLink: e.target.value }))} /></div>
            <div className="field" style={{ minWidth: 300, flex: 1 }}><label>Bio</label><input value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} /></div>
            <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>

      <div className="panel">
        <h2 className="panel__title">Experience / Education / Institution / Portfolio</h2>
        {extendedMsg?.type === 'ok' ? <div className="alert alert--success">{extendedMsg.text}</div> : null}
        {extendedMsg?.type === 'err' ? <div className="alert alert--error">{extendedMsg.text}</div> : null}

        <div className="form-row">
          <div className="field" style={{ minWidth: 320, flex: 1 }}>
            <label>Experience JSON object</label>
            <input
              value={jsonDrafts.experience}
              onChange={(e) =>
                setJsonDrafts((p) => ({ ...p, experience: e.target.value }))
              }
            />
          </div>
          <button type="button" className="btn btn--primary" onClick={() => createExtendedPart('experience')}>
            Добавить Experience
          </button>
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
          <div className="field" style={{ minWidth: 320, flex: 1 }}>
            <label>Institution JSON object</label>
            <input
              value={jsonDrafts.institution}
              onChange={(e) =>
                setJsonDrafts((p) => ({ ...p, institution: e.target.value }))
              }
            />
          </div>
          <button type="button" className="btn btn--primary" onClick={() => createExtendedPart('institution')}>
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
          <div className="field" style={{ minWidth: 320, flex: 1 }}>
            <label>Education JSON object</label>
            <input
              value={jsonDrafts.education}
              onChange={(e) =>
                setJsonDrafts((p) => ({ ...p, education: e.target.value }))
              }
            />
          </div>
          <button type="button" className="btn btn--primary" onClick={() => createExtendedPart('education')}>
            Добавить Education
          </button>
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
          <div className="field" style={{ minWidth: 320, flex: 1 }}>
            <label>Portfolio JSON object</label>
            <input
              value={jsonDrafts.portfolio}
              onChange={(e) =>
                setJsonDrafts((p) => ({ ...p, portfolio: e.target.value }))
              }
            />
          </div>
          <button type="button" className="btn btn--primary" onClick={() => createExtendedPart('portfolio')}>
            Добавить Portfolio
          </button>
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

