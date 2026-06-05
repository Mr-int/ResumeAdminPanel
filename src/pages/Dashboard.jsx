import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import * as mainApi from '../api/main.js';
import * as analyticsApi from '../api/analytics.js';
import * as accountApi from '../api/accountApprovals.js';
import * as vacanciesApi from '../api/vacancies.js';
import * as regApi from '../api/recruiterRegistrations.js';
import { API_BASE } from '../config.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { LoadingBlock } from '../components/ui/LoadingBlock.jsx';

const QUICK_LINKS = [
  { to: '/account-approvals', title: 'Одобрение аккаунтов', desc: 'Очередь студентов и рекрутеров' },
  { to: '/students', title: 'Студенты', desc: 'Карточки резюме и порядок витрины' },
  { to: '/recruiter-registrations', title: 'Заявки рекрутеров', desc: 'Одобрение регистрации работодателей' },
  { to: '/vacancies', title: 'Вакансии', desc: 'Модерация и витрина' },
  { to: '/chats', title: 'Чаты', desc: 'Переписка и модерация сообщений' },
  { to: '/requests', title: 'Заявки на контакт', desc: 'Связь рекрутер ↔ студент' },
  { to: '/projects', title: 'Проекты', desc: 'Лента кейсов на сайте' },
  { to: '/analytics', title: 'Аналитика', desc: 'Воронка и просмотры' },
];

export function Dashboard() {
  const { isRecruiter } = useAuth();
  const [ok, setOk] = useState(null);
  const [err, setErr] = useState(null);
  const [stats, setStats] = useState(null);
  const [statsErr, setStatsErr] = useState(null);

  useEffect(() => {
    if (isRecruiter) return;
    let cancelled = false;
    (async () => {
      try {
        await mainApi.getStatus();
        if (!cancelled) {
          setOk(true);
          setErr(null);
        }
      } catch (e) {
        if (!cancelled) {
          setOk(false);
          setErr(e.message);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isRecruiter]);

  useEffect(() => {
    if (isRecruiter) return;
    let cancelled = false;
    (async () => {
      try {
        const [popRes, accRes, vacRes, regRes] = await Promise.all([
          analyticsApi.entityPopulation({}),
          accountApi.listAccountApprovals(undefined, 0, 1),
          vacanciesApi.filterVacancies({ status: 'PENDING_REVIEW' }, 0, 1),
          regApi.filterRecruiterRegistrations({ status: 'PENDING' }, 0, 1),
        ]);
        if (!cancelled) {
          setStats({
            population: popRes.data,
            pendingAccounts: accRes.data?.totalElements ?? 0,
            pendingVacancies: vacRes.data?.totalElements ?? 0,
            pendingRegistrations: regRes.data?.totalElements ?? 0,
          });
          setStatsErr(null);
        }
      } catch (e) {
        if (!cancelled) {
          setStats(null);
          setStatsErr(e.message);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isRecruiter]);

  if (isRecruiter) {
    return <Navigate to="/vacancies" replace />;
  }

  const pop = stats?.population;

  return (
    <div className="page">
      <PageHeader
        title="Главная"
        lead="Сводка состояния системы и быстрый переход к разделам админ-панели."
      />

      <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
        <div className="stat-card">
          <p className="stat-card__label">API</p>
          <p className="stat-card__value" style={{ fontSize: '1.1rem' }}>
            {ok === null ? '…' : ok ? 'Доступен' : 'Недоступен'}
          </p>
          <p className="stat-card__hint">
            {ok === null ? 'Проверка соединения' : ok ? 'GET /main/status — OK' : err}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-card__label">Аккаунты на одобрении</p>
          <p className="stat-card__value">{stats ? stats.pendingAccounts : '…'}</p>
          <p className="stat-card__hint">
            <Link to="/account-approvals">Открыть очередь</Link>
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-card__label">Вакансии на модерации</p>
          <p className="stat-card__value">{stats ? stats.pendingVacancies : '…'}</p>
          <p className="stat-card__hint">
            <Link to="/vacancies">Модерация</Link>
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-card__label">Заявки рекрутеров</p>
          <p className="stat-card__value">{stats ? stats.pendingRegistrations : '…'}</p>
          <p className="stat-card__hint">
            <Link to="/recruiter-registrations">Очередь</Link>
          </p>
        </div>
        {pop ? (
          <>
            <div className="stat-card">
              <p className="stat-card__label">Студенты</p>
              <p className="stat-card__value">{pop.totalStudents}</p>
              <p className="stat-card__hint">Учётных записей STUDENT: {pop.usersStudent}</p>
            </div>
            <div className="stat-card">
              <p className="stat-card__label">Рекрутеры</p>
              <p className="stat-card__value">{pop.totalRecruiters}</p>
              <p className="stat-card__hint">Учётных записей RECRUITER: {pop.usersRecruiter}</p>
            </div>
          </>
        ) : null}
        <div className="stat-card">
          <p className="stat-card__label">Базовый URL</p>
          <p className="stat-card__value" style={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>
            {API_BASE}
          </p>
          <p className="stat-card__hint">Cookie-сессия, credentials: include</p>
        </div>
      </div>

      {statsErr ? <div className="alert alert--error">{statsErr}</div> : null}

      {ok === false ? (
        <div className="alert alert--error">
          Не удалось связаться с API. Убедитесь, что backend запущен и{' '}
          <code>VITE_API_URL</code> указан верно.
        </div>
      ) : null}

      <div className="panel panel--accent">
        <h2 className="panel__title">Быстрые ссылки</h2>
        <div className="quick-links">
          {QUICK_LINKS.map((item) => (
            <Link key={item.to} to={item.to} className="quick-link">
              <p className="quick-link__title">{item.title}</p>
              <p className="quick-link__desc">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {ok === null ? <LoadingBlock text="Проверяем доступность API…" /> : null}
    </div>
  );
}
