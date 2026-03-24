import { useMemo, useState } from 'react';
import { API_BASE } from '../config.js';

function mainPhotoUrl(imagePath) {
  if (!imagePath) return null;
  return `${API_BASE}/main/photo/${encodeURIComponent(imagePath)}`;
}

/**
 * @param {{ id: number, name: string }[]} options
 * @param {number[]} selectedIds
 * @param {(ids: number[]) => void} onChange
 */
export function SkillPicker({ options, selectedIds, onChange, searchPlaceholder = 'Поиск навыка…' }) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((s) => s.name.toLowerCase().includes(needle));
  }, [options, q]);

  function toggle(id) {
    const sid = Number(id);
    const nums = selectedIds.map(Number);
    if (nums.includes(sid)) {
      onChange(nums.filter((x) => x !== sid));
    } else {
      onChange([...nums, sid]);
    }
  }

  return (
    <div className="skill-picker">
      <input
        className="skill-picker__search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={searchPlaceholder}
        autoComplete="off"
      />
      <ul className="skill-picker__list" role="listbox" aria-label="Навыки">
        {filtered.map((s) => (
          <li key={s.id} className="skill-picker__row">
            <label className="skill-picker__label">
              <input
                type="checkbox"
                checked={selectedIds.map(Number).includes(Number(s.id))}
                onChange={() => toggle(s.id)}
              />
              <span className="skill-picker__name">{s.name}</span>
            </label>
          </li>
        ))}
      </ul>
      {filtered.length === 0 ? (
        <p className="skill-picker__empty">Ничего не найдено</p>
      ) : null}
    </div>
  );
}

/**
 * Превью фото + загрузка (POST /student/photo/{id}, поле avatarFile).
 */
export function StudentPhotoBlock({
  imagePath,
  studentId,
  firstName,
  title = 'Фото',
  children,
}) {
  const src = mainPhotoUrl(imagePath);

  return (
    <div className="student-photo-block">
      <h3 className="student-photo-block__title">{title}</h3>
      <div className="student-photo-block__preview">
        {src ? (
          <img src={src} alt="" className="student-photo-block__img" />
        ) : (
          <div className="student-photo-block__placeholder" aria-hidden>
            <span className="student-photo-block__placeholder-text">Нет фото</span>
          </div>
        )}
      </div>
      {children}
      <p className="student-photo-block__hint">
        {studentId
          ? 'Выберите файл и нажмите «Загрузить / сменить фото».'
          : 'После сохранения студента появится ID — тогда можно загрузить фото.'}
      </p>
    </div>
  );
}
