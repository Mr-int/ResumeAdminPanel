import { useState } from 'react';
import * as analyticsApi from '../api/analytics.js';
import { toApiDateTime } from '../utils/dateTimeApi.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { FlashMessages } from '../components/ui/FlashMessages.jsx';
import { LoadingBlock } from '../components/ui/LoadingBlock.jsx';
import { BarChart } from '../components/BarChart.jsx';
import { DateTimeField } from '../components/ui/DateTimeField.jsx';
import {
  ANALYTICS_EVENT_LABELS,
  FUNNEL_EVENT_ORDER,
  labelOf,
} from '../lib/labels.js';

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

function buildFunnelRows(byEventType) {
  const map = new Map((byEventType ?? []).map((r) => [r.eventType, r.count]));
  return FUNNEL_EVENT_ORDER.map((code) => ({
    label: labelOf(ANALYTICS_EVENT_LABELS, code, code),
    value: map.get(code) ?? 0,
    code,
  }));
}

export function Analytics() {
  const initial = defaultRange();
  const [summaryFrom, setSummaryFrom] = useState(initial.from);
  const [summaryTo, setSummaryTo] = useState(initial.to);
  const [popFrom, setPopFrom] = useState('');
  const [popTo, setPopTo] = useState('');
  const [summary, setSummary] = useState(null);
  const [funnel, setFunnel] = useState(null);
  const [population, setPopulation] = useState(null);
  const [error, setError] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingPop, setLoadingPop] = useState(false);

  async function loadSummary(e) {
    e.preventDefault();
    setError(null);
    setLoadingSummary(true);
    try {
      const body = {
        from: toApiDateTime(summaryFrom),
        to: toApiDateTime(summaryTo),
      };
      const [{ data: sum }, { data: fun }] = await Promise.all([
        analyticsApi.analyticsSummary(body),
        analyticsApi.analyticsFunnel(body),
      ]);
      setSummary(sum);
      setFunnel(fun);
    } catch (e) {
      setError(e.message);
      setSummary(null);
      setFunnel(null);
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

  const pathRows = (summary?.byPath ?? []).map((row) => ({
    label: row.path,
    value: row.events,
  }));
  const funnelRows = buildFunnelRows(funnel?.byEventType);

  return (
    <div className="page">
      <PageHeader
        title="Аналитика"
        lead="Просмотры по path, воронка по типам событий и сводка по пользователям."
      />

      <FlashMessages error={error} />

      <div className="panel">
        <h2 className="panel__title">Период отчётов</h2>
        <form className="form-row" onSubmit={loadSummary}>
          <DateTimeField
            id="sum-from"
            label="С"
            value={summaryFrom}
            onChange={setSummaryFrom}
          />
          <DateTimeField
            id="sum-to"
            label="По (не включая)"
            value={summaryTo}
            onChange={setSummaryTo}
          />
          <button type="submit" className="btn btn--primary" disabled={loadingSummary}>
            {loadingSummary ? 'Загрузка…' : 'Загрузить сводку и воронку'}
          </button>
        </form>
      </div>

      {loadingSummary ? <LoadingBlock /> : null}

      {summary || funnel ? (
        <div className="analytics-charts">
          <div className="panel">
            <h2 className="panel__title">Воронка (типы событий)</h2>
            {funnelRows.length ? (
              <BarChart rows={funnelRows} />
            ) : (
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>Нет данных за период</p>
            )}
          </div>
          <div className="panel">
            <h2 className="panel__title">Просмотры по path</h2>
            {pathRows.length ? (
              <BarChart rows={pathRows.slice(0, 20)} />
            ) : (
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>Нет PAGE_VIEW за период</p>
            )}
          </div>
        </div>
      ) : null}

      <div className="panel">
        <h2 className="panel__title">Население сущностей</h2>
        <form className="form-row" onSubmit={loadPopulation}>
          <DateTimeField
            id="pop-from"
            label="Окно: с (необяз.)"
            value={popFrom}
            onChange={setPopFrom}
          />
          <DateTimeField
            id="pop-to"
            label="Окно: по (необяз.)"
            value={popTo}
            onChange={setPopTo}
          />
          <button type="submit" className="btn btn--primary" disabled={loadingPop}>
            {loadingPop ? 'Загрузка…' : 'Загрузить'}
          </button>
        </form>
        {population ? (
          <dl className="detail-dl">
            <dt>Всего пользователей</dt>
            <dd>{population.totalUsers}</dd>
            <dt>ADMIN</dt>
            <dd>{population.usersAdmin}</dd>
            <dt>STUDENT</dt>
            <dd>{population.usersStudent}</dd>
            <dt>RECRUITER</dt>
            <dd>{population.usersRecruiter}</dd>
            <dt>Всего студентов (таблица)</dt>
            <dd>{population.totalStudents}</dd>
            <dt>Всего рекрутеров (таблица)</dt>
            <dd>{population.totalRecruiters}</dd>
            {population.newStudentsInWindow != null ? (
              <>
                <dt>Новых студентов за окно</dt>
                <dd>{population.newStudentsInWindow}</dd>
              </>
            ) : null}
            {population.newRecruitersInWindow != null ? (
              <>
                <dt>Новых рекрутеров за окно</dt>
                <dd>{population.newRecruitersInWindow}</dd>
              </>
            ) : null}
          </dl>
        ) : null}
      </div>
    </div>
  );
}
