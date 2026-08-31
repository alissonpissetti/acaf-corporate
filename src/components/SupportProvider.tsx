import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createSupportTicket, fetchSupportCatalog } from '../api/support';
import { useFlash } from '../flashContext';
import './support.css';

type SupportContextValue = {
  openSupport: () => void;
};

const SupportContext = createContext<SupportContextValue | null>(null);

type SupportProviderProps = {
  children: ReactNode;
  apiPrefix: string;
  ticketsPath: string;
  getExtraContext?: () => Record<string, unknown>;
};

function SupportTicketModal({
  open,
  onClose,
  apiPrefix,
  ticketsPath,
  context,
}: {
  open: boolean;
  onClose: () => void;
  apiPrefix: string;
  ticketsPath: string;
  context: Record<string, unknown>;
}) {
  const navigate = useNavigate();
  const flash = useFlash();
  const [catalog, setCatalog] = useState<{ categories: Array<{ value: string; label: string }>; priorities: Array<{ value: string; label: string }> }>({
    categories: [],
    priorities: [],
  });
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('technical');
  const [priority, setPriority] = useState('normal');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSubject('');
    setCategory('technical');
    setPriority('normal');
    setDescription('');
    fetchSupportCatalog(apiPrefix)
      .then((data) => setCatalog(data))
      .catch(() => setCatalog({ categories: [], priorities: [] }));
  }, [open, apiPrefix]);

  if (!open) return null;

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSubmitting(true);
    try {
      const created = await createSupportTicket(apiPrefix, {
        subject: subject.trim(),
        category,
        priority,
        description: description.trim(),
        contextUrl: context.contextUrl ?? null,
        contextLabel: context.contextLabel ?? null,
        contextMetadata: context.contextMetadata ?? null,
        companyId: context.companyId ?? null,
        unitId: context.unitId ?? null,
      });
      flash.success(`Chamado ${created.code} aberto com sucesso.`);
      onClose();
      navigate(`${ticketsPath}?id=${created.id}`);
    } catch (err) {
      flash.error(err instanceof Error ? err.message : 'Não foi possível abrir o chamado.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="support-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="support-modal" role="dialog" aria-modal="true" onClick={(ev) => ev.stopPropagation()}>
        <header className="support-modal-head">
          <div>
            <h2>Abrir chamado</h2>
            <p className="support-modal-subtitle">Descreva sua solicitação para a nossa equipe.</p>
          </div>
          <button type="button" className="modal-close" aria-label="Fechar" onClick={onClose}>
            ×
          </button>
        </header>
        <form className="support-modal-body" onSubmit={onSubmit}>
          {context.contextLabel ? (
            <div className="support-context-chip">
              <span className="support-context-label">Contexto</span>
              <strong>{String(context.contextLabel)}</strong>
              {context.contextUrl ? <small>{String(context.contextUrl)}</small> : null}
            </div>
          ) : null}
          <label className="field">
            <span>Assunto</span>
            <input value={subject} onChange={(ev) => setSubject(ev.target.value)} required maxLength={200} />
          </label>
          <div className="support-form-grid">
            <label className="field">
              <span>Categoria</span>
              <select value={category} onChange={(ev) => setCategory(ev.target.value)}>
                {catalog.categories.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Prioridade</span>
              <select value={priority} onChange={(ev) => setPriority(ev.target.value)}>
                {catalog.priorities.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="field">
            <span>Descrição</span>
            <textarea rows={5} value={description} onChange={(ev) => setDescription(ev.target.value)} required />
          </label>
          <footer className="support-modal-foot">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Enviando…' : 'Abrir chamado'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

export function SupportProvider({ children, apiPrefix, ticketsPath, getExtraContext }: SupportProviderProps) {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const openSupport = useCallback(() => setOpen(true), []);
  const closeSupport = useCallback(() => setOpen(false), []);

  const contextValue = useMemo(() => ({ openSupport }), [openSupport]);
  const context = useMemo(
    () => ({
      contextUrl: `${location.pathname}${location.search}`,
      contextLabel: document.title,
      ...(getExtraContext?.() ?? {}),
    }),
    [location.pathname, location.search, getExtraContext],
  );

  return (
    <SupportContext.Provider value={contextValue}>
      {children}
      <SupportTicketModal
        open={open}
        onClose={closeSupport}
        apiPrefix={apiPrefix}
        ticketsPath={ticketsPath}
        context={context}
      />
      <button type="button" className="support-launcher-fab" aria-label="Abrir chamado" onClick={openSupport}>
        <span aria-hidden="true">🎧</span>
        <span>Atendimento</span>
      </button>
    </SupportContext.Provider>
  );
}

export function useSupport() {
  const ctx = useContext(SupportContext);
  if (!ctx) throw new Error('useSupport deve ser usado dentro de SupportProvider.');
  return ctx;
}
