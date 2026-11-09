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
        <h1>Visão geral</h1>
        <p className="page-lead">{company?.tradeName ?? 'Sua empresa'} · benefício de bem-estar dos colaboradores</p>
      </header>

      {error && <p className="page-error">{error}</p>}

      <section className="corp-hero movly-grain" aria-label="Resumo do benefício">
        <div className="corp-hero-main">
          <p className="corp-hero-label">Colaboradores com o benefício ativo</p>
          <p className="corp-hero-value">
            {stats.active}
            <span className="corp-hero-dot" aria-hidden="true" />
          </p>
          <p className="corp-hero-meta">
            {stats.awaitingActivation > 0
              ? `${stats.awaitingActivation} ${stats.awaitingActivation === 1 ? 'convite aguarda' : 'convites aguardam'} ativação no app.`
              : 'Todos os convites enviados já foram ativados.'}
          </p>
        </div>
        <div className="corp-hero-side">
          <Link to="/colaboradores" className="btn corp-hero-cta">
            Gerenciar colaboradores
          </Link>
          <Link to="/faturas" className="corp-hero-link">
            Ver faturas
          </Link>
        </div>
      </section>

      <div className="corp-stats">
        <div className="corp-stat">
          <span className="stat-label">Ativos</span>
          <strong className="stat-value">{stats.active}</strong>
        </div>
        <div className="corp-stat">
          <span className="stat-label">Aguardando ativação</span>
          <strong className="stat-value">{stats.awaitingActivation}</strong>
        </div>
        <div className="corp-stat">
          <span className="stat-label">Total cadastrados</span>
          <strong className="stat-value">{stats.total}</strong>
        </div>
        <div className="corp-stat">
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
