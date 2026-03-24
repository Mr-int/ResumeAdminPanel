import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { Layout } from './components/Layout.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Login } from './pages/Login.jsx';
import { Recruiters } from './pages/Recruiters.jsx';
import { Requests } from './pages/Requests.jsx';
import { Skills } from './pages/Skills.jsx';
import { StudentDetail } from './pages/StudentDetail.jsx';
import { Students } from './pages/Students.jsx';
import { Users } from './pages/Users.jsx';

function RequireAuth() {
  const { ready, authenticated } = useAuth();
  if (!ready) {
    return <div className="page-loading">Р—Р°РіСЂСѓР·РєР°вЂ¦</div>;
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
          <Route path="/students" element={<Students />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/students/:id" element={<StudentDetail />} />
          <Route path="/recruiters" element={<Recruiters />} />
          <Route path="/requests" element={<Requests />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
