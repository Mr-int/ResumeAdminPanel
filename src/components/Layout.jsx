import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './Layout.css';

const nav = [
  { to: '/', label: 'Обзор', end: true },
  { to: '/users', label: 'Пользователи' },
  { to: '/students', label: 'Студенты' },
  { to: '/recruiters', label: 'Рекрутеры' },
  { to: '/requests', label: 'Заявки' },
];

export function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <span className="sidebar__logo" aria-hidden />
          <div>
            <div className="sidebar__title">Resume</div>
            <div className="sidebar__subtitle">Админ-панель</div>
          </div>
        </div>
        <nav className="sidebar__nav">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button type="button" className="sidebar__logout" onClick={handleLogout}>
          Выйти
        </button>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
