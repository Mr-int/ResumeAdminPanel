import { useCallback, useEffect, useState } from 'react';
import * as usersApi from '../api/users.js';

const PAGE_SIZE = 10;

function roleBadge(role) {
  const c =
    role === 'ADMIN' ? 'badge--admin' : role === 'USER' ? 'badge--user' : 'badge--guest';
  return <span className={`badge ${c}`}>{role}</span>;
}

export function Users() {
  const [username, setUsername] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [createMsg, setCreateMsg] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const { data: res } = await usersApi.filterUsers(
        { username: username.trim() || undefined },
        page,
        PAGE_SIZE
      );
      setData(res);
    } catch (e) {
      setError(e.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [username, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    setCreateMsg(null);
    try {
      await usersApi.createUser({
        name: newName.trim() || undefined,
        username: newUsername.trim(),
        password: newPassword,
      });
      setNewName('');
      setNewUsername('');
      setNewPassword('');
      setShowCreate(false);
      setCreateMsg({ type: 'ok', text: 'Пользователь создан' });
      setPage(0);
      await load();
    } catch (e) {
      setCreateMsg({ type: 'err', text: e.message });
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Удалить пользователя?')) return;
    try {
      await usersApi.deleteUser(id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="page">
      <h1 className="page__title">Пользователи</h1>
      <p className="page__lead">Фильтр по username, создание и удаление (DELETE /user/&#123;id&#125;)</p>

      {createMsg?.type === 'ok' ? (
        <div className="alert alert--success">{createMsg.text}</div>
      ) : null}
      {createMsg?.type === 'err' ? (
        <div className="alert alert--error">{createMsg.text}</div>
      ) : null}

      <div className="panel">
        <h2 className="panel__title">Фильтр</h2>
        <form
          className="form-row"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(0);
            load();
          }}
        >
          <div className="field">
            <label htmlFor="ufilter">Username (частично)</label>
            <input
              id="ufilter"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Пусто — все"
            />
          </div>
          <button type="submit" className="btn btn--primary">
            Найти
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setShowCreate((v) => !v)}
          >
            {showCreate ? 'Закрыть форму' : 'Новый пользователь'}
          </button>
        </form>

        {showCreate ? (
          <form onSubmit={handleCreate} style={{ marginTop: '1rem' }}>
            <div className="form-row">
              <div className="field">
                <label>Имя (опционально)</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Username</label>
                <input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  pattern="[a-zA-Z0-9_]{3,64}"
                  title="3–64 символа: буквы, цифры, _"
                />
              </div>
              <div className="field">
                <label>Пароль</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn--primary">
                Создать
              </button>
            </div>
          </form>
        ) : null}
      </div>

      {error ? <div className="alert alert--error">{error}</div> : null}

      <div className="panel">
        <h2 className="panel__title">Список</h2>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Загрузка…</p>
        ) : (
          <>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Имя</th>
                    <th>Username</th>
                    <th>Роль</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {(data?.data ?? []).map((u) => (
                    <tr key={u.id}>
                      <td>{u.name ?? '—'}</td>
                      <td>{u.username}</td>
                      <td>{roleBadge(u.role)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn--danger"
                          onClick={() => handleDelete(u.id)}
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pager">
              <span>
                Стр. {data ? data.page + 1 : 1} из {Math.max(totalPages, 1)} · всего{' '}
                {data?.totalElements ?? 0}
              </span>
              <div className="pager__btns">
                <button
                  type="button"
                  className="btn btn--ghost"
                  disabled={page <= 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Назад
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  disabled={totalPages && page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Вперёд
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
