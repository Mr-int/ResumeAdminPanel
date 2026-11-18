import { useState } from 'react';
import { Link } from 'react-router-dom';
import { eventSummary, eventTypeLabel, formatOccurredAt, profileChangeFieldLabels } from '../lib/analyticsEvents.js';

function payloadEntries(payload) {
  if (!payload || typeof payload !== 'object') return [];
  return Object.entries(payload);
}

function formatField(value) {
  if (value == null || value === '') return '—';
  if (Array.isArray(value)) return value.join(', ') || '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function AnalyticsEventList({ events, showStudentLink = false, records }) {
  const [openId, setOpenId] = useState(null);
  if (!events?.length) {
    return <p className="page__lead" style={{ margin: 0 }}>За период событий нет.</p>;
  }
  return (
    <div className="event-list">
      {events.map((event) => {
        const open = openId === event.id;
        const profileChange = event.eventType === 'STUDENT_PROFILE_CHANGED';
        const entries = profileChange ? [] : payloadEntries(event.payload);
        const fieldLabels = profileChange ? profileChangeFieldLabels(event) : [];
        const studentId = event.payload?.studentId;
        const summary = eventSummary(event, records);
        return (
          <article className="event-row" key={event.id}>
            <button
              type="button"
              className="event-row__main"
              aria-expanded={open}
              onClick={() => setOpenId(open ? null : event.id)}
            >
              <time className="event-row__time" dateTime={event.occurredAt}>
                {formatOccurredAt(event.occurredAt)}
              </time>
              <span className="event-row__copy">
                <span className="event-row__type">{eventTypeLabel(event.eventType)}</span>
                <span className="event-row__summary">{summary}</span>
                <span className="event-row__path">{event.path || '—'}</span>
              </span>
            </button>
            {open ? (
              <div className="event-row__detail">
                {showStudentLink && studentId ? (
                  <p className="event-row__link">
                    <Link to={`/students/${studentId}`}>Открыть анкету</Link>
                  </p>
                ) : null}
                {profileChange ? (
                  <>
                    <p className="event-row__summary">{summary}</p>
                    {fieldLabels.length ? (
                      <ul className="event-row__labels">
                        {fieldLabels.map((label) => <li key={label}>{label}</li>)}
                      </ul>
                    ) : (
                      <p className="page__lead" style={{ margin: 0 }}>Поля не указаны.</p>
                    )}
                  </>
                ) : entries.length ? (
                  <dl className="event-row__fields">
                    {entries.map(([key, value]) => (
                      <div key={key}>
                        <dt>{key}</dt>
                        <dd>{formatField(value)}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="page__lead" style={{ margin: 0 }}>Подробностей нет.</p>
                )}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
