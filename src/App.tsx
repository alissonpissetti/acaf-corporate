import { Navigate, Route, Routes } from 'react-router-dom';
import { getCorporateToken } from './api/auth';
import { useCorporate } from './corporateContext';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { ActivatePage } from './pages/ActivatePage';

function Protected({ children }: { children: React.ReactNode }) {
  const { loggedIn, loading } = useCorporate();
  if (loading) {
    return (
      <div className="login-shell login-shell-loading">
        <p className="login-loading-text">Carregando portal…</p>
      </div>
    );
  }
  if (!getCorporateToken() || !loggedIn) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<SignupPage />} />
      <Route path="/ativar" element={<ActivatePage />} />
      <Route
        path="/"
        element={
          <Protected>
            <AppLayout />
          </Protected>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="colaboradores" element={<EmployeesPage />} />
        <Route path="faturas" element={<InvoicesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
