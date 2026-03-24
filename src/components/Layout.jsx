import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './Layout.css';

const nav = [
  { to: '/', label: 'РћР±Р·РѕСЂ', end: true },
  { to: '/users', label: 'РџРѕР»СЊР·РѕРІР°С‚РµР»Рё' },
  { to: '/students', label: 'РЎС‚СѓРґРµРЅС‚С‹' },
  { to: '/skills', label: 'РќР°РІС‹РєРё' },
  { to: '/skills', label: 'РќР°РІС‹РєРё' },
  { to: '/recruiters', label: 'Р РµРєСЂСѓС‚РµСЂС‹' },
  { to: '/requests', label: 'Р—Р°СЏРІРєРё' },
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
            <div className="sidebar__subtitle">РђРґРјРёРЅ-РїР°РЅРµР»СЊ</div>
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
          Р’С‹Р№С‚Рё
        </button>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

