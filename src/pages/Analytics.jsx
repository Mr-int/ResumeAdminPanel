import { useState } from 'react';
import * as analyticsApi from '../api/analytics.js';
import { toApiDateTime } from '../utils/dateTimeApi.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { FlashMessages } from '../components/ui/FlashMessages.jsx';
import { LoadingBlock } from '../components/ui/LoadingBlock.jsx';

function defaultRange() {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 30);
  const fmt = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T00:00`;
  };
  return { from: fmt(from), to: fmt(to) };
}

export function Analytics() {
  const initial = defaultRange();
  const [summaryFrom, setSummaryFrom] = useState(initial.from);
  const [summaryTo, setSummaryTo] = useState(initial.to);
  const [popFrom, setPopFrom] = useState('');
  const [popTo, setPopTo] = useState('');
  const [summary, setSummary] = useState(null);
  const [population, setPopulation] = useState(null);
  const [error, setError] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingPop, setLoadingPop] = useState(false);

  async function loadSummary(e) {
    e.preventDefault();
    setError(null);
    setLoadingSummary(true);
    try {
      const { data } = await analyticsApi.analyticsSummary({
        from: toApiDateTime(summaryFrom),
        to: toApiDateTime(summaryTo),
      });
      setSummary(data);
    } catch (e) {
      setError(e.message);
      setSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  }

  async function loadPopulation(e) {
    e.preventDefault();
    setError(null);
    setLoadingPop(true);
    try {
      const body = {};
      const from = toApiDateTime(popFrom);
      const to = toApiDateTime(popTo);
      if (from && to) {
        body.from = from;
        body.to = to;
      } else if (from || to) {
        throw new Error('Укажите обе даты окна или оставьте пустыми');
      }
      const { data } = await analyticsApi.entityPopulation(body);
      setPopulation(data);
    } catch (e) {
      setError(e.message);
      setPopulation(null);
    } finally {
      setLoadingPop(false);
    }
  }

  const pathRows = summary?.byPath ?? [];

  return (
    <div className="page">
      <PageHeader
        title="Аналитика"
        lead="Просмотры страниц сайта и сводка по пользователям, студентам и рекрутерам."
      />

      <FlashMessages error={error} />

      <div className="panel">
        <h2 className="panel__title">Просмотры по path</h2>
        <form className="form-row" onSubmit={loadSummary}>
          <div className="field">
            <label htmlFor="sum-from">С</label>
            <input
              id="sum-from"
              type="datetime-local"
              required
              value={summaryFrom}
              onChange={(e) => setSummaryFrom(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="sum-to">По (не включая)</label>
            <input
              id="sum-to"
              type="datetime-local"
              required
              value={summaryTo}
              onChange={(e) => setSummaryTo(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn--primary" disabled={loadingSummary}>
            {loadingSummary ? 'Загрузка…' : 'Загрузить'}
          </button>
        </form>
        {summary ? (
          <div className="table-wrap" style={{ marginTop: '1rem' }}>
            <table className="data">
              <thead>
                <tr>
                  <th>Path</th>
                  <th>Событий</th>
                </tr>
              </thead>
              <tbody>
                {pathRows.length ? (
                  pathRows.map((row) => (
                    <tr key={row.path}>
                      <td>{row.path}</td>
                      <td>{row.events}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} style={{ color: 'var(--text-muted)' }}>
                      Нет данных за период
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <div className="panel">
        <h2 className="panel__title">Население сущностей</h2>
        <form className="form-row" onSubmit={loadPopulation}>
          <div className="field">
            <label htmlFor="pop-from">Окно: с (необяз.)</label>
            <input
              id="pop-from"
              type="datetime-local"
              value={popFrom}
              onChange={(e) => setPopFrom(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="pop-to">Окно: по (необяз.)</label>
            <input
              id="pop-to"
              type="datetime-local"
              value={popTo}
              onChange={(e) => setPopTo(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn--primary" disabled={loadingPop}>
            {loadingPop ? 'Загрузка…' : 'Загрузить'}
          </button>
        </form>
        {population ? (
          <dl
            style={{
              display: 'grid',
              gridTemplateColumns: '280px 1fr',
              gap: '0.35rem 1rem',
              margin: '1rem 0 0',
              fontSize: '0.9rem',
            }}
          >
            <dt style={{ color: 'var(--text-muted)' }}>Всего пользователей</dt>
            <dd style={{ margin: 0 }}>{population.totalUsers}</dd>
            <dt style={{ color: 'var(--text-muted)' }}>ADMIN</dt>
            <dd style={{ margin: 0 }}>{population.usersAdmin}</dd>
            <dt style={{ color: 'var(--text-muted)' }}>STUDENT</dt>
            <dd style={{ margin: 0 }}>{population.usersStudent}</dd>
            <dt style={{ color: 'var(--text-muted)' }}>RECRUITER</dt>
            <dd style={{ margin: 0 }}>{population.usersRecruiter}</dd>
            <dt style={{ color: 'var(--text-muted)' }}>Всего студентов (таблица)</dt>
            <dd style={{ margin: 0 }}>{population.totalStudents}</dd>
            <dt style={{ color: 'var(--text-muted)' }}>Всего рекрутеров (таблица)</dt>
            <dd style={{ margin: 0 }}>{population.totalRecruiters}</dd>
            {population.newStudentsInWindow != null ? (
              <>
                <dt style={{ color: 'var(--text-muted)' }}>Новых студентов за окно</dt>
                <dd style={{ margin: 0 }}>{population.newStudentsInWindow}</dd>
              </>
            ) : null}
            {population.newRecruitersInWindow != null ? (
              <>
                <dt style={{ color: 'var(--text-muted)' }}>Новых рекрутеров за окно</dt>
                <dd style={{ margin: 0 }}>{population.newRecruitersInWindow}</dd>
              </>
            ) : null}
          </dl>
        ) : null}
      </div>
    </div>
  );
}
