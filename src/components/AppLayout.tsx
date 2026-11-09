import { Outlet } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';
import { FlashViewport } from './FlashMessage';
import { SidebarNav } from './SidebarNav';
import { useCorporate } from '../corporateContext';
import './AppLayout.css';
import './FlashMessage.css';
import './SidebarNav.css';

function initials(name?: string | null) {
  if (!name) return '·';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1]![0] : '')).toUpperCase();
}

/**
 * Portal corporativo — assinatura roxa da marca ("bem-estar para empresas e colaboradores"):
 * menu em roxo com wordmark limão, conteúdo em superfícies claras.
 */
export function AppLayout() {
  const { logout, company, user } = useCorporate();

  return (
    <div className="app-shell">
      <aside className="sidebar movly-grain">
        <div className="sidebar-brand">
          <BrandLogo height={30} variant="lime" className="brand-logo--sidebar" />
          <p className="sidebar-tagline">bem-estar para empresas e colaboradores</p>
        </div>

        {company && (
          <div className="sidebar-company">
            <span className="sidebar-company-label">Empresa</span>
            <span className="sidebar-company-name">{company.tradeName}</span>
          </div>
        )}

        <SidebarNav />

        <div className="sidebar-footer">
          {user && (
            <div className="sidebar-user">
              <span className="sidebar-user-avatar" aria-hidden="true">
                {initials(user.name)}
              </span>
              <span className="sidebar-user-text">
                <span className="sidebar-user-name">{user.name}</span>
                <span className="sidebar-user-email">{user.email}</span>
              </span>
            </div>
          )}
          <button type="button" className="sidebar-logout" onClick={logout}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Sair
          </button>
        </div>
      </aside>
      <main className="main-content">
        <div className="main-inner">
          <FlashViewport />
          <Outlet />
        </div>
      </main>
    </div>
  );
}
