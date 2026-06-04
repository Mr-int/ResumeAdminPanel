import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { Layout } from './components/Layout.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Login } from './pages/Login.jsx';
import { Recruiters } from './pages/Recruiters.jsx';
import { Requests } from './pages/Requests.jsx';
import { Skills } from './pages/Skills.jsx';
import { Specialities } from './pages/Specialities.jsx';
import { Companies } from './pages/Companies.jsx';
import { StudentDetail } from './pages/StudentDetail.jsx';
import { Students } from './pages/Students.jsx';
import { Users } from './pages/Users.jsx';
import { RecruiterRegistrations } from './pages/RecruiterRegistrations.jsx';
import { Vacancies } from './pages/Vacancies.jsx';
import { Projects } from './pages/Projects.jsx';
import { ProjectDetail } from './pages/ProjectDetail.jsx';
import { Storage } from './pages/Storage.jsx';
import { Analytics } from './pages/Analytics.jsx';
import { AccountApprovals } from './pages/AccountApprovals.jsx';
import { Chats } from './pages/Chats.jsx';

function RequireAuth() {
  const { ready, authenticated } = useAuth();
  if (!ready) {
    return <div className="page-loading">Загрузка…</div>;
  }
  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/account-approvals" element={<AccountApprovals />} />
          <Route path="/students" element={<Students />} />
          <Route path="/students/:id" element={<StudentDetail />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/specialities" element={<Specialities />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/recruiters" element={<Recruiters />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/chats" element={<Chats />} />
          <Route path="/recruiter-registrations" element={<RecruiterRegistrations />} />
          <Route path="/vacancies" element={<Vacancies />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/storage" element={<Storage />} />
          <Route path="/analytics" element={<Analytics />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
