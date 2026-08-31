import { useCallback, useEffect, useState } from 'react';
import {
  addEmployee,
  employeeStatusLabel,
  getEmployeeEnrollmentCode,
  getEnrollmentCode,
  listEmployees,
  patchEmployee,
  sendEmployeeInviteEmail,
  sendEmployeeInviteSms,
  type EmployeeDto,
} from '../api/client';
import { useCorporate } from '../corporateContext';
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
  const { company } = useCorporate();
  const [enrollmentCode, setEnrollmentCode] = useState<string | null>(
    company?.enrollmentCode ?? null,
  );
  const [codeLoading, setCodeLoading] = useState(company?.status === 'active');
  const [codeError, setCodeError] = useState<string | null>(null);
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
    if (company?.enrollmentCode) {
      setEnrollmentCode(company.enrollmentCode);
      setCodeLoading(false);
      setCodeError(null);
      return;
    }

    if (company?.status !== 'active') {
      setEnrollmentCode(null);
      setCodeLoading(false);
      return;
    }

    setCodeLoading(true);
    setCodeError(null);
    void getEnrollmentCode()
      .then(({ enrollmentCode: code }) => {
        setEnrollmentCode(code);
      })
      .catch((e) => {
        setEnrollmentCode(null);
        setCodeError(e instanceof Error ? e.message : 'Não foi possível obter o código.');
      })
      .finally(() => setCodeLoading(false));
  }, [company?.enrollmentCode, company?.status]);

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

  const onCopyCompanyCode = async () => {
    setActionBusyId('company-code');
    try {
      const code =
        enrollmentCode ?? (await getEnrollmentCode()).enrollmentCode;
      await copyTextToClipboard(code);
      flash.success('Código de adesão copiado.');
    } catch (e) {
      flash.error(e instanceof Error ? e.message : 'Erro ao copiar código.');
    } finally {
      setActionBusyId(null);
    }
  };

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
      flash.success('Colaborador cadastrado. Envie o código de adesão quando quiser.');
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
      flash.info('Aguardando o colaborador cadastrar no app com o código da empresa.');
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
        emp.status === 'pending'
          ? 'Código enviado por e-mail.'
          : 'Código reenviado por e-mail.',
      );
      await load();
    } catch (e) {
      flash.error(e instanceof Error ? e.message : 'Erro ao enviar e-mail.');
    } finally {
      setActionBusyId(null);
    }
  };

  const onCopyCode = async (emp: EmployeeDto) => {
    setActionBusyId(emp.id);
    try {
      const code =
        enrollmentCode ??
        (await getEmployeeEnrollmentCode(emp.id)).enrollmentCode;
      await copyTextToClipboard(code);
      flash.success('Código de adesão copiado.');
    } catch (e) {
      flash.error(e instanceof Error ? e.message : 'Erro ao copiar código.');
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
      flash.success('Código enviado por SMS.');
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
            Cadastre colaboradores e compartilhe o código de adesão para cadastro no app.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setModalOpen(true)}>
          Adicionar colaborador
        </button>
      </header>

      {company?.status === 'active' ? (
        <section className="panel enrollment-code-panel">
          <div className="panel-body">
            {codeLoading ? (
              <p className="enrollment-code-lead">Carregando código de adesão…</p>
            ) : enrollmentCode ? (
              <div className="enrollment-code-row">
                <div>
                  <h2 className="enrollment-code-title">Código de adesão da empresa</h2>
                  <p className="enrollment-code-lead">
                    O colaborador abre o aplicativo, vai em <strong>Minha conta</strong> e
                    informa este código para vincular a empresa e escolher o plano.
                  </p>
                </div>
                <div className="enrollment-code-value-wrap">
                  <code className="enrollment-code-value">{enrollmentCode}</code>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={actionBusyId === 'company-code'}
                    onClick={() => void onCopyCompanyCode()}
                  >
                    Copiar código
                  </button>
                </div>
              </div>
            ) : (
              <p className="enrollment-code-lead page-error">
                {codeError ?? 'Não foi possível carregar o código. Tente sair e entrar novamente.'}
              </p>
            )}
          </div>
        </section>
      ) : (
        <section className="panel">
          <div className="panel-body">
            <p className="enrollment-code-lead">
              Sua empresa está com status <strong>{company?.status ?? 'pendente'}</strong>. O código
              de adesão aparece após aprovação no <strong>Painel Admin</strong> (menu Corporativo →
              Empresas → Aprovar empresa).
            </p>
          </div>
        </section>
      )}

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
                                onClick={() => void onCopyCode(emp)}
                              >
                                Copiar código
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
                  Cadastre os dados de contato. Depois compartilhe o código de adesão da empresa
                  por e-mail, SMS ou copiando manualmente.
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
                  O cadastro no app é feito pelo colaborador com o <strong>código de adesão</strong>{' '}
                  da empresa (Minha conta no aplicativo).
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
