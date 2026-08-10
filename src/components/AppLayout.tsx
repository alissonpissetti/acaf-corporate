import { Outlet } from 'react-router-dom';
import { AcafConnectLogo } from './AcafConnectLogo';
import { FlashViewport } from './FlashMessage';
import { SidebarNav } from './SidebarNav';
import { useCorporate } from '../corporateContext';
import './AppLayout.css';
import './FlashMessage.css';
import './SidebarNav.css';

export function AppLayout() {
  const { logout, company, user } = useCorporate();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <AcafConnectLogo height={36} className="acaf-connect-logo--sidebar" />
          <div className="brand-sub brand-sub-sidebar">Portal corporativo</div>
        </div>

        {company && (
          <div className="sidebar-unit">
            <span className="unit-network">Empresa</span>
            <span className="unit-name">{company.tradeName}</span>
          </div>
        )}

        <SidebarNav />

        {user && (
          <div className="sidebar-user">
            <span className="sidebar-user-name">{user.name}</span>
            <span className="sidebar-user-email">{user.email}</span>
          </div>
        )}

        <button type="button" className="btn btn-ghost sidebar-logout" onClick={logout}>
          Sair
        </button>
      </aside>
      <main className="main-content">
        <FlashViewport />
        <Outlet />
      </main>
    </div>
  );
}
