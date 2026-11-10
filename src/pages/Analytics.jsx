import { useEffect, useState } from 'react';
import { DateTimeField } from '../components/ui/DateTimeField.jsx';
import { LoadingBlock } from '../components/ui/LoadingBlock.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { AnalyticsEventList } from '../components/AnalyticsEventList.jsx';
import * as analyticsApi from '../api/analytics.js';
import {
  EVENT_FILTERS,
  defaultAnalyticsPeriod,
  eventTypeLabel,
  toApiDateTime,
} from '../lib/analyticsEvents.js';

function periodBody(period) {
  const from = toApiDateTime(period.from);
  const to = toApiDateTime(period.to);
  if (!from || !to || from >= to) return null;
  return { from, to };
}

export function Analytics() {
  const [period, setPeriod] = useState(defaultAnalyticsPeriod);
  const [eventType, setEventType] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [population, setPopulation] = useState(null);
  const [funnel, setFunnel] = useState([]);
  const [paths, setPaths] = useState([]);
  const [eventsPage, setEventsPage] = useState(null);

  async function load(nextPage = 0, nextType = eventType) {
    const windowRange = periodBody(period);
    if (!windowRange) {
      setError('Конец периода должен быть позже начала.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [populationRes, funnelRes, summaryRes, eventsRes] = await Promise.all([
        analyticsApi.entityPopulation(windowRange),
        analyticsApi.analyticsFunnel(windowRange),
        analyticsApi.analyticsSummary(windowRange),
        analyticsApi.listEvents({
          ...windowRange,
          eventType: nextType || undefined,
          page: nextPage,
          size: 20,
        }),
      ]);
      setPopulation(populationRes.data);
      setFunnel(funnelRes.data?.byEventType ?? []);
      setPaths(summaryRes.data?.byPath ?? []);
      setEventsPage(eventsRes.data);
      setPage(nextPage);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(0, '');
    // Первая загрузка только для периода по умолчанию.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxCount = funnel.reduce((max, row) => Math.max(max, row.count || 0), 0);
  const totalPages = eventsPage?.totalPages ?? 0;
  const events = eventsPage?.data ?? [];

  return (
    <div className="page">
      <PageHeader
        title="Аналитика"
        lead="Сводка сайта и журнал событий за выбранный период."
      />

      <form
        className="panel"
        onSubmit={(event) => {
          event.preventDefault();
          load(0, eventType);
        }}
      >
        <div className="form-row">
          <DateTimeField
            id="analytics-from"
            label="С"
            value={period.from}
            onChange={(from) => setPeriod((prev) => ({ ...prev, from }))}
          />
          <DateTimeField
            id="analytics-to"
            label="По"
            value={period.to}
            onChange={(to) => setPeriod((prev) => ({ ...prev, to }))}
          />
          <div className="field">
            <label htmlFor="analytics-type">Тип события</label>
            <select
              id="analytics-type"
              value={eventType}
              onChange={(event) => setEventType(event.target.value)}
            >
              {EVENT_FILTERS.map((item) => (
                <option key={item.id || 'all'} value={item.id}>{item.label}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn--primary" disabled={loading}>
            Показать
          </button>
        </div>
      </form>

      {error ? <div className="alert alert--error">{error}</div> : null}

      <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
        <div className="stat-card">
          <p className="stat-card__label">Пользователи</p>
          <p className="stat-card__value">{population?.totalUsers ?? '…'}</p>
        </div>
        <div className="stat-card">
          <p className="stat-card__label">Студенты</p>
          <p className="stat-card__value">{population?.totalStudents ?? '…'}</p>
        </div>
        <div className="stat-card">
          <p className="stat-card__label">Работодатели</p>
          <p className="stat-card__value">{population?.totalRecruiters ?? '…'}</p>
        </div>
        <div className="stat-card">
          <p className="stat-card__label">Новые за период</p>
          <p className="stat-card__value" style={{ fontSize: '1.15rem' }}>
            {population == null
              ? '…'
              : `${population.newStudentsInWindow ?? 0} / ${population.newRecruitersInWindow ?? 0}`}
          </p>
          <p className="stat-card__hint">Студенты и работодатели</p>
        </div>
      </div>

      <div className="analytics-split">
        <section className="panel">
          <h2 className="panel__title">События по типам</h2>
          {funnel.length ? (
            <div className="funnel">
              {funnel.map((row) => {
                const width = maxCount ? Math.max(4, Math.round((row.count / maxCount) * 100)) : 0;
                return (
                  <div className="funnel-row" key={row.eventType}>
                    <span className="funnel-row__label">{eventTypeLabel(row.eventType)}</span>
                    <span className="funnel-row__track">
                      <span className="funnel-row__fill" style={{ width: `${width}%` }} />
                    </span>
                    <span className="funnel-row__count">{row.count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="page__lead" style={{ margin: 0 }}>За период событий нет.</p>
          )}
        </section>
        <section className="panel">
          <h2 className="panel__title">Пути</h2>
          {paths.length ? (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Путь</th>
                    <th>События</th>
                  </tr>
                </thead>
                <tbody>
                  {paths.map((row) => (
                    <tr key={row.path}>
                      <td>{row.path || '—'}</td>
                      <td>{row.events}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="page__lead" style={{ margin: 0 }}>За период событий нет.</p>
          )}
        </section>
      </div>

      <section className="panel">
        <h2 className="panel__title">Журнал</h2>
        {loading ? <LoadingBlock text="Загрузка журнала…" /> : (
          <AnalyticsEventList events={events} showStudentLink />
        )}
        <div className="pager">
          <span>
            Стр. {eventsPage ? eventsPage.page + 1 : 1} из {Math.max(totalPages, 1)} · всего{' '}
            {eventsPage?.totalElements ?? 0}
          </span>
          <div className="pager__btns">
            <button
              type="button"
              className="btn btn--ghost"
              disabled={loading || page <= 0}
              onClick={() => load(page - 1, eventType)}
            >
              Назад
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              disabled={loading || !totalPages || page >= totalPages - 1}
              onClick={() => load(page + 1, eventType)}
            >
              Вперёд
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
