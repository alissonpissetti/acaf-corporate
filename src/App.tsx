import { Navigate, Route, Routes } from 'react-router-dom';
import { useCallback } from 'react';
import { getCorporateToken } from './api/auth';
import { useCorporate } from './corporateContext';
import { AppLayout } from './components/AppLayout';
import { SupportProvider } from './components/SupportProvider';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { SupportTicketsPage } from './pages/SupportTicketsPage';
import { ActivatePage } from './pages/ActivatePage';

function CorporateSupportShell({ children }: { children: React.ReactNode }) {
  const { company } = useCorporate();
  const getExtraContext = useCallback(
    () => ({
      companyId: company?.id ?? null,
      contextMetadata: {
        companyName: company?.tradeName ?? company?.legalName ?? null,
      },
    }),
    [company?.id, company?.legalName, company?.tradeName],
  );

  return (
    <SupportProvider
      apiPrefix="/api/corporate/support"
      ticketsPath="/atendimento"
      getExtraContext={getExtraContext}
    >
      {children}
    </SupportProvider>
  );
}

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
            <CorporateSupportShell>
              <AppLayout />
            </CorporateSupportShell>
          </Protected>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="colaboradores" element={<EmployeesPage />} />
        <Route path="faturas" element={<InvoicesPage />} />
        <Route path="atendimento" element={<SupportTicketsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
