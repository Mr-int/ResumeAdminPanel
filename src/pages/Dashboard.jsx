import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as mainApi from '../api/main.js';
import { API_BASE } from '../config.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { LoadingBlock } from '../components/ui/LoadingBlock.jsx';

const QUICK_LINKS = [
  { to: '/students', title: 'Студенты', desc: 'Карточки резюме и модерация курса NEW' },
  { to: '/recruiter-registrations', title: 'Заявки рекрутеров', desc: 'Одобрение регистрации работодателей' },
  { to: '/vacancies', title: 'Вакансии', desc: 'Модерация публикаций' },
  { to: '/requests', title: 'Заявки на контакт', desc: 'Связь рекрутер ↔ студент' },
  { to: '/projects', title: 'Проекты', desc: 'Лента кейсов на сайте' },
  { to: '/analytics', title: 'Аналитика', desc: 'Просмотры и статистика' },
];

export function Dashboard() {
  const [ok, setOk] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
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
  }, []);

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
          <p className="stat-card__label">Базовый URL</p>
          <p className="stat-card__value" style={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>
            {API_BASE}
          </p>
          <p className="stat-card__hint">Все запросы с cookie-сессией</p>
        </div>
        <div className="stat-card">
          <p className="stat-card__label">Сессия</p>
          <p className="stat-card__value" style={{ fontSize: '1.1rem' }}>JWT в cookie</p>
          <p className="stat-card__hint">HttpOnly, credentials: include</p>
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

      {ok === null ? (
        <LoadingBlock text="Проверяем доступность API…" />
      ) : null}
    </div>
  );
}
