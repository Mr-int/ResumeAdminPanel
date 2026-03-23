import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as studentsApi from '../api/students.js';
import { API_BASE } from '../config.js';

function photoUrl(path) {
  if (!path) return null;
  return `${API_BASE}/main/photo/${encodeURIComponent(path)}`;
}

export function StudentDetail() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await studentsApi.getStudent(id);
        if (!cancelled) setStudent(data);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="page">
        <p className="page__lead">Загрузка…</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="page">
        <div className="alert alert--error">{error ?? 'Не найдено'}</div>
        <Link to="/students" className="btn btn--ghost">
          К списку
        </Link>
      </div>
    );
  }

  const src = photoUrl(student.imagePath);

  return (
    <div className="page">
      <p style={{ marginBottom: '1rem' }}>
        <Link to="/students" style={{ color: 'var(--text-secondary)' }}>
          ← Студенты
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
            {student.speciality} · {student.course} · {student.busyness}
          </p>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 560 }}>
            {student.bio || '—'}
          </p>
          <dl
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: '0.35rem 1.25rem',
              marginTop: '1rem',
              fontSize: '0.9rem',
            }}
          >
            <dt style={{ color: 'var(--text-muted)' }}>Город</dt>
            <dd style={{ margin: 0 }}>{student.city ?? '—'}</dd>
            <dt style={{ color: 'var(--text-muted)' }}>Дата рождения</dt>
            <dd style={{ margin: 0 }}>{student.birthDate ?? '—'}</dd>
            <dt style={{ color: 'var(--text-muted)' }}>HH</dt>
            <dd style={{ margin: 0 }}>
              {student.hhLink ? (
                <a href={student.hhLink} target="_blank" rel="noreferrer">
                  Ссылка
                </a>
              ) : (
                '—'
              )}
            </dd>
          </dl>
        </div>
      </div>

      <div className="panel" style={{ marginTop: '1.5rem' }}>
        <h2 className="panel__title">Навыки</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {(student.skills ?? []).map((sk) => (
            <span
              key={sk.id}
              style={{
                padding: '0.25rem 0.6rem',
                borderRadius: 8,
                background: 'rgba(99,102,241,0.15)',
                border: '1px solid rgba(99,102,241,0.25)',
                fontSize: '0.85rem',
              }}
            >
              {sk.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
