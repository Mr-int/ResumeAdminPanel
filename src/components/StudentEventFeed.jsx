import { useCallback, useEffect, useState } from 'react';
import { DateTimeField } from './ui/DateTimeField.jsx';
import { LoadingBlock } from './ui/LoadingBlock.jsx';
import { AnalyticsEventList } from './AnalyticsEventList.jsx';
import * as analyticsApi from '../api/analytics.js';
import { getEducation } from '../api/education.js';
import { defaultAnalyticsPeriod, toApiDateTime } from '../lib/analyticsEvents.js';

export function StudentEventFeed({
  studentId,
  experiences,
  institutions,
  portfolios,
  companies,
}) {
  const [period, setPeriod] = useState(defaultAnalyticsPeriod);
  const [events, setEvents] = useState([]);
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [schools, setSchools] = useState(() => new Map());

  useEffect(() => {
    const schoolIds = [...new Set((institutions ?? []).map((item) => item?.educationId).filter(Boolean))];
    if (!schoolIds.length) {
      setSchools(new Map());
      return undefined;
    }
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(schoolIds.map(async (schoolId) => {
        try {
          const { data } = await getEducation(schoolId);
          return [String(schoolId), data?.institution || ''];
        } catch {
          return [String(schoolId), ''];
        }
      }));
      if (!cancelled) setSchools(new Map(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [institutions]);

  const load = useCallback(async (nextPeriod) => {
    const from = toApiDateTime(nextPeriod.from);
    const to = toApiDateTime(nextPeriod.to);
    if (!from || !to || from >= to) {
      setError('Конец периода должен быть позже начала.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await analyticsApi.listStudentEvents(studentId, from, to);
      setEvents(result.events);
      setTruncated(result.truncated);
    } catch (e) {
      setError(e.message);
      setEvents([]);
      setTruncated(false);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load(defaultAnalyticsPeriod());
  }, [load]);

  return (
    <div className="panel">
      <h2 className="panel__title">События</h2>
      <form
        className="form-row"
        onSubmit={(event) => {
          event.preventDefault();
          load(period);
        }}
      >
        <DateTimeField
          id="student-events-from"
          label="С"
          value={period.from}
          onChange={(from) => setPeriod((prev) => ({ ...prev, from }))}
        />
        <DateTimeField
          id="student-events-to"
          label="По"
          value={period.to}
          onChange={(to) => setPeriod((prev) => ({ ...prev, to }))}
        />
        <button type="submit" className="btn btn--primary" disabled={loading}>
          Показать
        </button>
      </form>
      {error ? <div className="alert alert--error">{error}</div> : null}
      {loading ? <LoadingBlock text="Загрузка событий…" /> : (
        <AnalyticsEventList
          events={events}
          records={{ experiences, institutions, portfolios, companies, schools }}
        />
      )}
      {truncated ? (
        <p className="page__lead">Показаны не все события периода.</p>
      ) : null}
    </div>
  );
}
