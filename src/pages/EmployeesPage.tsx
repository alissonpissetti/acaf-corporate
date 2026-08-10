import { useCallback, useEffect, useState } from 'react';
import {
  addEmployee,
  employeeStatusLabel,
  getEmployeeInviteLink,
  listEmployees,
  patchEmployee,
  sendEmployeeInviteEmail,
  sendEmployeeInviteSms,
  type EmployeeDto,
} from '../api/client';
import { useFlash } from '../flashContext';
import { copyTextToClipboard } from '../utils/clipboard';
import { formatCpfInput, formatPhoneInput } from '../utils/personInput';
import './DashboardPage.css';
import '../components/EmployeeModal.css';

function canSendInvite(emp: EmployeeDto): boolean {
  return emp.status === 'pending' || emp.status === 'invited';
}

export function EmployeesPage() {
  const flash = useFlash();
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [mobilePhone, setMobilePhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const rows = await listEmployees();
      setEmployees(rows);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar colaboradores.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!modalOpen) return;

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape' && !busy) setModalOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [modalOpen, busy]);

  const onAdd = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    try {
      await addEmployee({
        name,
        email,
        cpf: cpf || undefined,
        mobilePhone,
      });
      flash.success('Colaborador cadastrado. Envie o convite quando quiser.');
      setModalOpen(false);
      setName('');
      setEmail('');
      setCpf('');
      setMobilePhone('');
      await load();
    } catch (e) {
      flash.error(e instanceof Error ? e.message : 'Erro ao cadastrar.');
    } finally {
      setBusy(false);
    }
  };

  const toggleStatus = async (emp: EmployeeDto) => {
    const next = emp.status === 'inactive' ? 'active' : 'inactive';
    if (emp.status === 'invited' || emp.status === 'pending') {
      flash.info('Aguardando o colaborador aceitar o convite.');
      return;
    }
    try {
      await patchEmployee(emp.id, next);
      flash.success(next === 'active' ? 'Colaborador reativado.' : 'Colaborador inativado.');
      await load();
    } catch (e) {
      flash.error(e instanceof Error ? e.message : 'Erro ao atualizar.');
    }
  };

  const onSendEmail = async (emp: EmployeeDto) => {
    setActionBusyId(emp.id);
    try {
      await sendEmployeeInviteEmail(emp.id);
      flash.success(
        emp.status === 'pending' ? 'Convite enviado por e-mail.' : 'Convite reenviado por e-mail.',
      );
      await load();
    } catch (e) {
      flash.error(e instanceof Error ? e.message : 'Erro ao enviar e-mail.');
    } finally {
      setActionBusyId(null);
    }
  };

  const onCopyLink = async (emp: EmployeeDto) => {
    setActionBusyId(emp.id);
    try {
      const { inviteUrl } = await getEmployeeInviteLink(emp.id);
      await copyTextToClipboard(inviteUrl);
      flash.success('Link do convite copiado.');
    } catch (e) {
      flash.error(e instanceof Error ? e.message : 'Erro ao copiar link.');
    } finally {
      setActionBusyId(null);
    }
  };

  const onSendSms = async (emp: EmployeeDto) => {
    if (!emp.mobilePhone) {
      flash.error('Colaborador sem celular cadastrado.');
      return;
    }
    setActionBusyId(emp.id);
    try {
      await sendEmployeeInviteSms(emp.id);
      flash.success('Convite enviado por SMS.');
      await load();
    } catch (e) {
      flash.error(e instanceof Error ? e.message : 'Erro ao enviar SMS.');
    } finally {
      setActionBusyId(null);
    }
  };

  const statusBadgeClass = (status: EmployeeDto['status']) => {
    switch (status) {
      case 'active':
        return 'badge badge-active';
      case 'invited':
        return 'badge badge-invited';
      case 'pending':
        return 'badge badge-pending';
      default:
        return 'badge badge-inactive';
    }
  };

  return (
    <div className="page-stack">
      <header className="page-header page-header-row">
        <div>
          <h1>Colaboradores</h1>
          <p className="page-lead">
            Cadastre colaboradores e envie convites por e-mail, SMS ou link manual.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setModalOpen(true)}>
          Adicionar colaborador
        </button>
      </header>

      {error && <p className="page-error">{error}</p>}

      <section className="panel">
        <div className="panel-body panel-body-flush">
          {loading ? (
            <p className="empty-state">Carregando…</p>
          ) : employees.length === 0 ? (
            <p className="empty-state">Nenhum colaborador cadastrado.</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>Celular</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => {
                    const actionBusy = actionBusyId === emp.id;
                    return (
                      <tr key={emp.id}>
                        <td>{emp.name}</td>
                        <td>{emp.email}</td>
                        <td>{emp.mobilePhone ?? '—'}</td>
                        <td>
                          <span className={statusBadgeClass(emp.status)}>
                            {employeeStatusLabel(emp.status)}
                          </span>
                        </td>
                        <td className="table-actions">
                          {canSendInvite(emp) && (
                            <>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                disabled={actionBusy}
                                onClick={() => void onSendEmail(emp)}
                              >
                                E-mail
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                disabled={actionBusy}
                                onClick={() => void onCopyLink(emp)}
                              >
                                Copiar link
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                disabled={actionBusy || !emp.mobilePhone}
                                onClick={() => void onSendSms(emp)}
                                title={emp.mobilePhone ? undefined : 'Celular não cadastrado'}
                              >
                                SMS
                              </button>
                            </>
                          )}
                          {(emp.status === 'active' || emp.status === 'inactive') && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => void toggleStatus(emp)}
                            >
                              {emp.status === 'active' ? 'Inativar' : 'Reativar'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {modalOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => !busy && setModalOpen(false)}
        >
          <div
            className="employee-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="employee-modal-title"
            onClick={(ev) => ev.stopPropagation()}
          >
            <header className="employee-modal-header">
              <div className="employee-modal-header-text">
                <h2 id="employee-modal-title" className="employee-modal-title">
                  Novo colaborador
                </h2>
                <p className="employee-modal-lead">
                  Cadastre os dados de contato. Depois você envia o convite por e-mail, SMS ou link.
                </p>
              </div>
              <button
                type="button"
                className="employee-modal-close"
                aria-label="Fechar"
                disabled={busy}
                onClick={() => setModalOpen(false)}
              >
                ×
              </button>
            </header>

            <form className="employee-modal-form" onSubmit={(ev) => void onAdd(ev)} autoComplete="off">
              <div className="employee-modal-body">
                <div className="employee-modal-grid">
                  <div className="field field-span-2">
                    <label htmlFor="emp-name">Nome completo</label>
                    <input
                      id="emp-name"
                      name="employee-name"
                      value={name}
                      onChange={(ev) => setName(ev.target.value)}
                      autoComplete="off"
                      placeholder="Ex.: Maria Silva"
                      required
                      disabled={busy}
                    />
                  </div>
                  <div className="field field-span-2">
                    <label htmlFor="emp-email">E-mail</label>
                    <input
                      id="emp-email"
                      name="employee-email"
                      type="email"
                      value={email}
                      onChange={(ev) => setEmail(ev.target.value)}
                      autoComplete="off"
                      placeholder="nome@empresa.com.br"
                      required
                      disabled={busy}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="emp-phone">Celular</label>
                    <input
                      id="emp-phone"
                      name="employee-phone"
                      value={mobilePhone}
                      onChange={(ev) => setMobilePhone(formatPhoneInput(ev.target.value))}
                      inputMode="tel"
                      autoComplete="off"
                      placeholder="(00) 00000-0000"
                      required
                      disabled={busy}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="emp-cpf">CPF</label>
                    <input
                      id="emp-cpf"
                      name="employee-cpf"
                      value={cpf}
                      onChange={(ev) => setCpf(formatCpfInput(ev.target.value))}
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="000.000.000-00"
                      disabled={busy}
                    />
                    <p className="field-hint">Opcional no cadastro.</p>
                  </div>
                </div>

                <p className="employee-modal-note">
                  O convite <strong>não é enviado automaticamente</strong>. Após salvar, use as ações na
                  lista para disparar por e-mail, SMS ou copiar o link.
                </p>
              </div>

              <footer className="employee-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalOpen(false)}
                  disabled={busy}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? 'Salvando…' : 'Cadastrar colaborador'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
