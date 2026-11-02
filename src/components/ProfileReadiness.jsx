import { checksFilled } from '../lib/studentProfileChecks.js';

export function ProfileMeter({ checks, caption, ready }) {
  const { done, total, complete } = checksFilled(checks);
  const full = ready ?? complete;
  const percent = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="profile-meter">
      <div className="profile-meter__track" aria-hidden="true">
        <div
          className={`profile-meter__fill${full ? ' profile-meter__fill--full' : ''}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="page__lead" style={{ margin: '0.35rem 0 0' }}>
        {done} из {total}{caption ? `. ${caption}` : ''}
      </p>
    </div>
  );
}

export function ProfileChecklist({ checks }) {
  return (
    <ul className="profile-checks">
      {checks.map((item) => (
        <li
          key={item.id}
          className={`profile-checks__item${item.ok ? ' profile-checks__item--ok' : ''}`}
        >
          <span aria-hidden="true">{item.ok ? '✓' : '·'}</span>
          {item.label}
        </li>
      ))}
    </ul>
  );
}
