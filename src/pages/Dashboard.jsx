import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import * as studentsApi from '../api/students.js';
import { API_BASE } from '../config.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { LoadingBlock } from '../components/ui/LoadingBlock.jsx';

const QUICK_LINKS = [
  { to: '/students', title: 'Студенты', desc: 'Карточки резюме и модерация аккаунтов' },
];

export function Dashboard() {
  const { isRecruiter } = useAuth();
  const [ok, setOk] = useState(null);
  const [err, setErr] = useState(null);
  const [studentCount, setStudentCount] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isRecruiter) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const { data } = await studentsApi.filterStudents({}, 0, 1);
        if (!cancelled) {
          setOk(true);
          setErr(null);
          setStudentCount(data?.totalElements ?? 0);
        }
      } catch (e) {
        if (!cancelled) {
          setOk(false);
          setErr(e.message);
          setStudentCount(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isRecruiter]);

  if (isRecruiter) {
    return <Navigate to="/vacancies" replace />;
  }

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
            {ok === null ? 'Загрузка сводки' : ok ? 'Админ-эндпоинты отвечают' : err}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-card__label">Студенты</p>
          <p className="stat-card__value">{studentCount ?? '…'}</p>
          <p className="stat-card__hint">
            <Link to="/students">Открыть список</Link>
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-card__label">Базовый URL</p>
          <p className="stat-card__value" style={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>
            {API_BASE}
          </p>
          <p className="stat-card__hint">Cookie-сессия, credentials: include</p>
        </div>
      </div>

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

      {loading ? <LoadingBlock text="Загрузка сводки…" /> : null}
    </div>
  );
}
