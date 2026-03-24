import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as studentsApi from '../api/students.js';
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
  const [form, setForm] = useState({
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
    skillsIds: '',
  });

  async function loadStudent() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await studentsApi.getStudent(id);
      setStudent(data);
      setForm({
        city: data.city ?? '',
        hhLink: data.hhLink ?? '',
        birthDate: data.birthDate ?? '',
        bio: data.bio ?? '',
        course: data.course ?? 'NEW',
        busyness: data.busyness ?? 'FREE',
        firstName: data.firstName ?? '',
        lastName: data.lastName ?? '',
        email: data.email ?? '',
        phoneNumber: data.phoneNumber ?? '',
        telegramUsername: data.telegramUsername ?? '',
        specialityId: '',
        skillsIds: (data.skills ?? []).map((s) => s.id).join(','),
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudent();
  }, [id]);

  async function handleUpdate(e) {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      const skillsIds = parseIds(form.skillsIds);
      if (!skillsIds.length) throw new Error('РЈРєР°Р¶РёС‚Рµ skillsIds (РјРёРЅРёРјСѓРј РѕРґРёРЅ id)');
      if (form.specialityId === '') {
        throw new Error('Р”Р»СЏ РїРѕР»РЅРѕРіРѕ PUT СѓРєР°Р¶РёС‚Рµ specialityId');
      }

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

      setMsg({ type: 'ok', text: 'РЎС‚СѓРґРµРЅС‚ РѕР±РЅРѕРІР»РµРЅ' });
      await loadStudent();
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <p className="page__lead">Р—Р°РіСЂСѓР·РєР°...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="page">
        <div className="alert alert--error">{error ?? 'РќРµ РЅР°Р№РґРµРЅРѕ'}</div>
        <Link to="/students" className="btn btn--ghost">
          Рљ СЃРїРёСЃРєСѓ
        </Link>
      </div>
    );
  }

  const src = photoUrl(student.imagePath);

  return (
    <div className="page">
      <p style={{ marginBottom: '1rem' }}>
        <Link to="/students" style={{ color: 'var(--text-secondary)' }}>
          в†ђ РЎС‚СѓРґРµРЅС‚С‹
        </Link>
      </p>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        {src ? (
          <img
            src={src}
            alt=""
            style={{
              width: 160,
              height: 160,
              borderRadius: 12,
              objectFit: 'cover',
              border: '1px solid var(--border)',
            }}
          />
        ) : null}
        <div>
          <h1 className="page__title" style={{ marginBottom: '0.25rem' }}>
            {student.firstName} {student.lastName}
          </h1>
          <p className="page__lead" style={{ marginBottom: '0.75rem' }}>
            {student.speciality} В· {student.course} В· {student.busyness}
          </p>
        </div>
      </div>

      <div className="panel" style={{ marginTop: '1.5rem' }}>
        <h2 className="panel__title">РџРѕР»РЅРѕРµ РѕР±РЅРѕРІР»РµРЅРёРµ (PUT /student/{'{id}'})</h2>
        {msg?.type === 'ok' ? <div className="alert alert--success">{msg.text}</div> : null}
        {msg?.type === 'err' ? <div className="alert alert--error">{msg.text}</div> : null}
        <form onSubmit={handleUpdate}>
          <div className="form-row">
            <div className="field">
              <label>РРјСЏ</label>
              <input
                required
                value={form.firstName}
                onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>Р¤Р°РјРёР»РёСЏ</label>
              <input
                required
                value={form.lastName}
                onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>Р”Р°С‚Р° СЂРѕР¶РґРµРЅРёСЏ</label>
              <input
                type="date"
                required
                value={form.birthDate}
                onChange={(e) => setForm((p) => ({ ...p, birthDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label>РљСѓСЂСЃ</label>
              <select
                value={form.course}
                onChange={(e) => setForm((p) => ({ ...p, course: e.target.value }))}
              >
                <option value="NEW">NEW</option>
                <option value="FIRST">FIRST</option>
                <option value="SECOND">SECOND</option>
                <option value="THIRD">THIRD</option>
                <option value="FOURTH">FOURTH</option>
              </select>
            </div>
            <div className="field">
              <label>Р—Р°РЅСЏС‚РѕСЃС‚СЊ</label>
              <select
                value={form.busyness}
                onChange={(e) => setForm((p) => ({ ...p, busyness: e.target.value }))}
              >
                <option value="FREE">FREE</option>
                <option value="FREELANCE">FREELANCE</option>
                <option value="EMPLOYED">EMPLOYED</option>
              </select>
            </div>
            <div className="field">
              <label>Speciality ID (РѕР±СЏР·. РґР»СЏ PUT)</label>
              <input
                type="number"
                min="0"
                required
                value={form.specialityId}
                onChange={(e) => setForm((p) => ({ ...p, specialityId: e.target.value }))}
              />
            </div>
            <div className="field" style={{ minWidth: 280 }}>
              <label>Skills IDs (С‡РµСЂРµР· Р·Р°РїСЏС‚СѓСЋ)</label>
              <input
                required
                value={form.skillsIds}
                onChange={(e) => setForm((p) => ({ ...p, skillsIds: e.target.value }))}
                placeholder="1,2,10"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label>Р“РѕСЂРѕРґ</label>
              <input
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>РўРµР»РµС„РѕРЅ</label>
              <input
                value={form.phoneNumber}
                onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>Telegram username</label>
              <input
                value={form.telegramUsername}
                onChange={(e) =>
                  setForm((p) => ({ ...p, telegramUsername: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="form-row">
            <div className="field" style={{ minWidth: 300, flex: 1 }}>
              <label>HH Link</label>
              <input
                value={form.hhLink}
                onChange={(e) => setForm((p) => ({ ...p, hhLink: e.target.value }))}
              />
            </div>
            <div className="field" style={{ minWidth: 300, flex: 1 }}>
              <label>Bio</label>
              <input
                value={form.bio}
                onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              />
            </div>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'РЎРѕС…СЂР°РЅРµРЅРёРµ...' : 'РЎРѕС…СЂР°РЅРёС‚СЊ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
