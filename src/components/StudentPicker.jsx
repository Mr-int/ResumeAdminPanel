import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import * as studentsApi from '../api/students.js';
import { API_BASE } from '../config.js';
import { pageItems, pageTotalPages } from '../lib/pageable.js';

const PAGE_SIZE = 10;

function avatarUrl(imagePath) {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return `${API_BASE}/main/photo/${encodeURIComponent(imagePath)}`;
}

function studentLabel(student) {
  const name = `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim();
  return name || student.id;
}

/**
 * Поиск и выбор студентов для привязки к проекту.
 * @param {string[]} excludeIds — уже привязанные UUID (строки)
 * @param {(ids: string[]) => void} onBind — выбранные id для привязки
 */
export function StudentPicker({ excludeIds = [], onBind, disabled = false }) {
  const exclude = useMemo(() => new Set(excludeIds.map(String)), [excludeIds]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(() => new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filter = {};
      if (query.trim()) filter.findString = query.trim();
      const { data: res } = await studentsApi.filterStudentCards(filter, page, PAGE_SIZE);
      setData(res);
    } catch (e) {
      setError(e.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [query, page]);

  useEffect(() => {
    const t = window.setTimeout(load, query.trim() ? 280 : 0);
    return () => window.clearTimeout(t);
  }, [load, query]);

  useEffect(() => {
    setPage(0);
  }, [query]);

  const rows = pageItems(data).filter((s) => !exclude.has(String(s.id)));
  const totalPages = pageTotalPages(data);

  function toggle(id) {
    const sid = String(id);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid);
      else next.add(sid);
      return next;
    });
  }

  function handleBind() {
    if (!selected.size || disabled) return;
    onBind([...selected]);
    setSelected(new Set());
  }

  return (
    <div className="student-picker">
      <div className="student-picker__toolbar">
        <input
          type="search"
          className="student-picker__search"
          placeholder="Поиск по имени, фамилии, специальности…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
        <button
          type="button"
          className="btn btn--primary"
          disabled={disabled || selected.size === 0}
          onClick={handleBind}
        >
          Привязать выбранных ({selected.size})
        </button>
      </div>

      {error ? <div className="alert alert--error">{error}</div> : null}
      {loading ? <p style={{ color: 'var(--text-muted)' }}>Поиск…</p> : null}

      <ul className="student-picker__list">
        {rows.map((s) => {
          const sid = String(s.id);
          const checked = selected.has(sid);
          const photo = avatarUrl(s.imagePath);
          return (
            <li key={sid}>
              <label className={`student-picker__row${checked ? ' student-picker__row--selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(sid)}
                  disabled={disabled}
                />
                <span className="student-picker__avatar">
                  {photo ? <img src={photo} alt="" /> : <span>{studentLabel(s).charAt(0)}</span>}
                </span>
                <span className="student-picker__info">
                  <strong>{studentLabel(s)}</strong>
                  <span>{s.speciality ?? '—'}</span>
                </span>
                <Link to={`/students/${sid}`} className="btn btn--ghost student-picker__link">
                  Карточка
                </Link>
              </label>
            </li>
          );
        })}
      </ul>

      {!loading && rows.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0' }}>
          {query.trim()
            ? 'Никого не найдено'
            : pageItems(data).length > 0
              ? 'Все студенты на странице уже привязаны'
              : 'Студенты не найдены — проверьте фильтр или создайте карточки студентов'}
        </p>
      ) : null}

      {totalPages > 1 ? (
        <div className="student-picker__pager">
          <button
            type="button"
            className="btn btn--ghost"
            disabled={page <= 0 || loading}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            ← Назад
          </button>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            className="btn btn--ghost"
            disabled={page >= totalPages - 1 || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Вперёд →
          </button>
        </div>
      ) : null}
    </div>
  );
}
