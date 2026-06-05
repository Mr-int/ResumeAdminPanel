import { useCallback, useState } from 'react';
import * as usersApi from '../api/users.js';
import { useEffectWithAbort } from '../hooks/useEffectWithAbort.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { LoadingBlock } from '../components/ui/LoadingBlock.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { FlashMessages } from '../components/ui/FlashMessages.jsx';
import { ROLE_LABELS, labelOf } from '../lib/labels.js';

const PAGE_SIZE = 10;

function roleBadge(role) {
  const c =
    role === 'ADMIN'
      ? 'badge--admin'
      : role === 'STUDENT'
        ? 'badge--student'
        : role === 'RECRUITER'
          ? 'badge--recruiter'
          : null;
  if (!c) return <span>{labelOf(ROLE_LABELS, role, role ?? '—')}</span>;
  return <span className={`badge ${c}`}>{labelOf(ROLE_LABELS, role, role)}</span>;
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

  const load = useCallback(async (signal, isActive = () => true) => {
    if (isActive()) {
      setError(null);
      setLoading(true);
    }
    try {
      const { data: res } = await usersApi.filterUsers(
        { username: username.trim() || undefined },
        page,
        PAGE_SIZE,
        { signal }
      );
      if (isActive()) setData(res);
    } catch (e) {
      if (e.name === 'AbortError') return;
      if (isActive()) {
        setError(e.message);
        setData(null);
      }
    } finally {
      if (isActive()) setLoading(false);
    }
  }, [username, page]);

  useEffectWithAbort((signal, isActive) => load(signal, isActive), [load]);

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
      <PageHeader
        title="Учётные записи"
        lead="Управление пользователями системы: создание студентов и рекрутеров, удаление."
      />

      <FlashMessages
        success={createMsg?.type === 'ok' ? createMsg.text : null}
        error={createMsg?.type === 'err' ? createMsg.text : error}
      />

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
            <label htmlFor="ufilter">Логин (частично)</label>
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
                <label>Логин</label>
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

      <div className="panel">
        <h2 className="panel__title">Список</h2>
        {loading ? (
          <LoadingBlock />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Имя</th>
                    <th>Логин</th>
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
            <Pagination
              page={page}
              totalPages={totalPages}
              totalElements={data?.totalElements}
              onPrev={() => setPage((p) => Math.max(0, p - 1))}
              onNext={() => setPage((p) => p + 1)}
            />
          </>
        )}
      </div>
    </div>
  );
}
