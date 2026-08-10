import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCorporate } from '../corporateContext';
import {
  formatBrl,
  formatMonthKey,
  listEmployees,
  listInvoices,
  type EmployeeDto,
  type InvoiceDto,
} from '../api/client';
import './DashboardPage.css';

export function DashboardPage() {
  const { company } = useCorporate();
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [emps, invs] = await Promise.all([listEmployees(), listInvoices()]);
        setEmployees(emps);
        setInvoices(invs);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar dados.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(() => {
    const active = employees.filter((e) => e.status === 'active').length;
    const awaitingActivation = employees.filter(
      (e) => e.status === 'invited' || e.status === 'pending',
    ).length;
    const currentInvoice = invoices[0] ?? null;
    return { active, awaitingActivation, total: employees.length, currentInvoice };
  }, [employees, invoices]);

  if (loading) {
    return <p className="page-loading">Carregando…</p>;
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <h1>Dashboard</h1>
        <p className="page-lead">
          {company?.tradeName ?? 'Empresa'} — benefício ACAF Connect para colaboradores.
        </p>
      </header>

      {error && <p className="page-error">{error}</p>}

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Colaboradores ativos</span>
          <strong className="stat-value">{stats.active}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Aguardando ativação</span>
          <strong className="stat-value">{stats.awaitingActivation}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total cadastrados</span>
          <strong className="stat-value">{stats.total}</strong>
        </div>
        <div className="stat-card stat-card-highlight">
          <span className="stat-label">Fatura do mês</span>
          <strong className="stat-value">
            {stats.currentInvoice ? formatBrl(stats.currentInvoice.totalAmount) : '—'}
          </strong>
          {stats.currentInvoice && (
            <span className="stat-meta">
              {stats.currentInvoice.activeEmployees} × {formatBrl(stats.currentInvoice.unitAmount)}
            </span>
          )}
        </div>
      </div>

      <div className="dashboard-actions">
        <Link to="/colaboradores" className="btn btn-primary">
          Gerenciar colaboradores
        </Link>
        <Link to="/faturas" className="btn btn-ghost">
          Ver faturas
        </Link>
      </div>

      {stats.currentInvoice && (
        <section className="panel">
          <div className="panel-header">
            <h2>Fatura atual — {formatMonthKey(stats.currentInvoice.monthKey)}</h2>
            <span className={`badge badge-${stats.currentInvoice.status === 'paid' ? 'success' : 'muted'}`}>
              {stats.currentInvoice.status === 'paid' ? 'Paga' : 'Em aberto'}
            </span>
          </div>
          <div className="panel-body">
            <p>
              {stats.currentInvoice.activeEmployees} colaborador(es) ativo(s) ×{' '}
              {formatBrl(stats.currentInvoice.unitAmount)} ={' '}
              <strong>{formatBrl(stats.currentInvoice.totalAmount)}</strong>
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
