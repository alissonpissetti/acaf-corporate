import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  addSupportTicketMessage,
  fetchSupportTicket,
  fetchSupportTickets,
  type SupportTicketDetail,
  type SupportTicketSummary,
} from '../api/support';
import { useSupport } from '../components/SupportProvider';
import { useFlash } from '../flashContext';
import './DashboardPage.css';

const API_PREFIX = '/api/corporate/support';

function formatRelativeTime(isoDate: string) {
  const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (seconds < 60) return 'agora';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  return `há ${days} dia(s)`;
}

export function SupportTicketsPage() {
  const flash = useFlash();
  const { openSupport } = useSupport();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<SupportTicketSummary[]>([]);
  const [detail, setDetail] = useState<SupportTicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const selectedId = searchParams.get('id') ?? '';

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSupportTickets(API_PREFIX);
      setItems(data.items ?? []);
    } catch (err) {
      flash.error(err instanceof Error ? err.message : 'Erro ao carregar chamados.');
    } finally {
      setLoading(false);
    }
  }, [flash]);

  const loadDetail = useCallback(
    async (id: string) => {
      if (!id) {
        setDetail(null);
        return;
      }
      try {
        setDetail(await fetchSupportTicket(API_PREFIX, id));
      } catch (err) {
        flash.error(err instanceof Error ? err.message : 'Erro ao carregar chamado.');
      }
    },
    [flash],
  );

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  const onReply = async () => {
    if (!detail || !reply.trim()) return;
    try {
      const updated = await addSupportTicketMessage(API_PREFIX, detail.id, reply.trim());
      setDetail(updated);
      setReply('');
      flash.success('Mensagem enviada.');
      await loadList();
    } catch (err) {
      flash.error(err instanceof Error ? err.message : 'Erro ao enviar mensagem.');
    }
  };

  return (
    <div className="page-stack">
      <header className="page-header page-header-row">
        <div>
          <h1>Meus chamados</h1>
          <p className="page-lead">Acompanhe solicitações abertas com a nossa equipe.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openSupport}>
          Novo chamado
        </button>
      </header>

      <section className="card">
        {loading ? <p>Carregando…</p> : null}
        {!loading && items.length === 0 ? <p>Nenhum chamado aberto ainda.</p> : null}
        {!loading && items.length > 0 ? (
          <table className="support-ticket-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Assunto</th>
                <th>Status</th>
                <th>Atualizado</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  style={{ cursor: 'pointer', background: selectedId === item.id ? '#fff7ed' : undefined }}
                  onClick={() => setSearchParams({ id: item.id })}
                >
                  <td>{item.code}</td>
                  <td>{item.subject}</td>
                  <td>{item.statusLabel}</td>
                  <td>{formatRelativeTime(item.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>

      {detail ? (
        <section className="card" style={{ marginTop: '1rem' }}>
          <h2>{detail.code}</h2>
          <p>{detail.description}</p>
          {(detail.messages ?? []).map((message) => (
            <article key={message.id} className="support-message">
              <strong>{message.authorName}</strong>
              <div>{message.body}</div>
              <small>{formatRelativeTime(message.createdAt)}</small>
            </article>
          ))}
          {!['resolved', 'closed'].includes(detail.status) ? (
            <div style={{ marginTop: '1rem' }}>
              <label className="field">
                <span>Responder</span>
                <textarea rows={4} value={reply} onChange={(ev) => setReply(ev.target.value)} />
              </label>
              <button type="button" className="btn btn-primary" onClick={onReply} disabled={!reply.trim()}>
                Enviar
              </button>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
