import { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';

import './Layout.css';



const ADMIN_NAV_GROUPS = [

  {

    title: 'Обзор',

    items: [{ to: '/', label: 'Главная', end: true }],

  },

  {

    title: 'Пользователи',

    items: [

      { to: '/users', label: 'Учётные записи' },

      { to: '/account-approvals', label: 'Одобрение аккаунтов' },

      { to: '/students', label: 'Студенты' },

      { to: '/recruiters', label: 'Рекрутеры' },

      { to: '/recruiter-registrations', label: 'Заявки рекрутеров' },

    ],

  },

  {

    title: 'Контент',

    items: [

      { to: '/vacancies', label: 'Вакансии' },

      { to: '/projects', label: 'Проекты' },

      { to: '/storage', label: 'Хранилище' },

      { to: '/requests', label: 'Заявки на контакт' },

      { to: '/chats', label: 'Чаты' },

    ],

  },

  {

    title: 'Справочники',

    items: [

      { to: '/skills', label: 'Навыки' },

      { to: '/specialities', label: 'Специальности' },

      { to: '/companies', label: 'Компании' },

    ],

  },

  {

    title: 'Система',

    items: [{ to: '/analytics', label: 'Аналитика' }],

  },

];

const RECRUITER_NAV_GROUPS = [
  {
    title: 'Работодатель',
    items: [{ to: '/vacancies', label: 'Мои вакансии' }],
  },
];

export function Layout() {
  const { logout, isRecruiter } = useAuth();
  const navGroups = isRecruiter ? RECRUITER_NAV_GROUPS : ADMIN_NAV_GROUPS;
  const navigate = useNavigate();
  const location = useLocation();
  const mainRef = useRef(null);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);



  async function handleLogout() {

    await logout();

    navigate('/login', { replace: true });

  }



  return (

    <div className="shell">

      <aside className="sidebar">

        <div className="sidebar__brand">
          <div>
            <div className="sidebar__title">Singularity Resume</div>
            <div className="sidebar__subtitle">
              {isRecruiter ? 'Панель работодателя' : 'Панель администратора'}
            </div>
          </div>
        </div>

        <nav className="sidebar__nav" aria-label="Основное меню">

          {navGroups.map((group) => (

            <div key={group.title} className="sidebar__group">

              <div className="sidebar__group-title">{group.title}</div>

              {group.items.map((item) => (

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

            </div>

          ))}

        </nav>

        <button type="button" className="sidebar__logout" onClick={handleLogout}>

          Выйти

        </button>

      </aside>

      <main ref={mainRef} className="main">
        <Outlet />
      </main>

    </div>

  );

}

