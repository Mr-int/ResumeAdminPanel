/**
 * Дата и время отдельными полями (календарь + часы), значение — YYYY-MM-DDTHH:mm.
 */
export function DateTimeField({ id, label, value = '', onChange, hint }) {
  const datePart = value?.slice(0, 10) ?? '';
  const timePart = value?.length >= 16 ? value.slice(11, 16) : '';

  function setDate(nextDate) {
    if (!nextDate) {
      onChange('');
      return;
    }
    onChange(`${nextDate}T${timePart || '00:00'}`);
  }

  function setTime(nextTime) {
    if (!datePart) return;
    onChange(`${datePart}T${nextTime || '00:00'}`);
  }

  return (
    <div className="field datetime-field">
      {label ? (
        <label className="datetime-field__label" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <div className="datetime-field__inputs">
        <input
          id={id}
          type="date"
          className="datetime-field__date"
          value={datePart}
          onChange={(e) => setDate(e.target.value)}
        />
        <input
          type="time"
          className="datetime-field__time"
          value={timePart}
          disabled={!datePart}
          onChange={(e) => setTime(e.target.value)}
          aria-label={label ? `${label} — время` : 'Время'}
        />
        {value ? (
          <button
            type="button"
            className="btn btn--ghost btn--small datetime-field__clear"
            onClick={() => onChange('')}
          >
            Очистить
          </button>
        ) : null}
      </div>
      {hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

/** Только дата (календарь), значение YYYY-MM-DD. */
export function DateField({
  id,
  label,
  value = '',
  onChange,
  required = false,
  min,
  max,
  hint,
  disabled = false,
}) {
  return (
    <div className="field date-field">
      {label ? <label htmlFor={id}>{label}</label> : null}
      <div className="date-field__row">
        <input
          id={id}
          type="date"
          value={value}
          required={required}
          min={min}
          max={max}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
        {value && !required && !disabled ? (
          <button
            type="button"
            className="btn btn--ghost btn--small"
            onClick={() => onChange('')}
          >
            Очистить
          </button>
        ) : null}
      </div>
      {hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

/** Год из выпадающего списка (без ручного ввода). */
export function YearSelect({
  id,
  label,
  value = '',
  onChange,
  fromYear = 1970,
  toYear = new Date().getFullYear() + 6,
  disabled = false,
}) {
  const years = [];
  for (let y = toYear; y >= fromYear; y -= 1) years.push(y);

  return (
    <div className="field">
      {label ? <label htmlFor={id}>{label}</label> : null}
      <select id={id} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {years.map((y) => (
          <option key={y} value={String(y)}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
