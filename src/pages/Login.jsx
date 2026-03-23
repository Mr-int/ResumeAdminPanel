import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function Login() {
  const { ready, authenticated, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  if (!ready) {
    return <div className="page-loading">Загрузка…</div>;
  }

  if (authenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login(username.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message ?? 'Ошибка входа');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Вход</h1>
        <p>Админ-панель Singularity Resume</p>
        {error ? <div className="alert alert--error">{error}</div> : null}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="username">Логин</label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={pending}
          >
            {pending ? 'Вход…' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}
