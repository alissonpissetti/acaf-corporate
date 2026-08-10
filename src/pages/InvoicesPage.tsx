import { useEffect, useState } from 'react';
import {
  formatBrl,
  formatMonthKey,
  getInvoice,
  listInvoices,
  type InvoiceDto,
} from '../api/client';
import './DashboardPage.css';

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [selected, setSelected] = useState<InvoiceDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const rows = await listInvoices();
        setInvoices(rows);
        if (rows[0]) {
          const detail = await getInvoice(rows[0].monthKey);
          setSelected(detail);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar faturas.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectMonth = async (monthKey: string) => {
    try {
      const detail = await getInvoice(monthKey);
      setSelected(detail);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar fatura.');
    }
  };

  return (
    <div className="page-stack">
      <header className="page-header">
        <h1>Faturas mensais</h1>
        <p className="page-lead">
          Valor por colaborador ativo no mês. Pagamento integrado em fase futura.
        </p>
      </header>

      {error && <p className="page-error">{error}</p>}

      <div className="invoices-layout">
        <section className="panel">
          <div className="panel-header">
            <h2>Histórico</h2>
          </div>
          <div className="panel-body panel-body-flush">
            {loading ? (
              <p className="empty-state">Carregando…</p>
            ) : invoices.length === 0 ? (
              <p className="empty-state">Nenhuma fatura gerada.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Mês</th>
                      <th>Colaboradores</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr
                        key={inv.id}
                        className={selected?.monthKey === inv.monthKey ? 'row-selected' : 'row-clickable'}
                        onClick={() => void selectMonth(inv.monthKey)}
                      >
                        <td>{formatMonthKey(inv.monthKey)}</td>
                        <td>{inv.activeEmployees}</td>
                        <td>{formatBrl(inv.totalAmount)}</td>
                        <td>
                          <span className={`badge ${inv.status === 'paid' ? 'badge-success' : 'badge-muted'}`}>
                            {inv.status === 'paid' ? 'Paga' : 'Em aberto'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {selected && (
          <section className="panel invoice-detail">
            <div className="panel-header">
              <h2>{formatMonthKey(selected.monthKey)}</h2>
              <span className={`badge ${selected.status === 'paid' ? 'badge-success' : 'badge-muted'}`}>
                {selected.status === 'paid' ? 'Paga' : 'Em aberto'}
              </span>
            </div>
            <div className="panel-body">
              <dl className="invoice-breakdown">
                <div>
                  <dt>Colaboradores ativos</dt>
                  <dd>{selected.activeEmployees}</dd>
                </div>
                <div>
                  <dt>Valor unitário</dt>
                  <dd>{formatBrl(selected.unitAmount)}</dd>
                </div>
                <div>
                  <dt>Total</dt>
                  <dd>
                    <strong>{formatBrl(selected.totalAmount)}</strong>
                  </dd>
                </div>
                <div>
                  <dt>Gerada em</dt>
                  <dd>{new Date(selected.generatedAt).toLocaleString('pt-BR')}</dd>
                </div>
              </dl>
              <p className="invoice-formula">
                {selected.activeEmployees} × {formatBrl(selected.unitAmount)} ={' '}
                {formatBrl(selected.totalAmount)}
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
