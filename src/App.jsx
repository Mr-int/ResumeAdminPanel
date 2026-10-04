import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { Layout } from './components/Layout.jsx';
import { Login } from './pages/Login.jsx';
import { Recruiters } from './pages/Recruiters.jsx';
import { Requests } from './pages/Requests.jsx';
import { Skills } from './pages/Skills.jsx';
import { Specialities } from './pages/Specialities.jsx';
import { Companies } from './pages/Companies.jsx';
import { Students } from './pages/Students.jsx';
import { Users } from './pages/Users.jsx';
import { RecruiterRegistrations } from './pages/RecruiterRegistrations.jsx';
import { Projects } from './pages/Projects.jsx';
import { ProjectDetail } from './pages/ProjectDetail.jsx';
import { Storage } from './pages/Storage.jsx';
import { Analytics } from './pages/Analytics.jsx';
import { AccountApprovals } from './pages/AccountApprovals.jsx';

const Dashboard = lazy(() =>
  import('./pages/Dashboard.jsx').then((m) => ({ default: m.Dashboard }))
);
const Vacancies = lazy(() =>
  import('./pages/Vacancies.jsx').then((m) => ({ default: m.Vacancies }))
);
const StudentDetail = lazy(() =>
  import('./pages/StudentDetail.jsx').then((m) => ({ default: m.StudentDetail }))
);
const Chats = lazy(() => import('./pages/Chats.jsx').then((m) => ({ default: m.Chats })));

function PageLoading() {
  return <div className="page-loading">Загрузка…</div>;
}

function LazyPage({ children }) {
  return <Suspense fallback={<PageLoading />}>{children}</Suspense>;
}

function RequireAuth() {
  const { ready, authenticated } = useAuth();
  if (!ready) {
    return <PageLoading />;
  }
  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

function RequireAdmin() {
  const { isRecruiter } = useAuth();
  if (isRecruiter) {
    return <Navigate to="/vacancies" replace />;
  }
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route
            path="/vacancies"
            element={
              <LazyPage>
                <Vacancies />
              </LazyPage>
            }
          />
          <Route element={<RequireAdmin />}>
            <Route
              path="/"
              element={
                <LazyPage>
                  <Dashboard />
                </LazyPage>
              }
            />
            <Route path="/users" element={<Users />} />
            <Route path="/account-approvals" element={<AccountApprovals />} />
            <Route path="/students" element={<Students />} />
            <Route
              path="/students/:id"
              element={
                <LazyPage>
                  <StudentDetail />
                </LazyPage>
              }
            />
            <Route path="/skills" element={<Skills />} />
            <Route path="/specialities" element={<Specialities />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/recruiters" element={<Recruiters />} />
            <Route path="/requests" element={<Requests />} />
            <Route
              path="/chats"
              element={
                <LazyPage>
                  <Chats />
                </LazyPage>
              }
            />
            <Route path="/recruiter-registrations" element={<RecruiterRegistrations />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/storage" element={<Storage />} />
            <Route path="/analytics" element={<Analytics />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
