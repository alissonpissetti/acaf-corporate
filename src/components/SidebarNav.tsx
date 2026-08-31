import { NavLink } from 'react-router-dom';
import './SidebarNav.css';

const items = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/colaboradores', label: 'Colaboradores' },
  { to: '/faturas', label: 'Faturas mensais' },
  { to: '/atendimento', label: 'Meus chamados' },
];

export function SidebarNav() {
  return (
    <nav className="sidebar-nav" aria-label="Menu principal">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
