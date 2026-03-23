import { useEffect, useState } from 'react';
import * as mainApi from '../api/main.js';
import { API_BASE } from '../config.js';

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
      <h1 className="page__title">Обзор</h1>
      <p className="page__lead">
        Состояние API и быстрые ссылки. База:{' '}
        <span style={{ color: 'var(--text-secondary)' }}>{API_BASE}</span>
      </p>

      <div className="panel">
        <h2 className="panel__title">Доступность</h2>
        {ok === null ? (
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Проверка…</p>
        ) : ok ? (
          <p style={{ color: 'var(--success)', margin: 0 }}>
            GET /main/status — сервис отвечает (204)
          </p>
        ) : (
          <div className="alert alert--error" style={{ margin: 0 }}>
            Не удалось связаться с API: {err}
          </div>
        )}
      </div>

      <div className="panel">
        <h2 className="panel__title">Разделы</h2>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Используйте меню слева: пользователи, студенты, рекрутеры и заявки. Все
          запросы отправляются с cookie-сессией (credentials: include).
        </p>
      </div>
    </div>
  );
}
